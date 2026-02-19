import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { downloadTarball, extractTarball, fetchMetadata } from '../utils/registry.js';
import { getPackageInstallPath, getPackagesInstallDir } from '../config.js';
import { cacheTarball, getCachedTarball } from '../utils/cache.js';

export async function installCommand(packageName) {
  if (!packageName) {
    console.log(chalk.red('Usage: osm install <skill-name>'));
    return;
  }

  const spinner = ora(`Fetching ${packageName} from registry...`).start();

  try {
    const metadata = await fetchMetadata(packageName);
    const version = metadata['dist-tags']?.latest || Object.keys(metadata.versions || {})[0];
    if (!version) throw new Error(`No published version found for ${packageName}`);

    const versionData = metadata.versions?.[version];
    if (!versionData?.dist?.tarball) throw new Error(`No tarball available for ${packageName}@${version}`);

    const { tarball, shasum } = versionData.dist;

    spinner.text = `Downloading ${packageName}@${version}...`;

    const tmpTar = path.join(os.tmpdir(), `${packageName}-${version}-${Date.now()}.tgz`);
    let tarballPath = null;

    try {
      await downloadTarball(tarball, tmpTar, shasum);
      tarballPath = await cacheTarball(packageName, version, tmpTar, shasum);
    } catch {
      tarballPath = await getCachedTarball(packageName, version, shasum);
      if (!tarballPath) throw new Error(`Network unavailable and no valid cache for ${packageName}@${version}`);
    }

    const installPath = getPackageInstallPath(packageName);
    await fs.ensureDir(getPackagesInstallDir());
    await fs.remove(installPath);
    await extractTarball(tarballPath, installPath);

    spinner.succeed(`Installed ${packageName}@${version} → ~/.osm/skills/${packageName}`);
  } catch (error) {
    spinner.fail('Install failed');
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
