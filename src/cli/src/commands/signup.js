import chalk from 'chalk';
import readline from 'readline';
import { register } from '../utils/auth.js';

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export async function signupCommand() {
  try {
    const username = await prompt('Username: ');
    const email    = await prompt('Email: ');
    const password = await prompt('Password: ');

    if (!username || !email || !password) {
      console.log(chalk.red('All fields are required.'));
      return;
    }

    const data = await register(username, password, email);
    console.log(chalk.green(`\n✓ Account created for ${username}`));
    console.log(chalk.yellow(`  Check ${email} for a verification link before publishing.`));
    console.log(chalk.dim(`  Once verified, run: osm login`));
  } catch (error) {
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
