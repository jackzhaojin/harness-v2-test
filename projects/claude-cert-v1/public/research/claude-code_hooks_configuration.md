# Hook Configuration

**Topic ID:** claude-code.hooks.configuration
**Researched:** 2026-03-01T12:00:00Z

## Overview

Hooks are user-defined shell commands, HTTP endpoints, or LLM prompts that execute automatically at specific points in Claude Code's lifecycle [1]. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them [2]. The configuration lives in JSON settings files using a three-level nesting structure: hook event (the lifecycle point), matcher group (optional filter), and hook handlers (the actual commands or endpoints to run) [1].

Hook configuration can be defined in multiple locations with different scopes: user settings (`~/.claude/settings.json`) for all projects, project settings (`.claude/settings.json`) for a single shareable project, local settings (`.claude/settings.local.json`) for project-specific non-shared hooks, managed policy settings for organization-wide enforcement, plugin `hooks/hooks.json` when a plugin is enabled, or skill/agent YAML frontmatter while that component is active [1][2].

## Key Concepts

- **Hook Events** — The lifecycle points where hooks can fire. Claude Code supports 17 events: SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, and SessionEnd [1].

- **Matchers** — Regex patterns that filter when hooks fire. Without a matcher, a hook fires on every occurrence of its event. Each event type matches on a different field: tool events match on `tool_name`, SessionStart matches on trigger type (startup, resume, clear, compact), Notification matches on notification type [1].

- **Hook Handler Types** — Four types available: `command` (shell commands), `http` (POST to URLs), `prompt` (single-turn LLM evaluation), and `agent` (multi-turn verification with tool access) [1][2].

- **Exit Codes** — Exit 0 means success and the action proceeds. Exit 2 is a blocking error that prevents the action. Any other exit code is a non-blocking error where execution continues [1][2].

- **JSON Input** — Hooks receive event-specific JSON data on stdin (for command hooks) or as POST body (for HTTP hooks). Common fields include `session_id`, `transcript_path`, `cwd`, `permission_mode`, and `hook_event_name` [1].

- **Decision Control** — Hooks can return JSON to control behavior beyond simple allow/block. PreToolUse uses `hookSpecificOutput.permissionDecision` (allow/deny/ask), while PostToolUse and Stop use top-level `decision: "block"` [1].

- **PostToolUse Event** — Fires immediately after a tool completes successfully. Cannot undo actions since the tool has already executed. Useful for reactions like formatting, logging, or running tests after file edits [1][2].

- **Matcher Case Sensitivity** — Matchers are case-sensitive. `"bash"` will not match the `Bash` tool [2].

## Technical Details

### Configuration Schema

The basic structure for configuring hooks in settings files:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

This example auto-formats files after Claude writes or edits them [2].

### Hook Handler Fields

Common fields for all hook types [1]:

| Field | Required | Description |
|-------|----------|-------------|
| `type` | yes | `"command"`, `"http"`, `"prompt"`, or `"agent"` |
| `timeout` | no | Seconds before canceling (defaults: 600 for command, 30 for prompt, 60 for agent) |
| `statusMessage` | no | Custom spinner message while hook runs |
| `once` | no | If true, runs only once per session (skills only) |

Command-specific fields [1]:
- `command` (required): Shell command to execute
- `async`: If true, runs in background without blocking

### PostToolUse Input Schema

PostToolUse hooks receive both the tool input and output [1]:

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../session.jsonl",
  "cwd": "/Users/.../project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

### MCP Tool Matchers

MCP tools follow the naming pattern `mcp__<server>__<tool>` [1]:
- `mcp__memory__create_entities` — Memory server's create entities tool
- `mcp__github__search_repositories` — GitHub server's search tool

Use regex patterns to match groups: `mcp__memory__.*` matches all tools from the memory server [1].

### Environment Variables

Key environment variables available to hooks [1][2]:
- `$CLAUDE_PROJECT_DIR` — The project root directory
- `${CLAUDE_PLUGIN_ROOT}` — Plugin's root directory (for plugin hooks)
- `$CLAUDE_CODE_REMOTE` — Set to "true" in remote web environments
- `$CLAUDE_ENV_FILE` — File path for persisting environment variables (SessionStart only)

## Common Patterns

### Auto-Format After Edits

Run Prettier on every file Claude edits [2]:

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

### Log Bash Commands

Record every shell command Claude runs [2]:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' >> ~/.claude/command-log.txt"
          }
        ]
      }
    ]
  }
}
```

### Block Protected Files (PreToolUse)

Prevent edits to sensitive files before they happen [2]:

```bash
#!/bin/bash
# .claude/hooks/protect-files.sh
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

### Stop Hook with Loop Prevention

Prevent infinite loops when using Stop hooks [2]:

```bash
#!/bin/bash
INPUT=$(cat)
if [ "$(echo "$INPUT" | jq -r '.stop_hook_active')" = "true" ]; then
  exit 0  # Allow Claude to stop
fi
# ... rest of hook logic
```

## Gotchas

- **PostToolUse Cannot Undo** — PostToolUse hooks fire after the tool has already executed successfully. They cannot undo or prevent the action. If you need to block an action, use PreToolUse instead [1][2].

- **PostToolUse vs PostToolUseFailure** — PostToolUse only fires on success. For failed tool calls, use PostToolUseFailure [1].

- **Case-Sensitive Matchers** — Matchers are case-sensitive. `"bash"` will not match the `Bash` tool. Always use exact capitalization [2].

- **PermissionRequest in Non-Interactive Mode** — PermissionRequest hooks do not fire in non-interactive mode (`-p` flag). Use PreToolUse hooks for automated permission decisions when running headlessly [2].

- **Stop Hook Infinite Loops** — Stop hooks can cause infinite loops if they always block. Check the `stop_hook_active` field in the input JSON and exit 0 if true [2].

- **Shell Profile Output Corrupts JSON** — If your shell profile (`.zshrc`, `.bashrc`) contains unconditional `echo` statements, they corrupt hook JSON output. Wrap echoes in `if [[ $- == *i* ]]` to only run in interactive shells [2].

- **Direct File Edits Require Reload** — Hooks added via the `/hooks` menu take effect immediately, but manual edits to settings files require a session restart or review in `/hooks` [1].

- **PreToolUse Decision Fields Changed** — PreToolUse previously used top-level `decision` and `reason` fields, but these are deprecated. Use `hookSpecificOutput.permissionDecision` and `hookSpecificOutput.permissionDecisionReason` instead [1].

- **Different Events Use Different Decision Patterns** — PreToolUse uses `hookSpecificOutput` with `permissionDecision`, PostToolUse/Stop use top-level `decision: "block"`, PermissionRequest uses `hookSpecificOutput.decision.behavior`. Do not mix these patterns [1].

- **HTTP Hooks Cannot Block via Status Code** — Unlike command hooks that use exit code 2 to block, HTTP hooks must return a 2xx response with JSON body containing the block decision. Non-2xx responses are treated as non-blocking errors [1].

- **Session Safety** — Claude Code snapshots hooks at session startup. Mid-session edits to settings files are not applied until reviewed in `/hooks` or the session restarts. This prevents malicious hook injection [1].

## Sources

[1] **Hooks reference - Claude Code Docs**
    URL: https://code.claude.com/docs/en/hooks
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical reference including all 17 hook events, configuration schema with field definitions, matcher patterns for each event type, JSON input/output formats, decision control patterns for each event, MCP tool naming conventions, environment variables, async hooks, HTTP hooks, prompt-based hooks, and security considerations.

[2] **Automate workflows with hooks - Claude Code Docs**
    URL: https://code.claude.com/docs/en/hooks-guide
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Practical examples for common patterns (auto-format, logging, file protection), step-by-step setup instructions, troubleshooting guide for common issues (infinite loops, JSON corruption, hooks not firing), and limitations section covering PostToolUse constraints and non-interactive mode behavior.
