# Subagents vs Teams

**Topic ID:** agents.multi-agent.subagents
**Researched:** 2026-03-01T12:00:00Z

## Overview

Subagents and agent teams represent two distinct approaches to multi-agent orchestration in Claude Code, each designed for different coordination needs. Subagents are specialized AI assistants that run within a single session, executing focused tasks and returning results to the main agent [1]. Agent teams, by contrast, coordinate multiple independent Claude Code instances that can communicate directly with each other through shared task lists and messaging [2].

The fundamental distinction lies in communication patterns. Subagents follow a hub-and-spoke model where all information flows through the main agent. They report results back and cannot talk to each other [2]. Agent teams operate more like a collaborative project team sitting in the same room, where teammates share findings, challenge each other's conclusions, and coordinate work autonomously through direct messaging [2].

Understanding when to use each approach is critical for certification scenarios, as the wrong choice leads to either insufficient collaboration (subagents when you need discussion) or excessive token costs (teams when you just need parallel execution). In practice, agents typically use about 4x more tokens than chat interactions, and multi-agent systems use about 15x more tokens than chats [3].

## Key Concepts

- **Subagent** — A specialized AI assistant that runs in its own isolated context window with custom system prompts, specific tool access, and independent permissions [1]. Subagents work within a single session and can only report results back to the main agent.

- **Agent Team** — Multiple coordinated Claude Code instances where one session acts as team lead and teammates work independently while communicating directly with each other [2]. Requires enabling via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` setting.

- **Context Isolation** — Subagents maintain separate context from the main agent, preventing information overload [1]. Only relevant summaries return to the orchestrator rather than full context, which reduces token consumption [4].

- **Task Tool** — The SDK mechanism for spawning subagents. When `Task` is in `allowedTools`, Claude can delegate work to subagents [1]. Critical: subagents cannot spawn other subagents, preventing infinite nesting [1][3].

- **Shared Task List** — Agent teams coordinate through a central work list with three states: pending, in progress, and completed [2]. Tasks can have dependencies that automatically unblock when prerequisites finish.

- **Direct Messaging** — In agent teams, teammates can message each other directly or broadcast to all teammates simultaneously [2]. Subagents lack this capability entirely.

- **Built-in Subagents** — Claude Code includes three built-in subagents: Explore (fast, read-only codebase analysis using Haiku), Plan (research for plan mode), and general-purpose (complex multi-step tasks) [1].

## Technical Details

### Subagent Definition

Subagents are defined in Markdown files with YAML frontmatter, stored at different priority levels [1]:

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All user projects | 3 |
| Plugin's `agents/` | Where plugin enabled | 4 (lowest) |

Example subagent configuration [1]:

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

Key frontmatter fields include: `name`, `description` (required), `tools`, `disallowedTools`, `model` (sonnet/opus/haiku/inherit), `permissionMode`, `maxTurns`, `skills`, `hooks`, and `memory` [1].

### Permission Inheritance

Subagents inherit permission context from the main conversation but can override the mode [1][3]. Available modes: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, and `plan`. Critical: if the parent uses `bypassPermissions`, this takes precedence and cannot be overridden [1].

### Agent Team Architecture

Agent teams consist of [2]:
- **Team lead**: Main session that creates team, spawns teammates, coordinates work
- **Teammates**: Separate Claude Code instances working on assigned tasks
- **Task list**: Shared work items with automatic dependency resolution
- **Mailbox**: Messaging system for inter-agent communication

Team configuration is stored locally at `~/.claude/teams/{team-name}/config.json` and tasks at `~/.claude/tasks/{team-name}/` [2].

### Display Modes for Teams

Agent teams support two display modes [2]:
- **In-process**: All teammates run in main terminal; use Shift+Down to cycle
- **Split panes**: Each teammate gets own pane (requires tmux or iTerm2)

## Common Patterns

### When to Use Subagents [1][2]

Use subagents for:
- Quick, focused workers that report back results
- Sequential tasks where only output matters
- Isolating high-volume operations (test runs, log processing)
- Tasks with same-file edits or many dependencies
- Enforcing tool restrictions on specific workflows
- Cost-conscious scenarios (lower token usage than teams)

Pattern example for parallel research [1]:
```text
Research the authentication, database, and API modules in parallel using separate subagents
```

### When to Use Agent Teams [2]

Use agent teams for:
- Research and review where multiple perspectives add value
- Work requiring direct collaboration and discussion
- Debugging with competing hypotheses (teammates argue theories)
- Cross-layer coordination (frontend, backend, tests owned separately)
- New modules where teammates own separate pieces
- Tasks where teammates need to share findings and challenge each other

Pattern example [2]:
```text
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### Best Practice: Plan Then Team

The most effective pattern is two-step [2]: plan first with plan mode, then hand the plan to a team for parallel execution. Start with subagents for focused work, graduate to teams when workers need to coordinate.

## Gotchas

- **No nested spawning**: Subagents cannot spawn other subagents [1][3]. This prevents infinite recursion but means complex hierarchical workflows must use chaining from the main conversation.

- **Agent teams are experimental**: Must enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment variable or settings.json [2]. Teams have known limitations around session resumption and shutdown behavior.

- **Token cost scaling**: Teams use significantly more tokens than subagents [2]. Each teammate is a full Claude Code session with its own context window. Rule of thumb: if you need focused execution, use subagents; if you need collaboration, accept the higher cost of teams.

- **Context window confusion**: Teammates load project context (CLAUDE.md, MCP servers, skills) but do NOT inherit the lead's conversation history [2]. The spawn prompt and shared task list are the only context transfer mechanisms.

- **Permission prompts in background**: Background subagents auto-deny any permissions not pre-approved before launch [1]. If a background subagent fails due to missing permissions, you can resume it in foreground.

- **Team cleanup order**: Always use the lead to clean up teams, not teammates [2]. Teammates may have incorrect team context that leaves resources inconsistent.

- **Task tool vs Teammate tool**: The Task tool spawns subagents (isolated workers). Agent teams use different mechanisms (TeammateTool) for spawning teammates that can communicate [2]. These are distinct systems, not interchangeable.

- **No session resumption with in-process teammates**: Using `/resume` and `/rewind` does not restore in-process teammates [2]. After resuming, the lead may try to message teammates that no longer exist.

- **Model assignment confusion**: For subagents, `model: inherit` (default) uses parent's model; for teams, each teammate is a full session that inherits the lead's model settings at spawn time but runs independently thereafter [1][2].

## Sources

[1] **Create custom subagents - Claude Code Docs**
    URL: https://code.claude.com/docs/en/sub-agents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical reference for subagent definition, configuration, frontmatter fields, built-in subagents, permission modes, tool restrictions, hooks, persistent memory, and common usage patterns.

[2] **Orchestrate teams of Claude Code sessions - Claude Code Docs**
    URL: https://code.claude.com/docs/en/agent-teams
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive documentation on agent teams architecture, comparison with subagents, display modes, task lists, inter-agent messaging, best practices, use case examples, and known limitations.

[3] **Building agents with the Claude Agent SDK - Anthropic Engineering Blog**
    URL: https://claude.com/blog/building-agents-with-the-claude-agent-sdk
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Context isolation rationale, token usage patterns (4x for agents, 15x for multi-agent), subagent spawning limitations, and best practice recommendations for when to use subagents.

[4] **Claude Code Subagents Enable Modular AI Workflows with Isolated Context - InfoQ**
    URL: https://www.infoq.com/news/2025/08/claude-code-subagents/
    Accessed: 2026-03-01
    Relevance: background
    Extracted: Context isolation benefits, parent-child permission relationships, and minimum permission recommendations for subagent definitions.
