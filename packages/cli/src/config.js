import os from 'os';
import path from 'path';

export const CONFIG = {
  API_URL: process.env.OSM_API_URL || 'http://localhost:3000',
  GLOBAL_OSM_DIR: path.join(os.homedir(), '.osm'),
  CACHE_DIR: path.join(os.homedir(), '.osm', 'cache'),
  TOKENS_FILE: path.join(os.homedir(), '.osm', 'auth.json')
};

export function getProjectManifestPath(cwd = process.cwd()) {
  return path.join(cwd, 'osm.json');
}

export function getLockfilePath(cwd = process.cwd()) {
  return path.join(cwd, 'osm-lock.json');
}

export function getProjectOsmDir(cwd = process.cwd()) {
  return path.join(cwd, '.osm');
}

export function getPackagesInstallDir(cwd = process.cwd()) {
  return path.join(getProjectOsmDir(cwd), 'packages');
}

export function getPackageInstallPath(name, cwd = process.cwd()) {
  return path.join(getPackagesInstallDir(cwd), name);
}

export function getCachePackageDir(name, version) {
  return path.join(CONFIG.CACHE_DIR, `${name}@${version}`);
}
