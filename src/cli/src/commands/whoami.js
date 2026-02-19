import chalk from 'chalk';
import { whoami } from '../utils/auth.js';

export async function whoamiCommand() {
  try {
    const user = await whoami();
    console.log(chalk.green(`${user.username} (${user.email || 'no-email'})`));
  } catch (error) {
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
