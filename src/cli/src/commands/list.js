import chalk from 'chalk';
import ora from 'ora';
import { listRegistry } from '../utils/registry.js';
import { getInstalledSkills } from '../utils/storage.js';

export async function listCommand(page = '1', limit = '20') {
  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const spinner = ora('Fetching skills...').start();

  try {
    const data = await listRegistry(pageNum, limitNum);
    const installedSkills = await getInstalledSkills();
    const installedNames = new Set(installedSkills.map(s => s.name));

    const showing = data.objects.length;
    const total   = data.total;
    const start   = (pageNum - 1) * limitNum + 1;

    spinner.succeed(`Showing ${start}–${start + showing - 1} of ${total} skills (page ${pageNum})`);
    console.log('');

    if (!showing) {
      console.log(chalk.yellow('No skills found.'));
      return;
    }

    data.objects.forEach(pkg => {
      const installed = installedNames.has(pkg.name) ? chalk.blue(' [installed]') : '';
      console.log(`${chalk.bold(pkg.name)} ${chalk.gray(`v${pkg.latest_version || 'n/a'}`)}${installed}`);
      if (pkg.description) console.log(`  ${chalk.gray(pkg.description)}`);
      console.log('');
    });

    const totalPages = Math.ceil(total / limitNum);
    if (pageNum < totalPages) {
      console.log(chalk.gray(`Page ${pageNum}/${totalPages} — run ${chalk.yellow(`osm list ${pageNum + 1} ${limitNum}`)} for next page`));
    }

  } catch (error) {
    spinner.fail('Failed to fetch skills');
    console.error(chalk.red(error.message));

    // Fallback to locally installed skills
    try {
      const installed = await getInstalledSkills();
      if (installed.length > 0) {
        console.log(chalk.yellow('\nShowing locally installed skills:\n'));
        installed.forEach(skill => {
          console.log(`${chalk.bold(skill.name)} ${chalk.gray(`v${skill.version}`)} ${chalk.blue('[installed]')}`);
          if (skill.description) console.log(`  ${chalk.gray(skill.description)}`);
          console.log('');
        });
      }
    } catch {}
  }
}
