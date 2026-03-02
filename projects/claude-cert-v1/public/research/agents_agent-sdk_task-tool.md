# Task Tool for Spawning

**Topic ID:** agents.agent-sdk.task-tool
**Researched:** 2026-03-01T00:00:00Z

## Overview

The Task tool (renamed to Agent tool in version 2.1.63, though "Task" remains as an alias) is the core mechanism in the Claude Agent SDK for spawning sub-agents with isolated contexts and controlled tool access [1][2]. It enables a coordinator or main agent to delegate focused subtasks to specialized sub-agents, each running in their own context window with custom system prompts, specific tool restrictions, and independent permissions [2]. This architectural pattern is fundamental to building sophisticated multi-agent systems where different agents handle different aspects of complex workflows.

The Task tool transforms Claude from a single AI assistant into an orchestration system capable of managing multiple AI agents working in parallel or sequence [3]. Sub-agents receive only relevant information back to the orchestrator rather than their full context, making them ideal for tasks that require sifting through large amounts of information [1]. This context isolation prevents information overload in the main conversation while enabling parallel execution, specialized instructions, and fine-grained tool restrictions.

## Key Concepts

- **Task Tool Invocation** — Sub-agents are spawned through the Task tool, which must be included in `allowedTools` for the parent agent to delegate work [1]. The tool accepts parameters including `subagent_type`, `description`, `prompt`, `run_in_background`, `model`, and `resume` [3].

- **Context Isolation** — Each sub-agent maintains a separate context window from the main agent, preventing information overload and keeping interactions focused [1][2]. A research sub-agent can explore dozens of files without cluttering the main conversation, returning only relevant findings.

- **Tool Restrictions** — Sub-agents can be limited to specific tools via the `tools` field in their definition, reducing the risk of unintended actions [1][2]. For example, a code reviewer might only have access to `Read`, `Grep`, and `Glob` tools.

- **No Nested Spawning** — Sub-agents cannot spawn their own sub-agents; the `Task` tool should not be included in a sub-agent's tool list [1][2]. This prevents infinite nesting while maintaining clear delegation hierarchies.

- **Automatic Delegation** — Claude determines when to invoke sub-agents based on each sub-agent's `description` field [1][2]. Clear, specific descriptions enable Claude to match tasks to the appropriate sub-agent automatically.

- **Model Override** — Each sub-agent can specify its own model via the `model` field (`sonnet`, `opus`, `haiku`, or `inherit`), enabling cost optimization by routing simpler tasks to faster, cheaper models [1][2].

- **Permission Inheritance** — Sub-agents inherit the parent conversation's permission context but can override the mode with options like `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, or `plan` [2].

## Technical Details

### AgentDefinition Configuration

The `AgentDefinition` object configures each sub-agent with the following fields [1]:

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `description` | `string` | Yes | Natural language description of when to use this agent |
| `prompt` | `string` | Yes | The agent's system prompt defining its role and behavior |
| `tools` | `string[]` | No | Array of allowed tool names. If omitted, inherits all tools |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit'` | No | Model override for this agent. Defaults to main model if omitted |

### TypeScript Example

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review the authentication module for security issues",
  options: {
    // Task tool is required for subagent invocation
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents: {
      "code-reviewer": {
        description: "Expert code review specialist. Use for quality, security, and maintainability reviews.",
        prompt: `You are a code review specialist with expertise in security, performance, and best practices.
When reviewing code:
- Identify security vulnerabilities
- Check for performance issues
- Verify adherence to coding standards
- Suggest specific improvements`,
        tools: ["Read", "Grep", "Glob"],
        model: "sonnet"
      }
    }
  }
})) {
  if ("result" in message) console.log(message.result);
}
```
[1]

### Python Example

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def main():
    async for message in query(
        prompt="Review the authentication module for security issues",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Task"],
            agents={
                "code-reviewer": AgentDefinition(
                    description="Expert code review specialist.",
                    prompt="You are a code review specialist...",
                    tools=["Read", "Grep", "Glob"],
                    model="sonnet",
                )
            },
        ),
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```
[1]

### Task Tool Parameters

When Claude invokes the Task tool, it passes these parameters [3]:

| Parameter | Required | Purpose |
|-----------|----------|---------|
| `subagent_type` | Yes | Specifies which agent variant to spawn |
| `description` | Yes | 3-5 word task summary |
| `prompt` | Yes | Detailed instructions for the agent |
| `run_in_background` | No | Async (true) or blocking (false) execution |
| `model` | No | Model selection (sonnet/opus/haiku) |
| `resume` | No | Resume a previous agent by ID |

### Detecting Sub-Agent Invocation

To detect when a sub-agent is invoked, check for `tool_use` blocks with `name: "Task"` [1]. Messages from within a sub-agent's context include a `parent_tool_use_id` field:

```typescript
for await (const message of query({...})) {
  for (const block of msg.message?.content ?? []) {
    if (block.type === "tool_use" && block.name === "Task") {
      console.log(`Subagent invoked: ${block.input.subagent_type}`);
    }
  }
  if (msg.parent_tool_use_id) {
    console.log("  (running inside subagent)");
  }
}
```
[1]

## Common Patterns

### Three Approaches to Defining Sub-Agents

1. **Programmatic (Recommended for SDK Apps)** — Define sub-agents directly in code using the `agents` parameter in `query()` options [1]. This provides full programmatic control and is ideal for dynamic configurations.

2. **Filesystem-Based** — Define agents as markdown files in `.claude/agents/` directories with YAML frontmatter [2]. Project-level agents go in `.claude/agents/`, user-level in `~/.claude/agents/`. Programmatically defined agents take precedence over filesystem-based agents with the same name [1].

3. **Built-In General-Purpose** — Even without defining custom sub-agents, Claude can spawn the built-in `general-purpose` sub-agent when `Task` is in `allowedTools` [1]. This is useful for delegating research or exploration tasks without creating specialized agents.

### Common Tool Combinations

| Use Case | Tools | Description |
|:---------|:------|:------------|
| Read-only analysis | `Read`, `Grep`, `Glob` | Can examine code but not modify or execute |
| Test execution | `Bash`, `Read`, `Grep` | Can run commands and analyze output |
| Code modification | `Read`, `Edit`, `Write`, `Grep`, `Glob` | Full read/write access without command execution |
| Full access | All tools | Inherits all tools from parent (omit `tools` field) |
[1]

### Built-In Sub-Agents

Claude Code includes several built-in sub-agents [2]:

- **Explore** — A fast, read-only agent (Haiku model) optimized for searching and analyzing codebases. Supports thoroughness levels: quick, medium, or very thorough.
- **Plan** — A research agent used during plan mode to gather context before presenting a plan. Prevents infinite nesting since sub-agents cannot spawn other sub-agents.
- **General-Purpose** — A capable agent for complex, multi-step tasks requiring both exploration and action.

### Parallel Research Pattern

Spawn multiple sub-agents to work simultaneously on independent investigations [4]:

```text
Research the authentication, database, and API modules in parallel using separate subagents
```

Each sub-agent explores its area independently, then Claude synthesizes the findings. This works best when research paths do not depend on each other.

### Resuming Sub-Agents

Sub-agents can be resumed to continue where they left off, retaining their full conversation history [1][2]. When a sub-agent completes, Claude receives its agent ID in the Task tool result. To resume:

1. Capture the `session_id` from messages during the first query
2. Extract `agentId` from the message content
3. Pass `resume: sessionId` in the second query's options

Sub-agent transcripts persist independently and are cleaned up based on the `cleanupPeriodDays` setting (default: 30 days) [2].

## Gotchas

- **Task Tool Must Be in allowedTools** — The most common mistake is forgetting to include `Task` (or `Agent` in v2.1.63+) in the parent agent's `allowedTools`. Without it, the agent cannot spawn sub-agents at all [1][2].

- **Sub-Agents Cannot Nest** — Do not include `Task` in a sub-agent's `tools` array. Sub-agents cannot spawn their own sub-agents, and including Task will cause errors or unexpected behavior [1][2].

- **settingSources Required for Filesystem Agents** — When using filesystem-based agents with the SDK, you must include `settingSources: ['user', 'project']` in the `query()` options for the SDK to discover `.claude/agents/` files [CLAUDE.md].

- **cwd Must Point to Agent Directory** — The `cwd` option must point to where `.claude/agents/` lives for filesystem-based agent discovery to work [CLAUDE.md].

- **Windows Command Line Limits** — On Windows, sub-agents with very long prompts may fail due to command line length limits (8191 chars). Keep prompts concise or use filesystem-based agents for complex instructions [1].

- **Filesystem Agents Load at Startup** — Agents defined in `.claude/agents/` are loaded at session start only. If you create a new agent file while Claude Code is running, restart the session or use `/agents` to load it immediately [2].

- **Background Sub-Agents Auto-Deny Permissions** — Background sub-agents auto-deny any permissions not pre-approved before launch. If a background sub-agent fails due to missing permissions, you can resume it in the foreground to retry with interactive prompts [2].

- **Context Window Consumption** — When sub-agents complete, their results return to the main conversation. Running many sub-agents that each return detailed results can consume significant context [2].

- **Programmatic Agents Take Precedence** — Programmatically defined agents (via the `agents` parameter) take precedence over filesystem-based agents with the same name [1]. This can cause confusion if you expect a filesystem agent to be used.

- **Model Alias vs Full Name** — The `model` field accepts short aliases (`sonnet`, `opus`, `haiku`) or `inherit`, not full model IDs. Using an incorrect value will cause the sub-agent to default to the parent's model [1].

## Sources

[1] **Subagents in the SDK - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agent-sdk/subagents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive technical details on AgentDefinition configuration, TypeScript/Python code examples, tool restrictions, detecting sub-agent invocation, resuming sub-agents, and troubleshooting guidance.

[2] **Create custom subagents - Claude Code Docs**
    URL: https://code.claude.com/docs/en/sub-agents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Detailed information on filesystem-based agent definitions, YAML frontmatter format, built-in agents (Explore, Plan, General-Purpose), permission modes, hooks, persistent memory, and best practices for working with sub-agents.

[3] **The Task Tool: Claude Code's Agent Orchestration System - DEV Community**
    URL: https://dev.to/bhaidar/the-task-tool-claude-codes-agent-orchestration-system-4bf2
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Task tool parameter specification (subagent_type, description, prompt, run_in_background, model, resume), agent types and their tool access differences, execution architecture overview.

[4] **Building agents with the Claude Agent SDK - Anthropic Engineering Blog**
    URL: https://claude.com/blog/building-agents-with-the-claude-agent-sdk
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: High-level architecture concepts including parallelization benefits, context isolation mechanisms, and the agent feedback loop pattern.
