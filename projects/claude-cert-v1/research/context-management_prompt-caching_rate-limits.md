# Cache and Rate Limits

**Topic ID:** context-management.prompt-caching.rate-limits
**Researched:** 2026-03-01T18:45:00Z

## Overview

Prompt caching fundamentally transforms how rate limits apply to Claude API requests by excluding cached tokens from Input Tokens Per Minute (ITPM) calculations. This architectural decision means that for most Claude models, only uncached input tokens and cache creation tokens count toward your ITPM rate limit, while tokens read from cache are free from rate limit constraints [1]. The practical impact is substantial: with high cache hit rates, your effective throughput can be 5-10x higher than your nominal ITPM limit without any tier upgrades or custom rate limit negotiations [1][2].

Understanding this interaction is critical for certification exam scenarios because it affects architectural decisions around system design, cost optimization, and capacity planning. When designing high-volume applications, the choice of caching strategy directly determines whether you need to request higher rate limits or can achieve target throughput within standard tiers. This is especially relevant for agentic workflows, RAG applications with large document contexts, and multi-turn conversations where the same prefix content is repeatedly processed [3].

## Key Concepts

- **ITPM (Input Tokens Per Minute)** — The rate limit that constrains how many input tokens an organization can send per minute. For most Claude models, this only counts uncached tokens, making it effectively higher than stated [1].

- **Cache-Aware ITPM** — The mechanism by which cached tokens are excluded from ITPM calculations. Only `input_tokens` + `cache_creation_input_tokens` count toward your limit; `cache_read_input_tokens` do not [1].

- **Total Input Token Calculation** — The formula is `total_input_tokens = cache_read_input_tokens + cache_creation_input_tokens + input_tokens`. The `input_tokens` field only represents tokens after your last cache breakpoint, not all input tokens [1][3].

- **Token Bucket Algorithm** — Anthropic uses this algorithm for rate limiting, meaning capacity is continuously replenished rather than reset at fixed intervals. This allows for burst handling while maintaining overall limits [1].

- **Effective Throughput Multiplier** — With an 80% cache hit rate and a 2,000,000 ITPM limit, you can effectively process 10,000,000 total input tokens per minute (2M uncached + 8M cached) [1][2].

- **Legacy Model Exception** — Older models marked with a dagger symbol in rate limit tables also count `cache_read_input_tokens` toward ITPM limits. These include Claude Haiku 3, Claude Haiku 3.5, and other deprecated models [1].

- **Cache Hit Rate** — The percentage of input tokens that are served from cache rather than processed fresh. Higher cache hit rates directly translate to higher effective throughput [1].

## Technical Details

### How ITPM Is Calculated with Caching

The API response includes three separate token fields that determine rate limit consumption [1][3]:

```text
# What counts toward ITPM:
input_tokens                    # Tokens after last cache breakpoint
cache_creation_input_tokens     # Tokens being written to cache

# What does NOT count toward ITPM:
cache_read_input_tokens         # Tokens read from cache (for most models)
```

For example, if you send a request with a 200K token cached document and a 50 token user question:

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_read_input_tokens": 200000,
    "cache_creation_input_tokens": 0,
    "output_tokens": 500
  }
}
```

Only the 50 `input_tokens` count toward your ITPM limit, not the full 200,050 tokens processed [1].

### Rate Limit Tiers and ITPM Values

Standard tier ITPM limits for current models [1]:

| Tier | Deposit | Sonnet 4.x ITPM | Haiku 4.5 ITPM | Opus 4.x ITPM |
|------|---------|-----------------|----------------|---------------|
| 1    | $5      | 30,000          | 50,000         | 30,000        |
| 2    | $40     | 450,000         | 450,000        | 450,000       |
| 3    | $200    | 800,000         | 1,000,000      | 800,000       |
| 4    | $400    | 2,000,000       | 4,000,000      | 2,000,000     |

### Effective Throughput Calculation

With prompt caching, your effective ITPM becomes [1][2]:

```text
Effective ITPM = Nominal ITPM / (1 - cache_hit_rate)

Example at Tier 4 with 80% cache hit rate:
Effective ITPM = 2,000,000 / (1 - 0.80) = 10,000,000 tokens/minute
```

This represents a 5x throughput multiplier without any rate limit increases.

### Long Context Rate Limits

When using the 1M token context window (beta) with requests exceeding 200K tokens, separate rate limits apply [1]:

| Tier | Long Context ITPM | Long Context OTPM |
|------|-------------------|-------------------|
| 4    | 1,000,000         | 200,000           |

Prompt caching is especially valuable here because long context requests are otherwise heavily rate-limited [1].

## Common Patterns

### RAG Applications with Large Document Context

Cache the document corpus in the system prompt, then vary only the user question [3]:

```python
response = client.messages.create(
    model="claude-sonnet-4",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are a research assistant.",
        },
        {
            "type": "text",
            "text": "[200K tokens of document content]",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "Summarize the key findings."}]
)
```

With this pattern, only the user message consumes ITPM. The 200K document tokens are served from cache and do not count against rate limits [1][3].

### Agentic Tool Use Workflows

Iterative tool calls in agent loops can quickly exhaust ITPM if conversation history is re-sent each turn. Caching the conversation history means only new content counts [3]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    cache_control={"type": "ephemeral"},  # Automatic caching
    tools=[...],
    messages=conversation_history
)
```

### Multi-Turn Conversations with Automatic Caching

Use top-level `cache_control` to automatically cache the growing conversation [3]:

```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "cache_control": {"type": "ephemeral"},
  "messages": [/* conversation history */]
}
```

The cache point automatically moves forward as the conversation grows, maximizing cache hits without manual breakpoint management [3].

## Gotchas

- **Legacy Model Trap** — Models marked with a dagger in documentation (Haiku 3, Haiku 3.5 deprecated) DO count `cache_read_input_tokens` toward ITPM. Migrating from these to current models significantly improves effective throughput [1].

- **input_tokens Misunderstanding** — The `input_tokens` field in responses does NOT represent total input. It only shows tokens after your last cache breakpoint. This frequently confuses developers calculating total token usage [1][3].

- **Cache Miss on First Request** — The first request always has a cache miss for all content being cached. Plan for this when estimating initial request costs and timing [3].

- **Minimum Token Threshold** — Content must meet minimum token counts to be cached (1,024 tokens for Sonnet 4.x, 4,096 for Opus 4.5/4.6, 4,096 for Haiku 4.5). Requests below these thresholds process normally without caching [3].

- **Cache Write Costs Against ITPM** — Cache writes (`cache_creation_input_tokens`) DO count against ITPM, only cache reads are free. High churn in cached content reduces the throughput benefit [1].

- **OTPM Unaffected** — Output tokens per minute limits are completely independent of caching. The `max_tokens` parameter does not affect OTPM rate limit calculations [1].

- **Rate Limits Are Per-Model-Class** — Sonnet 4.x rate limits apply across Sonnet 4.6, 4.5, and 4 combined. Similarly for Opus models. You cannot circumvent limits by switching between minor versions [1].

- **Concurrent Request Cache Timing** — A cache entry only becomes available after the first response begins. Parallel requests sent simultaneously will not benefit from each other's cache writes [3].

- **Short Burst Enforcement** — A 60 RPM limit may be enforced as 1 request/second. Short bursts can trigger 429 errors even if you are under the per-minute total [1].

## Sources

[1] **Rate limits - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/rate-limits
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Cache-aware ITPM calculations, tier limits tables, token counting formulas, token bucket algorithm details, legacy model exceptions, response headers

[2] **Rate limits - Claude Docs (Search Result)**
    URL: https://docs.claude.com/en/api/rate-limits
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Effective throughput multiplier example (5-10x), 80% cache hit rate scenario

[3] **Prompt caching - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Caching mechanisms (automatic and explicit), minimum token thresholds, pricing multipliers, total input token formula, cache TTL options, concurrent request behavior, code examples

[4] **Prompt caching with Claude - Anthropic Blog**
    URL: https://claude.com/blog/prompt-caching
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Latency improvement percentages (79% reduction for 100K document chat), use case examples for agentic workflows and multi-turn conversations
