# PromptLog Technical Requirements Document

## Overview

**PromptLog** is a CLI tool that helps developers track prompt iterations with version history and diffs—like git, but for prompts.

### Problem

Developers constantly iterate on prompts when working with AI assistants. They tweak wording, add constraints, change formats, but never track what changed or what worked. When a prompt stops working or they want to revert, there's no history.

### Solution

A lightweight CLI that captures prompts from the clipboard, stores them with timestamps and notes, and provides diff views between versions.

---

## User Workflow

1. Developer is in Cursor/VS Code working with an AI assistant
2. They craft a system prompt that finally works well
3. They select the prompt and copy it (`Cmd+C`)
4. They open terminal and run:
   ```bash
   promptlog save code-review --note "added naming convention rules"
   ```
5. The CLI reads their clipboard, shows a preview, and saves on confirmation
6. Later, they can view history, see diffs, or retrieve old versions

---

## Core Commands

### 1. Save Prompt

```bash
promptlog save <name> [--note "description"] [--yes]
```

**Behavior:**
- Reads current clipboard contents
- Shows first 200 characters as preview
- Warns if content looks like an API key
- Asks for confirmation (unless `--yes`)
- Appends new version to the prompt's history
- Displays: "Saved code-review v3"

**Flags:**
- `--note`, `-n`: Description of what changed
- `--yes`, `-y`: Skip confirmation prompt

---

### 2. List All Prompts

```bash
promptlog list
```

**Output:**
```
NAME              VERSIONS    LAST UPDATED
code-review       3           2 hours ago
sql-generator     7           Dec 4
commit-msg        2           Nov 28, 2024
```

---

### 3. View Prompt History

```bash
promptlog history <name>
```

**Output:**
```
code-review history:

v3  2 hours ago     "added naming convention rules"
v2  3 days ago      "stricter about error handling"
v1  Dec 4           (no note)
```

---

### 4. Show Specific Version

```bash
promptlog show <name>           # latest version
promptlog show <name>@2         # specific version
```

**Output:** Full prompt content printed to stdout.

**Flags:**
- `--copy`, `-c`: Also copy to clipboard

**@ Syntax Rules:**
- `@` is only used with single-version commands (`show`)
- Split on `@` once: `code-review@2` → name: `code-review`, version: `2`
- No chaining: `@2@3` is invalid

---

### 5. Diff Between Versions

```bash
promptlog diff <name>           # latest vs previous
promptlog diff <name> 2         # v2 vs latest  
promptlog diff <name> 2 3       # v2 vs v3
```

**Output:** Colorized diff showing additions and deletions.

**Note:** Diff uses positional arguments, not `@` syntax. This avoids ambiguity like `@2@3`.

---

### 6. Delete Prompt

```bash
promptlog delete <name> [--yes]
```

**Behavior:**
- Creates backup before deleting
- Requires confirmation (unless `--yes`)
- Deletes the entire prompt and all versions

**Important:** You cannot delete individual versions. Versions are immutable and append-only. This keeps the mental model simple and preserves history integrity. If you need to clean up, delete the whole prompt and start fresh.

---

### 7. Export Prompt

```bash
promptlog export <name>            # latest, text format
promptlog export <name>@2          # specific version
promptlog export <name> --json     # JSON format
```

---

### 8. Rename Prompt

```bash
promptlog rename <old-name> <new-name>
```

---

## Data Storage

### Storage Location

```
~/.promptlog/
├── config.json              # settings (manual edit only)
├── prompts/
│   ├── code-review.json
│   ├── sql-generator.json
│   └── commit-msg.json
└── .backup/                 # one backup per prompt
    └── code-review.json     # overwritten on each delete
```

### Prompt File Schema

```json
{
  "name": "code-review",
  "created_at": "2024-12-08T16:45:00Z",
  "updated_at": "2024-12-11T14:32:00Z",
  "versions": [
    {
      "version": 1,
      "timestamp": "2024-12-08T16:45:00Z",
      "note": null,
      "content": "You are a code reviewer...",
      "hash": "a1b2c3d4"
    },
    {
      "version": 2,
      "timestamp": "2024-12-10T09:15:00Z",
      "note": "stricter about error handling",
      "content": "You are a senior code reviewer...",
      "hash": "e5f6g7h8"
    }
  ]
}
```

### Hash Generation

Each version gets a short hash (first 8 chars of SHA-256 of content). Used for duplicate detection—if user tries to save identical content, warn: "This prompt is identical to v2. Save anyway?"

### Config File

```json
{
  "preview_length": 200,
  "auto_confirm": false,
  "backup_enabled": true
}
```

**v1 Decision:** No `promptlog config` command. Users edit the file manually if needed. Document options in README.

---

## Backup Strategy

**One backup per prompt, overwritten on each destructive action.**

```typescript
// Before deleting "code-review"
await fs.copyFile(
  '~/.promptlog/prompts/code-review.json',
  '~/.promptlog/.backup/code-review.json'
);
```

**Rationale:**
- The "oops" window is short—you notice immediately, not weeks later
- Prompts are already versioned internally
- No cleanup/retention logic needed
- Power users can `git init ~/.promptlog` for full history

---

## Time Formatting

**Consistent rule across all commands:**

| Age | Format | Example |
|-----|--------|---------|
| < 1 hour | relative | "5 minutes ago" |
| < 7 days | relative | "3 days ago" |
| Same year | short date | "Dec 4" |
| Different year | full date | "Nov 28, 2024" |

Use a small helper function or `timeago.js`. Same logic for `list` and `history`.

---

## Security

### Clipboard Safety

**Always preview before saving:**
```
About to save:
────────────────────────────────
You are a senior code reviewer. Review the following code for bugs,
performance issues, security vulnerabilities...
────────────────────────────────
Save this prompt? (y/n)
```

**Pattern detection warning:**
```
⚠️  Warning: This looks like it might contain an API key.
Save anyway? (y/n)
```

**Patterns to detect:**
- `sk-` (OpenAI/Anthropic keys)
- `AKIA` (AWS keys)
- `ghp_` (GitHub tokens)
- `-----BEGIN.*PRIVATE KEY-----`

### File Permissions

All files in `~/.promptlog/` created with `0600` (owner read/write only).

### No Network

The CLI never makes network requests. All data stays local.

---

## Technical Implementation

### Technology Stack

| Purpose | Tool |
|---------|------|
| Language | Node.js (TypeScript) |
| Argument parsing | Commander.js |
| Interactive UI | @clack/prompts |
| Diff generation | diff (npm) |
| Clipboard | clipboardy |
| Storage | Native fs + JSON |

### Why Clack

Clack (`@clack/prompts`) provides beautiful, pre-styled CLI prompts with zero configuration. 1.7M weekly downloads, 80% smaller than Inquirer.

**What Clack gives us:**
- `intro()` / `outro()` - Session banners
- `text()` - Text input with validation
- `confirm()` - Yes/no prompts
- `select()` / `multiselect()` - Option picking
- `spinner()` - Loading indicators
- `log.info()` / `log.success()` / `log.warning()` / `log.error()` - Styled output
- `isCancel()` - Graceful Ctrl+C handling

### Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "@clack/prompts": "^0.11.0",
    "clipboardy": "^4.0.0",
    "diff": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/diff": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
```

### Project Structure

```
promptlog/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts              # CLI entry (Commander setup)
│   ├── commands/
│   │   ├── save.ts
│   │   ├── list.ts
│   │   ├── history.ts
│   │   ├── show.ts
│   │   ├── diff.ts
│   │   ├── delete.ts
│   │   ├── export.ts
│   │   └── rename.ts
│   ├── lib/
│   │   ├── storage.ts        # Read/write/delete prompts
│   │   ├── clipboard.ts      # Clipboard wrapper
│   │   ├── security.ts       # Pattern detection
│   │   ├── time.ts           # Relative time formatting
│   │   └── hash.ts           # SHA-256 hashing
│   └── types/
│       └── index.ts
└── dist/                     # Built output
```

---

## Implementation Reference

### CLI Entry Point

```typescript
// src/index.ts
#!/usr/bin/env node
import { program } from 'commander';
import { saveCommand } from './commands/save';
import { listCommand } from './commands/list';
import { historyCommand } from './commands/history';
import { showCommand } from './commands/show';
import { diffCommand } from './commands/diff';
import { deleteCommand } from './commands/delete';
import { exportCommand } from './commands/export';
import { renameCommand } from './commands/rename';

program
  .name('promptlog')
  .description('Version control for your prompts')
  .version('1.0.0');

program
  .command('save <name>')
  .description('Save clipboard contents as a new prompt version')
  .option('-n, --note <note>', 'Add a note describing this version')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(saveCommand);

program
  .command('list')
  .description('List all saved prompts')
  .action(listCommand);

program
  .command('history <name>')
  .description('Show version history for a prompt')
  .action(historyCommand);

program
  .command('show <nameWithVersion>')
  .description('Display a prompt (use name@N for specific version)')
  .option('-c, --copy', 'Copy to clipboard')
  .action(showCommand);

program
  .command('diff <name> [v1] [v2]')
  .description('Show diff between versions')
  .action(diffCommand);

program
  .command('delete <name>')
  .description('Delete a prompt and all its versions')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(deleteCommand);

program
  .command('export <nameWithVersion>')
  .description('Export prompt to stdout')
  .option('--json', 'Output as JSON')
  .action(exportCommand);

program
  .command('rename <oldName> <newName>')
  .description('Rename a prompt')
  .action(renameCommand);

program.parse();
```

### Save Command

```typescript
// src/commands/save.ts
import * as p from '@clack/prompts';
import clipboard from 'clipboardy';
import { detectSensitiveContent } from '../lib/security';
import { savePrompt, isDuplicate } from '../lib/storage';

export async function saveCommand(name: string, options: { note?: string; yes?: boolean }) {
  p.intro('promptlog save');

  // Validate name
  if (!/^[a-z][a-z0-9-]{0,49}$/.test(name)) {
    p.cancel('Name must start with a letter and contain only a-z, 0-9, and hyphens.');
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
  p.log.message(preview);

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
```

### List Command

```typescript
// src/commands/list.ts
import * as p from '@clack/prompts';
import { getAllPrompts } from '../lib/storage';
import { formatRelativeTime } from '../lib/time';

export async function listCommand() {
  p.intro('promptlog');

  const prompts = await getAllPrompts();

  if (prompts.length === 0) {
    p.log.info('No prompts saved yet.');
    p.log.message('Use: promptlog save <name>');
    p.outro('');
    return;
  }

  const header = 'NAME              VERSIONS    LAST UPDATED';
  const rows = prompts.map(prompt =>
    `${prompt.name.padEnd(18)}${String(prompt.versionCount).padEnd(12)}${formatRelativeTime(prompt.updatedAt)}`
  );

  p.log.message([header, ...rows].join('\n'));
  p.outro(`${prompts.length} prompt(s)`);
}
```

### Diff Command

```typescript
// src/commands/diff.ts
import * as p from '@clack/prompts';
import { diffLines } from 'diff';
import { getPrompt } from '../lib/storage';

export async function diffCommand(name: string, v1?: string, v2?: string) {
  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  const latest = prompt.versions.length;

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
  if (fromVersion < 1 || toVersion > latest || fromVersion >= toVersion) {
    p.cancel(`Invalid version range. ${name} has versions 1-${latest}.`);
    process.exit(1);
  }

  const oldContent = prompt.versions[fromVersion - 1]?.content;
  const newContent = prompt.versions[toVersion - 1]?.content;

  p.intro(`${name}: v${fromVersion} → v${toVersion}`);

  const changes = diffLines(oldContent, newContent);
  const output = changes
    .map(part => {
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
      return part.value
        .split('\n')
        .filter(line => line !== '')
        .map(line => prefix + line)
        .join('\n');
    })
    .join('\n');

  p.log.message(output);
  p.outro('');
}
```

### Delete Command

```typescript
// src/commands/delete.ts
import * as p from '@clack/prompts';
import { getPrompt, deletePrompt, backupPrompt } from '../lib/storage';

export async function deleteCommand(name: string, options: { yes?: boolean }) {
  p.intro('promptlog delete');

  const prompt = await getPrompt(name);

  if (!prompt) {
    p.cancel(`No prompt named '${name}' found.`);
    process.exit(1);
  }

  if (!options.yes) {
    const confirmed = await p.confirm({
      message: `Delete '${name}' (${prompt.versions.length} versions)? This cannot be undone.`,
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
```

### Security Helper

```typescript
// src/lib/security.ts
const SENSITIVE_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'API key' },
  { pattern: /AKIA[A-Z0-9]{16}/, name: 'AWS key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
  { pattern: /-----BEGIN.*PRIVATE KEY-----/, name: 'private key' },
];

export function detectSensitiveContent(content: string): string | null {
  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      return `This looks like it might contain a ${name}.`;
    }
  }
  return null;
}
```

### Time Helper

```typescript
// src/lib/time.ts
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const sameYear = now.getFullYear() === then.getFullYear();
  const month = then.toLocaleString('en-US', { month: 'short' });
  const day = then.getDate();

  if (sameYear) {
    return `${month} ${day}`;
  } else {
    return `${month} ${day}, ${then.getFullYear()}`;
  }
}
```

---

## Error Messages

| Scenario | Message |
|----------|---------|
| Empty clipboard | "Clipboard is empty. Copy a prompt first." |
| Prompt not found | "No prompt named 'foo' found." |
| Invalid version | "Invalid version. 'code-review' has versions 1-3." |
| Invalid name | "Name must start with a letter and contain only a-z, 0-9, and hyphens." |
| Duplicate content | "This is identical to v2." (warning, not error) |

---

## Name Validation

Prompt names must:
- Start with a lowercase letter
- Contain only `a-z`, `0-9`, `-`
- Be 1-50 characters

Regex: `^[a-z][a-z0-9-]{0,49}$`

---

## Testing Strategy

**v1: Skip automated tests. Ship first.**

This is a hackathon project. Get it working, submit it, iterate later.

If adding minimal coverage:
- Test `storage.ts` (pure file operations)
- Test `security.ts` (pure pattern matching)
- Test `time.ts` (pure date formatting)

Don't test Clack UI flows—too much mocking for little value.

---

## CLI Help Output

```
$ promptlog --help

promptlog v1.0.0

Version control for your prompts

Usage: promptlog <command> [options]

Commands:
  save <name>              Save clipboard as new version
  list                     List all prompts
  history <name>           Show version history
  show <name>[@version]    Display a prompt
  diff <name> [v1] [v2]    Compare versions
  delete <name>            Delete prompt and all versions
  export <name>[@version]  Export to stdout
  rename <old> <new>       Rename a prompt

Options:
  -h, --help               Show help
  -v, --version            Show version

Examples:
  promptlog save code-review --note "added error handling"
  promptlog show code-review@2
  promptlog diff code-review 1 3

Storage: ~/.promptlog/
```

---

## v1 Scope Summary

**In scope:**
- All 8 commands (save, list, history, show, diff, delete, export, rename)
- Clipboard capture with preview
- Security pattern warnings
- Single backup on delete
- Relative time formatting

**Explicitly out of scope:**
- `promptlog config` command (manual edit only)
- Individual version deletion (delete whole prompts only)
- Automated tests (ship first)
- MCP server integration (future)
- Cloud sync (future)

---

## Distribution

```bash
npm install -g promptlog
```

Build with `tsup`, publish to npm. Consider standalone binaries with `pkg` for v2.

---

## Success Criteria

1. Install to first save: < 2 minutes
2. Save operation: < 500ms
3. Works offline
4. Zero config required
5. Storage is human-readable JSON
