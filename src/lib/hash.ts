import { createHash } from 'crypto';

/**
 * Generate a short hash (first 8 chars of SHA-256) for content.
 * Used for duplicate detection.
 */
export function generateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}
