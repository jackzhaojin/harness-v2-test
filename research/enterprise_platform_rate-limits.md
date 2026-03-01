# Rate Limits and Usage Tiers

**Topic ID:** enterprise.platform.rate-limits
**Researched:** 2026-03-01T12:00:00Z

## Overview

Rate limits are safeguards that API providers implement to control how much an organization can use their services over a defined period. They exist to prevent abuse, ensure fair access across all users, maintain system stability, and help developers predict costs. When building applications that consume APIs—particularly LLM APIs like OpenAI, Claude, or Azure OpenAI—understanding rate limits is essential for designing resilient systems that don't fail under load.

Rate limits are typically measured across multiple dimensions simultaneously: requests per minute (RPM), tokens per minute (TPM), and sometimes requests per day (RPD) or images per minute (IPM). Hitting any single limit triggers throttling, so applications must track and respect all applicable constraints. Most providers organize users into usage tiers, where higher tiers unlock greater limits as you demonstrate consistent usage and spend.

The underlying mechanism for many rate limiting systems is the **token bucket algorithm**, which allows for controlled bursting while maintaining average rate compliance. Understanding this algorithm helps explain why you might sometimes exceed your stated limit briefly, or why capacity "refills" continuously rather than resetting at fixed intervals.

## Key Concepts

- **RPM (Requests Per Minute)**: The total number of API calls permitted per minute, regardless of request size. A simple "hello world" prompt counts the same as a 10,000-token document.

- **TPM (Tokens Per Minute)**: The total tokens (input + output) your application can process per minute. Tokens are roughly 4 characters or 0.75 words. This limit applies to the sum of prompt tokens and completion tokens.

- **ITPM/OTPM**: Some providers (like Claude) separate input tokens per minute (ITPM) and output tokens per minute (OTPM), giving finer control and allowing optimization strategies like prompt caching.

- **Usage Tiers**: Graduated levels that determine your rate limits. As you spend more with a provider and maintain good standing, you automatically advance to higher tiers with increased limits.

- **Spend Limits**: Maximum monthly expenditure allowed per tier. Prevents runaway costs and requires tier advancement to exceed.

- **Token Bucket Algorithm**: The rate limiting mechanism where tokens accumulate at a fixed rate up to a maximum capacity. Requests consume tokens; if insufficient tokens exist, the request is rejected or queued.

- **429 Error**: The HTTP status code returned when rate limits are exceeded. Accompanied by a `retry-after` header indicating when to retry.

- **Exponential Backoff**: A retry strategy where wait time increases exponentially (1s, 2s, 4s, 8s...) after each failed attempt, often with random jitter to prevent thundering herd problems.

## Technical Details

### Token Bucket Algorithm

The token bucket algorithm works as follows:

```
1. Initialize bucket with max_capacity tokens
2. Tokens are added at refill_rate (e.g., 1000 tokens/second)
3. On request arrival:
   - If tokens >= request_cost: allow request, deduct tokens
   - Else: reject request (429 error)
4. Bucket cannot exceed max_capacity
```

Key parameters:
- **Bucket capacity**: Maximum burst size allowed
- **Refill rate**: How quickly capacity regenerates
- **Token cost**: Tokens consumed per request

This differs from fixed-window counters, which reset at intervals and are vulnerable to boundary attacks (double traffic at window edges).

### Usage Tier Structure (Claude API Example)

| Tier | Credit Purchase Required | Max Credit Purchase |
|------|-------------------------|---------------------|
| Tier 1 | $5 | $100 |
| Tier 2 | $40 | $500 |
| Tier 3 | $200 | $1,000 |
| Tier 4 | $400 | $5,000 |

Rate limits scale significantly across tiers. For Claude Sonnet 4.x:
- Tier 1: 50 RPM, 30K ITPM, 8K OTPM
- Tier 4: 4,000 RPM, 2M ITPM, 400K OTPM

### Response Headers

APIs return headers to help track limits:

```
retry-after: 2
anthropic-ratelimit-requests-limit: 1000
anthropic-ratelimit-requests-remaining: 500
anthropic-ratelimit-tokens-remaining: 450000
anthropic-ratelimit-tokens-reset: 2026-03-01T12:01:00Z
```

### Handling 429 Errors with Exponential Backoff

```python
from tenacity import retry, wait_random_exponential, stop_after_attempt

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def call_api_with_backoff(**kwargs):
    return client.messages.create(**kwargs)
```

Or manually:

```python
import time
import random

def call_with_retry(func, max_retries=6):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError:
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(min(wait, 60))
    raise Exception("Max retries exceeded")
```

## Common Patterns

### Proactive Rate Management

Instead of reacting to 429 errors, calculate delays proactively:

```python
# For 60 RPM limit, space requests ~1 second apart
import time

RATE_LIMIT_RPM = 60
DELAY = 60 / RATE_LIMIT_RPM  # 1 second

for request in requests:
    response = make_api_call(request)
    time.sleep(DELAY)
```

### Cache-Aware Token Optimization (Claude)

Claude's ITPM only counts uncached input tokens. With 80% cache hit rate on a 2M ITPM limit:

```
Effective throughput = 2M uncached + 8M cached = 10M total input tokens/minute
```

Use prompt caching for:
- System instructions
- Large context documents
- Tool definitions
- Repeated conversation prefixes

### Batch Processing for High-Volume Workloads

For non-time-sensitive bulk processing, use batch APIs:
- Requests queue in processing pool
- Higher throughput limits than synchronous API
- Cost savings (often 50% discount)
- Separate rate limit pool

### Multi-Model Fallback

```python
MODELS = ["claude-sonnet-4", "claude-haiku-4.5", "gpt-4o-mini"]

def call_with_fallback(prompt):
    for model in MODELS:
        try:
            return call_api(model, prompt)
        except RateLimitError:
            continue
    raise Exception("All models rate limited")
```

## Gotchas

- **max_tokens counts against TPM (OpenAI)**: The `max_tokens` parameter you set counts toward your TPM limit at request time, even if the model generates fewer tokens. Claude's OTPM only counts actual output tokens.

- **Shared limits across model families**: Some providers share rate limits across model versions. Claude's Opus 4.x limit applies to combined traffic across Opus 4.6, 4.5, 4.1, and 4.

- **Short bursts can trigger limits**: A rate of 60 RPM may be enforced as 1 request per second. Sending 10 requests in 1 second can trigger limits even if you're under 60/minute average.

- **Acceleration limits**: Sharp usage increases can trigger throttling even within rate limits. Ramp up traffic gradually.

- **Azure OpenAI ratio**: Azure enforces RPM proportional to TPM at 6 RPM per 1000 TPM. A 10K TPM quota means only 60 RPM.

- **Cached tokens still cost money**: While Claude's cached tokens don't count toward ITPM rate limits, they're still billed (at 10% of base price). Don't confuse rate limits with pricing.

- **Older model differences**: Some deprecated models (marked with †) count `cache_read_input_tokens` toward ITPM. Check documentation for your specific model version.

- **Workspace limits stack**: Organization-wide limits always apply even if workspace sub-limits add up to more than the org limit.

## Sources

- [Claude API Rate Limits Documentation](https://platform.claude.com/docs/en/api/rate-limits) — Comprehensive guide to Claude's ITPM/OTPM system, usage tiers, cache-aware rate limiting, and response headers
- [Rate Limiting Algorithms Explained with Code](https://blog.algomaster.io/p/rate-limiting-algorithms-explained-with-code) — Technical comparison of token bucket, leaky bucket, fixed window, and sliding window algorithms with implementation details
- [OpenAI Cookbook: How to Handle Rate Limits](https://developers.openai.com/cookbook/examples/how_to_handle_rate_limits) — Practical Python examples for exponential backoff, tenacity/backoff libraries, and throughput optimization
- [Token Bucket - Wikipedia](https://en.wikipedia.org/wiki/Token_bucket) — Foundational explanation of the token bucket algorithm in telecommunications and networking
- [How to Deal with API Rate Limits - Sentry](https://blog.sentry.io/how-to-deal-with-api-rate-limits/) — Best practices for proactive rate management, caching, and monitoring strategies
