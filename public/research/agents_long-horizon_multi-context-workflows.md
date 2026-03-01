# Multi-Context Window Workflows

**Topic ID:** agents.long-horizon.multi-context-workflows
**Researched:** 2026-03-01T12:00:00Z

## Overview

Multi-context window workflows address a fundamental challenge in AI agent systems: LLMs are stateless by design, meaning they cannot inherently remember past interactions once a session ends or the context window fills up. For long-horizon tasks—those spanning tens of minutes to multiple hours of continuous work—agents must employ specialized techniques to maintain coherence, track progress, and gracefully continue across discrete context windows.

The core problem is that each new context window starts as a blank slate. Without explicit state management, an agent cannot know what work was previously completed, what decisions were made, or what remains to be done. This becomes critical for complex tasks like large codebase migrations, comprehensive research projects, or multi-day development workflows where the token count far exceeds any single context window's capacity.

Modern solutions combine several complementary strategies: compaction (summarizing filled context windows before starting fresh), persistent external state (files tracking progress and decisions), structured handoff protocols (init scripts and progress logs), and hierarchical agent architectures (sub-agents handling focused tasks with isolated context). Together, these enable agents to theoretically work for arbitrarily long periods while maintaining quality and avoiding redundant work.

## Key Concepts

- **Context Compaction**: The practice of summarizing a conversation nearing the context limit and reinitiating with that summary. This preserves critical information while freeing tokens. Claude Code implements "auto-compact" at 95% context capacity using recursive compression strategies.

- **State Persistence**: Mechanisms for maintaining information across context windows, including progress files (`claude-progress.txt`), git history, JSON feature lists, and external databases. This transforms stateless LLM sessions into a continuous workflow.

- **Initializer Agent Pattern**: A specialized first-session agent that establishes foundational infrastructure—setup scripts (`init.sh`), progress tracking files, initial git commits, and feature requirement documents—before any implementation begins.

- **Context Isolation**: Separating verbose output (test failures, build logs, file edits) into sub-agent context windows, preventing token exhaustion in the main conversation. This is what enables multi-hour autonomous operation.

- **Hierarchical Memory**: Multi-tier storage with short-term verbatim records, medium-term compressed summaries, and long-term extracted facts. Agents draw from all tiers, allocating more context budget to recent information while including relevant historical data.

- **Graceful Continuation**: The ability for subsequent sessions to quickly understand prior state, validate the codebase works, and resume from where previous work halted—typically achieved through structured progress files and git history.

- **Context Poisoning**: A failure mode where hallucinated or incorrect information enters a summary and propagates to all future sessions, corrupting the agent's understanding of the project state.

- **Sub-Agent Delegation**: Spawning specialized agents with dedicated context windows for focused tasks, returning compressed summaries (typically 1,000-2,000 tokens) to the lead agent while maintaining overall coherence.

## Technical Details

### Two-Part Session Architecture

The recommended architecture splits work into an initializer session and subsequent coding sessions:

**Initializer Agent (First Session)**
```
Responsibilities:
1. Set up init.sh script for development environment
2. Create claude-progress.txt for work logging
3. Generate structured feature list (JSON format)
4. Make initial git commit documenting setup
```

**Coding Agent (Subsequent Sessions)**
```
Onboarding sequence:
1. Run pwd to identify working directory
2. Read git logs and progress files for context
3. Select highest-priority incomplete feature
4. Start development server via init.sh
5. Run end-to-end tests before new implementation
6. Implement one feature incrementally
7. Commit with descriptive messages
8. Update progress documentation
```

### Feature List Structure

```json
{
  "category": "functional",
  "description": "User action and expected outcome",
  "steps": ["step1", "step2", "step3"],
  "passes": false
}
```

### Context Management Commands

| Command | Effect |
|---------|--------|
| `/compact` | Manually trigger context compression |
| `/clear` | Clear context while preserving disk-based state |
| `resume: <agent_id>` | Continue a previous sub-agent's work with full history |

### Sub-Agent Execution Modes

- **Foreground**: Blocks main session until completion (tasks under 30 seconds)
- **Background** (`run_in_background: true`): Asynchronous execution with notifications and output saved to file

### Memory Persistence Layers

```
┌─────────────────────────────────────────────┐
│ In-Context Memory (current session)         │
├─────────────────────────────────────────────┤
│ Persistent Memory Blocks (across LLM calls) │
├─────────────────────────────────────────────┤
│ External Memory (databases, vector stores)  │
└─────────────────────────────────────────────┘
```

## Common Patterns

### Todo-Driven Autonomous Execution

A proven pattern for extended runtime uses hierarchical agent delegation with todo lists:

```
/todo-all (slash command)
  └── loops through incomplete tasks
       └── @do-todo (agent) executes individual task
            └── @precommit-runner
            └── @git-commit-handler
            └── @git-rebaser
```

Each agent has a focused job with explicit delegation instructions. The main conversation stays clean because verbose output (test failures, build logs) happens inside sub-agent context windows. Reported runtimes: over 2 hours for file-porting tasks.

### Validation Before Implementation

Every session validates the codebase runs before implementing new features:

```bash
# Run init.sh to start environment
# Execute existing test suite
# Only proceed if tests pass
# This catches bugs from prior sessions
```

### Progress File Pattern

```markdown
# Progress Log

## 2026-03-01 Session 1
- Set up project structure
- Implemented user authentication
- Decision: Using JWT over sessions for statelessness
- Blocked: Need API key for external service

## 2026-03-01 Session 2
- Resolved API key issue
- Completed user authentication
- Started payment integration
```

### Context Refresh Strategy

For multi-day workflows:
1. Begin each day by reading `claude-progress.txt`
2. Review recent git history for implementation decisions
3. Run test suite to confirm working state
4. Continue with next priority item

## Gotchas

- **Compaction alone is insufficient**: While context compression helps, it cannot replace structured state management. Production-quality results require explicit progress tracking, feature lists, and validation steps.

- **Performance degradation at 35 minutes**: Research indicates agent performance degrades after approximately 35 minutes of human time on a task. Plan sub-agent boundaries accordingly.

- **Context poisoning is persistent**: If a hallucination enters a summary or progress file, it propagates to all future sessions. Implement validation checks and encourage explicit documentation of decisions with reasoning.

- **Token multiplication with sub-agents**: Multi-agent architectures can increase token usage by 15x compared to single-agent approaches. Use sub-agents for genuinely parallel work, not as a default pattern.

- **Don't edit test files to make them pass**: A common anti-pattern where agents modify tests rather than implementation. Instructions should explicitly state: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

- **Context distraction from information density**: Simply filling the context window with information is counterproductive. Selective injection based on relevance outperforms exhaustive inclusion.

- **Resuming requires agent ID**: To continue a sub-agent's work, you must have its agent ID from the previous invocation. Without it, a new agent starts fresh with no context.

- **External memory retrieval unpredictability**: Automated retrieval from external memory can surface unexpected information, making behavior harder to predict. Log all retrieval operations for debugging.

- **Session vs memory confusion**: Sessions generate memories, but memories persist across sessions. Clearing a session doesn't clear memories; these are separate persistence layers requiring independent management.

## Sources

- [Effective harnesses for long-running agents - Anthropic Engineering](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — Primary source for initializer/coding agent architecture, state persistence patterns, and anti-patterns
- [Effective context engineering for AI agents - Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Technical details on compaction, attention budget constraints, and structured note-taking
- [Context Engineering for Agents - LangChain Blog](https://blog.langchain.com/context-engineering-for-agents/) — Four strategies framework (write, select, compress, isolate) and LangGraph implementation details
- [Stateful Agents: The Missing Link in LLM Intelligence - Letta](https://www.letta.com/blog/stateful-agents) — Hierarchical memory architecture and multi-agent state sharing
- [The Task Tool: Claude Code's Agent Orchestration System - DEV Community](https://dev.to/bhaidar/the-task-tool-claude-codes-agent-orchestration-system-4bf2) — Sub-agent types, execution modes, and resumption patterns
- [Claude Code: Keeping It Running for Hours - motlin.com](https://motlin.com/blog/claude-code-running-for-hours) — Practical implementation of todo-driven autonomous execution and context isolation
- [Context Window Management Strategies - Maxim](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) — Sliding window architectures, hierarchical summarization, and external memory augmentation
