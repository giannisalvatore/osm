import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import tar from 'tar-stream';
import { Op } from 'sequelize';
import sequelize from '../db/database.js';
import { User, AuthToken, Package, PackageVersion, PackageOwner } from '../db/database.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const SALT_ROUNDS = 10;

function validateSkillName(name) {
  if (!name || typeof name !== 'string') return 'name is required';
  if (name.length < 1 || name.length > 64) return 'name must be 1-64 characters';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z0-9]$/.test(name))
    return 'name must be lowercase alphanumeric and hyphens, no leading/trailing hyphens';
  if (name.includes('--')) return 'name must not contain consecutive hyphens';
  return null;
}

function validateSkillDescription(desc) {
  if (!desc || typeof desc !== 'string') return 'description is required';
  if (desc.length < 1 || desc.length > 1024) return 'description must be 1-1024 characters';
  return null;
}

async function getUserFromToken(ctx) {
  const auth = ctx.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const authToken = await AuthToken.findOne({
    where: { token },
    include: [{ model: User }],
  });
  return authToken?.User || null;
}

async function isOwner(packageId, userId) {
  const row = await PackageOwner.findOne({ where: { package_id: packageId, user_id: userId } });
  return Boolean(row);
}

export const registryController = {
  async metadata(ctx) {
    const { name } = ctx.params;
    const pkg = await Package.findOne({ where: { name } });
    if (!pkg) {
      ctx.status = 404;
      ctx.body = { error: 'Package not found' };
      return;
    }

    const versions = await PackageVersion.findAll({
      where: { package_id: pkg.id },
      order: [['created_at', 'ASC']],
    });

    const versionMap = {};
    for (const row of versions) {
      const manifest = JSON.parse(row.manifest);
      versionMap[row.version] = {
        ...manifest,
        dist: {
          shasum: row.shasum,
          tarball: `${ctx.origin}/registry/${encodeURIComponent(name)}/-/${encodeURIComponent(name)}-${row.version}.tgz`,
        },
      };
    }

    const owner = await PackageOwner.findOne({
      where: { package_id: pkg.id },
      include: [{ model: User, attributes: ['username'] }],
      order: [['created_at', 'ASC']],
    });

    ctx.body = {
      name: pkg.name,
      description: pkg.description,
      downloads: pkg.downloads || 0,
      author: owner?.User?.username || pkg.github_username || null,
      github_url: pkg.github_url || null,
      github_username: pkg.github_username || null,
      source: pkg.source || 'registry',
      'dist-tags': { latest: pkg.latest_version },
      versions: versionMap,
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
    const row = await PackageVersion.findOne({
      include: [{ model: Package, where: { name } }],
      where: { version },
    });

    if (!row || !row.tarball_data) {
      ctx.status = 404;
      ctx.body = { error: 'Tarball not found' };
      return;
    }

    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
    ctx.body = row.tarball_data;

    Package.increment('downloads', { where: { name } }).catch(() => {});
  },

  async publish(ctx) {
    const user = await getUserFromToken(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Authentication required. Run osm login.' };
      return;
    }

    if (!user.verified) {
      ctx.status = 403;
      ctx.body = { error: 'Account not verified. Check your email to confirm your address before publishing.' };
      return;
    }

    const { manifest, tarballBase64 } = ctx.request.body || {};
    if (!manifest?.name || !manifest?.version || !tarballBase64) {
      ctx.status = 400;
      ctx.body = { error: 'manifest(name, version) and tarballBase64 are required' };
      return;
    }

    const nameErr = validateSkillName(manifest.name);
    if (nameErr) { ctx.status = 400; ctx.body = { error: nameErr }; return; }

    const descErr = validateSkillDescription(manifest.description);
    if (descErr) { ctx.status = 400; ctx.body = { error: descErr }; return; }

    if (manifest.compatibility !== undefined && manifest.compatibility !== null) {
      if (typeof manifest.compatibility !== 'string' || manifest.compatibility.length > 500) {
        ctx.status = 400;
        ctx.body = { error: 'compatibility must be a string of max 500 characters' };
        return;
      }
    }

    const tarballBuffer = Buffer.from(tarballBase64, 'base64');

    const MAX_TARBALL_BYTES = 5 * 1024 * 1024; // 5 MB
    if (tarballBuffer.length > MAX_TARBALL_BYTES) {
      ctx.status = 413;
      ctx.body = { error: `Skill package is too large (${(tarballBuffer.length / 1024).toFixed(0)} KB). Maximum allowed size is 5 MB.` };
      return;
    }

    const shasum = crypto.createHash('sha1').update(tarballBuffer).digest('hex');

    let pkg = await Package.findOne({ where: { name: manifest.name } });

    if (!pkg) {
      pkg = await Package.create({
        name: manifest.name,
        description: manifest.description || '',
        latest_version: manifest.version,
        downloads: 0,
      });
      await PackageOwner.create({ package_id: pkg.id, user_id: user.id });
    } else if (!(await isOwner(pkg.id, user.id))) {
      ctx.status = 403;
      ctx.body = { error: 'Only package owners can publish new versions' };
      return;
    }

    const exists = await PackageVersion.findOne({
      where: { package_id: pkg.id, version: manifest.version },
    });
    if (exists) {
      ctx.status = 409;
      ctx.body = { error: 'Version already exists and is immutable' };
      return;
    }

    await PackageVersion.create({
      package_id: pkg.id,
      version: manifest.version,
      manifest: JSON.stringify(manifest),
      tarball_data: tarballBuffer,
      shasum,
    });

    await pkg.update({
      latest_version: manifest.version,
      description: manifest.description || pkg.description || '',
    });

    ctx.status = 201;
    ctx.body = { ok: true, name: manifest.name, version: manifest.version, shasum };
  },

  async files(ctx) {
    const { name } = ctx.params;
    const pkg = await Package.findOne({ where: { name } });
    if (!pkg) { ctx.status = 404; ctx.body = { error: 'Package not found' }; return; }

    const row = await PackageVersion.findOne({
      where: { package_id: pkg.id, version: pkg.latest_version },
    });
    if (!row?.tarball_data) { ctx.status = 404; ctx.body = { error: 'Tarball not found' }; return; }

    const files = [];
    const contents = {};

    await new Promise((resolve, reject) => {
      const extract = tar.extract();
      extract.on('entry', (header, stream, next) => {
        const filePath = header.name.replace(/^[^/]+\//, '');
        if (header.type === 'file') {
          files.push(filePath);
          const isReadme = /^readme(\.md)?$/i.test(filePath.split('/').pop());
          const isSkillMd = /^skill\.md$/i.test(filePath.split('/').pop());
          const isSmall = header.size <= 64 * 1024;
          if ((isReadme || isSkillMd) && isSmall) {
            const chunks = [];
            stream.on('data', (c) => chunks.push(c));
            stream.on('end', () => { contents[filePath] = Buffer.concat(chunks).toString('utf8'); next(); });
            stream.on('error', next);
            return;
          }
        }
        stream.resume();
        stream.on('end', next);
        stream.on('error', next);
      });
      extract.on('finish', resolve);
      extract.on('error', reject);
      const readable = new Readable();
      readable.push(row.tarball_data);
      readable.push(null);
      readable.pipe(createGunzip()).pipe(extract);
    });

    ctx.body = { files, contents };
  },

  async last10(ctx) {
    const rows = await Package.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['name', 'description', 'latest_version', 'downloads', 'github_url', 'github_username', 'source'],
    });
    ctx.body = { total: rows.length, objects: rows };
  },

  async mostDownloaded(ctx) {
    const rows = await Package.findAll({
      order: [['downloads', 'DESC']],
      limit: 10,
      attributes: ['name', 'description', 'latest_version', 'downloads', 'github_url', 'github_username', 'source'],
    });
    ctx.body = { total: rows.length, objects: rows };
  },

  async list(ctx) {
    const page  = Math.max(1, parseInt(ctx.query.page  || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(ctx.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { count, rows } = await Package.findAndCountAll({
      order: [['name', 'ASC']],
      limit,
      offset,
      attributes: ['name', 'description', 'latest_version', 'downloads', 'github_url', 'github_username', 'source'],
    });
    ctx.body = { total: count, page, limit, objects: rows };
  },

  async search(ctx) {
    const q = (ctx.query.q || '').trim();
    if (!q) {
      ctx.body = { total: 0, objects: [] };
      return;
    }
    const likeParam = sequelize.escape(`%${q}%`);
    const rows = await Package.findAll({
      where: {
        [Op.or]: [
          { name:        { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      order: [
        sequelize.literal(`CASE WHEN name LIKE ${likeParam} THEN 0 ELSE 1 END`),
        ['downloads', 'DESC'],
      ],
      limit: 100,
      attributes: ['name', 'description', 'latest_version', 'downloads', 'github_url', 'github_username', 'source'],
    });
    ctx.body = { total: rows.length, objects: rows };
  },

  async mine(ctx) {
    const user = await getUserFromToken(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Authentication required. Run osm login.' };
      return;
    }

    const ownedRows = await PackageOwner.findAll({
      where: { user_id: user.id },
      attributes: ['package_id'],
    });

    const packageIds = ownedRows.map(r => r.package_id);

    if (!packageIds.length) {
      ctx.body = { total: 0, objects: [] };
      return;
    }

    const rows = await Package.findAll({
      where: { id: packageIds },
      order: [['name', 'ASC']],
      attributes: ['name', 'description', 'latest_version', 'downloads'],
    });

    ctx.body = { total: rows.length, objects: rows };
  },
};

export const authController = {
  async register(ctx) {
    const { username, password, email } = ctx.request.body || {};
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { error: 'username and password required' };
      return;
    }
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'email is required' };
      return;
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      ctx.status = 409;
      ctx.body = { error: 'Username already taken' };
      return;
    }
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      ctx.status = 409;
      ctx.body = { error: 'Email already in use' };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await User.create({
      username,
      password: hashedPassword,
      email,
      verified: false,
      verification_token: verificationToken,
    });

    // Send verification email — if it fails, don't block the response
    try {
      await sendVerificationEmail(email, username, verificationToken);
    } catch (err) {
      console.error('Failed to send verification email:', err.message);
    }

    ctx.status = 201;
    ctx.body = { message: 'Account created. Check your email to verify your address before publishing.' };
  },

  async verify(ctx) {
    const { token } = ctx.params;
    const user = await User.findOne({ where: { verification_token: token } });

    if (!user) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid or expired verification token.' };
      return;
    }

    await user.update({ verified: true, verification_token: null });
    ctx.body = { ok: true, message: 'Email verified. You can now publish skills.' };
  },

  async login(ctx) {
    const { username, password } = ctx.request.body || {};
    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { error: 'username and password required' };
      return;
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      ctx.status = 401;
      ctx.body = { error: 'Invalid credentials' };
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    await AuthToken.create({ user_id: user.id, token });
    ctx.body = { token, username: user.username };
  },

  async whoami(ctx) {
    const user = await getUserFromToken(ctx);
    if (!user) {
      ctx.status = 401;
      ctx.body = { error: 'Not authenticated' };
      return;
    }

    ctx.body = { username: user.username, email: user.email };
  },
};

