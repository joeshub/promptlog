import * as p from '@clack/prompts';
import clipboard from 'clipboardy';
import { getPrompt, getVersion } from '../lib/storage.js';

/**
 * Parse name@version syntax.
 * Returns { name, version } where version is undefined if not specified.
 */
function parseNameWithVersion(input: string): { name: string; version?: number } {
  const parts = input.split('@');
  if (parts.length === 1) {
    return { name: parts[0] };
  }
  if (parts.length === 2) {
    const version = parseInt(parts[1], 10);
    if (isNaN(version) || version < 1) {
      return { name: parts[0] }; // Invalid version, treat as name only
    }
    return { name: parts[0], version };
  }
  // More than one @, just use everything before first @
  return { name: parts[0] };
}

export async function showCommand(
  nameWithVersion: string,
  options: { copy?: boolean }
): Promise<void> {
  const { name, version } = parseNameWithVersion(nameWithVersion);

  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  // Get the requested version (default to latest)
  const targetVersion = version ?? prompt.versions.length;
  const versionData = getVersion(prompt, targetVersion);

  if (!versionData) {
    p.cancel(`Invalid version. '${name}' has versions 1-${prompt.versions.length}.`);
    process.exit(1);
  }

  // Output content
  console.log(versionData.content);

  // Copy to clipboard if requested
  if (options.copy) {
    await clipboard.write(versionData.content);
    p.log.success('Copied to clipboard');
  }
}
