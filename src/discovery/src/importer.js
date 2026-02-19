/**
 * Importer — takes a SKILL.md path inside a GitHub repo, downloads the skill
 * files, builds a tarball, and saves the skill to the OSM database.
 *
 * Name-conflict strategy: if `my-skill` already exists, we try `my-skill-2`,
 * `my-skill-3`, … until we find a free slot.
 */

import crypto from 'crypto';
import { Package, PackageVersion } from './db.js';
import { parseSkillMd, sanitizeName, validateName } from './skillmd.js';
import { buildTarball } from './tarball.js';
import { getFileContent, getFileBuffer } from './github.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES    = 512 * 1024;       // 512 KB per file
const MAX_TARBALL_BYTES = 5  * 1024 * 1024; // 5 MB total tarball

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Finds the first available skill name starting from `baseName`.
 * Returns `baseName` if it's free, otherwise `baseName-2`, `baseName-3`, …
 */
async function findAvailableName(baseName) {
  let name = baseName;
  let n    = 2;
  while (n <= 200) {
    const existing = await Package.findOne({ where: { name } });
    if (!existing) return name;
    name = `${baseName}-${n}`;
    n++;
  }
  throw new Error(`Cannot find available name for "${baseName}" after 200 attempts`);
}

/**
 * Given a SKILL.md path (e.g. "skills/my-skill/SKILL.md"), returns the
 * directory that contains it (e.g. "skills/my-skill"), or "" for root.
 */
function dirOf(skillMdPath) {
  const parts = skillMdPath.split('/');
  parts.pop(); // remove "SKILL.md"
  return parts.join('/');
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * Import a single skill from GitHub into the OSM registry.
 *
 * @param {string} repoFullName  e.g. "octocat/hello-skill"
 * @param {string} skillMdPath  e.g. "skills/my-skill/SKILL.md" or "SKILL.md"
 * @param {object} repoInfo     Full GitHub repo object (from GET /repos/:full_name)
 * @returns {string|null}       The imported skill name, or null on failure
 */
/**
 * @param {object|null} repoTree  Pre-fetched git tree from the crawler (avoids a
 *   second getTree() call). If null the importer falls back to skipping siblings.
 */
/**
 * @param {string|null} skillMdSha  Git blob SHA of SKILL.md from the tree (already
 *   fetched by the crawler). If provided and matches the stored SHA in the DB,
 *   the skill is skipped immediately with zero additional API calls.
 */
export async function importSkill(repoFullName, skillMdPath, repoInfo, repoTree = null, skillMdSha = null) {
  // ── 1. Fetch and parse SKILL.md ───────────────────────────────────────────
  const rawContent = await getFileContent(repoFullName, skillMdPath);
  if (!rawContent) {
    console.log(`[importer] Cannot read ${skillMdPath} in ${repoFullName}`);
    return null;
  }

  let frontmatter;
  try {
    ({ frontmatter } = parseSkillMd(rawContent));
  } catch (err) {
    console.log(`[importer] Invalid SKILL.md (${repoFullName}/${skillMdPath}): ${err.message}`);
    return null;
  }

  // ── 2. Validate required fields ───────────────────────────────────────────
  if (!frontmatter.description) {
    console.log(`[importer] Missing description in ${repoFullName}/${skillMdPath}`);
    return null;
  }

  const rawName = sanitizeName(String(frontmatter.name ?? ''));
  const nameErr = validateName(rawName);
  if (nameErr) {
    console.log(`[importer] Invalid name "${frontmatter.name}" (${repoFullName}/${skillMdPath}): ${nameErr}`);
    return null;
  }

  // ── 3. Deduplicate / update check ────────────────────────────────────────
  // Primary key is the skill NAME from frontmatter — not the github_url.
  // This prevents name-2, name-3 duplicates when the same skill appears in
  // multiple repos or when a re-scan finds the URL slightly different.
  const version   = String(frontmatter.metadata?.version ?? '1.0.0');
  const githubUrl = `https://github.com/${repoFullName}/blob/${repoInfo.default_branch}/${skillMdPath}`;

  // Look up by name first (canonical identifier)
  const existing = await Package.findOne({ where: { name: rawName } });

  if (existing) {
    // SHA unchanged — nothing to do (fastest path)
    if (skillMdSha && existing.skillmd_sha === skillMdSha) {
      console.log(`[importer] "${rawName}" unchanged (SHA match) — skipping`);
      return existing.name;
    }
    // Same version and no SHA to compare — nothing to do
    if (existing.latest_version === version && !skillMdSha) {
      console.log(`[importer] "${existing.name}" is already at v${version} — skipping`);
      return existing.name;
    }
    // Check version already recorded
    const alreadyHasVersion = await PackageVersion.findOne({
      where: { package_id: existing.id, version },
    });
    if (alreadyHasVersion) {
      // Update SHA pointer if we now have it
      if (skillMdSha && existing.skillmd_sha !== skillMdSha) {
        await Package.update({ skillmd_sha: skillMdSha }, { where: { id: existing.id } });
      }
      console.log(`[importer] "${existing.name}" already at v${version} — skipping`);
      return existing.name;
    }
    // Genuine update: fall through to build tarball
    console.log(`[importer] "${existing.name}" updating ${existing.latest_version} → v${version}`);
  }

  // ── 4. Resolve skill name ─────────────────────────────────────────────────
  // Always reuse the existing name if found; only allocate a new one if this
  // skill has never been imported before.
  const skillName = existing ? existing.name : rawName;

  // ── 4. Collect files for the tarball ──────────────────────────────────────
  const skillDir = dirOf(skillMdPath); // "" for root, "path/to/dir" otherwise

  const files = []; // { name: string, content: Buffer }
  let totalBytes = 0;

  // Always include SKILL.md first
  const skillMdBuf = Buffer.from(rawContent, 'utf8');
  files.push({ name: 'SKILL.md', content: skillMdBuf });
  totalBytes += skillMdBuf.length;

  // Download other files from the same directory (use pre-fetched tree if available)
  try {
    const tree = repoTree;
    if (!tree) throw new Error('no tree available');
    const dirPrefix = skillDir ? skillDir + '/' : '';

    const siblings = (tree.tree ?? []).filter(item => {
      if (item.type !== 'blob')         return false; // skip subdirs / trees
      if (item.path === skillMdPath)    return false; // already added
      if (dirPrefix) {
        // Must be a direct child of the skill directory (no deeper nesting)
        if (!item.path.startsWith(dirPrefix)) return false;
        const rel = item.path.slice(dirPrefix.length);
        return !rel.includes('/');
      } else {
        // Root-level files only
        return !item.path.includes('/');
      }
    });

    for (const item of siblings) {
      if (totalBytes >= MAX_TARBALL_BYTES) break;
      if ((item.size ?? 0) > MAX_FILE_BYTES) continue;

      const buf = await getFileBuffer(repoFullName, item.path, MAX_FILE_BYTES);
      if (buf) {
        totalBytes += buf.length;
        const relName = dirPrefix ? item.path.slice(dirPrefix.length) : item.path;
        files.push({ name: relName, content: buf });
      }
    }
  } catch (err) {
    // Non-fatal: we can still publish with just SKILL.md
    console.log(`[importer] Warning — couldn't fetch sibling files for ${skillMdPath}: ${err.message}`);
  }

  // ── 5. Build tarball ──────────────────────────────────────────────────────
  const tarball = await buildTarball(files);
  if (tarball.length > MAX_TARBALL_BYTES) {
    console.log(`[importer] Tarball too large (${(tarball.length / 1024).toFixed(0)} KB) for ${skillName}`);
    return null;
  }
  const shasum = crypto.createHash('sha1').update(tarball).digest('hex');

  // ── 6. Build manifest ─────────────────────────────────────────────────────
  // `version` was already resolved in step 3
  const manifest = {
    name:        skillName,
    description: String(frontmatter.description).slice(0, 1024),
    version,
    ...(frontmatter.license        && { license:          frontmatter.license }),
    ...(frontmatter.compatibility  && { compatibility:    String(frontmatter.compatibility).slice(0, 500) }),
    ...(frontmatter.metadata       && { metadata:         frontmatter.metadata }),
    ...(frontmatter['allowed-tools'] && { 'allowed-tools': frontmatter['allowed-tools'] }),
  };

  // ── 8. Persist to DB ──────────────────────────────────────────────────────
  // githubUrl and version already computed above
  const githubUsername = frontmatter.metadata?.author ?? repoFullName.split('/')[0];

  let pkg;
  if (existing) {
    // Update existing package (new version or SHA changed)
    pkg = existing;
    await Package.update(
      { description: manifest.description, latest_version: version, github_username: githubUsername, skillmd_sha: skillMdSha ?? existing.skillmd_sha },
      { where: { id: existing.id } }
    );
  } else {
    pkg = await Package.create({
      name:            skillName,
      description:     manifest.description,
      latest_version:  version,
      downloads:       0,
      github_url:      githubUrl,
      github_username: githubUsername,
      source:          'github',
      skillmd_sha:     skillMdSha ?? null,
    });
  }

  await PackageVersion.create({
    package_id:   pkg.id,
    version,
    manifest:     JSON.stringify(manifest),
    tarball_data: tarball,
    shasum,
  });

  // No PackageOwner row is created for auto-imported skills. The `mine`
  // endpoint only returns skills owned by authenticated users, which is the
  // desired behaviour (GitHub skills are "unowned" in the human sense).

  const action = existing ? 'updated' : 'imported';
  console.log(`[importer] ✓ ${skillName}@${version} ${action} from ${repoFullName} (${skillMdPath})`);
  return skillName;
}
