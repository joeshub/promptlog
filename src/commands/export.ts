import * as p from '@clack/prompts';
import { getPrompt, getVersion } from '../lib/storage.js';

/**
 * Parse name@version syntax.
 */
function parseNameWithVersion(input: string): { name: string; version?: number } {
  const parts = input.split('@');
  if (parts.length === 1) {
    return { name: parts[0] };
  }
  if (parts.length === 2) {
    const version = parseInt(parts[1], 10);
    if (isNaN(version) || version < 1) {
      return { name: parts[0] };
    }
    return { name: parts[0], version };
  }
  return { name: parts[0] };
}

export async function exportCommand(
  nameWithVersion: string,
  options: { json?: boolean }
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

  if (options.json) {
    // JSON format
    const output = {
      name: prompt.name,
      version: versionData.version,
      timestamp: versionData.timestamp,
      note: versionData.note,
      content: versionData.content,
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Plain text
    console.log(versionData.content);
  }
}
