# Caching for Cost Savings

**Topic ID:** enterprise.cost-optimization.caching
**Researched:** 2026-03-01T00:00:00Z

## Overview

Prompt caching is a feature in the Claude API that enables substantial cost reductions and latency improvements for enterprise applications by storing and reusing context across requests. When enabled, the system checks if a prompt prefix (up to a specified cache breakpoint) is already cached from a recent query, and if found, uses the cached version instead of reprocessing the full prompt [1]. This mechanism is particularly valuable for enterprise use cases involving large documents, multi-turn conversations, agentic workflows, and applications with consistent system instructions.

The cost savings are significant: cached content costs only 10% of the base input token price to read, representing a 90% discount on repeated context [1][2]. For example, with Claude Opus 4.6 at $5/MTok base input price, cache reads cost just $0.50/MTok [1]. Beyond cost, prompt caching also reduces latency by up to 85% for long prompts, with real-world examples showing 3x speedups from ~4.3 seconds to ~1.5 seconds for 187K-token documents [3].

Enterprise applications benefit most when they have substantial repeated context: customer service bots with lengthy system prompts, coding assistants with codebase summaries, RAG systems with embedded documents, and agentic systems making multiple tool calls. The cache has a 5-minute default TTL (refreshed on each hit), with an optional 1-hour TTL available at 2x the base input price for scenarios where longer persistence is needed [1].

## Key Concepts

- **Cache Control Parameter** — The `cache_control` parameter with `{"type": "ephemeral"}` enables caching. It can be placed at the request top-level (automatic caching) or on individual content blocks (explicit breakpoints) [1].

- **Automatic Caching** — Adding a single `cache_control` field at the request body's top level automatically applies the cache breakpoint to the last cacheable block. The breakpoint moves forward automatically as conversations grow, making this ideal for multi-turn scenarios [1][3].

- **Explicit Cache Breakpoints** — Placing `cache_control` directly on individual content blocks provides fine-grained control over exactly what gets cached, useful when different sections change at different frequencies [1].

- **Cache Hierarchy** — The cache follows the order: `tools` -> `system` -> `messages`. Changes at any level invalidate that level and all subsequent levels [1].

- **TTL (Time to Live)** — Default is 5 minutes, refreshed on each cache hit. A 1-hour TTL is available by specifying `{"type": "ephemeral", "ttl": "1h"}` at 2x the base input price [1].

- **Minimum Token Thresholds** — Claude Opus 4.6/4.5 and Haiku 4.5 require 4,096 tokens minimum; Sonnet 4.6 requires 2,048 tokens; Sonnet 4.5/4 require 1,024 tokens [1]. Prompts below these thresholds will not be cached.

- **Cache Pricing Multipliers** — Cache writes cost 1.25x base input price (5-min TTL) or 2x (1-hour TTL). Cache reads cost 0.1x base input price [1][2].

- **Breakpoint Limits** — Maximum 4 explicit cache breakpoints per request. Automatic caching uses one slot when combined with explicit breakpoints [1].

## Technical Details

### Implementation Syntax

The simplest implementation uses automatic caching at the request level:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},  # Enables automatic caching
    system="You are a helpful assistant...",
    messages=[{"role": "user", "content": "Question here"}]
)
```

For explicit breakpoints on individual blocks [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "System instructions...",
            "cache_control": {"type": "ephemeral"}
        },
        {
            "type": "text",
            "text": "Large document content here...",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "User question"}]
)
```

### Monitoring Cache Performance

The API response includes usage metrics for tracking cache effectiveness [1]:

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 100000,
    "output_tokens": 500
  }
}
```

Total input tokens = `cache_read_input_tokens` + `cache_creation_input_tokens` + `input_tokens` [1].

### Pricing Table (Per Million Tokens)

| Model | Base Input | 5m Cache Write | 1h Cache Write | Cache Read | Output |
|-------|------------|----------------|----------------|------------|--------|
| Opus 4.6/4.5 | $5 | $6.25 | $10 | $0.50 | $25 |
| Sonnet 4.6/4.5 | $3 | $3.75 | $6 | $0.30 | $15 |
| Haiku 4.5 | $1 | $1.25 | $2 | $0.10 | $5 |

Source: [1][2]

### Stacking Discounts

Cache pricing multipliers stack with other modifiers: the 50% Batch API discount applies to long context pricing, and prompt caching multipliers apply on top of that [2]. For example, combining caching (90% input savings) with batch processing (50% discount) can reduce daily costs from $33.75 to $10.88 in typical scenarios [2].

## Common Patterns

### Multi-Turn Conversation Caching

For chatbots and assistants, automatic caching handles growing conversation history efficiently [1][3]:

```python
# Cache breakpoint moves forward automatically
conversation = []
for user_input in user_inputs:
    conversation.append({"role": "user", "content": user_input})
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        cache_control={"type": "ephemeral"},
        system="Long system prompt...",
        messages=conversation
    )
    conversation.append({"role": "assistant", "content": response.content[0].text})
```

After the first turn, approximately 99% of input tokens are read from cache [3].

### RAG with Multiple Independent Sections

When different document sections change at different frequencies, use multiple breakpoints [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[...],  # Cached together with tools
    system=[
        {"type": "text", "text": "Instructions (rarely change)",
         "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": "Documents (change daily)",
         "cache_control": {"type": "ephemeral"}}
    ],
    messages=[...]  # Conversation cached separately
)
```

### Agentic Tool Use

For agents with multiple tool calls per task, cache the tool definitions and context [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[
        {"name": "tool_1", ...},
        {"name": "tool_n", ..., "cache_control": {"type": "ephemeral"}}  # Last tool
    ],
    messages=conversation
)
```

## Gotchas

- **Minimum Token Requirement** — Prompts under the minimum threshold (1,024-4,096 tokens depending on model) will NOT be cached, even with `cache_control` set. The request succeeds but no caching occurs [1][3].

- **Cache Invalidation Triggers** — Changing tool definitions, enabling/disabling web search or citations, modifying tool_choice, adding/removing images, or changing thinking parameters will invalidate the cache [1]. The cache hierarchy means changes to tools invalidate system and message caches too.

- **TTL Confusion** — The 5-minute TTL refreshes on each cache HIT, not continuously. If no requests hit the cache within 5 minutes, it expires [1].

- **1-Hour TTL Cost** — The extended 1-hour cache costs 2x base input (vs 1.25x for 5-minute), making it more expensive for initial writes. Only beneficial when cache hits extend beyond 5 minutes between requests [1].

- **Workspace Isolation Change** — Starting February 5, 2026, caches will be workspace-isolated instead of organization-isolated on the Claude API and Azure AI Foundry. Requests from different workspaces will not share caches [1].

- **Automatic vs Explicit TTL Conflicts** — If the last block has an explicit `cache_control` with a different TTL than automatic caching specifies, the API returns a 400 error [1].

- **20-Block Lookback Limit** — The system only checks up to 20 blocks before each explicit `cache_control` breakpoint. For prompts with more than 20 content blocks, place additional breakpoints to ensure all content can be cached [1].

- **Concurrent Request Timing** — A cache entry only becomes available after the first response begins. For parallel requests, wait for the first response before sending subsequent requests to ensure cache hits [1].

- **Tool Key Ordering** — Some languages (Swift, Go) randomize key order during JSON conversion, breaking cache matches. Ensure consistent key ordering in `tool_use` content blocks [1].

- **Extended Thinking Interactions** — Cached thinking blocks are stripped when non-tool-result user content is added, invalidating the cache for previous thinking blocks [1].

## Sources

[1] **Prompt caching - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical specification including cache_control syntax, automatic vs explicit caching, pricing multipliers (1.25x write, 0.1x read), TTL options (5-min default, 1-hour at 2x), minimum token thresholds per model, cache hierarchy and invalidation rules, monitoring fields (cache_creation_input_tokens, cache_read_input_tokens), 20-block lookback limit, workspace isolation changes, and comprehensive code examples for all patterns.

[2] **Pricing - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/pricing
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete pricing table for all Claude models including base input/output, cache write/read costs for both TTL options, confirmation that batch API and caching discounts stack, and long context pricing interactions.

[3] **Prompt caching through the Claude API (Cookbook)**
    URL: https://platform.claude.com/cookbook/misc-prompt-caching
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Practical implementation patterns with automatic caching, multi-turn conversation examples, real-world performance metrics (3.3x speedup, 99% cache hit rates after first turn), common mistakes to avoid, and comparison of automatic vs explicit caching approaches.
