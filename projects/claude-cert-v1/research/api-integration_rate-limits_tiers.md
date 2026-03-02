# Usage Tiers

**Topic ID:** api-integration.rate-limits.tiers
**Researched:** 2026-03-01T00:00:00Z

## Overview

Anthropic's Claude API implements a four-tier usage system that governs both spending limits and rate limits for API consumers [1]. This tiered structure serves two purposes: preventing API abuse while providing a predictable growth path for developers scaling their applications. Tiers advance automatically based on cumulative credit purchases, with Tier 1 starting at a $5 deposit and Tier 4 unlocking at $400+ cumulative spend [1].

A critical architectural detail is that rate limits are enforced at the **organization level**, not per API key [1][2]. This means all API keys under a single Anthropic organization share the same pool of capacity. Multiple team members or applications using the same organization account draw from identical rate limit buckets, a distinction that frequently surprises developers accustomed to per-key limiting [2].

The API uses the **token bucket algorithm** for rate limiting, meaning capacity replenishes continuously rather than resetting at fixed intervals [1]. A 60 RPM limit effectively becomes 1 request per second continuously, making burst behavior more predictable but also meaning short bursts can trigger rate limits even when overall throughput seems within bounds [1].

## Key Concepts

- **Usage Tier** — A classification level (1 through 4) that determines both your monthly spending cap and your rate limits across all models [1]. Higher tiers unlock proportionally higher limits.

- **Requests Per Minute (RPM)** — The maximum number of API requests your organization can make within a rolling minute window [1]. At Tier 1 this is 50 RPM; at Tier 4 it reaches 4,000 RPM.

- **Input Tokens Per Minute (ITPM)** — Maximum input tokens processed per minute [1]. Crucially, **cached input tokens do not count** toward ITPM for most current models, effectively multiplying your throughput when using prompt caching [1].

- **Output Tokens Per Minute (OTPM)** — Maximum output tokens generated per minute [1]. Unlike input, the `max_tokens` parameter does not factor into OTPM calculations, so setting higher `max_tokens` values has no rate limit penalty [1].

- **Credit Purchase (Cumulative)** — The total amount deposited into your Anthropic account that determines tier eligibility [1]. This is cumulative across all purchases, not a single transaction requirement.

- **Monthly Spend Limit** — The maximum you can spend per calendar month at each tier [1]. Hitting this limit blocks API access until the next month or until you qualify for a higher tier.

- **Organization-Level Enforcement** — All rate limits apply across the entire organization, shared by all API keys and workspaces [1][2].

- **Token Bucket Algorithm** — Rate limiting mechanism where capacity continuously replenishes up to maximum, rather than hard-resetting at interval boundaries [1].

## Technical Details

### Tier Requirements and Spend Limits

| Usage Tier | Credit Purchase (Cumulative) | Monthly Spend Limit |
|------------|------------------------------|---------------------|
| Tier 1     | $5                           | $100                |
| Tier 2     | $40                          | $500                |
| Tier 3     | $200                         | $1,000              |
| Tier 4     | $400                         | $5,000              |

Tier advancement is immediate upon reaching the cumulative deposit threshold [1]. There is no waiting period or manual approval required for standard tiers.

### Rate Limits by Tier (Current Models)

**Tier 1:**
| Model           | RPM | ITPM    | OTPM   |
|-----------------|-----|---------|--------|
| Claude Sonnet 4.x | 50  | 30,000  | 8,000  |
| Claude Haiku 4.5  | 50  | 50,000  | 10,000 |
| Claude Opus 4.x   | 50  | 30,000  | 8,000  |

**Tier 4:**
| Model           | RPM   | ITPM      | OTPM    |
|-----------------|-------|-----------|---------|
| Claude Sonnet 4.x | 4,000 | 2,000,000 | 400,000 |
| Claude Haiku 4.5  | 4,000 | 4,000,000 | 800,000 |
| Claude Opus 4.x   | 4,000 | 2,000,000 | 400,000 |

The progression from Tier 1 to Tier 4 represents an **80x increase** in RPM and up to **66x increase** in token throughput [1].

### Combined Model Limits

Rate limits apply to model families collectively [1]:
- **Opus 4.x limit** covers combined traffic across Opus 4.6, 4.5, 4.1, and 4
- **Sonnet 4.x limit** covers combined traffic across Sonnet 4.6, 4.5, and 4

This means you cannot circumvent limits by switching between model versions within the same family [1].

### Cache-Aware ITPM Calculation

For most current models, only uncached input tokens count toward ITPM [1]:

```
Counts toward ITPM:
- input_tokens (tokens after last cache breakpoint)
- cache_creation_input_tokens (tokens being written to cache)

Does NOT count toward ITPM:
- cache_read_input_tokens (tokens read from cache)
```

With an 80% cache hit rate, you could effectively process 5x your nominal ITPM limit [1].

### Rate Limit Response Headers

Every response includes headers for monitoring [1]:

```
anthropic-ratelimit-requests-limit
anthropic-ratelimit-requests-remaining
anthropic-ratelimit-requests-reset
anthropic-ratelimit-input-tokens-limit
anthropic-ratelimit-input-tokens-remaining
anthropic-ratelimit-output-tokens-limit
anthropic-ratelimit-output-tokens-remaining
retry-after (on 429 errors only)
```

## Common Patterns

**Proactive Rate Monitoring**: Check `anthropic-ratelimit-*-remaining` headers on every response to throttle requests before hitting limits, rather than reacting to 429 errors [1][3].

**Exponential Backoff with Jitter**: When receiving 429 errors, implement retry logic using the `retry-after` header as primary guidance, with exponential backoff (starting at 1-2 seconds, capping at 30-60 seconds) and random jitter to prevent synchronized retries [3]:

```python
import random
import time

def retry_with_backoff(func, max_retries=5):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait = e.retry_after or (2 ** attempt)
            jitter = random.uniform(0, wait * 0.1)
            time.sleep(wait + jitter)
```

**Prompt Caching Strategy**: Structure requests to maximize cache hits by placing stable content (system prompts, tool definitions, large documents) at the beginning of the prompt, before dynamic content [1].

**Workspace-Level Limits**: Organizations can set custom rate limits per workspace to protect shared capacity [1]. For example, limiting a development workspace to 30,000 ITPM ensures production workspaces retain access to remaining capacity.

## Gotchas

**Organization-Level Sharing Is Not Obvious**: Developers often assume API keys have independent limits. They do not. A single heavy-usage application can exhaust limits for all other applications in the same organization [1][2].

**Burst Behavior with Token Bucket**: Even if you are well under the RPM limit on average, a burst of rapid requests can trigger 429 errors because the token bucket algorithm enforces limits at sub-minute granularity [1]. A 60 RPM limit is effectively 1 request per second.

**Acceleration Limits**: Sharp increases in usage can trigger 429 errors even when within rate limits due to acceleration limits designed to prevent abuse [1]. Ramp up traffic gradually when scaling.

**Cached Tokens and Older Models**: Older/deprecated models (marked with a dagger symbol in docs) count `cache_read_input_tokens` toward ITPM, unlike current models [1]. This can cause unexpected rate limit behavior when migrating between model versions.

**Monthly Spend vs Rate Limits**: Hitting your monthly spend limit blocks API access until the next calendar month, regardless of rate limit capacity [1]. These are separate controls.

**1M Context Window Restrictions**: The 1M token context window is only available to Tier 4 organizations and uses separate, dedicated rate limits for requests exceeding 200K tokens [1]. Lower tiers cannot access extended context regardless of other limits.

**No Free API Tier**: Unlike the Claude web interface, there is no free tier for API access [2]. All API usage requires a minimum $5 deposit to reach Tier 1.

## Sources

[1] **Rate limits - Claude API Docs**
    URL: https://platform.claude.com/docs/en/api/rate-limits
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete tier structure, rate limit tables for all tiers and models, token bucket algorithm details, cache-aware ITPM calculations, response headers, workspace limits, and 1M context restrictions.

[2] **Our approach to rate limits for the Claude API - Claude Help Center**
    URL: https://support.claude.com/en/articles/8243635-our-approach-to-api-rate-limits
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Organization-level enforcement philosophy, 429 error handling guidance, tier management overview.

[3] **How to Fix Claude API 429 Rate Limit Error - AI Free API**
    URL: https://www.aifreeapi.com/en/posts/claude-api-429-error-fix
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Exponential backoff implementation patterns, jitter strategies, retry-after header usage, practical error handling recommendations.
