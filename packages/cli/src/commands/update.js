import chalk from 'chalk';
import ora from 'ora';
import { fetchSkill } from '../utils/api.js';
import { isSkillInstalled, loadSkillManifest, saveSkillManifest } from '../utils/storage.js';
import { getSkillPath } from '../config.js';

export async function updateCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm u <skill-name>'));
    return;
  }

  const spinner = ora(`Checking for updates to ${skillName}...`).start();

  try {
    // Check if skill is installed
    if (!await isSkillInstalled(skillName)) {
      spinner.fail(`${skillName} is not installed`);
      console.log(chalk.gray(`Use 'osm i ${skillName}' to install it`));
      return;
    }

    // Load current manifest
    const currentManifest = await loadSkillManifest(skillName);
    const currentVersion = currentManifest.version;

    // Fetch latest version from registry
    const data = await fetchSkill(skillName);
    const latestSkill = data.skill;
    const latestVersion = latestSkill.version;

    if (currentVersion === latestVersion) {
      spinner.succeed(`${skillName} is already up to date (v${currentVersion})`);
      return;
    }

    spinner.text = `Updating ${skillName} from v${currentVersion} to v${latestVersion}...`;

    // Update manifest
    const updatedManifest = {
      name: latestSkill.name,
      version: latestSkill.version,
      description: latestSkill.description,
      author: latestSkill.author,
      repository: latestSkill.repository,
      ai_verified: latestSkill.ai_verified,
      permissions: latestSkill.permissions,
      entrypoint: latestSkill.entrypoint,
      dependencies: latestSkill.dependencies
    };

    await saveSkillManifest(skillName, updatedManifest);

    spinner.succeed(chalk.green(`Successfully updated ${skillName} from v${currentVersion} to v${latestVersion}`));
    console.log(chalk.gray(`  Location: ${getSkillPath(skillName)}`));

  } catch (error) {
    spinner.fail(`Failed to update ${skillName}`);
    console.error(chalk.red(error.message));
  }
}
