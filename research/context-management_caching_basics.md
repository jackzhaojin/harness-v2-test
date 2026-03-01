# Prompt Caching Fundamentals

**Topic ID:** context-management.caching.basics
**Researched:** 2026-03-01T12:00:00Z

## Overview

Prompt caching is an Anthropic API feature that optimizes both cost and latency by allowing the reuse of previously processed prompt prefixes. When you send a request with caching enabled, the system stores KV cache representations and cryptographic hashes of cached content. Subsequent requests with identical prefixes retrieve this cached state rather than reprocessing from scratch, reducing processing time by up to 85% for long prompts and cutting input token costs by 90%.

The feature operates on a prefix-matching basis: content is cached in order from `tools` → `system` → `messages`, and any modification to earlier content invalidates all downstream cache entries. Prompt caching is particularly valuable for conversational agents, coding assistants processing large codebases, document analysis workflows, and agentic systems with multiple tool calls. A 100K-token document analysis, for example, can see response time drop from 11.5 seconds to 2.4 seconds after the initial cache is established.

Anthropic offers two cache duration options: a default 5-minute TTL (time-to-live) that refreshes on each hit at no additional cost, and an extended 1-hour TTL at higher write cost for use cases with less frequent access patterns.

## Key Concepts

- **`cache_control` parameter**: The mechanism for marking content to be cached. Set as `{"type": "ephemeral"}` for 5-minute cache or `{"type": "ephemeral", "ttl": "1h"}` for 1-hour cache.

- **Automatic caching**: Adding `cache_control` at the request's top level; the system automatically places the breakpoint on the last cacheable block and moves it forward as conversations grow.

- **Explicit cache breakpoints**: Placing `cache_control` on individual content blocks for fine-grained control. Up to 4 breakpoints are allowed per request.

- **Cache prefix**: The entire prompt content up to and including the block marked with `cache_control`. Caching follows the hierarchy: `tools` → `system` → `messages`.

- **Cache write**: When new content is written to cache (1.25x base input price for 5-minute, 2x for 1-hour TTL).

- **Cache read/hit**: When cached content is retrieved (0.1x base input price—a 90% savings).

- **Minimum token threshold**: Content must meet minimum length requirements to be cached: 1024 tokens for Sonnet models, 2048-4096 tokens for other models depending on the specific version.

- **20-block lookback window**: The system automatically checks up to 20 content blocks before each explicit breakpoint for cache matches.

- **TTL refresh**: Each cache hit resets the expiration timer, so active sessions can maintain cache indefinitely.

## Technical Details

### Enabling Caching

**Automatic caching (simplest approach):**

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},  # Top-level, automatic
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
```

**Explicit caching (fine-grained control):**

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "Large system prompt content here...",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "Analyze this."}]
)
```

### Extended 1-Hour TTL

```json
{
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  }
}
```

When mixing TTLs, longer TTL entries must appear before shorter ones (1-hour before 5-minute).

### Minimum Cacheable Tokens by Model

| Model | Minimum Tokens |
|-------|----------------|
| Claude Opus 4.6, Opus 4.5 | 4096 |
| Claude Sonnet 4.6 | 2048 |
| Claude Sonnet 4.5, Sonnet 4, Opus 4.1, Opus 4 | 1024 |
| Claude Haiku 4.5 | 4096 |
| Claude Haiku 3.5, Haiku 3 | 2048 |

### Pricing Structure

| Model | Base Input | 5m Cache Write | 1h Cache Write | Cache Read |
|-------|------------|----------------|----------------|------------|
| Claude Sonnet 4.x | $3/MTok | $3.75/MTok | $6/MTok | $0.30/MTok |
| Claude Opus 4.x | $15/MTok | $18.75/MTok | $30/MTok | $1.50/MTok |
| Claude Haiku 4.5 | $1/MTok | $1.25/MTok | $2/MTok | $0.10/MTok |

Break-even occurs at just 2 API calls with cached content.

### Usage Response Fields

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_creation_input_tokens": 10000,
    "cache_read_input_tokens": 0,
    "output_tokens": 200
  }
}
```

Total input tokens = `cache_read_input_tokens` + `cache_creation_input_tokens` + `input_tokens`

## Common Patterns

### Multi-Turn Conversation Caching

For ongoing conversations, mark the final block with `cache_control`. The system automatically reuses previously cached turns:

```python
messages=[
    {"role": "user", "content": "First message"},
    {"role": "assistant", "content": "First response"},
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Follow-up question"},
            {"type": "text", "text": "More context", "cache_control": {"type": "ephemeral"}}
        ]
    }
]
```

### Large Document Analysis

Cache the document in the system prompt, keep queries uncached:

```python
system=[
    {"type": "text", "text": "You are a document analyst."},
    {
        "type": "text",
        "text": "[Full 50-page document text here]",
        "cache_control": {"type": "ephemeral"}
    }
]
```

### Tool Definition Caching

Place `cache_control` on the last tool to cache all tool definitions:

```python
tools=[
    {"name": "search", "description": "...", "input_schema": {...}},
    {
        "name": "get_doc",
        "description": "...",
        "input_schema": {...},
        "cache_control": {"type": "ephemeral"}
    }
]
```

### Multiple Independent Breakpoints

Use up to 4 breakpoints for content that changes at different frequencies:

1. Tools (rarely change)
2. System instructions (rarely change)
3. RAG/document context (may change daily)
4. Conversation history (changes per message)

## Gotchas

- **Concurrent request race condition**: A cache entry only becomes available after the first response begins. For parallel requests, the first must complete before others can hit the cache.

- **Image and tool_choice changes invalidate cache**: Adding or removing images anywhere in the prompt, or changing `tool_choice`, invalidates message-level caches.

- **Thinking blocks cannot be directly cached**: You cannot place `cache_control` on thinking blocks, though they are cached when appearing in previous assistant turns.

- **TTL ordering constraint**: When mixing 1-hour and 5-minute caches, 1-hour entries must appear before 5-minute entries or the API returns a 400 error.

- **Web search/citations toggle invalidates system cache**: Enabling or disabling these features modifies the system prompt internally.

- **Reported TTL variance**: Some users have reported the effective 5-minute TTL behaving closer to 3 minutes in practice, though documentation still states 5 minutes.

- **No manual cache clearing**: Cached content automatically expires; there's no API to force eviction.

- **JSON key ordering matters**: Languages like Swift and Go may randomize JSON key order during serialization, breaking cache matches for tool definitions.

- **20-block lookback limit**: For prompts with more than 20 content blocks before your breakpoint, early modifications won't trigger cache hits unless you add explicit breakpoints closer to that content.

- **Workspace isolation change (Feb 2026)**: Cache isolation is moving from organization-level to workspace-level on the Claude API and Azure AI Foundry.

## Sources

- [Prompt caching - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — Primary source for all technical details, code examples, caching strategies, pricing, and limitations
- [Pricing - Claude API Docs](https://platform.claude.com/docs/en/about-claude/pricing) — Official pricing tables and multiplier information for cache writes and reads
- [How Prompt Caching Actually Works in Claude Code](https://www.claudecodecamp.com/p/how-prompt-caching-actually-works-in-claude-code) — Practical insights on TTL behavior and cache hit patterns
