# Cache Implementation

**Topic ID:** context-management.prompt-caching.implementation
**Researched:** 2026-03-01T00:00:00Z

## Overview

Prompt caching is a performance optimization feature in the Claude API that allows developers to cache and reuse portions of their prompts across multiple requests. When enabled, the system stores KV cache representations of prompt prefixes, enabling subsequent requests with identical prefixes to skip reprocessing and instead read from cache [1]. This dramatically reduces both latency (up to 85% faster time-to-first-token) and costs (90% discount on cached tokens) for applications that repeatedly send similar context [1][3].

The feature supports two implementation approaches: automatic caching, which requires just a single `cache_control` field at the request level, and explicit cache breakpoints, which provide fine-grained control over exactly what gets cached [1]. Cache entries have a configurable time-to-live (TTL) of either 5 minutes (default) or 1 hour (at additional cost), with the cache automatically refreshing each time it is accessed [1]. This makes caching particularly valuable for long multi-turn conversations, large document processing, agentic tool use workflows, and any application involving repetitive system prompts or instructions.

## Key Concepts

- **Cache Control Parameter** — The `cache_control: {"type": "ephemeral"}` parameter enables caching. It can be placed at the request level for automatic caching or on individual content blocks for explicit breakpoints [1].

- **TTL (Time-to-Live)** — Cache entries persist for 5 minutes by default. The 1-hour extended TTL is available at 2x base input price by specifying `"ttl": "1h"` in the cache_control object [1][2].

- **Cache Prefix** — The system caches all content up to and including the last block marked with `cache_control`. The prefix follows the order: tools, system, then messages [1].

- **Cache Hit** — When a request's prefix exactly matches cached content, tokens are read from cache at 10% of base input price rather than being reprocessed [1][3].

- **Cache Write** — First-time caching of new content costs 1.25x base input price for 5-minute TTL or 2x for 1-hour TTL [1][2].

- **Minimum Cacheable Length** — Different models have different minimums: 1,024 tokens for Sonnet 4/4.5, 2,048 for Sonnet 4.6, and 4,096 for Opus 4.5/4.6 and Haiku 4.5 [1].

- **Exact Matching** — Cache hits require 100% identical content including whitespace. Even minor changes invalidate the cache [1][3].

- **Breakpoint Limits** — Up to 4 explicit cache breakpoints per request. Automatic caching uses one of these slots [1].

## Technical Details

### Automatic Caching Implementation

The simplest approach adds `cache_control` at the request level. The system automatically places the cache breakpoint on the last cacheable block:

```python
# Python SDK - Automatic caching [2]
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},  # Single line enables caching
    system="You are a helpful assistant analyzing legal documents.",
    messages=[
        {"role": "user", "content": "Analyze this contract: [large document]"}
    ]
)
```

For multi-turn conversations, the cache breakpoint moves forward automatically with each turn [1][2]:

```python
# Multi-turn with automatic caching [2]
conversation = []

for question in questions:
    conversation.append({"role": "user", "content": question})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        cache_control={"type": "ephemeral"},
        system=system_message,
        messages=conversation
    )

    conversation.append({"role": "assistant", "content": response.content[0].text})
```

### Explicit Cache Breakpoints

For fine-grained control, place `cache_control` on specific content blocks [1]:

```python
# Explicit breakpoints - caching system prompt and large context separately [1]
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are an AI assistant for legal analysis.",
            "cache_control": {"type": "ephemeral"}  # Breakpoint 1
        },
        {
            "type": "text",
            "text": "[50-page legal document text]",
            "cache_control": {"type": "ephemeral"}  # Breakpoint 2
        }
    ],
    messages=[{"role": "user", "content": "What are the key terms?"}]
)
```

### 1-Hour TTL Configuration

Extend cache lifetime for infrequent but recurring usage patterns [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    cache_control={"type": "ephemeral", "ttl": "1h"},  # Extended TTL
    system="Long-running system prompt...",
    messages=[{"role": "user", "content": "Query..."}]
)
```

### Monitoring Cache Performance

Track cache effectiveness via the usage object in API responses [1][2]:

```python
def analyze_cache_usage(response):
    usage = response.usage
    cache_create = getattr(usage, "cache_creation_input_tokens", 0)
    cache_read = getattr(usage, "cache_read_input_tokens", 0)
    uncached = usage.input_tokens

    total = cache_create + cache_read + uncached
    print(f"Cache write: {cache_create} tokens")
    print(f"Cache read:  {cache_read} tokens (90% savings)")
    print(f"Uncached:    {uncached} tokens")
    print(f"Total input: {total} tokens")
```

## Common Patterns

**Large Document Analysis**: Cache the entire document in the system prompt, then ask multiple questions against it. First request pays write cost; subsequent questions read from cache at 90% discount [1][2].

**Agentic Tool Use**: Cache tool definitions and system instructions. When agents make multiple tool calls per task, the static context is reused across iterations [1].

**RAG Applications**: Use multiple breakpoints to cache static instructions separately from retrieved documents. When documents update, only that cache segment invalidates [1].

**Long Conversations**: Automatic caching handles multi-turn conversations efficiently. Each new turn reads previous context from cache and writes only the new content [1][2].

**Mixing TTLs**: Place 1-hour caches before 5-minute caches in the same request. For example, cache rarely-changing system prompts for 1 hour while caching conversation history for 5 minutes [1].

## Gotchas

**Minimum Token Thresholds**: Attempting to cache fewer tokens than the model minimum silently fails with no caching applied. The request succeeds but without cache benefits. Always verify your cacheable content exceeds the threshold: 1,024 for Sonnet 4/4.5, 4,096 for Opus and Haiku 4.5 [1].

**TTL Ordering Constraint**: When mixing TTLs, longer-duration caches MUST appear before shorter ones. A 5-minute breakpoint followed by a 1-hour breakpoint returns a 400 error [1].

**Cache Invalidation Hierarchy**: The cache follows tools then system then messages order. Modifying tools invalidates everything. Modifying system preserves tools cache but invalidates messages. Toggling features like citations or web search modifies the system prompt implicitly, breaking the system and messages cache [1].

**Concurrent Request Timing**: Cache entries only become available after the first response begins. Parallel requests sent simultaneously will not benefit from each other's caching. Wait for the first response before sending subsequent requests if cache hits are critical [1].

**20-Block Lookback Limit**: The system only checks up to 20 blocks before each explicit breakpoint when looking for cache hits. For prompts with more than 20 content blocks, add additional breakpoints closer to potentially modified content [1].

**Tool Choice Changes**: Changing `tool_choice` between requests invalidates the messages cache even if the content is identical [1].

**Thinking Block Limitations**: Extended thinking blocks cannot have `cache_control` applied directly. They get cached automatically when passed back in subsequent requests with tool results, but adding non-tool-result user content strips all thinking blocks from context [1].

**Batch API Cache Hits**: Batch requests process concurrently in any order, so cache hits are best-effort. Use 1-hour TTL and submit a single priming request before the batch to improve hit rates [1].

## Sources

[1] **Prompt caching - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete implementation details including cache_control syntax, TTL options (5-minute and 1-hour), minimum token requirements per model, automatic vs explicit caching approaches, pricing multipliers, cache invalidation rules, supported content types, and troubleshooting guidance.

[2] **Prompt caching through the Claude API (Cookbook)**
    URL: https://platform.claude.com/cookbook/misc-prompt-caching
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Practical code examples for Python SDK implementation, multi-turn conversation patterns, automatic caching setup, usage monitoring, and performance benchmarks showing 3.3x speedup and 90% cost reduction.

[3] **Pricing - Claude API Docs**
    URL: https://platform.claude.com/docs/en/about-claude/pricing
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Complete pricing table for all Claude models including cache write costs (1.25x for 5-minute, 2x for 1-hour), cache read costs (0.1x base), interaction with batch API discounts, and long context pricing modifiers that stack with caching multipliers.
