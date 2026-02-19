import fs from 'fs-extra';
import { CONFIG, getSkillPath, getSkillManifestPath } from '../config.js';
import { parseSkillMd } from './skillmd.js';

export async function ensureOSMDir() {
  await fs.ensureDir(CONFIG.GLOBAL_OSM_DIR);
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
        const content = await fs.readFile(manifestPath, 'utf8');
        try {
          const { frontmatter } = parseSkillMd(content);
          skills.push({ ...frontmatter, name: dir, installed: true });
        } catch {
          // skip malformed SKILL.md
        }
      }
    }

    return skills;
  } catch {
    return [];
  }
}

export async function loadSkillManifest(skillName) {
  const manifestPath = getSkillManifestPath(skillName);
  const content = await fs.readFile(manifestPath, 'utf8');
  const { frontmatter } = parseSkillMd(content);
  return frontmatter;
}

export async function removeSkill(skillName) {
  const skillPath = getSkillPath(skillName);
  await fs.remove(skillPath);
}
