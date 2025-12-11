import * as p from '@clack/prompts';
import clipboard from 'clipboardy';
import { detectSensitiveContent, isValidName } from '../lib/security.js';
import { savePrompt, isDuplicate } from '../lib/storage.js';

export async function saveCommand(
  name: string,
  options: { note?: string; yes?: boolean }
): Promise<void> {
  p.intro('promptlog save');

  // Validate name
  if (!isValidName(name)) {
    p.cancel('Name must start with a letter and contain only a-z, 0-9, and hyphens (max 50 chars).');
    process.exit(1);
  }

  // Read clipboard
  let content: string;
  try {
    content = await clipboard.read();
  } catch {
    p.cancel('Could not read clipboard.');
    process.exit(1);
  }

  if (!content.trim()) {
    p.cancel('Clipboard is empty. Copy a prompt first.');
    process.exit(1);
  }

  // Preview
  const preview = content.length > 200 ? content.slice(0, 200) + '...' : content;
  p.log.message('────────────────────────────────');
  p.log.message(preview);
  p.log.message('────────────────────────────────');

  // Duplicate check
  const dupVersion = await isDuplicate(name, content);
  if (dupVersion) {
    p.log.warning(`This is identical to v${dupVersion}.`);
  }

  // Security check
  const warning = detectSensitiveContent(content);
  if (warning) {
    p.log.warning(`⚠️  ${warning}`);
  }

  // Confirm
  if (!options.yes) {
    const confirmed = await p.confirm({ message: 'Save this prompt?' });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
  }

  // Save
  const s = p.spinner();
  s.start('Saving...');
  const version = await savePrompt(name, content, options.note);
  s.stop(`Saved ${name} v${version}`);

  p.outro('Done');
}
