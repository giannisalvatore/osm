import os from 'os';
import path from 'path';

export const CONFIG = {
  API_URL: process.env.OSM_API_URL || 'https://api.osmagent.com',
  GLOBAL_OSM_DIR: path.join(os.homedir(), '.osm'),
  CACHE_DIR: path.join(os.homedir(), '.osm', 'cache'),
  TOKENS_FILE: path.join(os.homedir(), '.osm', 'auth.json'),
  SKILLS_DIR: path.join(os.homedir(), '.osm', 'skills'),
};

export function getProjectManifestPath(cwd = process.cwd()) {
  return path.join(cwd, 'SKILL.md');
}

export function getSkillPath(name) {
  return path.join(CONFIG.SKILLS_DIR, name);
}

export function getSkillManifestPath(name) {
  return path.join(CONFIG.SKILLS_DIR, name, 'SKILL.md');
}

// Aliases used by install command
export function getPackagesInstallDir() {
  return CONFIG.SKILLS_DIR;
}

export function getPackageInstallPath(name) {
  return path.join(CONFIG.SKILLS_DIR, name);
}

export function getLockfilePath(cwd = process.cwd()) {
  return path.join(cwd, 'osm-lock.json');
}

export function getCachePackageDir(name, version) {
  return path.join(CONFIG.CACHE_DIR, `${name}@${version}`);
}
