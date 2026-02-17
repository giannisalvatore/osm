import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.join(__dirname, '../../storage/tarballs');
fs.mkdirSync(storageDir, { recursive: true });

function getUserFromToken(ctx) {
  const auth = ctx.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return db.prepare(`
    SELECT users.* FROM auth_tokens
    JOIN users ON users.id = auth_tokens.user_id
    WHERE auth_tokens.token = ?
  `).get(token);
}

function isOwner(packageId, userId) {
  return Boolean(db.prepare('SELECT 1 FROM package_owners WHERE package_id = ? AND user_id = ?').get(packageId, userId));
}

export const registryController = {
  async metadata(ctx) {
    const { name } = ctx.params;
    const pkg = db.prepare('SELECT * FROM packages WHERE name = ?').get(name);
    if (!pkg) {
      ctx.status = 404;
      ctx.body = { error: 'Package not found' };
      return;
    }

    const versions = db.prepare('SELECT version, manifest, shasum FROM package_versions WHERE package_id = ? ORDER BY created_at').all(pkg.id);
    const versionMap = {};
    for (const row of versions) {
      const manifest = JSON.parse(row.manifest);
      versionMap[row.version] = {
        ...manifest,
        dist: {
          shasum: row.shasum,
          tarball: `${ctx.origin}/registry/${encodeURIComponent(name)}/-/${encodeURIComponent(name)}-${row.version}.tgz`
        }
      };
    }

    ctx.body = {
      name: pkg.name,
      description: pkg.description,
      'dist-tags': { latest: pkg.latest_version },
      versions: versionMap
    };
  },

  async tarball(ctx) {
    const { name, filename } = ctx.params;
    const match = filename.match(new RegExp(`^${name}-(.+)\\.tgz$`));
    if (!match) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid tarball name' };
      return;
    }

    const version = match[1];
    const row = db.prepare(`
      SELECT pv.tarball_path FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.name = ? AND pv.version = ?
    `).get(name, version);

    if (!row || !fs.existsSync(row.tarball_path)) {
      ctx.status = 404;
      ctx.body = { error: 'Tarball not found' };
      return;
    }

    ctx.set('content-type', 'application/octet-stream');
    ctx.body = fs.createReadStream(row.tarball_path);
  },

  async publish(ctx) {
    const user = getUserFromToken(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Authentication required. Run osm login.' };
      return;
    }

    const { manifest, tarballBase64 } = ctx.request.body || {};
    if (!manifest?.name || !manifest?.version || !tarballBase64) {
      ctx.status = 400;
      ctx.body = { error: 'manifest(name, version) and tarballBase64 are required' };
      return;
    }

    const tarballBuffer = Buffer.from(tarballBase64, 'base64');
    const shasum = crypto.createHash('sha1').update(tarballBuffer).digest('hex');

    let pkg = db.prepare('SELECT * FROM packages WHERE name = ?').get(manifest.name);
    if (!pkg) {
      const result = db.prepare('INSERT INTO packages (name, description, latest_version) VALUES (?, ?, ?)')
        .run(manifest.name, manifest.description || '', manifest.version);
      pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(result.lastInsertRowid);
      db.prepare('INSERT INTO package_owners (package_id, user_id) VALUES (?, ?)').run(pkg.id, user.id);
    } else if (!isOwner(pkg.id, user.id)) {
      ctx.status = 403;
      ctx.body = { error: 'Only package owners can publish new versions' };
      return;
    }

    const exists = db.prepare('SELECT 1 FROM package_versions WHERE package_id = ? AND version = ?').get(pkg.id, manifest.version);
    if (exists) {
      ctx.status = 409;
      ctx.body = { error: 'Version already exists and is immutable' };
      return;
    }

    const tarballPath = path.join(storageDir, `${manifest.name}-${manifest.version}-${Date.now()}.tgz`);
    fs.writeFileSync(tarballPath, tarballBuffer);

    db.prepare(`
      INSERT INTO package_versions (package_id, version, manifest, tarball_path, shasum)
      VALUES (?, ?, ?, ?, ?)
    `).run(pkg.id, manifest.version, JSON.stringify(manifest), tarballPath, shasum);

    db.prepare('UPDATE packages SET latest_version = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(manifest.version, manifest.description || pkg.description || '', pkg.id);

    ctx.status = 201;
    ctx.body = { ok: true, name: manifest.name, version: manifest.version, shasum };
  },

  async search(ctx) {
    const q = ctx.query.q || '';
    const rows = db.prepare('SELECT name, description, latest_version FROM packages WHERE name LIKE ? OR description LIKE ? ORDER BY name').all(`%${q}%`, `%${q}%`);
    ctx.body = { total: rows.length, objects: rows };
  }
};

export const authController = {
  async login(ctx) {
    const { username, password } = ctx.request.body || {};
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { error: 'username and password required' };
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Invalid credentials' };
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO auth_tokens (user_id, token) VALUES (?, ?)').run(user.id, token);
    ctx.body = { token, username: user.username };
  },

  async whoami(ctx) {
    const user = getUserFromToken(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Not authenticated' };
      return;
    }

    ctx.body = { username: user.username, email: user.email };
  }
};
