import chalk from 'chalk';
import { fetchSkill } from '../utils/api.js';
import { isSkillInstalled, loadSkillManifest } from '../utils/storage.js';

export async function infoCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm info <skill-name>'));
    return;
  }

  try {
    // Try to get info from registry first
    const data = await fetchSkill(skillName);
    const skill = data.skill;
    const installed = await isSkillInstalled(skillName);
    
    let localVersion = null;
    if (installed) {
      const manifest = await loadSkillManifest(skillName);
      localVersion = manifest.version;
    }

    console.log('');
    console.log(chalk.bold.cyan(`${skill.name}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
    console.log(`${chalk.bold('Description:')} ${skill.description}`);
    console.log(`${chalk.bold('Version:')} ${skill.version} ${installed ? chalk.blue(`(installed: v${localVersion})`) : ''}`);
    console.log(`${chalk.bold('Author:')} ${skill.author}`);
    console.log(`${chalk.bold('Category:')} ${skill.category}`);
    console.log(`${chalk.bold('Repository:')} ${chalk.cyan(skill.repository)}`);
    console.log(`${chalk.bold('AI Verified:')} ${skill.ai_verified ? chalk.green('✓ Yes') : chalk.gray('No')}`);
    console.log(`${chalk.bold('Downloads:')} ${skill.downloads}`);
    console.log('');

    if (skill.permissions && skill.permissions.length > 0) {
      console.log(chalk.bold('Permissions:'));
      skill.permissions.forEach(perm => {
        console.log(`  • ${chalk.yellow(perm)}`);
      });
      console.log('');
    }

    if (skill.dependencies && Object.keys(skill.dependencies).length > 0) {
      console.log(chalk.bold('Dependencies:'));
      Object.entries(skill.dependencies).forEach(([name, version]) => {
        console.log(`  • ${name}: ${chalk.gray(version)}`);
      });
      console.log('');
    }

    if (installed) {
      console.log(chalk.blue('✓ This skill is installed'));
      console.log(chalk.gray(`  Run 'osm u ${skillName}' to update`));
      console.log(chalk.gray(`  Run 'osm rm ${skillName}' to remove`));
    } else {
      console.log(chalk.gray('This skill is not installed'));
      console.log(chalk.gray(`  Run 'osm i ${skillName}' to install`));
    }
    console.log('');

  } catch (error) {
    if (error.response?.status === 404) {
      console.error(chalk.red(`Skill "${skillName}" not found`));
      
      // Try to show local info if installed
      if (await isSkillInstalled(skillName)) {
        console.log(chalk.yellow('\nShowing local information:\n'));
        const manifest = await loadSkillManifest(skillName);
        
        console.log(chalk.bold.cyan(`${manifest.name}`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log('');
        console.log(`${chalk.bold('Description:')} ${manifest.description}`);
        console.log(`${chalk.bold('Version:')} ${manifest.version} ${chalk.blue('(installed)')}`);
        console.log(`${chalk.bold('Author:')} ${manifest.author}`);
        console.log(`${chalk.bold('Repository:')} ${chalk.cyan(manifest.repository)}`);
        console.log('');
      }
    } else {
      console.error(chalk.red(error.message));
    }
  }
}
