#!/usr/bin/env node
import { program } from 'commander';
import { saveCommand } from './commands/save.js';
import { listCommand } from './commands/list.js';
import { historyCommand } from './commands/history.js';
import { showCommand } from './commands/show.js';
import { diffCommand } from './commands/diff.js';
import { deleteCommand } from './commands/delete.js';
import { exportCommand } from './commands/export.js';
import { renameCommand } from './commands/rename.js';

program
  .name('promptlog')
  .description('Version control for your prompts')
  .version('1.0.0');

program
  .command('save <name>')
  .description('Save clipboard contents as a new prompt version')
  .option('-n, --note <note>', 'Add a note describing this version')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(saveCommand);

program
  .command('list')
  .description('List all saved prompts')
  .action(listCommand);

program
  .command('history <name>')
  .description('Show version history for a prompt')
  .action(historyCommand);

program
  .command('show <name>')
  .description('Display a prompt (use name@N for specific version)')
  .option('-c, --copy', 'Copy to clipboard')
  .action(showCommand);

program
  .command('diff <name> [v1] [v2]')
  .description('Show diff between versions')
  .action(diffCommand);

program
  .command('delete <name>')
  .description('Delete a prompt and all its versions')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(deleteCommand);

program
  .command('export <name>')
  .description('Export prompt to stdout (use name@N for specific version)')
  .option('--json', 'Output as JSON')
  .action(exportCommand);

program
  .command('rename <oldName> <newName>')
  .description('Rename a prompt')
  .action(renameCommand);

program.parse();
