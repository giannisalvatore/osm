import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { readManifest } from '../utils/manifest.js';
import { resolveDependencies } from '../utils/resolver.js';
import { downloadTarball, extractTarball, fetchMetadata } from '../utils/registry.js';
import { getPackageInstallPath, getPackagesInstallDir } from '../config.js';
import { readLockfile, writeLockfile } from '../utils/lockfile.js';
import { cacheTarball, getCachedTarball } from '../utils/cache.js';

export async function installCommand(packageName) {
  const spinner = ora('Resolving dependencies...').start();
  try {
    const projectManifest = await readManifest();
    const deps = packageName
      ? { [packageName]: (projectManifest.dependencies || {})[packageName] || 'latest' }
      : (projectManifest.dependencies || {});

    const resolved = await resolveDependencies(deps);
    const lock = await readLockfile();
    lock.name = projectManifest.name || lock.name;
    lock.lockfileVersion = 1;
    lock.packages = lock.packages || {};

    await fs.ensureDir(getPackagesInstallDir());

    for (const pkg of Object.values(resolved)) {
      const installPath = getPackageInstallPath(pkg.name);
      await fs.remove(installPath);

      const tmpTar = path.join(os.tmpdir(), `${pkg.name}-${pkg.version}-${Date.now()}.tgz`);
      let tarballPath = null;

      try {
        await downloadTarball(pkg.dist.tarball, tmpTar, pkg.dist.shasum);
        tarballPath = await cacheTarball(pkg.name, pkg.version, tmpTar, pkg.dist.shasum);
      } catch {
        tarballPath = await getCachedTarball(pkg.name, pkg.version, pkg.dist.shasum);
        if (!tarballPath) throw new Error(`Network unavailable and no valid cache for ${pkg.name}@${pkg.version}`);
      }

      await extractTarball(tarballPath, installPath);
      lock.packages[pkg.name] = {
        installPath,
        version: pkg.version,
        resolved: pkg.dist.tarball,
        integrity: pkg.dist.shasum,
        dependencies: pkg.dependencies
      };
    }

    await writeLockfile(lock);
    spinner.succeed(packageName ? `Installed ${packageName}` : 'Installed dependencies from osm.json');
  } catch (error) {
    spinner.fail('Install failed');
    console.log(chalk.red(error.message));
  }
}

export async function installSingleLatest(name) {
  const metadata = await fetchMetadata(name);
  const latest = metadata['dist-tags']?.latest;
  return installCommand(name || latest);
}
