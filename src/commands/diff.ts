import * as p from '@clack/prompts';
import { diffLines } from 'diff';
import { getPrompt } from '../lib/storage.js';

export async function diffCommand(
  name: string,
  v1?: string,
  v2?: string
): Promise<void> {
  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  const latest = prompt.versions.length;

  if (latest < 2) {
    p.cancel(`'${name}' only has one version. Nothing to diff.`);
    process.exit(1);
  }

  // Parse version args
  let fromVersion: number;
  let toVersion: number;

  if (!v1 && !v2) {
    // Default: previous vs latest
    fromVersion = latest - 1;
    toVersion = latest;
  } else if (v1 && !v2) {
    // One arg: that version vs latest
    fromVersion = parseInt(v1, 10);
    toVersion = latest;
  } else {
    // Two args: explicit range
    fromVersion = parseInt(v1!, 10);
    toVersion = parseInt(v2!, 10);
  }

  // Validate
  if (
    isNaN(fromVersion) ||
    isNaN(toVersion) ||
    fromVersion < 1 ||
    toVersion < 1 ||
    fromVersion > latest ||
    toVersion > latest
  ) {
    p.cancel(`Invalid version. '${name}' has versions 1-${latest}.`);
    process.exit(1);
  }

  if (fromVersion === toVersion) {
    p.cancel('Cannot diff a version with itself.');
    process.exit(1);
  }

  const oldContent = prompt.versions[fromVersion - 1]?.content;
  const newContent = prompt.versions[toVersion - 1]?.content;

  if (!oldContent || !newContent) {
    p.cancel('Could not find requested versions.');
    process.exit(1);
  }

  p.intro(`${name}: v${fromVersion} → v${toVersion}`);

  const changes = diffLines(oldContent, newContent);

  const output = changes
    .map((part) => {
      const prefix = part.added ? '\x1b[32m+ ' : part.removed ? '\x1b[31m- ' : '  ';
      const reset = part.added || part.removed ? '\x1b[0m' : '';
      return part.value
        .split('\n')
        .filter((line) => line !== '' || part.value === '\n')
        .map((line) => prefix + line + reset)
        .join('\n');
    })
    .filter((s) => s.trim())
    .join('\n');

  console.log(output);
  p.outro('');
}
