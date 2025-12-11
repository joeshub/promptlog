# Implementation Plan for PromptLog

## Phase 1: Project Scaffolding
- `package.json` - Dependencies, scripts, bin entry
- `tsconfig.json` - TypeScript config
- `.gitignore`
- Directory structure (`src/`, `src/commands/`, `src/lib/`, `src/types/`)

Note: Using tsup via CLI flags in package.json scripts. No separate `tsup.config.ts` needed.

## Phase 2: Types (`src/types/index.ts`)
- `PromptVersion` interface
- `PromptFile` interface  
- `Config` interface
- `PromptSummary` (for list command)

## Phase 3: Pure Libraries (no dependencies)
| File | Purpose |
|------|---------|
| `src/lib/hash.ts` | SHA-256 first 8 chars |
| `src/lib/time.ts` | Relative time formatter |
| `src/lib/security.ts` | Pattern detection for API keys etc |

These are pure functions — easy to verify in isolation.

## Phase 4: Storage Library
| File | Purpose |
|------|---------|
| `src/lib/storage.ts` | Init dirs, CRUD for prompts, backup, getAllPrompts, isDuplicate |

Depends on `hash.ts`. Uses fs with 0600 permissions.

Note: Skipping `clipboard.ts` wrapper — just import clipboardy directly where needed.

## Phase 5: Core Commands
| File | Complexity |
|------|------------|
| `src/commands/save.ts` | Medium - clipboard, validation, duplicate check, save |
| `src/commands/list.ts` | Simple - read all, format table |

**🔴 CHECKPOINT:** After this phase, manually test save→list workflow before proceeding.
```bash
npm run build
echo "test prompt" | pbcopy
./dist/index.js save test-prompt --yes
./dist/index.js list
```

## Phase 6: Read Commands
| File | Complexity |
|------|------------|
| `src/commands/show.ts` | Simple - parse @N, output content, optional clipboard copy |
| `src/commands/history.ts` | Simple - read one, format versions |

## Phase 7: Diff Command
| File | Complexity |
|------|------------|
| `src/commands/diff.ts` | Medium - parse positional args, generate diff |

## Phase 8: Utility Commands
| File | Complexity |
|------|------------|
| `src/commands/delete.ts` | Simple - backup then delete |
| `src/commands/rename.ts` | Simple - rename file + update name field |
| `src/commands/export.ts` | Simple - parse @N, output text or JSON |

## Phase 9: CLI Entry Point
- `src/index.ts` - Commander.js setup with all commands

## Phase 10: Documentation
- `README.md` - Installation, usage examples, config file documentation

---

## Build Order Summary

```
1. Scaffolding (package.json, tsconfig, .gitignore, dirs)
2. Types
3. Pure libs (hash, time, security)
4. Storage lib (depends on hash)
5. save + list commands → ✅ CHECKPOINT: test core loop
6. show + history
7. diff
8. delete + rename + export
9. Entry point
10. README
```
