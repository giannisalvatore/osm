import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { CONFIG, getCachePackageDir } from '../config.js';

export async function ensureCacheDir() {
  await fs.ensureDir(CONFIG.CACHE_DIR);
}

export async function cacheTarball(name, version, tarballPath, shasum) {
  await ensureCacheDir();
  const dir = getCachePackageDir(name, version);
  await fs.ensureDir(dir);
  const cachedTarball = path.join(dir, `${name}-${version}.tgz`);
  await fs.copyFile(tarballPath, cachedTarball);
  await fs.writeJson(path.join(dir, 'meta.json'), { shasum }, { spaces: 2 });
  return cachedTarball;
}

export async function getCachedTarball(name, version, expectedShasum) {
  const dir = getCachePackageDir(name, version);
  const file = path.join(dir, `${name}-${version}.tgz`);
  if (!(await fs.pathExists(file))) return null;
  const buffer = await fs.readFile(file);
  const actual = crypto.createHash('sha1').update(buffer).digest('hex');
  if (expectedShasum && actual !== expectedShasum) return null;
  return file;
}
