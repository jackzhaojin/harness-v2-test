# Hooks and Sessions

**Topic ID:** agents.sdk.hooks-and-sessions
**Researched:** 2026-03-01T12:00:00Z

## Overview

Hooks and sessions are two fundamental mechanisms in the Claude Agent SDK that provide control over agent behavior and conversation continuity. **Hooks** are callback functions that execute at specific lifecycle points during agent execution, enabling you to intercept, modify, or block agent actions programmatically. **Sessions** provide persistent conversation state, allowing you to resume conversations across multiple interactions while maintaining full context.

Together, these features enable sophisticated agent workflows: hooks let you enforce security policies, audit actions, transform inputs/outputs, and implement custom permission logic, while sessions allow for long-running development workflows where Claude can pick up exactly where it left off. This combination is essential for production deployments where you need both behavioral control and conversation continuity.

The SDK provides both Python and TypeScript implementations, with hooks available as callback functions passed in agent options. Sessions are automatically created when queries start, and the SDK returns session IDs that can be stored and used to resume conversations later.

## Key Concepts

- **Hook Events**: Lifecycle points where hooks can fire. Primary events include `PreToolUse` (before tool execution), `PostToolUse` (after successful tool execution), `Stop` (when agent finishes), `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, and `Notification`.

- **Matchers**: Regex patterns that filter when hooks fire. For tool-based hooks, matchers filter by tool name (e.g., `"Bash"`, `"Write|Edit"`, `"mcp__.*"`). Omitting a matcher runs the hook for all occurrences.

- **Hook Callbacks**: Async functions receiving three arguments: `input_data` (event details), `tool_use_id` (correlates PreToolUse/PostToolUse for same call), and `context` (contains AbortSignal in TypeScript).

- **Permission Decisions**: PreToolUse hooks can return `permissionDecision` of `"allow"` (bypass permission system), `"deny"` (block tool call), or `"ask"` (prompt user). Deny takes priority when multiple hooks apply.

- **Session IDs**: Unique identifiers returned in the initial system message when a session starts. Store these to resume conversations later using the `resume` option.

- **Session Forking**: When resuming, use `forkSession: true` to create a new branch from the resume point, preserving the original session unchanged. Default behavior continues the original session.

- **hookSpecificOutput**: A nested object in hook responses containing event-specific fields like `permissionDecision`, `updatedInput`, or `additionalContext`.

- **Async Hooks**: Hooks can return `{ async: true }` to run in the background without blocking. Useful for logging and webhooks that don't need to influence agent behavior.

## Technical Details

### Hook Configuration

Hooks are passed in the `hooks` field of agent options as a dictionary mapping event names to arrays of matchers:

```python
from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient, HookMatcher

async def my_hook(input_data, tool_use_id, context):
    # Check tool input
    if input_data["tool_name"] == "Bash":
        command = input_data["tool_input"].get("command", "")
        if "rm -rf" in command:
            return {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "Destructive command blocked"
                }
            }
    return {}  # Allow by default

options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Bash", hooks=[my_hook])
        ]
    }
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("Your prompt")
```

```typescript
import { query, HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";

const myHook: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as PreToolUseHookInput;
  const toolInput = preInput.tool_input as Record<string, unknown>;

  if (preInput.tool_name === "Bash" &&
      (toolInput.command as string)?.includes("rm -rf")) {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Destructive command blocked"
      }
    };
  }
  return {};
};

for await (const message of query({
  prompt: "Your prompt",
  options: {
    hooks: {
      PreToolUse: [{ matcher: "Bash", hooks: [myHook] }]
    }
  }
})) {
  console.log(message);
}
```

### Session Management

```python
from claude_agent_sdk import query, ClaudeAgentOptions

session_id = None

# Start a session and capture ID
async for message in query(
    prompt="Help me build a web app",
    options=ClaudeAgentOptions(model="claude-opus-4-6")
):
    if hasattr(message, "subtype") and message.subtype == "init":
        session_id = message.data.get("session_id")
    print(message)

# Resume the session later
async for message in query(
    prompt="Continue where we left off",
    options=ClaudeAgentOptions(resume=session_id)
):
    print(message)

# Fork the session to explore an alternative
async for message in query(
    prompt="Let's try a different approach",
    options=ClaudeAgentOptions(resume=session_id, fork_session=True)
):
    print(message)
```

### Available Hook Events

| Hook Event | Description | Can Block? |
|------------|-------------|------------|
| `PreToolUse` | Before tool executes | Yes |
| `PostToolUse` | After tool succeeds | No (already ran) |
| `PostToolUseFailure` | After tool fails | No |
| `Stop` | Agent finishes responding | Yes |
| `SubagentStart` | Subagent spawned | No |
| `SubagentStop` | Subagent finished | Yes |
| `SessionStart` | Session begins/resumes | No |
| `SessionEnd` | Session terminates | No |
| `Notification` | Agent status messages | No |
| `UserPromptSubmit` | User submits prompt | Yes |
| `PreCompact` | Before context compaction | No |

### Hook Input Fields

All hooks receive common fields: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`. Tool hooks also receive `tool_name`, `tool_input`, and `tool_use_id`.

## Common Patterns

### Audit Logging

```python
async def audit_logger(input_data, tool_use_id, context):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "tool": input_data.get("tool_name"),
        "input": input_data.get("tool_input"),
        "session": input_data.get("session_id")
    }
    await send_to_logging_service(log_entry)
    return {"async_": True}  # Don't block execution
```

### Sandboxing File Operations

```python
async def sandbox_writes(input_data, tool_use_id, context):
    if input_data["tool_name"] == "Write":
        original_path = input_data["tool_input"].get("file_path", "")
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "updatedInput": {
                    **input_data["tool_input"],
                    "file_path": f"/sandbox{original_path}"
                }
            }
        }
    return {}
```

### Auto-Approving Read-Only Tools

```python
async def auto_approve_reads(input_data, tool_use_id, context):
    read_only_tools = ["Read", "Glob", "Grep"]
    if input_data["tool_name"] in read_only_tools:
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow"
            }
        }
    return {}
```

### Chaining Multiple Hooks

```python
options = ClaudeAgentOptions(
    hooks={
        "PreToolUse": [
            HookMatcher(hooks=[rate_limiter]),      # First: check limits
            HookMatcher(hooks=[auth_check]),         # Second: verify perms
            HookMatcher(hooks=[input_sanitizer]),    # Third: sanitize
            HookMatcher(hooks=[audit_logger])        # Last: log action
        ]
    }
)
```

## Gotchas

- **Python SDK limitations**: `SessionStart` and `SessionEnd` can only be registered as SDK callback hooks in TypeScript. In Python, these are only available as shell command hooks in settings files.

- **Hooks don't fire at max_turns**: When the agent hits the `max_turns` limit, hooks may not execute because the session ends abruptly.

- **Matchers only filter tool names**: To filter by file path or other arguments, you must check inside your callback—matchers only match against `tool_name`.

- **updatedInput requires permissionDecision**: When modifying tool input with `updatedInput`, you must also return `permissionDecision: "allow"` for the change to take effect.

- **Deny always wins**: When multiple hooks or permission rules apply, `deny` takes priority over `ask`, which takes priority over `allow`.

- **Session resumption sends full history**: When resuming, the entire conversation history is sent to Claude's API, consuming input tokens proportional to conversation length.

- **No automatic memory across sessions**: The SDK doesn't remember context across different sessions without explicit resume functionality. Each new session starts fresh.

- **Hook timeout defaults**: Command hooks timeout after 10 minutes by default. For long operations, set an explicit `timeout` value or use `async: true`.

- **MCP tool naming**: MCP tools follow the pattern `mcp__<server>__<tool>`. Use regex matchers like `mcp__memory__.*` to target all tools from a server.

## Sources

- [Intercept and control agent behavior with hooks - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/hooks) — Comprehensive documentation on hook configuration, events, callbacks, and examples
- [Session Management - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/sessions) — Official documentation on session creation, resumption, and forking
- [Hooks reference - Claude Code Docs](https://code.claude.com/docs/en/hooks) — Detailed reference for hook events, JSON input/output formats, matchers, and shell command hooks
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) — Python SDK repository with hook and session examples
