import chalk from 'chalk';
import { login } from '../utils/auth.js';

export async function loginCommand(username, password) {
  try {
    if (!username || !password) {
      console.log(chalk.red('Usage: osm login <username> <password>'));
      return;
    }
    const data = await login(username, password);
    console.log(chalk.green(`Logged in as ${data.username}`));
  } catch (error) {
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
