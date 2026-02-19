import chalk from 'chalk';
import ora from 'ora';
import { getInstalledSkills } from '../utils/storage.js';
import { installCommand } from './install.js';

export async function updateCommand(packageName) {
  if (packageName) {
    await installCommand(packageName);
    return;
  }

  // Update all installed skills
  const installed = await getInstalledSkills();
  if (!installed.length) {
    console.log(chalk.yellow('No skills installed.'));
    return;
  }

  console.log(chalk.blue(`Updating ${installed.length} skill(s)...\n`));
  for (const skill of installed) {
    await installCommand(skill.name);
  }
}
