import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { fetchSkill, incrementDownloads } from '../utils/api.js';
import { ensureOSMDir, isSkillInstalled, saveSkillManifest } from '../utils/storage.js';
import { getSkillPath } from '../config.js';

const execFileAsync = promisify(execFile);

export async function installCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm i <skill-name>'));
    return;
  }

  const spinner = ora(`Installing ${skillName}...`).start();

  try {
    await ensureOSMDir();

    if (await isSkillInstalled(skillName)) {
      spinner.warn(`${skillName} is already installed`);
      console.log(chalk.gray(`Use 'osm u ${skillName}' to update`));
      return;
    }

    const data = await fetchSkill(skillName);
    const skill = data.skill;

    spinner.text = `Downloading ${skillName} v${skill.version} from GitHub...`;

    if (!skill.repository) {
      throw new Error('Skill repository URL is missing');
    }

    const skillPath = getSkillPath(skillName);
    await fs.remove(skillPath);

    try {
      await execFileAsync('git', ['clone', '--depth', '1', skill.repository, skillPath]);
    } catch (cloneError) {
      await fs.remove(skillPath);
      throw new Error(`Unable to clone repository: ${cloneError.stderr || cloneError.message}`);
    }

    const manifest = {
      name: skill.name,
      version: skill.version,
      description: skill.description,
      author: skill.author,
      repository: skill.repository,
      ai_verified: skill.ai_verified,
      permissions: skill.permissions,
      entrypoint: skill.entrypoint,
      dependencies: skill.dependencies
    };

    await saveSkillManifest(skillName, manifest);
    await incrementDownloads(skillName);

    spinner.succeed(chalk.green(`Successfully installed ${skillName} v${skill.version}`));

    if (skill.ai_verified) {
      console.log(chalk.green('  ✓ AI-Verified'));
    }

    console.log(chalk.gray(`  Installed to: ${skillPath}`));
    console.log(chalk.gray(`  Source: ${skill.repository}`));
    console.log(chalk.gray(`\n  Run 'osm info ${skillName}' for more details`));

  } catch (error) {
    spinner.fail(`Failed to install ${skillName}`);

    if (error.response?.status === 404) {
      console.error(chalk.red(`Skill "${skillName}" not found in registry`));
      console.log(chalk.gray(`Run 'osm search ${skillName}' to find similar skills`));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}
