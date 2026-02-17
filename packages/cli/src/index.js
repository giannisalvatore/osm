#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { listCommand } from './commands/list.js';
import { searchCommand } from './commands/search.js';
import { installCommand } from './commands/install.js';
import { updateCommand } from './commands/update.js';
import { removeCommand } from './commands/remove.js';
import { infoCommand } from './commands/info.js';
import { createCommand } from './commands/create.js';
import { publishCommand } from './commands/publish.js';

const program = new Command();

program
  .name('osm')
  .description('osm - Open Skills Manager')
  .version('1.0.0');

// List command
program
  .command('list')
  .alias('ls')
  .description('List all available skills')
  .action(listCommand);

// Search command
program
  .command('search <query>')
  .description('Search for skills by name or description')
  .action(searchCommand);

// Install command
program
  .command('install <skill>')
  .alias('i')
  .description('Install a skill from the registry')
  .action(installCommand);

// Update command
program
  .command('update <skill>')
  .alias('u')
  .description('Update an installed skill to the latest version')
  .action(updateCommand);

// Remove command
program
  .command('remove <skill>')
  .alias('rm')
  .description('Remove an installed skill')
  .action(removeCommand);

// Info command
program
  .command('info <skill>')
  .description('Show detailed information about a skill')
  .action(infoCommand);

// Create command
program
  .command('create <skill>')
  .alias('new')
  .description('Create a new empty skill')
  .action(createCommand);

// Publish command
program
  .command('publish [path]')
  .description('Publish a skill')
  .action(publishCommand);

// Welcome banner
if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('\n🚀 osm - Open Skills Manager\n'));
  console.log('Run ' + chalk.yellow('osm --help') + ' to see available commands\n');
  process.exit(0);
}

program.parse();

