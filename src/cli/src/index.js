#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create.js';
import { searchCommand } from './commands/search.js';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';
import { removeCommand } from './commands/remove.js';
import { publishCommand } from './commands/publish.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { signupCommand } from './commands/signup.js';
import { whoamiCommand } from './commands/whoami.js';
import { infoCommand } from './commands/info.js';
import { listCommand } from './commands/list.js';
import { mineCommand } from './commands/mine.js';

const program = new Command();

program
  .name('osm')
  .description('osm - Open Skills Manager')
  .version('1.0.0');

program.command('create <skill-name>').description('Scaffold a new skill in the current directory').action(createCommand);
program.command('search <query>').description('Search for packages by name or description').action(searchCommand);
program.command('list [page] [limit]').description('List all available skills (osm list [page] [limit])').action(listCommand);
program.command('info <skill-name>').description('Show details of a skill').action(infoCommand);
program.command('install [package]').alias('i').description('Install dependencies or a package').action(installCommand);
program.command('update [package]').alias('u').description('Update a package').action(updateCommand);
program.command('uninstall <package>').alias('remove').alias('rm').description('Uninstall a package').action(removeCommand);
program.command('publish').description('Publish skill from current folder').action(publishCommand);
program.command('login').description('Authenticate and store local token').action(loginCommand);
program.command('logout').description('Clear stored authentication token').action(logoutCommand);
program.command('signup').description('Create a new account').action(signupCommand);
program.command('whoami').description('Show current authenticated user').action(whoamiCommand);
program.command('mine').description('List skills published by you').action(mineCommand);

if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('\n🚀 osm - Open Skills Manager 1.0.0\n'));
  console.log('Run ' + chalk.yellow('osm --help') + ' to see available commands\n');
  process.exit(0);
}

program.parse();
