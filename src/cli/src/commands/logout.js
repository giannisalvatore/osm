import chalk from 'chalk';
import fs from 'fs-extra';
import { CONFIG } from '../config.js';

export async function logoutCommand() {
  try {
    if (await fs.pathExists(CONFIG.TOKENS_FILE)) {
      await fs.remove(CONFIG.TOKENS_FILE);
      console.log(chalk.green('✓ Logged out successfully.'));
    } else {
      console.log(chalk.yellow('You are not logged in.'));
    }
  } catch (error) {
    console.log(chalk.red('Logout failed: ' + error.message));
  }
}
