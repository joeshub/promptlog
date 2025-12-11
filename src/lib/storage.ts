import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile, readdir, unlink, copyFile, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { generateHash } from './hash.js';
import type { PromptFile, PromptSummary, PromptVersion } from '../types/index.js';

const PROMPTLOG_DIR = join(homedir(), '.promptlog');
const PROMPTS_DIR = join(PROMPTLOG_DIR, 'prompts');
const BACKUP_DIR = join(PROMPTLOG_DIR, '.backup');

/**
 * Ensure the ~/.promptlog directory structure exists.
 */
export async function ensureStorage(): Promise<void> {
  await mkdir(PROMPTS_DIR, { recursive: true, mode: 0o700 });
  await mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Get the file path for a prompt.
 */
function getPromptPath(name: string): string {
  return join(PROMPTS_DIR, `${name}.json`);
}

/**
 * Get a prompt by name. Returns null if not found.
 */
export async function getPrompt(name: string): Promise<PromptFile | null> {
  const path = getPromptPath(name);
  if (!existsSync(path)) {
    return null;
  }
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as PromptFile;
}

/**
 * Save a prompt file with restrictive permissions.
 */
async function writePrompt(prompt: PromptFile): Promise<void> {
  const path = getPromptPath(prompt.name);
  await writeFile(path, JSON.stringify(prompt, null, 2), { mode: 0o600 });
}

/**
 * Save new content as a new version of a prompt.
 * Creates the prompt if it doesn't exist.
 * Returns the new version number.
 */
export async function savePrompt(
  name: string,
  content: string,
  note?: string
): Promise<number> {
  await ensureStorage();

  const now = new Date().toISOString();
  const hash = generateHash(content);

  let prompt = await getPrompt(name);

  if (prompt) {
    // Add new version
    const newVersion: PromptVersion = {
      version: prompt.versions.length + 1,
      timestamp: now,
      note: note ?? null,
      content,
      hash,
    };
    prompt.versions.push(newVersion);
    prompt.updated_at = now;
  } else {
    // Create new prompt
    prompt = {
      name,
      created_at: now,
      updated_at: now,
      versions: [
        {
          version: 1,
          timestamp: now,
          note: note ?? null,
          content,
          hash,
        },
      ],
    };
  }

  await writePrompt(prompt);
  return prompt.versions.length;
}

/**
 * Get all prompts as summaries for listing.
 */
export async function getAllPrompts(): Promise<PromptSummary[]> {
  await ensureStorage();

  const files = await readdir(PROMPTS_DIR);
  const prompts: PromptSummary[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const path = join(PROMPTS_DIR, file);
    const content = await readFile(path, 'utf-8');
    const prompt = JSON.parse(content) as PromptFile;

    prompts.push({
      name: prompt.name,
      versionCount: prompt.versions.length,
      updatedAt: prompt.updated_at,
    });
  }

  // Sort by most recently updated
  prompts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return prompts;
}

/**
 * Check if content is a duplicate of an existing version.
 * Returns the version number if duplicate, null otherwise.
 */
export async function isDuplicate(name: string, content: string): Promise<number | null> {
  const prompt = await getPrompt(name);
  if (!prompt) return null;

  const hash = generateHash(content);
  const match = prompt.versions.find((v) => v.hash === hash);
  return match?.version ?? null;
}

/**
 * Backup a prompt before deletion.
 */
export async function backupPrompt(name: string): Promise<void> {
  const sourcePath = getPromptPath(name);
  const backupPath = join(BACKUP_DIR, `${name}.json`);

  if (existsSync(sourcePath)) {
    await copyFile(sourcePath, backupPath);
  }
}

/**
 * Delete a prompt and all its versions.
 */
export async function deletePrompt(name: string): Promise<void> {
  const path = getPromptPath(name);
  if (existsSync(path)) {
    await unlink(path);
  }
}

/**
 * Rename a prompt.
 */
export async function renamePrompt(oldName: string, newName: string): Promise<void> {
  const prompt = await getPrompt(oldName);
  if (!prompt) {
    throw new Error(`Prompt '${oldName}' not found`);
  }

  // Check new name doesn't exist
  if (await getPrompt(newName)) {
    throw new Error(`Prompt '${newName}' already exists`);
  }

  // Update the name in the file
  prompt.name = newName;
  await writePrompt(prompt);

  // Delete the old file
  await unlink(getPromptPath(oldName));
}

/**
 * Get a specific version of a prompt.
 */
export function getVersion(prompt: PromptFile, version: number): PromptVersion | null {
  return prompt.versions.find((v) => v.version === version) ?? null;
}
