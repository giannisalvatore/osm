/**
 * Discovery crawler.
 *
 * Uses GET /search/code?q=filename:SKILL.md
 *
 * The code search API returns individual file results (each containing path,
 * sha, and a partial repository object). We group results by repository,
 * fetch full repo metadata (stars, license, default_branch) via getRepo(),
 * and import each discovered SKILL.md.
 *
 * Algorithm per cycle
 * ───────────────────
 *  1. Fetch page N (30 code results at a time).
 *  2. Group files by repository.
 *  3. For each repository:
 *     a. Fetch full repo metadata (stars, license, default_branch).
 *     b. Gate on license.
 *     c. Import each SKILL.md found in that repo.
 *     d. Mark repo as done.
 *  4. Advance to next page; when exhausted wait IDLE_WAIT_MS and restart.
 *
 * Rate limits
 * ───────────
 *  Search API: 30 req/min authenticated → SEARCH_DELAY_MS between pages.
 *  Core API (getRepo + file downloads): self-throttled via X-RateLimit-* headers.
 */

import { searchCode, getRepo, getTree, sleep } from './github.js';
import { isLicenseAllowed }                    from './license.js';
import { importSkill }                         from './importer.js';
import { DiscoveredRepo }                      from './db.js';

// ── Seed repos (manually curated, imported at startup) ───────────────────────
// Add any GitHub repos here that won't surface via the SKILL.md search API.
// Each entry needs { fullName, branch } — license is NOT checked for seeds.
const SEED_REPOS = [
  { fullName: 'openclaw/skills', branch: 'main' },
];

// ── Tuning ────────────────────────────────────────────────────────────────────
const PER_PAGE        = 30;              // code results per search page
const SEARCH_DELAY_MS = 1000;           // gap between search page requests
const SKILL_DELAY_MS  = 50;             // gap between skill imports within a repo
const REPO_DELAY_MS   = 100;             // gap between repos on the same page
const IDLE_WAIT_MS    = 5 * 60 * 1000;  // wait after no new repos found (5 min)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Helper for seed repos: extract SKILL.md paths from a git tree.
 */
function findSkillMdPaths(tree) {
  return (tree?.tree ?? [])
    .filter(item => item.type === 'blob' && /(?:^|\/)SKILL\.md$/i.test(item.path))
    .map(item => ({ path: item.path, sha: item.sha ?? null }));
}

async function markAnalyzed(repoFullName, stars, skillsFound) {
  try {
    await DiscoveredRepo.create({
      repo_full_name: repoFullName,
      stars:          stars       ?? 0,
      skills_found:   skillsFound ?? 0,
      analyzed_at:    new Date(),
    });
  } catch (_) {
    await DiscoveredRepo.update(
      { stars, skills_found: skillsFound, analyzed_at: new Date() },
      { where: { repo_full_name: repoFullName } }
    ).catch(() => {});
  }
}

// ── Process a single repo ─────────────────────────────────────────────────────

/**
 * Process a repository and import all the given SKILL.md files.
 *
 * @param {string} repoFullName   e.g. "octocat/hello-world"
 * @param {Array} skillFiles      [{path, sha}, ...] from code search results
 */
async function processRepo(repoFullName, skillFiles) {
  // Already analyzed?
  const already = await DiscoveredRepo.findOne({ where: { repo_full_name: repoFullName } });
  if (already) return;

  // Fetch full repository metadata (stars, license, default_branch)
  let repoInfo;
  try {
    repoInfo = await getRepo(repoFullName);
  } catch (err) {
    console.error(`[crawler] Could not fetch ${repoFullName}: ${err.message}`);
    await markAnalyzed(repoFullName, 0, 0);
    return;
  }

  const stars = repoInfo.stargazers_count ?? 0;
  console.log(`[crawler] → ${repoFullName} (★${stars})`);

  // License gate
  if (!isLicenseAllowed(repoInfo.license)) {
    const lic = repoInfo.license?.spdx_id ?? 'none';
    console.log(`[crawler]   skip — license not allowed (${lic})`);
    await markAnalyzed(repoFullName, stars, 0);
    return;
  }

  console.log(`[crawler]   found ${skillFiles.length} SKILL.md file(s) — importing…`);

  let imported = 0;
  for (const { path: skillPath, sha: skillMdSha } of skillFiles) {
    try {
      // Pass null for repoTree since we don't have it (code search doesn't provide tree)
      const name = await importSkill(repoFullName, skillPath, repoInfo, null, skillMdSha);
      if (name) imported++;
    } catch (err) {
      console.error(`[crawler]   error importing ${skillPath}: ${err.message}`);
    }
    await sleep(SKILL_DELAY_MS);
  }

  await markAnalyzed(repoFullName, stars, imported);
  console.log(`[crawler]   ✓ ${repoFullName} — ${imported}/${skillFiles.length} skill(s) imported`);
}

// ── Main loop ─────────────────────────────────────────────────────────────────

// ── Seed import ──────────────────────────────────────────────────────────────

async function runSeeds() {
  if (SEED_REPOS.length === 0) return;
  console.log(`[seeds] Processing ${SEED_REPOS.length} seed repo(s)…`);

  for (const seed of SEED_REPOS) {
    // Unlike the main crawler, seeds are always re-scanned on startup so that
    // version updates in the upstream repo are picked up. Deduplication and
    // version comparison happen inside importSkill().
    console.log(`[seeds] → ${seed.fullName}`);
    let repoInfo;
    try {
      repoInfo = await getRepo(seed.fullName);
    } catch (err) {
      console.error(`[seeds] Could not fetch repo info for ${seed.fullName}: ${err.message}`);
      continue;
    }

    // Override the branch with the configured one (getRepo returns default_branch too,
    // but honour the explicit config in case they differ)
    repoInfo.default_branch = seed.branch ?? repoInfo.default_branch;

    // Walk tree to find all SKILL.md files
    let skillPaths = [];
    let tree       = null;
    try {
      tree       = await getTree(seed.fullName, repoInfo.default_branch);
      skillPaths = findSkillMdPaths(tree);
    } catch (err) {
      console.log(`[seeds] Warning — tree unavailable for ${seed.fullName}: ${err.message}`);
    }

    if (skillPaths.length === 0) {
      console.log(`[seeds] No SKILL.md found in ${seed.fullName} — marking as analyzed.`);
      await markAnalyzed(seed.fullName, repoInfo.stargazers_count ?? 0, 0);
      continue;
    }

    console.log(`[seeds] Found ${skillPaths.length} SKILL.md file(s) in ${seed.fullName} — importing…`);
    let imported = 0;
    for (const { path: skillPath, sha: skillMdSha } of skillPaths) {
      try {
        const name = await importSkill(seed.fullName, skillPath, repoInfo, tree, skillMdSha);
        if (name) imported++;
      } catch (err) {
        console.error(`[seeds] Error importing ${skillPath}: ${err.message}`);
      }
      await sleep(SKILL_DELAY_MS);
    }

    await markAnalyzed(seed.fullName, repoInfo.stargazers_count ?? 0, imported);
    console.log(`[seeds] ✓ ${seed.fullName} — ${imported}/${skillPaths.length} skill(s) imported`);
  }

  console.log('[seeds] Seed import complete.');
}

// ── Main crawler loop ─────────────────────────────────────────────────────────

export async function runCrawler() {
  console.log('[crawler] Starting OSM discovery crawler…');
  console.log('[crawler] GitHub token:', process.env.GITHUB_TOKEN ? 'present ✓' : 'missing ✗ (60 req/h limit)');

  // ── Seed repos first ──────────────────────────────────────────────────────
  await runSeeds();

  let page = 1;

  while (true) {
    let result;
    try {
      console.log(`[crawler] Fetching page ${page} (${PER_PAGE} code results)…`);
      result = await searchCode(page, PER_PAGE);
    } catch (err) {
      console.error(`[crawler] Search error: ${err.message} — retrying in 30s`);
      await sleep(30_000);
      continue;
    }

    const items = result.items ?? [];
    console.log(`[crawler] Page ${page}: ${items.length} file(s) (GitHub total: ${result.total_count})`);

    if (items.length === 0) {
      console.log(`[crawler] No results. Waiting ${IDLE_WAIT_MS / 60_000} min before restarting…`);
      page = 1;
      await sleep(IDLE_WAIT_MS);
      continue;
    }

    // Group files by repository
    const repoMap = new Map(); // fullName → [{path, sha}, ...]
    for (const item of items) {
      const fullName = item.repository?.full_name;
      if (!fullName) continue;
      if (!repoMap.has(fullName)) {
        repoMap.set(fullName, []);
      }
      repoMap.get(fullName).push({
        path: item.path,
        sha:  item.sha ?? null,
      });
    }

    console.log(`[crawler] Page ${page}: ${repoMap.size} unique repo(s)`);

    // Process each unique repository
    let newOnThisPage = 0;
    for (const [fullName, skillFiles] of repoMap.entries()) {
      try {
        const before = await DiscoveredRepo.findOne({ where: { repo_full_name: fullName } });
        if (!before) newOnThisPage++;
        await processRepo(fullName, skillFiles);
      } catch (err) {
        console.error(`[crawler] Unhandled error for ${fullName}: ${err.message}`);
        await markAnalyzed(fullName, 0, 0);
      }
      await sleep(REPO_DELAY_MS);
    }

    console.log(`[crawler] Page ${page}: ${newOnThisPage} new repo(s) processed.`);

    // Last page → cycle complete, wait and restart
    if (items.length < PER_PAGE) {
      console.log(`[crawler] All pages exhausted. Waiting ${IDLE_WAIT_MS / 60_000} min before restarting…`);
      page = 1;
      await sleep(IDLE_WAIT_MS);
      continue;
    }

    page++;
    await sleep(SEARCH_DELAY_MS);
  }
}
