# Agent SDK Core Concepts

**Topic ID:** agents.sdk.core-concepts
**Researched:** 2025-03-01T00:00:00Z

## Overview

The Claude Agent SDK (formerly Claude Code SDK) is Anthropic's official library for building AI agents that can autonomously read files, run commands, search the web, edit code, and more. It provides the same tools, agent loop, and context management that power Claude Code, but programmable in Python and TypeScript.

The SDK's core innovation is built-in tool execution. Unlike the Anthropic Client SDK where developers implement tool loops manually, the Agent SDK handles tool orchestration internally. You provide a prompt and configuration; Claude figures out which tools to use, executes them, observes results, and continues until the task is complete. This dramatically reduces the code needed to build capable agents.

The SDK targets developers building production automation, CI/CD pipelines, and custom AI-powered applications. It supports authentication via Anthropic API keys, Amazon Bedrock, Google Vertex AI, and Microsoft Azure AI Foundry, making it suitable for enterprise deployments with existing cloud infrastructure.

## Key Concepts

- **`query()` function**: The primary async interface for Claude interactions. It returns an `AsyncIterator` that streams messages as Claude works. Each iteration yields Claude's reasoning, tool calls, tool results, or final outcomes.

- **Built-in tools**: Pre-implemented tools that work immediately without custom code. These include `Read` (read files), `Write` (create files), `Edit` (modify files), `Bash` (run commands), `Glob` (find files by pattern), `Grep` (search content with regex), `WebSearch`, and `WebFetch`.

- **`ClaudeAgentOptions`**: Configuration object controlling agent behavior. Key parameters include `allowed_tools`, `permission_mode`, `system_prompt`, `max_turns`, `cwd` (working directory), `mcp_servers`, and `hooks`.

- **Permission modes**: Global controls for tool approval. Options include `default` (requires callback), `acceptEdits` (auto-approve file operations), `bypassPermissions` (all tools auto-approved), and `plan` (no execution, planning only).

- **Message types**: Response objects from the query stream. `AssistantMessage` contains Claude's reasoning and tool invocations, `ResultMessage` indicates completion, and content blocks (`TextBlock`, `ToolUseBlock`) carry specific data.

- **Hooks**: Callback functions that run at key lifecycle points (`PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, etc.) for validation, logging, blocking, or transforming agent behavior.

- **Sessions**: Context persistence across multiple exchanges. Claude remembers files read, analysis done, and conversation history. Sessions can be resumed or forked.

- **Subagents**: Specialized agents spawned for focused subtasks. Defined via `AgentDefinition` with custom prompts and tool restrictions.

## Technical Details

### Query Function Signature

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt: str,
    options: ClaudeAgentOptions = None
) -> AsyncIterator[Message]:
    # Process messages as they stream
```

The query creates a new session for each invocation. Use `async for` in Python or `for await` in TypeScript to consume the stream.

### ClaudeAgentOptions Parameters

```python
ClaudeAgentOptions(
    system_prompt: str,                    # Custom instructions for Claude
    max_turns: int,                        # Maximum conversation turns
    allowed_tools: List[str],              # Tools Claude can use
    permission_mode: str,                  # "default", "acceptEdits", "bypassPermissions", "plan"
    cwd: str | Path,                       # Working directory for tool operations
    mcp_servers: Dict[str, Any],           # External MCP server connections
    hooks: Dict[str, List[HookMatcher]],   # Lifecycle callbacks
    resume: str,                           # Session ID to resume
)
```

### Built-in Tools Reference

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `Read` | Read any file in working directory | Analyze code, check configs |
| `Write` | Create new files | Generate code, create configs |
| `Edit` | Make precise edits to existing files | Fix bugs, refactor code |
| `Bash` | Run terminal commands | Git operations, run tests, install packages |
| `Glob` | Find files by pattern (`**/*.ts`) | Discover project structure |
| `Grep` | Search file contents with regex | Find function usages, locate patterns |
| `WebSearch` | Search the web | Find documentation, research |
| `WebFetch` | Fetch and parse web pages | Read API docs, get examples |
| `AskUserQuestion` | Prompt user with multiple choice | Clarify requirements |

### Permission Evaluation Order

When Claude requests a tool, the SDK evaluates permissions in this sequence:

1. **Hooks** — `PreToolUse` hooks can allow, deny, or pass
2. **Permission rules** — Declarative `deny` → `allow` → `ask` rules from settings.json
3. **Permission mode** — `bypassPermissions`, `acceptEdits`, etc.
4. **canUseTool callback** — Runtime approval function if not resolved above

### TypeScript Usage

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix bugs in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits"
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

## Common Patterns

### Read-Only Analysis Agent

Restrict tools to prevent modifications:

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Glob", "Grep"],
    permission_mode="bypassPermissions"
)

async for message in query(
    prompt="Review this codebase for security issues",
    options=options
):
    # Claude analyzes but cannot modify files
```

### Automated Code Fixer

Full automation with file editing and command execution:

```python
options = ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Bash", "Glob", "Grep"],
    permission_mode="acceptEdits"
)

async for message in query(
    prompt="Run tests, find failures, and fix them",
    options=options
):
    pass
```

### Session Continuation

Resume a previous session with full context:

```python
# First query - capture session ID
session_id = None
async for message in query(prompt="Analyze the auth module"):
    if hasattr(message, "session_id"):
        session_id = message.session_id

# Resume with context
async for message in query(
    prompt="Now refactor it",
    options=ClaudeAgentOptions(resume=session_id)
):
    pass
```

### Audit Hook for File Changes

Log all modifications:

```python
async def log_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path")
    with open("audit.log", "a") as f:
        f.write(f"{datetime.now()}: modified {file_path}\n")
    return {}

options = ClaudeAgentOptions(
    permission_mode="acceptEdits",
    hooks={
        "PostToolUse": [HookMatcher(matcher="Edit|Write", hooks=[log_change])]
    }
)
```

## Gotchas

- **`bypassPermissions` inheritance**: When using `bypassPermissions`, all subagents inherit this mode and it cannot be overridden. Subagents may have different system prompts and less constrained behavior—they get full autonomous system access.

- **Tool name casing**: Tool names are case-sensitive. Use `"Read"` not `"read"`. The SDK will not recognize lowercase tool names.

- **`acceptEdits` scope**: This mode only auto-approves file operations (`Edit`, `Write`, `mkdir`, `rm`, `mv`, `cp`). Other Bash commands that aren't filesystem operations still require normal permissions.

- **Session ID capture**: The session ID is emitted in an early `init` message. You must capture it during streaming to resume later—it's not available after the query completes.

- **`plan` mode limitations**: In plan mode, Claude cannot execute any tools. It can only analyze and propose changes. This is useful for review workflows but requires a second pass with execution permissions.

- **Working directory matters**: Tools operate relative to `cwd`. If unspecified, it defaults to the current working directory. File paths in prompts should be relative to this directory.

- **Streaming is default**: The SDK is streaming-first. If you need all results at once (for CI/CD or background jobs), you must collect messages manually or use single-turn mode patterns documented separately.

- **ClaudeSDKClient vs query()**: For simple one-shot tasks, use `query()`. For bidirectional conversations with custom tools and hooks defined as Python functions, use `ClaudeSDKClient` context manager.

## Sources

- [Agent SDK Overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview) — Primary documentation covering query function, built-in tools, capabilities, and comparison with other Claude tools
- [Configure Permissions - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/permissions) — Detailed documentation on permission modes, evaluation order, and mode-specific behaviors
- [Quickstart - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/quickstart) — Step-by-step guide with working examples and explanation of key concepts
- [GitHub - anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) — Official Python SDK repository with API signatures, message types, and error handling
