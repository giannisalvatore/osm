import fs from 'fs-extra';
import { CONFIG, getSkillPath, getSkillManifestPath } from '../config.js';

export async function ensureOSMDir() {
  await fs.ensureDir(CONFIG.OSM_DIR);
  await fs.ensureDir(CONFIG.SKILLS_DIR);
}

export async function isSkillInstalled(skillName) {
  const skillPath = getSkillPath(skillName);
  return await fs.pathExists(skillPath);
}

export async function getInstalledSkills() {
  await ensureOSMDir();

  try {
    const dirs = await fs.readdir(CONFIG.SKILLS_DIR);
    const skills = [];

    for (const dir of dirs) {
      const manifestPath = getSkillManifestPath(dir);
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        skills.push({ ...manifest, installed: true });
      }
    }

    return skills;
  } catch {
    return [];
  }
}

export async function saveSkillManifest(skillName, manifest) {
  const manifestPath = getSkillManifestPath(skillName);
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

export async function loadSkillManifest(skillName) {
  const manifestPath = getSkillManifestPath(skillName);
  return await fs.readJson(manifestPath);
}

export async function removeSkill(skillName) {
  const skillPath = getSkillPath(skillName);
  await fs.remove(skillPath);
}
