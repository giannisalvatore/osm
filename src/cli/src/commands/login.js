import chalk from 'chalk';
import readline from 'readline';
import { login } from '../utils/auth.js';

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export async function loginCommand() {
  try {
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');

    if (!username || !password) {
      console.log(chalk.red('Username and password are required.'));
      return;
    }

    const data = await login(username, password);
    console.log(chalk.green(`\n✓ Logged in as ${data.username}`));
  } catch (error) {
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
