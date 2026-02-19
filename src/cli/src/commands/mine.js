import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import { CONFIG } from '../config.js';
import { authHeaders, loadToken } from '../utils/auth.js';

export async function mineCommand() {
  const token = await loadToken();
  if (!token) {
    console.log(chalk.red('You are not logged in. Run osm login first.'));
    process.exit(1);
  }

  const spinner = ora('Fetching your published skills...').start();

  try {
    const api = axios.create({ baseURL: CONFIG.API_URL, timeout: 10000 });
    const headers = await authHeaders();
    const { data } = await api.get('/registry/mine', { headers });

    spinner.succeed(`Found ${data.total} skill${data.total !== 1 ? 's' : ''} published by you`);
    console.log('');

    if (!data.total) {
      console.log(chalk.yellow('You have not published any skills yet. Run osm publish to get started.'));
      return;
    }

    data.objects.forEach(pkg => {
      console.log(`${chalk.bold(pkg.name)} ${chalk.gray(`v${pkg.latest_version || 'n/a'}`)}`);
      if (pkg.description) console.log(`  ${chalk.gray(pkg.description)}`);
      console.log(`  ${chalk.dim(`↓ ${pkg.downloads || 0} download${pkg.downloads !== 1 ? 's' : ''}`)}`);
      console.log('');
    });

  } catch (error) {
    spinner.fail('Failed to fetch your skills');
    console.error(chalk.red(error.response?.data?.error || error.message));
    process.exit(1);
  }
}
