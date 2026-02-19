import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { readManifest } from '../utils/manifest.js';
import { packCurrentDirectory, publishPackage } from '../utils/registry.js';
import { loadToken, login } from '../utils/auth.js';

function prompt(question, { silent = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (silent) {
    process.stdout.write(question);
    process.stdin.setRawMode?.(true);
    return new Promise((resolve) => {
      let input = '';
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      const onData = (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener('data', onData);
          rl.close();
          process.stdout.write('\n');
          resolve(input);
        } else if (ch === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += ch;
        }
      };
      process.stdin.on('data', onData);
    });
  }
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export async function publishCommand() {
  const token = await loadToken();

  if (!token) {
    console.log(chalk.yellow('You are not logged in. Please enter your credentials to publish.'));
    const username = await prompt('Username: ');
    const password = await prompt('Password: ', { silent: true });

    if (!username || !password) {
      console.log(chalk.red('Username and password are required.'));
      return;
    }

    try {
      const data = await login(username, password);
      console.log(chalk.green(`✓ Logged in as ${data.username}`));
    } catch (error) {
      console.log(chalk.red('Login failed: ' + (error.response?.data?.error || error.message)));
      return;
    }
  }

  const spinner = ora('Validating SKILL.md...').start();
  try {
    const manifest = await readManifest();
    spinner.text = `Publishing ${manifest.name}@${manifest.version}...`;
    const tarball = await packCurrentDirectory();
    const result = await publishPackage(manifest, tarball);
    spinner.succeed(`Published ${result.name}@${result.version}`);
  } catch (error) {
    spinner.fail('Publish failed');
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
