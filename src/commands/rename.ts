import * as p from '@clack/prompts';
import { getPrompt, renamePrompt } from '../lib/storage.js';
import { isValidName } from '../lib/security.js';

export async function renameCommand(oldName: string, newName: string): Promise<void> {
  p.intro('promptlog rename');

  // Validate new name
  if (!isValidName(newName)) {
    p.cancel('New name must start with a letter and contain only a-z, 0-9, and hyphens (max 50 chars).');
    process.exit(1);
  }

  // Check old prompt exists
  const prompt = await getPrompt(oldName);
  if (!prompt) {
    p.cancel(`No prompt named '${oldName}' found.`);
    process.exit(1);
  }

  // Check new name doesn't exist
  const existing = await getPrompt(newName);
  if (existing) {
    p.cancel(`A prompt named '${newName}' already exists.`);
    process.exit(1);
  }

  const s = p.spinner();
  s.start('Renaming...');

  await renamePrompt(oldName, newName);

  s.stop(`Renamed '${oldName}' → '${newName}'`);
  p.outro('Done');
}
