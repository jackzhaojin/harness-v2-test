# Adaptive Thinking and Effort Parameter

**Topic ID:** agents.thinking.adaptive-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Adaptive thinking is Anthropic's recommended approach for controlling Claude's extended reasoning capabilities in Claude Opus 4.6 and Sonnet 4.6. Rather than manually specifying a fixed token budget for thinking, adaptive thinking allows Claude to dynamically determine when and how much internal reasoning to apply based on each request's complexity. This represents a significant shift from the earlier `budget_tokens` approach, which required developers to predict appropriate reasoning allocation upfront.

The effort parameter works alongside adaptive thinking to provide high-level control over Claude's token expenditure. With four levels—`low`, `medium`, `high`, and `max`—developers can tune the tradeoff between response quality and cost/latency without micromanaging token budgets. This system is particularly effective for agentic workflows and tool-heavy applications where reasoning requirements vary dramatically across different steps.

Adaptive thinking automatically enables interleaved thinking, meaning Claude can reason between tool calls rather than only at the start of an assistant turn. This makes it especially powerful for multi-step agents that need to process tool results and adjust strategy mid-execution.

## Key Concepts

- **Adaptive thinking mode**: Set via `thinking: {type: "adaptive"}` in API calls. Claude evaluates each request's complexity and allocates thinking tokens accordingly. No manual budget specification required.

- **Effort parameter**: A behavioral signal (`low`, `medium`, `high`, `max`) that guides Claude's token spending across text responses, tool calls, and thinking. Set via `output_config: {effort: "medium"}`.

- **Interleaved thinking**: Automatically enabled with adaptive thinking. Allows Claude to reason after receiving tool results, not just at the start of a turn. Critical for sophisticated agent behavior.

- **Summarized thinking**: Claude 4 models return a summary of the full thinking process rather than raw thinking tokens. You're billed for full thinking tokens, not the summary you see in responses.

- **Thinking blocks**: Content blocks of type `thinking` returned in API responses. Include a `signature` field for verification and must be passed back unmodified during tool use loops.

- **Budget_tokens deprecation**: The manual `thinking: {type: "enabled", budget_tokens: N}` approach is deprecated on Opus 4.6 and Sonnet 4.6. It still works but will be removed in a future release.

- **Model support**: Adaptive thinking works on Claude Opus 4.6 and Sonnet 4.6 only. Older models require manual `budget_tokens` configuration.

## Technical Details

### API Configuration

Enable adaptive thinking with the effort parameter:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "medium"},
    messages=[
        {"role": "user", "content": "Analyze this codebase for security vulnerabilities."}
    ],
)

for block in response.content:
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### Effort Level Behaviors

| Level | Thinking Behavior | Typical Use Case |
|-------|-------------------|------------------|
| `max` | Always thinks, no constraints. Opus 4.6 only. | Deepest reasoning, thorough analysis |
| `high` | Always thinks (default behavior) | Complex reasoning, difficult coding |
| `medium` | Moderate thinking, may skip for simple queries | Agentic coding, tool-heavy workflows |
| `low` | Minimal thinking, skips for simple tasks | High-volume, latency-sensitive tasks |

### Effort Effects on Tool Use

Lower effort levels cause Claude to:
- Combine operations into fewer tool calls
- Proceed directly without preamble
- Use terse confirmation messages

Higher effort levels cause Claude to:
- Make more tool calls for thoroughness
- Explain plans before execution
- Provide detailed summaries

### Streaming with Adaptive Thinking

```python
with client.messages.stream(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    messages=[{"role": "user", "content": "Solve this math problem..."}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(event.delta.thinking, end="", flush=True)
            elif event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
```

### Claude Code Trigger Words

In Claude Code CLI, natural language triggers map to effort levels:

- **"think"** → Small reasoning boost
- **"think hard"** → Medium-depth analysis
- **"think harder"** → Extended thinking
- **"ultrathink"** → Maximum reasoning depth (maps to `max` effort)

Usage: "Ultrathink this authentication bug" naturally in prompts.

## Common Patterns

### Agentic Workflow with Adaptive Thinking

For agents that make multiple tool calls, adaptive thinking with medium effort provides the best balance:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "medium"},
    tools=[search_tool, calculator_tool, file_tool],
    messages=[{"role": "user", "content": "Research and summarize..."}],
)
```

### Dynamic Effort Based on Task Complexity

Adjust effort programmatically based on task type:

```python
def get_effort_for_task(task_type):
    if task_type in ["debug", "architecture", "security"]:
        return "high"
    elif task_type in ["code_generation", "refactor"]:
        return "medium"
    else:
        return "low"
```

### Preserving Thinking in Multi-Turn Tool Use

During tool use loops, pass back thinking blocks unmodified:

```python
# After receiving tool_use block, include thinking when continuing
continuation = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_id, "content": "72°F"}]},
    ],
)
```

### Prompt-Based Thinking Tuning

Add guidance in system prompts to influence when Claude thinks:

```text
Extended thinking adds latency and should only be used when it
will meaningfully improve answer quality — typically for problems
that require multi-step reasoning. When in doubt, respond directly.
```

## Gotchas

- **Max effort is Opus 4.6 only**: Using `effort: "max"` on other models returns an error. It does not fall back gracefully.

- **Billing mismatch**: You're billed for full thinking tokens, not summarized output. The token count you see in responses won't match your bill. Monitor the `usage` object in API responses.

- **Switching thinking modes breaks cache**: Changing between `adaptive` and `enabled`/`disabled` modes invalidates message cache breakpoints. System prompts and tool definitions remain cached.

- **Can't toggle mid-turn**: You cannot switch thinking modes during a tool use loop. The entire assistant turn must use the same thinking configuration. If you try, thinking is silently disabled.

- **Interleaved thinking requires adaptive mode on Opus 4.6**: Unlike Sonnet 4.6 which supports both the beta header and adaptive mode for interleaved thinking, Opus 4.6 only supports interleaved thinking via adaptive mode.

- **MAX_THINKING_TOKENS ignored on 4.6 models**: In Claude Code, the environment variable `MAX_THINKING_TOKENS` has no effect on Opus 4.6 and Sonnet 4.6 since they use adaptive reasoning. Exception: setting it to `0` still disables thinking.

- **Validation flexibility**: Unlike manual mode, adaptive thinking doesn't require assistant turns to start with thinking blocks. This is more permissive but may cause confusion when mixing modes.

- **Effort is a signal, not a guarantee**: Lower effort levels still trigger thinking on sufficiently hard problems—just less thinking than higher levels would use for the same problem.

- **Sonnet 4.6 recommendation**: Anthropic recommends explicitly setting effort to `medium` for most Sonnet 4.6 workloads rather than relying on the `high` default, to balance speed, cost, and performance.

## Sources

- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Primary documentation on adaptive thinking configuration, streaming, and comparison with manual mode
- [Effort - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/effort) — Complete reference for effort parameter levels, behaviors, and integration with thinking
- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — Deep dive on thinking mechanics, tool use integration, caching, and migration from budget_tokens
- [How to make Claude Code think harder | @kentgigger](https://kentgigger.com/posts/claude-code-thinking-triggers) — Practical guide to thinking trigger words in Claude Code CLI
