# Agent Teams

**Topic ID:** agents.multi-agent.agent-teams
**Researched:** 2026-03-01T00:00:00Z

## Overview

Agent Teams is Anthropic's native multi-agent coordination feature for Claude Code, introduced alongside Opus 4.6 in February 2026 [1][2]. The feature enables multiple Claude Code instances to work together on shared projects, with one session acting as the team lead that coordinates work, assigns tasks, and synthesizes results. Teammates operate as fully independent Claude Code instances, each with their own context window, but with the ability to communicate directly with each other rather than only reporting back to a parent agent [1].

The key innovation distinguishing Agent Teams from traditional subagent patterns is the coordination layer. These agents are aware of each other, can share context, flag dependencies, and avoid stepping on each other's work through a shared task list and inbox-based messaging system [1][3]. This makes Agent Teams suitable for complex collaborative work requiring discussion and parallel exploration, while subagents remain better for focused, fire-and-forget tasks where only the result matters [1].

Agent Teams are experimental and disabled by default. They add significant coordination overhead and token costs compared to single sessions, but provide value when parallel exploration genuinely benefits the task at hand [1].

## Key Concepts

- **Team Lead** — The main Claude Code session that creates the team, spawns teammates, coordinates work, and synthesizes results. The lead can assign tasks explicitly or let teammates self-claim work. Only the lead can manage the team; it cannot be promoted or transferred [1].

- **Teammates** — Separate Claude Code instances that work independently, each with its own context window. Unlike subagents, teammates can message each other directly without going through the lead. They load project context (CLAUDE.md, MCP servers, skills) but do not inherit the lead's conversation history [1].

- **Shared Task List** — A coordinated work queue with dependency tracking. Tasks have three states: pending, in-progress, and completed. Tasks can depend on other tasks; blocked tasks automatically unblock when dependencies complete. File-lock based claiming prevents race conditions [1][3].

- **Mailbox System** — An inter-agent messaging system enabling direct communication. The lead can message any teammate, teammates can message the lead, and teammates can message each other. This bidirectional communication is what fundamentally differentiates Agent Teams from subagents [1].

- **Display Modes** — Two modes for viewing teammates: in-process (all teammates in one terminal, cycle with Shift+Down) and split panes (each teammate in its own tmux or iTerm2 pane). Split panes require tmux or iTerm2; they do not work in VS Code integrated terminal, Windows Terminal, or Ghostty [1].

- **Delegate Mode** — Pressing Shift+Tab restricts the lead to coordination-only tools (spawning, messaging, shutting down teammates, managing tasks) without touching code directly. Useful when the lead keeps implementing instead of delegating [1][4].

- **Plan Approval** — Teammates can be required to work in read-only plan mode until the lead approves their approach. Rejected plans include feedback for revision before resubmission [1].

## Technical Details

### Enabling Agent Teams

Agent teams are disabled by default. Enable via environment variable or settings.json [1]:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Or in settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Storage Locations

Teams and tasks are stored locally [1]:
- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`

The team config contains a `members` array with each teammate's name, agent ID, and agent type. Teammates can read this file to discover other team members [1].

### Quality Gate Hooks

Two hook events are designed specifically for teams [1][5]:

```json
{
  "hooks": {
    "TeammateIdle": [{
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/check-remaining-tasks.sh"
      }]
    }],
    "TaskCompleted": [{
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/verify-task-quality.sh"
      }]
    }]
  }
}
```

- **TeammateIdle**: Runs when a teammate is about to go idle. Exit code 2 sends stdout as feedback and keeps the teammate working; exit code 0 allows idling [1][5].
- **TaskCompleted**: Runs when a task is being marked complete. Exit code 2 prevents completion and sends feedback. Useful for running test suites before allowing task closure [1][5].

### Permissions

Teammates start with the lead's permission settings. If the lead runs with `--dangerously-skip-permissions`, all teammates do too. Individual teammate modes can be changed after spawning but not at spawn time [1].

## Common Patterns

**Parallel Code Review** — Split review criteria across independent domains so security, performance, and test coverage all get simultaneous attention [1]:

```text
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

**Competing Hypothesis Debugging** — Spawn teammates to investigate different theories and have them actively try to disprove each other, combating anchoring bias from sequential investigation [1]:

```text
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific debate.
```

**Cross-Layer Feature Development** — Teammates each own distinct layers (frontend, backend, tests, migrations) working in parallel [2][3]:

```text
Create a team with 4 teammates to build the new user profile feature.
One on the React components, one on the API endpoints, one on database
migrations, one on integration tests.
```

**Plan-Then-Execute** — Use plan mode (cheap) with a single session first, then hand the plan to a team for parallel execution (expensive but fast) [4].

## Gotchas

- **Subagents vs Agent Teams confusion** — Subagents run within a single session, report only back to the caller, and cannot message each other. Agent Teams are fully independent instances that coordinate through shared tasks and direct messaging. Use subagents for quick focused tasks; use Agent Teams when collaboration is needed [1].

- **No session resumption for in-process teammates** — The `/resume` and `/rewind` commands do not restore in-process teammates. After resuming, the lead may try to message teammates that no longer exist. Spawn new teammates if needed [1].

- **Task status can lag** — Teammates sometimes fail to mark tasks as completed, blocking dependent tasks. Check manually if work appears stuck [1].

- **Lead may implement instead of delegate** — If the lead starts coding instead of coordinating, tell it to wait for teammates or toggle delegate mode with Shift+Tab [1][4].

- **Split panes terminal requirements** — Split-pane mode requires tmux or iTerm2 with the `it2` CLI. tmux has known limitations on certain operating systems and works best on macOS. VS Code integrated terminal, Windows Terminal, and Ghostty do not support split panes [1].

- **Token costs scale linearly** — Each teammate has its own context window. A 5-teammate team uses roughly 5x the tokens of a single session. Opus 4.6 pricing is $5 per million input tokens and $25 per million output tokens (higher for requests exceeding 200K tokens) [1][2].

- **File conflicts from concurrent edits** — Two teammates editing the same file leads to overwrites. Structure work so each teammate owns distinct files or directories [1].

- **One team per session, no nesting** — A lead can only manage one team at a time. Teammates cannot spawn their own teams or teammates [1].

- **Cleanup must use the lead** — Teammates should not run cleanup because their team context may not resolve correctly, leaving resources in an inconsistent state. Always use the lead for cleanup [1].

## Sources

[1] **Orchestrate teams of Claude Code sessions - Claude Code Docs**
    URL: https://code.claude.com/docs/en/agent-teams
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core architecture, enabling instructions, display modes, task management, hooks, permissions, best practices, limitations, and troubleshooting guidance. Primary authoritative source.

[2] **Anthropic releases Opus 4.6 with new 'agent teams' | TechCrunch**
    URL: https://techcrunch.com/2026/02/05/anthropic-releases-opus-4-6-with-new-agent-teams/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Release timing, pricing information, competitive context, and real-world stress test example (16 agents building a C compiler).

[3] **Claude Code Agent Teams - AddyOsmani.com**
    URL: https://addyosmani.com/blog/claude-code-agent-teams/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Architecture overview, file-lock based task claiming, control mechanisms, and practical guidance on when to use vs avoid agent teams.

[4] **Claude Code Agent Teams: Run Parallel AI Agents on Your Codebase | SitePoint**
    URL: https://www.sitepoint.com/anthropic-claude-code-agent-teams/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Delegate mode usage, plan-then-execute pattern, and practical tips for monitoring and steering teams.

[5] **Claude Code Agent Teams Controls: Delegate Mode, Hooks & More | ClaudeFast**
    URL: https://claudefa.st/blog/guide/agents/agent-teams-controls
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Detailed hook configuration, exit code behavior for TeammateIdle and TaskCompleted, and async vs synchronous hook execution patterns.
