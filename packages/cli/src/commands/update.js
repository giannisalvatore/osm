import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { fetchSkill } from '../utils/api.js';
import { isSkillInstalled, loadSkillManifest, saveSkillManifest } from '../utils/storage.js';
import { getSkillPath } from '../config.js';

const execFileAsync = promisify(execFile);

export async function updateCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm u <skill-name>'));
    return;
  }

  const spinner = ora(`Checking for updates to ${skillName}...`).start();

  try {
    if (!await isSkillInstalled(skillName)) {
      spinner.fail(`${skillName} is not installed`);
      console.log(chalk.gray(`Use 'osm i ${skillName}' to install it`));
      return;
    }

    const currentManifest = await loadSkillManifest(skillName);
    const currentVersion = currentManifest.version;

    const data = await fetchSkill(skillName);
    const latestSkill = data.skill;
    const latestVersion = latestSkill.version;
    const skillPath = getSkillPath(skillName);

    spinner.text = `Syncing source from ${latestSkill.repository}...`;

    await fs.remove(skillPath);
    await execFileAsync('git', ['clone', '--depth', '1', latestSkill.repository, skillPath]);

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

    if (currentVersion === latestVersion) {
      spinner.succeed(`${skillName} source refreshed (version still v${currentVersion})`);
    } else {
      spinner.succeed(chalk.green(`Successfully updated ${skillName} from v${currentVersion} to v${latestVersion}`));
    }

    console.log(chalk.gray(`  Location: ${skillPath}`));

  } catch (error) {
    spinner.fail(`Failed to update ${skillName}`);
    console.error(chalk.red(error.message));
  }
}
