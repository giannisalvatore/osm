import chalk from 'chalk';
import ora from 'ora';
import { installCommand } from './install.js';

export async function updateCommand(packageName) {
  const spinner = ora(`Updating ${packageName || 'dependencies'}...`).start();
  try {
    spinner.stop();
    await installCommand(packageName);
  } catch (error) {
    spinner.fail('Update failed');
    console.log(chalk.red(error.message));
  }
}
