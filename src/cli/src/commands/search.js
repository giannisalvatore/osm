import chalk from 'chalk';
import ora from 'ora';
import { searchRegistry } from '../utils/registry.js';

export async function searchCommand(query) {
  const spinner = ora(`Searching for ${query}...`).start();
  try {
    const data = await searchRegistry(query);
    spinner.stop();
    data.objects.forEach((pkg) => {
      console.log(`${chalk.bold(pkg.name)} ${chalk.gray(`v${pkg.latest_version || 'n/a'}`)}`);
      console.log(`  ${pkg.description || ''}`);
    });
    if (!data.objects.length) console.log(chalk.yellow('No packages found'));
  } catch (error) {
    spinner.fail('Search failed');
    console.log(chalk.red(error.message));
  }
}
