# PromptLog

Version control for your prompts. Like git, but for the prompts you use with AI assistants.

![PromptLog Demo](demo.gif)

## Installation

```bash
npm install -g promptlog
```

## Quick Start

```bash
# Copy a prompt to your clipboard, then save it
promptlog save code-review --note "initial version"

# List all saved prompts
promptlog list

# View prompt history
promptlog history code-review

# Show a specific version
promptlog show code-review@1

# Compare versions
promptlog diff code-review

# Copy a prompt back to clipboard
promptlog show code-review --copy
```

## Commands

### `promptlog save <name>`

Save clipboard contents as a new prompt version.

```bash
promptlog save code-review                    # Save with confirmation
promptlog save code-review --note "v2 notes"  # Add a note
promptlog save code-review --yes              # Skip confirmation
```

**Flags:**
- `-n, --note <note>` - Add a note describing this version
- `-y, --yes` - Skip confirmation prompt

### `promptlog list`

List all saved prompts.

```bash
promptlog list
```

```
NAME              VERSIONS    LAST UPDATED
code-review       3           2 hours ago
sql-generator     7           Dec 4
commit-msg        2           Nov 28, 2024
```

### `promptlog history <name>`

Show version history for a prompt.

```bash
promptlog history code-review
```

```
v3  2 hours ago     "added naming convention rules"
v2  3 days ago      "stricter about error handling"
v1  Dec 4           (no note)
```

### `promptlog show <name>`

Display a prompt. Use `@N` for a specific version.

```bash
promptlog show code-review       # Latest version
promptlog show code-review@2     # Specific version
promptlog show code-review -c    # Copy to clipboard
```

### `promptlog diff <name> [v1] [v2]`

Show diff between versions.

```bash
promptlog diff code-review        # Latest vs previous
promptlog diff code-review 2      # v2 vs latest
promptlog diff code-review 1 3    # v1 vs v3
```

### `promptlog delete <name>`

Delete a prompt and all its versions.

```bash
promptlog delete code-review       # With confirmation
promptlog delete code-review --yes # Skip confirmation
```

A backup is automatically created before deletion at `~/.promptlog/.backup/`.

### `promptlog export <name>`

Export prompt to stdout.

```bash
promptlog export code-review          # Plain text
promptlog export code-review@2        # Specific version
promptlog export code-review --json   # JSON format
```

### `promptlog rename <old> <new>`

Rename a prompt.

```bash
promptlog rename code-review strict-reviewer
```

## Storage

Prompts are stored at `~/.promptlog/prompts/` as JSON files:

```
~/.promptlog/
├── config.json         # Settings (optional)
├── prompts/
│   ├── code-review.json
│   └── sql-generator.json
└── .backup/            # Backups before deletion
```

## Configuration

Edit `~/.promptlog/config.json` (created automatically):

```json
{
  "preview_length": 200,
  "auto_confirm": false,
  "backup_enabled": true
}
```

## Security

- **Sensitive content detection**: Warns if clipboard contains API keys, tokens, or private keys
- **Local only**: No network requests, all data stays on your machine
- **Restrictive permissions**: Files created with `0600` (owner read/write only)

## Name Rules

Prompt names must:
- Start with a lowercase letter
- Contain only `a-z`, `0-9`, `-`
- Be 1-50 characters

## License

MIT
