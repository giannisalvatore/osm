import yaml from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';

/**
 * Parse SKILL.md file — extracts YAML frontmatter and body.
 * Returns { frontmatter, body }.
 */
export function parseSkillMd(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)([\s\S]*)/);
  if (!match) {
    throw new Error('SKILL.md must start with YAML frontmatter (--- ... ---)');
  }
  const frontmatter = yaml.load(match[1]) || {};
  const body = match[3] || '';
  return { frontmatter, body };
}

/**
 * Validate name per agentskills.io spec:
 * - 1–64 characters
 * - lowercase alphanumeric and hyphens only
 * - must not start or end with a hyphen
 * - must not contain consecutive hyphens
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') return 'name is required';
  if (name.length < 1 || name.length > 64) return 'name must be 1–64 characters';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name))
    return 'name must be lowercase alphanumeric + hyphens; must not start or end with a hyphen';
  if (/--/.test(name)) return 'name must not contain consecutive hyphens (--)';
  return null;
}

/**
 * Validate description: 1–1024 characters, non-empty.
 */
export function validateDescription(desc) {
  if (!desc || typeof desc !== 'string') return 'description is required';
  if (desc.length < 1 || desc.length > 1024) return 'description must be 1–1024 characters';
  return null;
}

/**
 * Validate optional compatibility: max 500 characters.
 */
export function validateCompatibility(compat) {
  if (!compat) return null;
  if (typeof compat !== 'string') return 'compatibility must be a string';
  if (compat.length > 500) return 'compatibility must be max 500 characters';
  return null;
}

/**
 * Validate optional metadata: map of string keys → string values.
 */
export function validateMetadata(meta) {
  if (!meta) return null;
  if (typeof meta !== 'object' || Array.isArray(meta)) return 'metadata must be a key-value map';
  for (const [k, v] of Object.entries(meta)) {
    if (typeof k !== 'string') return 'metadata keys must be strings';
    if (typeof v !== 'string' && typeof v !== 'number') return `metadata value for "${k}" must be a string`;
  }
  return null;
}

/**
 * Read and fully validate a SKILL.md.
 * Returns a normalized manifest object ready to send to the registry.
 * Throws an Error with a human-readable message on any violation.
 */
export async function readAndValidateSkillMd(cwd = process.cwd()) {
  const skillMdPath = path.join(cwd, 'SKILL.md');
  if (!(await fs.pathExists(skillMdPath))) {
    throw new Error('SKILL.md not found in current directory');
  }

  const content = await fs.readFile(skillMdPath, 'utf8');
  const { frontmatter } = parseSkillMd(content);

  // Name
  const nameErr = validateName(frontmatter.name);
  if (nameErr) throw new Error(`Invalid name: ${nameErr}`);

  // Name must match directory name
  const dirName = path.basename(cwd);
  if (frontmatter.name !== dirName) {
    throw new Error(`name "${frontmatter.name}" must match the parent directory name "${dirName}"`);
  }

  // Description
  const descErr = validateDescription(frontmatter.description);
  if (descErr) throw new Error(`Invalid description: ${descErr}`);

  // Optional fields
  const compatErr = validateCompatibility(frontmatter.compatibility);
  if (compatErr) throw new Error(`Invalid compatibility: ${compatErr}`);

  const metaErr = validateMetadata(frontmatter.metadata);
  if (metaErr) throw new Error(`Invalid metadata: ${metaErr}`);

  // Extract version from metadata.version, fall back to '1.0.0'
  const version = String(frontmatter.metadata?.version || '1.0.0');

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    version,
    ...(frontmatter.license && { license: frontmatter.license }),
    ...(frontmatter.compatibility && { compatibility: frontmatter.compatibility }),
    ...(frontmatter.metadata && { metadata: frontmatter.metadata }),
    ...(frontmatter['allowed-tools'] && { 'allowed-tools': frontmatter['allowed-tools'] }),
  };
}
