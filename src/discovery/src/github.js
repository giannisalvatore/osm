/**
 * GitHub API client with automatic rate-limit management.
 *
 * Rate limits (authenticated):
 *   - Core API:   5 000 req / hour
 *   - Search API:    30 req / minute
 *
 * The client reads the X-RateLimit-* response headers after every call and
 * inserts the necessary sleep when the remaining quota drops to a safe floor.
 */

import axios from 'axios';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const gh = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept:                  'application/vnd.github+json',
    'X-GitHub-Api-Version':  '2022-11-28',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  },
  timeout: 30_000,
});

// ── Rate-limit state ──────────────────────────────────────────────────────────
let coreRemaining   = GITHUB_TOKEN ? 5000 : 60;
let searchRemaining = GITHUB_TOKEN ?   30 : 10;
let coreResetAt     = 0;
let searchResetAt   = 0;

// Minimum remaining requests before we pause and wait for the reset window
const CORE_FLOOR   = 5;
const SEARCH_FLOOR = 3;

function updateRateLimits(headers) {
  if (!headers) return;
  const resource  = headers['x-ratelimit-resource'];
  const remaining = parseInt(headers['x-ratelimit-remaining'] ?? '-1', 10);
  const reset     = parseInt(headers['x-ratelimit-reset']     ?? '0',  10);
  if (remaining < 0) return;

  if (resource === 'search') {
    searchRemaining = remaining;
    searchResetAt   = reset;
  } else {
    coreRemaining = remaining;
    coreResetAt   = reset;
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitIfNeeded(isSearch) {
  const remaining = isSearch ? searchRemaining : coreRemaining;
  const resetAt   = isSearch ? searchResetAt   : coreResetAt;
  const floor     = isSearch ? SEARCH_FLOOR    : CORE_FLOOR;

  if (remaining <= floor) {
    const now      = Math.floor(Date.now() / 1000);
    const waitSecs = Math.max(resetAt - now + 3, isSearch ? 60 : 10);
    console.log(`[github] Rate limit low (${remaining} left), waiting ${waitSecs}s…`);
    await sleep(waitSecs * 1000);
  }
}

async function request(url, params = {}, isSearch = false, attempt = 0) {
  await waitIfNeeded(isSearch);

  try {
    const res = await gh.get(url, { params });
    updateRateLimits(res.headers);
    return res.data;
  } catch (err) {
    const status = err.response?.status;

    // Rate-limited or secondary-rate-limited
    if (status === 403 || status === 429) {
      const retryAfter = parseInt(err.response?.headers?.['retry-after'] ?? '0', 10);
      const resetAt    = parseInt(err.response?.headers?.['x-ratelimit-reset'] ?? '0', 10);
      const now        = Math.floor(Date.now() / 1000);
      const waitSecs   = retryAfter || Math.max(resetAt - now + 5, 60);
      console.log(`[github] Hit rate limit (${status}), waiting ${waitSecs}s…`);
      await sleep(waitSecs * 1000);
      if (attempt < 3) return request(url, params, isSearch, attempt + 1);
    }

    // Transient server error — retry with back-off
    if (status >= 500 && attempt < 3) {
      await sleep(5000 * (attempt + 1));
      return request(url, params, isSearch, attempt + 1);
    }

    throw err;
  }
}

// ── Public helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches a single repository object from the GitHub API.
 * Returns the full repo object (stars, license, default_branch, etc.).
 */
export async function getRepo(fullName) {
  return request(`/repos/${fullName}`);
}

/**
 * Search GitHub code for SKILL.md files.
 * Each item contains { name, path, sha, repository {...} }.
 * The repository object is incomplete (no stars/license/default_branch) so
 * requires a separate getRepo() call.
 * Returns the raw API response ({ total_count, items }).
 *
 * @param {number} page
 * @param {number} perPage
 */
export async function searchCode(page = 1, perPage = 30) {
  return request('/search/code', {
    q:        'filename:SKILL.md',
    per_page: perPage,
    page,
  }, /* isSearch */ true);
}

/**
 * Search GitHub repositories.
 * Returns full repository objects (with stars, license, default_branch, etc.).
 * Returns the raw API response ({ total_count, items }).
 *
 * @param {string} query - Search query (e.g., "skill created:2024-01-01..2024-01-31")
 * @param {number} page
 * @param {number} perPage
 */
export async function searchRepositories(query, page = 1, perPage = 100) {
  return request('/search/repositories', {
    q:        query,
    sort:     'stars',
    order:    'desc',
    per_page: perPage,
    page,
  }, /* isSearch */ true);
}

/**
 * Recursive git tree for a repo.
 * Returns { tree: [{path, type, size}], truncated }.
 */
export async function getTree(fullName, branch) {
  return request(`/repos/${fullName}/git/trees/${branch}`, { recursive: 1 });
}

/**
 * Returns the decoded text content of a file, or null if unavailable / too large.
 * Uses the Contents API; falls back to download_url for files > 1 MB.
 */
export async function getFileContent(fullName, filePath) {
  try {
    const data = await request(`/repos/${fullName}/contents/${filePath}`);
    if (Array.isArray(data)) return null; // path is a directory

    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    }
    if (data.download_url) {
      const res = await axios.get(data.download_url, { timeout: 30_000 });
      return typeof res.data === 'string' ? res.data : null;
    }
    return null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Returns the raw Buffer of a file, or null if the file doesn't exist or
 * exceeds `maxBytes`.
 */
export async function getFileBuffer(fullName, filePath, maxBytes = 512 * 1024) {
  try {
    const data = await request(`/repos/${fullName}/contents/${filePath}`);
    if (Array.isArray(data)) return null;
    if ((data.size ?? 0) > maxBytes) return null; // too large, skip

    if (data.encoding === 'base64' && data.content) {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64');
    }
    if (data.download_url) {
      const res = await axios.get(data.download_url, {
        responseType: 'arraybuffer',
        timeout: 30_000,
      });
      return Buffer.from(res.data);
    }
    return null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}
