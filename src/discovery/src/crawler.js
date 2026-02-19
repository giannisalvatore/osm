/**
 * Discovery crawler.
 *
 * Uses GET /search/repositories?q=SKILL.md&sort=stars&order=desc
 *
 * Results are already sorted by stars descending, and each item already
 * contains the full repository object (stars, license, default_branch) —
 * so no separate getRepo() call is needed.
 *
 * Algorithm per cycle
 * ───────────────────
 *  1. Fetch page N (30 repos at a time), stars high → low.
 *  2. Skip repos already in discovered_repos.
 *  3. Gate on licence.
 *  4. Walk the full git tree to find every SKILL.md in the repo.
 *  5. Import each skill.
 *  6. Mark repo as done.
 *  7. Advance to next page; when exhausted wait IDLE_WAIT_MS and restart.
 *
 * Rate limits
 * ───────────
 *  Search API: 30 req/min authenticated → SEARCH_DELAY_MS between pages.
 *  Core API (tree + file downloads): self-throttled via X-RateLimit-* headers.
 */

import { searchRepos, getRepo, getTree, sleep } from './github.js';
import { isLicenseAllowed }            from './license.js';
import { importSkill }                 from './importer.js';
import { DiscoveredRepo }              from './db.js';

// ── Seed repos (manually curated, imported at startup) ───────────────────────
// Add any GitHub repos here that won't surface via the SKILL.md search API.
// Each entry needs { fullName, branch } — license is NOT checked for seeds.
const SEED_REPOS = [
  { fullName: 'openclaw/skills', branch: 'main' },
];

// ── Tuning ────────────────────────────────────────────────────────────────────
const PER_PAGE        = 30;              // repos per search page
const SEARCH_DELAY_MS = 1000;           // gap between search page requests
const SKILL_DELAY_MS  = 50;             // gap between skill imports within a repo
const REPO_DELAY_MS   = 100;             // gap between repos on the same page
const IDLE_WAIT_MS    = 5 * 60 * 1000;  // wait after no new repos found (5 min)

// ── Helpers ───────────────────────────────────────────────────────────────────

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

async function processRepo(repoInfo) {
  const fullName = repoInfo.full_name;
  const stars    = repoInfo.stargazers_count ?? 0;

  // Already analyzed?
  const already = await DiscoveredRepo.findOne({ where: { repo_full_name: fullName } });
  if (already) return;

  console.log(`[crawler] → ${fullName} (★${stars})`);

  // Licence gate (license object already in repoInfo from search result)
  if (!isLicenseAllowed(repoInfo.license)) {
    const lic = repoInfo.license?.spdx_id ?? 'none';
    console.log(`[crawler]   skip — licence not allowed (${lic})`);
    await markAnalyzed(fullName, stars, 0);
    return;
  }

  // Walk full git tree to find every SKILL.md (handles multi-skill repos)
  let skillPaths = [];
  let tree       = null;
  try {
    tree       = await getTree(fullName, repoInfo.default_branch);
    skillPaths = findSkillMdPaths(tree);
  } catch (err) {
    console.log(`[crawler]   warning — tree unavailable: ${err.message}`);
  }

  if (skillPaths.length === 0) {
    console.log(`[crawler]   no SKILL.md found in tree — skipping`);
    await markAnalyzed(fullName, stars, 0);
    return;
  }

  console.log(`[crawler]   found ${skillPaths.length} SKILL.md file(s) — importing…`);

  let imported = 0;
  for (const { path: skillPath, sha: skillMdSha } of skillPaths) {
    try {
      const name = await importSkill(fullName, skillPath, repoInfo, tree, skillMdSha);
      if (name) imported++;
    } catch (err) {
      console.error(`[crawler]   error importing ${skillPath}: ${err.message}`);
    }
    await sleep(SKILL_DELAY_MS);
  }

  await markAnalyzed(fullName, stars, imported);
  console.log(`[crawler]   ✓ ${fullName} — ${imported}/${skillPaths.length} skill(s) imported`);
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
      console.log(`[crawler] Fetching page ${page} (${PER_PAGE} repos, ★ desc)…`);
      result = await searchRepos(page, PER_PAGE);
    } catch (err) {
      console.error(`[crawler] Search error: ${err.message} — retrying in 30s`);
      await sleep(30_000);
      continue;
    }

    const items = result.items ?? [];
    console.log(`[crawler] Page ${page}: ${items.length} repo(s) (GitHub total: ${result.total_count})`);

    if (items.length === 0) {
      console.log(`[crawler] No results. Waiting ${IDLE_WAIT_MS / 60_000} min before restarting…`);
      page = 1;
      await sleep(IDLE_WAIT_MS);
      continue;
    }

    // Process each repo in the page (already star-sorted by GitHub)
    let newOnThisPage = 0;
    for (const repoInfo of items) {
      try {
        const before = await DiscoveredRepo.findOne({ where: { repo_full_name: repoInfo.full_name } });
        if (!before) newOnThisPage++;
        await processRepo(repoInfo);
      } catch (err) {
        console.error(`[crawler] Unhandled error for ${repoInfo.full_name}: ${err.message}`);
        await markAnalyzed(repoInfo.full_name, repoInfo.stargazers_count ?? 0, 0);
      }
      await sleep(REPO_DELAY_MS);
    }

    console.log(`[crawler] Page ${page}: ${newOnThisPage} new repo(s) processed.`);

    // Last page from GitHub or no more results → cycle complete, wait and restart
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
