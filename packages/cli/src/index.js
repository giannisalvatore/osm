#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search.js';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';
import { removeCommand } from './commands/remove.js';
import { publishCommand } from './commands/publish.js';
import { loginCommand } from './commands/login.js';
import { whoamiCommand } from './commands/whoami.js';

const program = new Command();

program
  .name('osm')
  .description('osm - Open Skills Manager')
  .version('1.0.0');

program.command('search <query>').description('Search for packages by name or description').action(searchCommand);
program.command('install [package]').alias('i').description('Install dependencies or a package').action(installCommand);
program.command('update [package]').alias('u').description('Update dependencies or a package').action(updateCommand);
program.command('uninstall <package>').alias('remove').alias('rm').description('Uninstall a package').action(removeCommand);
program.command('publish').description('Publish package from current folder').action(publishCommand);
program.command('login <username> <password>').description('Authenticate and store local token').action(loginCommand);
program.command('whoami').description('Show current authenticated user').action(whoamiCommand);

if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('\n🚀 osm - Open Skills Manager 1.0.0\n'));
  console.log('Run ' + chalk.yellow('osm --help') + ' to see available commands\n');
  process.exit(0);
}

program.parse();
