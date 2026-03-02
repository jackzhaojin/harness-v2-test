# Long-Running Agents

**Topic ID:** agents.agent-loops.long-running
**Researched:** 2026-03-01T14:32:00Z

## Overview

Long-running agents are AI systems designed to operate across multiple sessions or context windows, maintaining continuity and making incremental progress toward complex goals. Unlike single-shot interactions, these agents face unique challenges: context windows fill up, sessions terminate, processes crash, and the agent must resume work without losing progress or duplicating effort [1][2].

The core problem is that LLMs are fundamentally stateless. Every interaction starts fresh, bounded by static knowledge in the model's weights [3]. For long-running agents, this means architectural solutions are required to provide session continuity, state persistence, and recovery mechanisms. Anthropic's research demonstrates that even frontier models like Claude Opus running in a loop across multiple context windows will fail to build production-quality applications without proper harness design [1].

The solution involves two complementary strategies: within-session management through automatic context compaction, and cross-session coordination through structured handoff artifacts like progress files and git commits [1][5]. Production deployments increasingly combine these with checkpointing systems that enable pause, resume, and even "time travel" debugging capabilities [2][6].

## Key Concepts

- **Context Window** — The working memory available to the model during a single interaction. Claude's context window is approximately 200K tokens, but accuracy and recall degrade as token count grows, a phenomenon known as "context rot" [5].

- **Automatic Compaction** — Server-side or SDK-managed summarization that condenses earlier conversation parts when token usage exceeds a threshold, enabling continued work beyond context limits [5][7]. When triggered, the SDK injects a summary prompt, Claude generates a structured summary, and the history is replaced with this compressed form.

- **Two-Agent Pattern** — Anthropic's recommended architecture using an Initializer Agent for first-session setup and a Coding Agent for subsequent incremental work [1]. The initializer creates the scaffolding; the coding agent reads state and makes bounded progress.

- **Progress File (claude-progress.txt)** — A structured log of what previous agent sessions accomplished, enabling new sessions to quickly understand project state without parsing the entire codebase [1]. Serves as "institutional memory" between sessions.

- **Checkpointing** — Saving agent state at specific points to enable recovery, rollback, or branching. Captures file state, conversation context, and execution position [2][6]. Frameworks like LangGraph and Microsoft Agent Framework provide built-in checkpointing.

- **Memory-Augmented Agents** — Agents enhanced with short-term memory (recent session context) and long-term memory (historical insights from vector databases and key-value stores) for cross-session personalization and strategic reasoning [4].

- **Superstep** — In workflow frameworks, a unit of execution after which checkpoints are created. All executors in the superstep complete before state is captured, ensuring consistency [6].

- **Stateless vs. Stateful Recovery** — Stateless recovery re-launches processes and loads serialized state from files (simpler, more portable). Stateful recovery captures exact execution context for true pause-and-resume (minimal recomputation, but environment-dependent) [2].

## Technical Details

### Context Compaction Configuration

The Claude Agent SDK provides automatic compaction with configurable thresholds [7]:

```python
runner = client.beta.messages.tool_runner(
    model="claude-opus-4-6",
    max_tokens=4096,
    tools=tools,
    messages=messages,
    compaction_control={
        "enabled": True,
        "context_token_threshold": 100000,  # Default: 100k tokens
        "model": "claude-haiku-4-5",         # Optional: use cheaper model
        "summary_prompt": CUSTOM_PROMPT,     # Optional: domain-specific
    },
)
```

Threshold guidelines from Anthropic [7]:
- **Low (5k-20k)**: Iterative task processing with clear boundaries
- **Medium (50k-100k)**: Multi-phase workflows with fewer checkpoints
- **High (100k-150k)**: Tasks requiring substantial historical context

For subagents, auto-compaction triggers at approximately 95% capacity by default. Set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` to a lower percentage (e.g., 50) for earlier triggering [5].

### Session Handoff Architecture

The recommended startup sequence for each agent session [1]:

1. Run `pwd` to confirm working directory
2. Read git logs and `claude-progress.txt` to understand recent work
3. Run the development server and verify the app works (catch bugs immediately)
4. Read the features list and select the highest-priority incomplete feature
5. Implement ONE feature per session (prevents context exhaustion)
6. Update progress file and commit with descriptive message

### Feature List Structure

Use JSON format for feature tracking (Markdown is harder to parse reliably) [1]:

```json
{
  "category": "functional",
  "description": "New chat button creates a fresh conversation",
  "steps": [
    "Navigate to main interface",
    "Click the 'New Chat' button",
    "Verify a new conversation is created",
    "Check that chat area shows welcome state"
  ],
  "passes": false
}
```

### Checkpointing in Microsoft Agent Framework

Checkpoints capture complete workflow state after each superstep [6]:

```python
from agent_framework import (
    InMemoryCheckpointStorage,
    WorkflowBuilder,
)

checkpoint_storage = InMemoryCheckpointStorage()
builder = WorkflowBuilder(
    start_executor=start_executor,
    checkpoint_storage=checkpoint_storage
)
workflow = builder.build()

# Run workflow
async for event in workflow.run_streaming(input):
    pass

# Resume from checkpoint
saved_checkpoint = checkpoints[5]
async for event in workflow.run_stream(
    checkpoint_id=saved_checkpoint.checkpoint_id
):
    pass
```

State captured includes: current executor states, pending messages for next superstep, pending requests/responses, and shared states [6].

## Common Patterns

### Multi-Session Incremental Development

The pattern used to build a 100,000-line C compiler across nearly 2,000 Claude sessions [1]:

1. **First session (Initializer)**: Create `init.sh` (development server startup), `claude-progress.txt` (empty), initial git commit
2. **Each subsequent session**: Read state, verify app works, implement one feature, update progress, commit
3. **Coordination**: Agents take "locks" by writing text files, work, merge changes from other agents, push, remove lock

### Memory-Augmented Agent Workflow

Six-step process for agents with persistent memory [4]:

1. Receive input or event
2. Retrieve short-term memory (recent conversation, session context)
3. Retrieve long-term memory (vector DB queries for historical insights)
4. Inject memory context into LLM prompt
5. Generate contextually-aware output
6. Update memory with new goals, outcomes, and structured responses

### Hybrid State Recovery

Combine both approaches for robustness [2]:

- **Stateful snapshots**: For immediate resilience and fast recovery within same environment
- **Stateless checkpoints**: For cross-version persistence and environment portability
- Checkpoint at semantically meaningful points (task completion, not arbitrary intervals)
- Exclude unchanging data (model weights on disk) from snapshots

### Custom Summary Prompt for Domain-Specific Compaction

Preserve critical information during compaction [7]:

```python
SUMMARY_PROMPT = """You are processing customer support tickets.

Create a focused summary preserving:

1. **COMPLETED TICKETS**: Ticket ID, category, priority, team, outcome
2. **PROGRESS STATUS**: Completed count, remaining count
3. **NEXT STEPS**: What to do next

Wrap in <summary></summary> tags."""
```

## Gotchas

- **Premature victory declaration**: Agents tend to mark features complete without proper testing. Solution: Mandate browser automation (Puppeteer) for end-to-end verification "as a human user would" [1].

- **Context exhaustion mid-implementation**: Attempting too much in one session leaves features half-implemented. Solution: Limit agents to ONE feature per session [1].

- **Compaction information loss**: Standard compaction can lose critical details. Use custom summary prompts to preserve domain-specific information, or use PreCompact hooks to save data before each compaction [5][7].

- **Context poisoning**: If a bad fact enters a compaction summary, it can poison future agent behavior. There is no easy fix except careful summary prompt design [3].

- **Compaction with server-side sampling loops**: Not optimal because cache tokens can trigger premature compaction [7].

- **Checkpoint accumulation**: Checkpoints accumulate over time. Implement retention policies: time-based (keep last 24 hours), count-based (keep last N), or milestone-based (keep named checkpoints) [2].

- **Git merge conflicts in multi-agent teams**: Frequent when multiple agents work in parallel. Claude can usually resolve them, but the coordination mechanism (lock files, push/pull cycles) adds overhead [1].

- **Interrupt rate paradox**: Experienced users actually interrupt agents more often (9% of turns) than new users (5%), suggesting increased comfort with intervention rather than decreased need [1].

- **Session boundary bugs**: Previous sessions may leave the app in a broken state. Always verify the app works at session start before implementing new features [1].

## Sources

[1] **Effective harnesses for long-running agents**
    URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Two-agent pattern (initializer + coding agent), claude-progress.txt usage, session handoff best practices, failure patterns and solutions, feature list JSON structure, C compiler stress test details, multi-agent coordination with lock files.

[2] **Checkpoint/Restore Systems: Evolution, Techniques, and Applications in AI Agents**
    URL: https://eunomia.dev/blog/2025/05/11/checkpointrestore-systems-evolution-techniques-and-applications-in-ai-agents/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Five architectural layers of checkpointing (OS, container, VM, application, library), state capture mechanisms for memory/GPU/I/O, stateless vs stateful recovery patterns, best practices for checkpoint scheduling and retention.

[3] **Memory and State in LLM Applications**
    URL: https://arize.com/blog/memory-and-state-in-llm-applications/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Core problem of LLM statelessness, layered memory architecture (working, short-term, long-term), context poisoning risk, sliding window with summarization pattern.

[4] **Memory-augmented agents - AWS Prescriptive Guidance**
    URL: https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/memory-augmented-agents.html
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Short-term vs long-term memory storage mechanisms, six-step agent workflow with memory injection, memory-injected prompting strategy, AWS service mappings (DynamoDB, S3, OpenSearch).

[5] **Context windows - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/context-windows
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Context window definition, context rot phenomenon, subagent compaction behavior, CLAUDE_AUTOCOMPACT_PCT_OVERRIDE setting, structured prompts having better compaction fidelity (92% vs 71%).

[6] **Microsoft Agent Framework: Checkpointing and Resuming Workflows**
    URL: https://learn.microsoft.com/en-us/agent-framework/tutorials/workflows/checkpointing-and-resuming
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Superstep-based checkpoint creation, what state is captured, CheckpointManager usage, code examples for capturing and resuming checkpoints in Python and C#, executor state save/restore methods.

[7] **Automatic context compaction - Claude Cookbook**
    URL: https://platform.claude.com/cookbook/tool-use-automatic-context-compaction
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Compaction configuration options (threshold, model, custom prompt), token savings metrics (58.6% reduction example), threshold guidelines, what gets preserved vs lost, custom summary prompt patterns, when to use and avoid compaction.
