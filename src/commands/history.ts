import * as p from '@clack/prompts';
import { getPrompt } from '../lib/storage.js';
import { formatRelativeTime } from '../lib/time.js';

export async function historyCommand(name: string): Promise<void> {
  p.intro(`${name} history`);

  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  const rows = prompt.versions
    .slice()
    .reverse()
    .map((v) => {
      const versionStr = `v${v.version}`.padEnd(4);
      const timeStr = formatRelativeTime(v.timestamp).padEnd(16);
      const noteStr = v.note ? `"${v.note}"` : '(no note)';
      return `${versionStr}${timeStr}${noteStr}`;
    });

  p.log.message(rows.join('\n'));
  p.outro(`${prompt.versions.length} version(s)`);
}
