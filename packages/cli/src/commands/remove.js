import chalk from 'chalk';
import ora from 'ora';
import { isSkillInstalled, removeSkill as removeSkillStorage } from '../utils/storage.js';

export async function removeCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm rm <skill-name>'));
    return;
  }

  const spinner = ora(`Removing ${skillName}...`).start();

  try {
    // Check if skill is installed
    if (!await isSkillInstalled(skillName)) {
      spinner.fail(`${skillName} is not installed`);
      return;
    }

    // Remove skill directory
    await removeSkillStorage(skillName);

    spinner.succeed(chalk.green(`Successfully removed ${skillName}`));

  } catch (error) {
    spinner.fail(`Failed to remove ${skillName}`);
    console.error(chalk.red(error.message));
  }
}
