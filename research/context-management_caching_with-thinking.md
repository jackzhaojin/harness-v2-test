# Caching with Extended Thinking

**Topic ID:** context-management.caching.with-thinking
**Researched:** 2026-03-01T12:00:00Z

## Overview

Prompt caching with extended thinking in the Claude API presents unique challenges and behaviors that developers must understand to optimize costs and maintain reasoning continuity. When Claude uses extended thinking (either manual or adaptive mode), the internal reasoning process generates thinking blocks that interact with the caching system in specific ways that differ from standard text content.

The core complexity stems from a fundamental tension: thinking blocks must be preserved during tool use loops to maintain reasoning continuity, yet they cannot be explicitly marked with `cache_control` breakpoints. Despite this limitation, thinking blocks are automatically cached as part of the request content when subsequent API calls include tool results. This implicit caching behavior means developers are billed for thinking block input tokens when they're read from cache, creating cost implications that aren't immediately obvious.

Starting with Claude Opus 4.5 (and continuing in Opus 4.6), thinking block preservation behavior changed significantly. Previous models stripped thinking blocks from prior assistant turns, but newer models preserve them in context by default. This enables better cache hit rates in multi-step agentic workflows but consumes more context window space in long conversations.

## Key Concepts

- **Thinking block preservation**: Thinking blocks must be passed back unmodified to the API when continuing conversations with tool use. The entire sequence of consecutive thinking blocks must match the original model output exactly—you cannot rearrange or modify them.

- **Implicit caching**: While thinking blocks cannot have explicit `cache_control` markers, they get cached automatically as part of request content when you make subsequent API calls with tool results. This happens transparently even without explicit cache breakpoints.

- **Cache invalidation on mode change**: Switching between thinking modes (`adaptive`, `enabled`, or `disabled`) invalidates message cache breakpoints. System prompts and tool definitions remain cached, but all message content must be reprocessed.

- **Budget change invalidation**: Changes to the thinking budget (`budget_tokens`) also invalidate previously cached message prefixes, even if thinking remains enabled.

- **Interleaved thinking**: Claude 4 models support thinking between tool calls, which amplifies cache invalidation effects since thinking blocks can occur between multiple tool calls within a single assistant turn.

- **Tool result exemption**: Cache remains valid when only tool results are provided as user messages. Cache gets invalidated when non-tool-result user content is added, causing all previous thinking blocks to be stripped.

- **Model-specific preservation**: Claude Opus 4.5+ preserves thinking blocks from previous turns by default. Earlier models (Sonnet 4.5, Opus 4.1, etc.) continue to strip thinking blocks from prior turns.

- **1-hour cache TTL**: Extended thinking tasks often exceed the default 5-minute cache lifetime. The 1-hour cache option (`"ttl": "1h"`) helps maintain cache hits across longer thinking sessions at 2x the base input token price.

## Technical Details

### Cache Hierarchy and Thinking Parameters

The cache follows a strict hierarchy: `tools` → `system` → `messages`. Thinking parameter changes only invalidate the messages level, leaving tools and system prompts cached:

```json
{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  }
}
```

Changing `budget_tokens` from 10000 to 8000 will invalidate message caches but preserve tool and system prompt caches.

### Token Counting with Cached Thinking Blocks

When thinking blocks are read from cache, they count as input tokens in usage metrics:

```json
{
  "usage": {
    "cache_creation_input_tokens": 1370,
    "cache_read_input_tokens": 0,
    "input_tokens": 17,
    "output_tokens": 700
  }
}
```

On cache hit:
```json
{
  "usage": {
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 1370,
    "input_tokens": 303,
    "output_tokens": 874
  }
}
```

### Adaptive vs Manual Thinking Caching Behavior

Consecutive requests using the same thinking mode preserve cache breakpoints:

| Mode Transition | Cache Effect |
|-----------------|--------------|
| `adaptive` → `adaptive` | Cache preserved |
| `enabled` → `enabled` (same budget) | Cache preserved |
| `enabled` → `enabled` (different budget) | Messages invalidated |
| `adaptive` → `enabled` | Messages invalidated |
| `adaptive` → disabled | Messages invalidated |

### Thinking Block Structure Requirements

When passing thinking blocks back, include the complete unmodified content:

```python
# Extract and preserve all thinking blocks
thinking_block = next(
    (block for block in response.content if block.type == "thinking"), None
)
tool_use_block = next(
    (block for block in response.content if block.type == "tool_use"), None
)

# Pass both back unmodified
continuation = client.messages.create(
    model="claude-sonnet-4-6",
    thinking={"type": "enabled", "budget_tokens": 10000},
    tools=[weather_tool],
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"},
        {"role": "assistant", "content": [thinking_block, tool_use_block]},
        {"role": "user", "content": [{"type": "tool_result", ...}]},
    ],
)
```

## Common Patterns

### Pattern 1: Long-Running Agentic Workflows

Use 1-hour cache TTL for agentic workflows that may pause between tool calls:

```json
{
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  }
}
```

### Pattern 2: Multi-Turn with Thinking Preservation (Opus 4.5+)

For Claude Opus 4.5 and later, thinking blocks are preserved by default, enabling incremental caching across assistant turns:

```python
# Request 1: Initial query
response1 = client.messages.create(
    model="claude-opus-4-5",
    thinking={"type": "enabled", "budget_tokens": 4000},
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": "Analyze this text..."}],
)

# Request 2: Follow-up with cache hit on previous content
response2 = client.messages.create(
    model="claude-opus-4-5",
    thinking={"type": "enabled", "budget_tokens": 4000},  # Same budget
    system=SYSTEM_PROMPT,
    messages=[
        {"role": "user", "content": "Analyze this text..."},
        {"role": "assistant", "content": response1.content},
        {"role": "user", "content": "Now focus on the characters."},
    ],
)
```

### Pattern 3: Stable System Prompts with Variable Thinking

Cache system prompts separately since they remain cached when thinking parameters change:

```python
system=[
    {
        "type": "text",
        "text": "You are an AI assistant...",
        "cache_control": {"type": "ephemeral"},  # Survives budget changes
    }
]
```

## Gotchas

- **Thinking blocks cannot have explicit cache_control**: You cannot place `cache_control` directly on thinking blocks. They're excluded from being cache breakpoints, but still get cached implicitly as part of preceding content.

- **Billed tokens differ from visible tokens**: With summarized thinking (Claude 4 models), you're billed for the full thinking tokens generated, not the summarized output you see. The `output_tokens` in usage reflects the actual cost, not the visible response length.

- **Mode switching is expensive**: Toggling between thinking modes mid-conversation invalidates message caches. Plan your thinking strategy at the start of conversations rather than switching dynamically.

- **Tool use loops are single turns**: The entire tool use sequence (thinking → tool_use → tool_result → response) is conceptually one assistant turn. You cannot toggle thinking mode mid-loop.

- **Non-tool user content strips thinking**: Adding regular user messages (not tool results) causes all previous thinking blocks to be stripped from context for older models, invalidating caches.

- **Context window surprise**: While thinking blocks from previous turns are stripped for context calculations, thinking blocks in the current tool use loop DO count toward context. This can cause unexpected context overflow in complex agentic workflows.

- **Signature field is required**: The encrypted `signature` field in thinking blocks must be preserved when passing blocks back. Modifying or removing it breaks verification.

- **5-minute default may be too short**: Extended thinking tasks often exceed 5 minutes. If you're seeing frequent cache misses, consider the 1-hour TTL option despite its 2x cost multiplier.

## Sources

- [Building with extended thinking - Claude API Docs](https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking) — Primary documentation on extended thinking behavior, caching interactions, thinking block preservation, and tool use patterns
- [Prompt caching - Claude API Docs](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching) — Comprehensive guide to prompt caching mechanics, cache invalidation rules, pricing, and thinking block caching behavior
- [Adaptive thinking - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — Documentation on adaptive thinking mode and its caching behavior relative to manual extended thinking
