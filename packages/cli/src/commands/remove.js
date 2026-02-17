import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { getPackageInstallPath } from '../config.js';
import { readLockfile, writeLockfile } from '../utils/lockfile.js';

export async function removeCommand(packageName) {
  if (!packageName) {
    console.log(chalk.red('Please provide a package name'));
    return;
  }

  const spinner = ora(`Uninstalling ${packageName}...`).start();
  try {
    await fs.remove(getPackageInstallPath(packageName));
    const lock = await readLockfile();
    if (lock.packages?.[packageName]) {
      delete lock.packages[packageName];
      await writeLockfile(lock);
    }
    spinner.succeed(`Uninstalled ${packageName}`);
  } catch (error) {
    spinner.fail('Uninstall failed');
    console.log(chalk.red(error.message));
  }
}
