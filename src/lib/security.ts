const SENSITIVE_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9_-]{20,}/, name: 'API key' },
  { pattern: /AKIA[A-Z0-9]{16}/, name: 'AWS key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
  { pattern: /-----BEGIN.*PRIVATE KEY-----/, name: 'private key' },
];

/**
 * Detect if content contains sensitive patterns like API keys.
 * Returns a warning message if detected, null otherwise.
 */
export function detectSensitiveContent(content: string): string | null {
  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      return `This looks like it might contain a ${name}.`;
    }
  }
  return null;
}

/**
 * Validate a prompt name.
 * Must start with a letter, contain only a-z, 0-9, -, and be 1-50 chars.
 */
export function isValidName(name: string): boolean {
  return /^[a-z][a-z0-9-]{0,49}$/.test(name);
}
