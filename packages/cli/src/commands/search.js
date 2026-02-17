import chalk from 'chalk';
import ora from 'ora';
import { searchSkills } from '../utils/api.js';
import { getInstalledSkills } from '../utils/storage.js';

export async function searchCommand(query) {
  if (!query) {
    console.log(chalk.red('Please provide a search query'));
    console.log(chalk.gray('Usage: osm search <query>'));
    return;
  }

  const spinner = ora(`Searching for "${query}"...`).start();

  try {
    const data = await searchSkills(query);
    const installedSkills = await getInstalledSkills();
    const installedNames = new Set(installedSkills.map(s => s.name));

    spinner.succeed(`Found ${data.count} matching skills`);
    console.log('');

    if (data.count === 0) {
      console.log(chalk.yellow(`No skills found matching "${query}"`));
      return;
    }

    console.log(chalk.bold.cyan(`Search Results for "${query}":\n`));

    data.skills.forEach(skill => {
      const isInstalled = installedNames.has(skill.name);
      const badge = skill.ai_verified ? chalk.green('✓ AI-Verified') : chalk.gray('Not verified');
      const installed = isInstalled ? chalk.blue('[Installed]') : '';
      
      console.log(`${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)} ${installed}`);
      console.log(`  ${skill.description}`);
      console.log(`  ${badge} | ${chalk.gray(`Category: ${skill.category}`)}`);
      console.log('');
    });

  } catch (error) {
    spinner.fail('Search failed');
    console.error(chalk.red(error.message));
  }
}
