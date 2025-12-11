# VHS Demo for PromptLog
# https://github.com/charmbracelet/vhs

Output demo.gif

Set FontSize 14
Set Width 800
Set Height 500
Set Theme "Catppuccin Mocha"

Type "# Let's save a prompt from clipboard"
Enter
Sleep 500ms

Type "echo 'You are a helpful code reviewer. Check for bugs and security issues.' | pbcopy"
Enter
Sleep 300ms

Type "promptlog save code-review --note 'initial version' --yes"
Enter
Sleep 2s

Type "# Save an updated version"
Enter
Sleep 500ms

Type "echo 'You are a SENIOR code reviewer. Be strict about bugs, security, and naming conventions.' | pbcopy"
Enter
Sleep 300ms

Type "promptlog save code-review --note 'stricter version' --yes"
Enter
Sleep 2s

Type "# List all prompts"
Enter
Sleep 500ms

Type "promptlog list"
Enter
Sleep 2s

Type "# View history"
Enter
Sleep 500ms

Type "promptlog history code-review"
Enter
Sleep 2s

Type "# See what changed"
Enter
Sleep 500ms

Type "promptlog diff code-review"
Enter
Sleep 3s

Type "# Show a specific version"
Enter
Sleep 500ms

Type "promptlog show code-review@1"
Enter
Sleep 2s
