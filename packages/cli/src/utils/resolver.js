import semver from 'semver';
import { fetchMetadata } from './registry.js';

function pickVersion(metadata, range) {
  const versions = Object.keys(metadata.versions || {});
  if (!versions.length) throw new Error(`No versions available for ${metadata.name}`);
  if (!range || range === 'latest') return metadata['dist-tags']?.latest || versions.sort(semver.rcompare)[0];
  if (metadata.versions[range]) return range;
  const matched = versions.filter((v) => semver.satisfies(v, range)).sort(semver.rcompare);
  if (!matched.length) throw new Error(`No version for ${metadata.name} satisfies ${range}`);
  return matched[0];
}

/**
 * Resolve full dependency tree for osm.json dependencies.
 */
export async function resolveDependencies(initialDeps) {
  const resolved = {};

  async function visit(name, range) {
    const metadata = await fetchMetadata(name);
    const version = pickVersion(metadata, range);
    const key = `${name}@${version}`;
    if (resolved[key]) return;
    const manifest = metadata.versions[version];
    resolved[key] = {
      name,
      version,
      dependencies: manifest.dependencies || {},
      dist: manifest.dist
    };

    for (const [depName, depRange] of Object.entries(manifest.dependencies || {})) {
      await visit(depName, depRange);
    }
  }

  for (const [name, range] of Object.entries(initialDeps || {})) {
    await visit(name, range);
  }

  return resolved;
}
