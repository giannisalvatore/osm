import fs from 'fs-extra';
import { getLockfilePath } from '../config.js';

export async function readLockfile(cwd = process.cwd()) {
  const lockPath = getLockfilePath(cwd);
  if (!(await fs.pathExists(lockPath))) return { name: null, lockfileVersion: 1, packages: {} };
  return fs.readJson(lockPath);
}

export async function writeLockfile(lock, cwd = process.cwd()) {
  const lockPath = getLockfilePath(cwd);
  await fs.writeJson(lockPath, lock, { spaces: 2 });
}
