import chalk from 'chalk';
import ora from 'ora';
import { fetchSkills } from '../utils/api.js';
import { getInstalledSkills } from '../utils/storage.js';

export async function listCommand() {
  const spinner = ora('Fetching skills...').start();

  try {
    const data = await fetchSkills();
    const installedSkills = await getInstalledSkills();
    const installedNames = new Set(installedSkills.map(s => s.name));

    spinner.succeed(`Found ${data.count} skills`);
    console.log('');

    if (data.count === 0) {
      console.log(chalk.yellow('No skills available yet.'));
      return;
    }

    console.log(chalk.bold.cyan('Available Skills:\n'));

    data.skills.forEach(skill => {
      const isInstalled = installedNames.has(skill.name);
      const badge = skill.ai_verified ? chalk.green('✓ AI-Verified') : chalk.gray('Not verified');
      const installed = isInstalled ? chalk.blue('[Installed]') : '';
      
      console.log(`${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)} ${installed}`);
      console.log(`  ${skill.description}`);
      console.log(`  ${badge} | ${chalk.gray(`Category: ${skill.category}`)}`);
      console.log(`  ${chalk.gray(`Downloads: ${skill.downloads}`)}`);
      console.log('');
    });

  } catch (error) {
    spinner.fail('Failed to fetch skills');
    console.error(chalk.red(error.message));
    
    // Fallback to locally installed skills
    try {
      const installed = await getInstalledSkills();
      if (installed.length > 0) {
        console.log(chalk.yellow('\nShowing locally installed skills:\n'));
        installed.forEach(skill => {
          console.log(`${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)} ${chalk.blue('[Installed]')}`);
          console.log(`  ${skill.description}`);
          console.log('');
        });
      }
    } catch (err) {
      // Silent fail
    }
  }
}
