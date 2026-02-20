/**
 * Discovery crawler.
 *
 * Uses GET /search/repositories?q=skill+created:YYYY-MM-DD..YYYY-MM-DD
 *
 * Searches for repositories containing "skill" keyword, segmented by creation date
 * to bypass GitHub's 1000-result-per-query limit. Each date segment is a separate
 * query with its own 1000-result allowance.
 *
 * Algorithm per cycle
 * ───────────────────
 *  1. For each day in DAYS_TO_SCAN:
 *     a. Search repos created on that day (up to 1000 results = 10 pages × 100).
 *     b. For each repository found:
 *        - Check if already analyzed (skip if yes).
 *        - Fetch full repo metadata (stars, license, default_branch).
 *        - Gate on license.
 *        - Scan tree for SKILL.md files.
 *        - Import each SKILL.md found.
 *        - Mark repo as analyzed.
 *  2. After scanning all days, wait IDLE_WAIT_MS and restart.
 *
 * Rate limits
 * ───────────
 *  Search API: 30 req/min authenticated → SEARCH_DELAY_MS between pages.
 *  Core API (getRepo + file downloads): self-throttled via X-RateLimit-* headers.
 */

import { searchRepositories, getRepo, getTree, sleep } from './github.js';
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
const PER_PAGE        = 100;             // results per page (max allowed)
const MAX_PAGE        = 10;              // max 10 pages per date range (1000 results)
const SEARCH_DELAY_MS = 2000;            // gap between search page requests
const SKILL_DELAY_MS  = 50;              // gap between skill imports within a repo
const REPO_DELAY_MS   = 100;             // gap between repos on the same page
const IDLE_WAIT_MS    = 5 * 60 * 1000;   // wait after finishing all date segments (5 min)
const DAYS_TO_SCAN    = 365;             // how many days back to scan

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
 * Process a repository: scan for SKILL.md files and import them.
 *
 * @param {Object} repoInfo   Full repository object from GitHub API
 */
async function processRepo(repoInfo) {
  const repoFullName = repoInfo.full_name;
  
  // Already analyzed?
  const already = await DiscoveredRepo.findOne({ where: { repo_full_name: repoFullName } });
  if (already) return;

  const stars = repoInfo.stargazers_count ?? 0;
  console.log(`[crawler] → ${repoFullName} (★${stars})`);

  // License gate
  if (!isLicenseAllowed(repoInfo.license)) {
    const lic = repoInfo.license?.spdx_id ?? 'none';
    console.log(`[crawler]   skip — license not allowed (${lic})`);
    await markAnalyzed(repoFullName, stars, 0);
    return;
  }

  // Scan repository tree for SKILL.md files
  let skillPaths = [];
  let tree = null;
  try {
    tree = await getTree(repoFullName, repoInfo.default_branch);
    skillPaths = findSkillMdPaths(tree);
  } catch (err) {
    console.log(`[crawler]   warning — tree unavailable: ${err.message}`);
    await markAnalyzed(repoFullName, stars, 0);
    return;
  }

  if (skillPaths.length === 0) {
    console.log(`[crawler]   no SKILL.md found`);
    await markAnalyzed(repoFullName, stars, 0);
    return;
  }

  console.log(`[crawler]   found ${skillPaths.length} SKILL.md file(s) — importing…`);

  let imported = 0;
  for (const { path: skillPath, sha: skillMdSha } of skillPaths) {
    try {
      const name = await importSkill(repoFullName, skillPath, repoInfo, tree, skillMdSha);
      if (name) imported++;
    } catch (err) {
      console.error(`[crawler]   error importing ${skillPath}: ${err.message}`);
    }
    await sleep(SKILL_DELAY_MS);
  }

  await markAnalyzed(repoFullName, stars, imported);
  console.log(`[crawler]   ✓ ${repoFullName} — ${imported}/${skillPaths.length} skill(s) imported`);
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

/**
 * Generate date range for a specific day offset from today.
 * @param {number} daysAgo - Number of days before today
 * @returns {string} Date range query string "YYYY-MM-DD..YYYY-MM-DD"
 */
function getDateRange(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}..${dateStr}`;
}

export async function runCrawler() {
  console.log('[crawler] Starting OSM discovery crawler…');
  console.log('[crawler] GitHub token:', process.env.GITHUB_TOKEN ? 'present ✓' : 'missing ✗ (60 req/h limit)');
  console.log(`[crawler] Strategy: scan repositories by creation date (last ${DAYS_TO_SCAN} days)`);

  // ── Seed repos first ──────────────────────────────────────────────────────
  await runSeeds();

  while (true) {
    // Iterate through each day segment
    for (let dayOffset = 0; dayOffset < DAYS_TO_SCAN; dayOffset++) {
      const dateRange = getDateRange(dayOffset);
      console.log(`\n[crawler] ═══ Scanning day ${dayOffset + 1}/${DAYS_TO_SCAN}: ${dateRange} ═══`);

      // Paginate through results for this date range (up to 10 pages = 1000 results)
      for (let page = 1; page <= MAX_PAGE; page++) {
        let result;
        try {
          result = await searchRepositories(`skill created:${dateRange}`, page, PER_PAGE);
        } catch (err) {
          console.error(`[crawler] Search error: ${err.message} — retrying in 30s`);
          await sleep(30_000);
          page--; // Retry same page
          continue;
        }

        const items = result.items ?? [];
        console.log(`[crawler] Page ${page}/${MAX_PAGE}: ${items.length} repo(s) (total: ${result.total_count})`);

        if (items.length === 0) break; // No more results for this date

        // Process each repository
        let newCount = 0;
        for (const repo of items) {
          try {
            const already = await DiscoveredRepo.findOne({ where: { repo_full_name: repo.full_name } });
            if (!already) newCount++;
            await processRepo(repo);
          } catch (err) {
            console.error(`[crawler] Unhandled error for ${repo.full_name}: ${err.message}`);
            await markAnalyzed(repo.full_name, 0, 0);
          }
          await sleep(REPO_DELAY_MS);
        }

        console.log(`[crawler] Page ${page}: ${newCount} new repo(s)`);

        // Stop if we got fewer results than requested (last page)
        if (items.length < PER_PAGE) break;

        await sleep(SEARCH_DELAY_MS);
      }
    }

    // Completed full cycle through all days
    console.log(`\n[crawler] ✓ Completed scan of ${DAYS_TO_SCAN} days. Waiting ${IDLE_WAIT_MS / 60_000} min before restarting…`);
    await sleep(IDLE_WAIT_MS);
  }
}
