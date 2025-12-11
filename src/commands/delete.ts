import * as p from '@clack/prompts';
import { getPrompt, deletePrompt, backupPrompt } from '../lib/storage.js';

export async function deleteCommand(
  name: string,
  options: { yes?: boolean }
): Promise<void> {
  p.intro('promptlog delete');

  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  if (!options.yes) {
    const confirmed = await p.confirm({
      message: `Delete '${name}' (${prompt.versions.length} version${prompt.versions.length === 1 ? '' : 's'})? This cannot be undone.`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
  }

  const s = p.spinner();
  s.start('Deleting...');

  await backupPrompt(name);
  await deletePrompt(name);

  s.stop(`Deleted ${name}`);
  p.outro('Done');
}
