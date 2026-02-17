import os from 'os';
import path from 'path';

export const CONFIG = {
  API_URL: process.env.OSM_API_URL || 'http://localhost:3000',
  OSM_DIR: path.join(os.homedir(), '.osm'),
  SKILLS_DIR: path.join(os.homedir(), '.osm', 'skills'),
  CONFIG_FILE: path.join(os.homedir(), '.osm', 'config.json')
};

export function getSkillPath(skillName) {
  return path.join(CONFIG.SKILLS_DIR, skillName);
}

export function getSkillManifestPath(skillName) {
  return path.join(getSkillPath(skillName), 'SKILL.json');
}
