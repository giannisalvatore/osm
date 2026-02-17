import chalk from 'chalk';
import ora from 'ora';
import { readManifest } from '../utils/manifest.js';
import { packCurrentDirectory, publishPackage } from '../utils/registry.js';

export async function publishCommand() {
  const spinner = ora('Publishing package...').start();
  try {
    const manifest = await readManifest();
    const tarball = await packCurrentDirectory();
    const result = await publishPackage(manifest, tarball);
    spinner.succeed(`Published ${result.name}@${result.version}`);
  } catch (error) {
    spinner.fail('Publish failed');
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
