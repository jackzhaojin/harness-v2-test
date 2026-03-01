# Hooks System

**Topic ID:** claude-code.customization.hooks
**Researched:** 2026-03-01T00:00:00Z

## Overview

Claude Code hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them. While CLAUDE.md files serve as style guides that Claude should follow, hooks act as enforcers—they run every single time their conditions are met, with zero exceptions.

Hooks address a fundamental limitation of LLM-based tools: you cannot guarantee an AI agent will remember to format code, run tests, or avoid editing sensitive files. Hooks solve this by intercepting Claude's actions at predefined lifecycle points. You can block dangerous commands before they execute, auto-format files after every edit, inject context when sessions start, validate tool inputs, send desktop notifications, and audit configuration changes.

The hooks system supports three handler types: command hooks run shell scripts, prompt hooks use a Claude model for single-turn evaluation, and agent hooks spawn subagents with tool access for complex verification. This flexibility allows both simple automation (running Prettier) and sophisticated guardrails (verifying tests pass before allowing Claude to stop).

## Key Concepts

- **Lifecycle Events**: Hooks fire at specific points—`PreToolUse` (before tool execution), `PostToolUse` (after tool succeeds), `SessionStart`, `Stop` (when Claude finishes responding), `Notification`, `UserPromptSubmit`, and others. Each event type provides different input data and control options.

- **Matchers**: Regex patterns that filter when hooks fire. Without a matcher, hooks fire on every occurrence of their event. Matchers like `"Edit|Write"` limit a `PostToolUse` hook to only file-editing tools. Matchers are case-sensitive.

- **Exit Codes**: Command hooks communicate outcomes through exit codes. Exit 0 means proceed (stdout added to context for some events), exit 2 blocks the action (stderr becomes Claude's feedback), other codes proceed but log to verbose mode.

- **JSON I/O**: Hooks receive structured JSON on stdin containing session info, tool names, and tool inputs. They can return structured JSON on stdout for fine-grained control beyond simple allow/block decisions.

- **Hook Types**: `command` runs shell scripts, `prompt` makes a single Claude API call for judgment-based decisions, `agent` spawns a subagent with tool access for multi-step verification.

- **Configuration Scope**: Hooks can be defined at user level (`~/.claude/settings.json`), project level (`.claude/settings.json`), or local project level (`.claude/settings.local.json`). Project settings take precedence over user settings.

- **Deterministic Enforcement**: Unlike instructions in CLAUDE.md that Claude might occasionally forget, hooks execute every time their conditions match. This is critical for security and consistency.

## Technical Details

### Configuration Structure

Hooks are defined in JSON settings files:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Lifecycle Events Reference

| Event | When It Fires | Matcher Field |
|-------|---------------|---------------|
| `PreToolUse` | Before tool executes; can block | Tool name |
| `PostToolUse` | After tool succeeds | Tool name |
| `SessionStart` | Session begins/resumes | startup, resume, clear, compact |
| `Stop` | Claude finishes responding | None |
| `Notification` | Claude needs attention | permission_prompt, idle_prompt |
| `UserPromptSubmit` | User submits prompt | None |
| `ConfigChange` | Settings file modified | Configuration source |

### Hook Input Schema

Every hook receives JSON on stdin with common fields plus event-specific data:

```json
{
  "session_id": "abc123",
  "cwd": "/Users/sarah/myproject",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

### Structured JSON Output

For control beyond exit codes, return JSON to stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep for performance"
  }
}
```

`permissionDecision` accepts `"allow"` (proceed without prompt), `"deny"` (cancel and send reason to Claude), or `"ask"` (show normal permission prompt).

### Environment Variables

Hooks have access to `CLAUDE_PROJECT_DIR`, `CLAUDE_CODE_REMOTE`, and `CLAUDE_ENV_FILE`. The default timeout is 60 seconds per hook (configurable via the `timeout` field).

## Common Patterns

### Auto-Format After Edits

Run Prettier on every file Claude modifies:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

### Block Dangerous Commands

Create `.claude/hooks/protect-files.sh`:

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2
  fi
done
exit 0
```

Register with `PreToolUse` on `Edit|Write`.

### Desktop Notifications

Alert when Claude needs input:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

### Re-Inject Context After Compaction

When context compacts, critical info may be lost. Use `SessionStart` with `compact` matcher:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Reminder: use Bun, not npm. Run tests before committing.'"
          }
        ]
      }
    ]
  }
}
```

### Verify Tests Before Stopping

Use an agent hook to run tests:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. Run the test suite and check results.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## Gotchas

- **Shell profile output breaks JSON parsing**: If `~/.zshrc` prints anything on startup (welcome messages, conda activation), it prepends to hook stdout and corrupts JSON. Wrap noisy lines in `if [[ $- == *i* ]]; then ... fi` to only run in interactive shells.

- **Scripts must be executable**: `chmod +x` is easy to forget. If your hook silently does nothing, check permissions first.

- **Exit 2 ignores stdout**: When blocking with exit code 2, only stderr matters. The `permissionDecisionReason` in stdout JSON is ignored; write your message to stderr.

- **Matchers are case-sensitive**: Use `Bash`, not `bash`. Use `Edit|Write`, not `edit|write`.

- **PostToolUse cannot undo actions**: The tool has already executed. Use `PreToolUse` if you need to prevent something.

- **Stop hooks can loop infinitely**: If your Stop hook triggers continuation, it must check `stop_hook_active` in the input JSON and exit early when true, or Claude keeps working forever.

- **Manual settings edits require reload**: Hooks added via `/hooks` menu take effect immediately, but direct file edits require reviewing in `/hooks` or restarting the session.

- **PermissionRequest hooks don't fire in headless mode**: When running with `-p` (non-interactive), use `PreToolUse` instead for automated permission decisions.

- **MCP tool naming convention**: MCP tools use `mcp__<server>__<tool>` format. Match them with patterns like `"mcp__github__.*"`.

## Sources

- [Automate workflows with hooks - Claude Code Docs](https://code.claude.com/docs/en/hooks-guide) — Primary reference for all lifecycle events, configuration structure, JSON schemas, and official examples
- [Claude Code power user customization: How to configure hooks](https://claude.com/blog/how-to-configure-hooks) — Configuration file locations, matcher syntax, and practical JSON structure examples
- [Automating Your Workflow with Claude Code Hooks - DEV Community](https://dev.to/gunnargrosch/automating-your-workflow-with-claude-code-hooks-389h) — Practical gotchas including shell profile issues and permission problems, strategy recommendations
