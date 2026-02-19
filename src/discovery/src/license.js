/**
 * License gate.
 *
 * Strategy: ALLOW everything EXCEPT licenses that explicitly forbid copying,
 * redistribution, or commercial use.
 *
 * Blocked:
 *   - null / missing → no licence = all rights reserved by default
 *   - NOASSERTION    → GitHub couldn't detect the licence (treated as unknown)
 *   - CC-BY-NC-*     → non-commercial restriction
 *   - BUSL-1.1       → Business Source Licence (time-delayed open source)
 *   - SSPL-1.0       → Server Side Public Licence (very restrictive for SaaS)
 *
 * Everything else (MIT, Apache-2.0, GPL-*, LGPL-*, AGPL-*, MPL-*, BSD-*,
 * ISC, Unlicense, CC0, CC-BY, etc.) is allowed because those licences all
 * permit copying and redistribution (possibly with conditions).
 */

const BLOCKED_SPDX = new Set([
  'NOASSERTION',
  'BUSL-1.1',
  'SSPL-1.0',
  'CC-BY-NC-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-NC-ND-4.0',
  'CC-BY-NC-2.0',
  'CC-BY-NC-SA-2.0',
  'CC-BY-NC-ND-2.0',
]);

/**
 * @param {object|null} license - The `license` object returned by GitHub's
 *   /repos/{owner}/{repo} endpoint. Has at least { spdx_id }.
 * @returns {boolean} true = import allowed, false = skip
 */
export function isLicenseAllowed(license) {
  if (!license) return false;               // no licence detected
  const spdx = (license.spdx_id ?? '').trim();
  if (!spdx) return false;
  return !BLOCKED_SPDX.has(spdx);
}
