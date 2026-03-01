# Extended Thinking Basics

**Topic ID:** agents.thinking.extended-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Extended thinking is Anthropic's feature that gives Claude enhanced reasoning capabilities by allowing the model to perform step-by-step internal reasoning before generating its final response. When enabled, Claude creates `thinking` content blocks containing its reasoning process, then incorporates insights from that reasoning into the final `text` response. This mirrors how humans approach complex problems—working through sub-steps, exploring alternatives, and verifying conclusions before committing to an answer.

The feature is controlled via the `thinking` parameter in API requests, with `budget_tokens` specifying how much reasoning the model can perform. Extended thinking is particularly valuable for tasks requiring multi-step reasoning: mathematical proofs, complex coding problems, analytical comparisons, and strategic planning. However, it's not universally beneficial—research shows it can actually hurt performance by up to 36% on intuitive tasks where "overthinking" is counterproductive, similar to how humans perform worse when deliberating too hard on pattern-matching or simple lookups.

Starting with Claude 4 models, the API returns *summarized* thinking rather than full reasoning output (Claude 3.7 Sonnet still returns full thinking). This summarization preserves the intelligence benefits while preventing misuse, though you're billed for the full thinking tokens generated, not the summary you see in the response.

## Key Concepts

- **`thinking` parameter**: The top-level API parameter that enables extended thinking. Set `type: "enabled"` with a `budget_tokens` value, or use `type: "adaptive"` for Claude Opus 4.6+.

- **`budget_tokens`**: Maximum tokens Claude can use for internal reasoning. Minimum is 1,024 tokens. Must be less than `max_tokens` (except with interleaved thinking). Claude may not use the full budget, especially above 32K tokens.

- **Thinking blocks**: Content blocks with `type: "thinking"` in the response containing Claude's reasoning. Include a `signature` field for verification when passing back to the API.

- **Summarized thinking**: Claude 4 models return condensed versions of reasoning. The first few lines are more verbose for prompt engineering. You're billed for full tokens, not the summary.

- **Interleaved thinking**: Beta feature (header: `interleaved-thinking-2025-05-14`) allowing Claude to reason between tool calls. Automatic in Claude Opus 4.6 with adaptive thinking.

- **Redacted thinking**: Encrypted thinking blocks (`type: "redacted_thinking"`) when safety systems flag content. Must be passed back unmodified; Claude can still use them.

- **Adaptive thinking**: Recommended for Claude Opus 4.6+. Uses `type: "adaptive"` instead of manual budgets, letting Claude dynamically determine reasoning depth. Manual `budget_tokens` is deprecated on Opus 4.6.

- **Signature field**: Encrypted verification data attached to thinking blocks. Required when passing thinking back to the API during tool use loops.

## Technical Details

### Enabling Extended Thinking

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[
        {"role": "user", "content": "Prove there are infinitely many primes p where p mod 4 = 3"}
    ],
)

for block in response.content:
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### Response Structure

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...",
      "signature": "WaUjzkypQ2mUEVM36O2TxuC06KN8xyfbJwyem2dw3URve..."
    },
    {
      "type": "text",
      "text": "Based on my analysis..."
    }
  ]
}
```

### Streaming Extended Thinking

Streaming uses `thinking_delta` events for reasoning content:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": "What is GCD(1071, 462)?"}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(event.delta.thinking, end="", flush=True)
            elif event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
```

**Streaming requirement**: When `max_tokens` > 21,333, streaming is required to avoid HTTP timeouts.

### Tool Use with Thinking

When using tools with extended thinking, thinking blocks must be preserved and passed back:

```python
# After receiving tool_use response with thinking
thinking_block = next(b for b in response.content if b.type == "thinking")
tool_use_block = next(b for b in response.content if b.type == "tool_use")

# Continue conversation - MUST include thinking_block
continuation = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},  # Include both!
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_use_block.id, "content": "20°C, sunny"}]},
    ],
)
```

### Supported Models

| Model | Extended Thinking | Notes |
|-------|-------------------|-------|
| Claude Opus 4.6 | Adaptive only | Manual `budget_tokens` deprecated |
| Claude Sonnet 4.6 | Both manual + adaptive | Supports interleaved thinking beta |
| Claude Opus 4/4.1/4.5 | Manual | Interleaved with beta header |
| Claude Sonnet 4/4.5 | Manual | Interleaved with beta header |
| Claude Haiku 4.5 | Manual | Summarized thinking |
| Claude Sonnet 3.7 | Manual | Returns **full** thinking (not summarized) |

## Common Patterns

### Budget Sizing Strategy

Start with the 1,024 token minimum and scale up based on task complexity:
- **Simple reasoning** (basic math, straightforward analysis): 1,024–4,000 tokens
- **Moderate complexity** (multi-step problems, code review): 8,000–16,000 tokens
- **Complex tasks** (proofs, architecture design): 16,000–32,000 tokens
- **Very complex** (>32K): Use batch processing to avoid timeouts

### Enabling Interleaved Thinking (Claude 4 models)

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: interleaved-thinking-2025-05-14" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 16000,
    "thinking": {"type": "enabled", "budget_tokens": 10000},
    "tools": [...],
    "messages": [...]
  }'
```

### Using Adaptive Thinking (Claude Opus 4.6)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},  # No budget_tokens needed
    messages=[{"role": "user", "content": "Complex analysis task..."}],
)
```

### Amazon Bedrock Configuration

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 10000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 4000
  },
  "messages": [...]
}
```

## Gotchas

- **Token billing mismatch**: You're billed for *full* thinking tokens, not the summarized output. The `usage` field shows the real cost, which won't match visible token counts.

- **`budget_tokens` < `max_tokens` required**: The budget must be less than max_tokens, except when using interleaved thinking with tools (where budget can use the full 200K context).

- **Cannot pre-fill responses**: Assistant pre-fill is incompatible with extended thinking. Attempting it causes errors.

- **Tool choice restrictions**: Only `tool_choice: "auto"` (default) or `"none"` work. Using `"any"` or specific tool names errors because forced tool use conflicts with thinking.

- **No mid-turn thinking toggle**: You cannot enable/disable thinking during a tool use loop. The entire assistant turn must use one mode. If you try to toggle, thinking silently disables.

- **Thinking blocks must be preserved in tool loops**: Omitting thinking blocks when continuing with tool results breaks reasoning continuity. Always pass complete, unmodified blocks back.

- **Context window strict enforcement**: Claude 3.7+ enforces `prompt_tokens + max_tokens ≤ context_window` strictly. Older models auto-adjusted; newer ones return validation errors.

- **32K+ budgets need batch processing**: Large thinking budgets cause long-running requests that hit HTTP timeouts. Use batch API for heavy reasoning.

- **Cache invalidation**: Changing `budget_tokens` invalidates message cache breakpoints (system prompts/tools stay cached).

- **"Think" prompt sensitivity**: When thinking is *disabled*, Claude Opus 4.5 is sensitive to "think" and variants. Use "consider," "evaluate," or "reason through" instead.

- **Extended thinking isn't always better**: Simple questions, creative writing, quick lookups, and pattern matching often perform *worse* with extended thinking—up to 36% degradation on some intuitive tasks.

- **Signature field is opaque**: Never parse or modify the `signature` field—it's only for API verification.

## Sources

- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — Primary source for API parameters, code examples, streaming, tool use integration, caching behavior, and thinking encryption
- [Extended thinking - Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-extended-thinking.html) — Bedrock-specific configuration, model IDs, and platform differences
- [Extended thinking tips - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/extended-thinking-tips) — Best practices for prompting and when to use/avoid extended thinking
- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Documentation on adaptive thinking for Claude 4.6 models
