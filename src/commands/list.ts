import * as p from '@clack/prompts';
import { getAllPrompts } from '../lib/storage.js';
import { formatRelativeTime } from '../lib/time.js';

export async function listCommand(): Promise<void> {
  p.intro('promptlog');

  const prompts = await getAllPrompts();

  if (prompts.length === 0) {
    p.log.info('No prompts saved yet.');
    p.log.message('Use: promptlog save <name>');
    p.outro('');
    return;
  }

  const header = 'NAME              VERSIONS    LAST UPDATED';
  const rows = prompts.map((prompt) =>
    `${prompt.name.padEnd(18)}${String(prompt.versionCount).padEnd(12)}${formatRelativeTime(prompt.updatedAt)}`
  );

  p.log.message([header, ...rows].join('\n'));
  p.outro(`${prompts.length} prompt(s)`);
}
