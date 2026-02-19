/**
 * Minimal SKILL.md parser for the discovery service.
 *
 * Mirrors the CLI's implementation but relaxes the directory-name == skill-name
 * constraint (not applicable when importing from GitHub).
 */

import yaml from 'js-yaml';

export function parseSkillMd(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)([\s\S]*)/);
  if (!match) {
    throw new Error('SKILL.md must start with YAML frontmatter (--- … ---)');
  }
  const frontmatter = yaml.load(match[1]) || {};
  const body        = match[3] || '';
  return { frontmatter, body };
}

/** Sanitise a raw name into a valid OSM skill name. */
export function sanitizeName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')   // replace anything illegal with -
    .replace(/^-+|-+$/g, '')        // strip leading/trailing -
    .replace(/-{2,}/g, '-')         // collapse consecutive -
    .slice(0, 64);
}

/** Returns null if valid, otherwise an error string. */
export function validateName(name) {
  if (!name) return 'name is required';
  if (name.length < 1 || name.length > 64) return 'name must be 1–64 characters';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name))
    return 'name must be lowercase alphanumeric + hyphens, no leading/trailing hyphens';
  if (/--/.test(name)) return 'name must not contain consecutive hyphens';
  return null;
}
