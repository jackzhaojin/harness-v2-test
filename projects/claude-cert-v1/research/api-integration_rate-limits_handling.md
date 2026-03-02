# Rate Limit Handling

**Topic ID:** api-integration.rate-limits.handling
**Researched:** 2026-03-01T00:00:00Z

## Overview

Rate limit handling is a critical aspect of building robust API integrations, particularly with AI services like Claude. APIs implement rate limits to prevent abuse, protect infrastructure, and ensure fair resource distribution among users [1]. When you exceed these limits, the API returns a 429 (Too Many Requests) error along with a `retry-after` header indicating how long to wait before retrying [1].

Understanding rate limit handling requires knowledge of three interconnected concepts: how rate limits are measured and enforced (the token bucket algorithm), how the API communicates limit status (response headers), and how clients should respond to limits (retry strategies). The Anthropic Claude API uses a tiered system with separate limits for requests per minute (RPM), input tokens per minute (ITPM), and output tokens per minute (OTPM) for each model class [1]. Mastering these concepts enables you to build integrations that maximize throughput while avoiding service disruptions.

## Key Concepts

- **Token Bucket Algorithm** — The rate limiting mechanism used by Claude's API where capacity is continuously replenished up to your maximum limit, rather than being reset at fixed intervals [1]. This allows for burst traffic when tokens are available while maintaining long-term average rates [2].

- **Requests Per Minute (RPM)** — The maximum number of API calls allowed per minute. Exceeding this triggers a 429 error [1]. Short bursts at high volume can surpass this limit even if your average rate is within bounds [1].

- **Input Tokens Per Minute (ITPM)** — Limits on input tokens consumed per minute. Crucially, for most Claude models, only uncached input tokens count toward ITPM limits [1]. This makes prompt caching an effective strategy for increasing effective throughput.

- **Output Tokens Per Minute (OTPM)** — Limits on generated output tokens per minute. The `max_tokens` parameter does not factor into OTPM calculations, so there is no rate limit downside to setting a higher `max_tokens` value [1].

- **Retry-After Header** — HTTP header returned with 429 responses indicating the number of seconds to wait before retrying [1][3]. Clients should respect this value; earlier retries will fail [1].

- **Exponential Backoff** — A retry strategy where wait time increases exponentially after each failed attempt (e.g., 1s, 2s, 4s, 8s) [4]. Essential for gracefully handling rate limits without overwhelming the service.

- **Jitter** — Randomness added to backoff timing to prevent the "thundering herd" problem where multiple clients retry simultaneously [4]. Full jitter randomizes the entire sleep time within the backoff window [4].

- **Usage Tiers** — Anthropic's system of progressive rate limit increases based on credit purchases. Tier 1 starts at $5 credit purchase with 50 RPM; Tier 4 at $400 offers 4,000 RPM and 2,000,000 ITPM for Claude Opus and Sonnet models [1].

## Technical Details

### Token Bucket Algorithm Mechanics

The token bucket works with two key parameters: **capacity** (max burst) and **refill rate** [2][5]. Tokens accumulate at a constant rate until reaching maximum capacity. Each request consumes a token; if tokens are available, the request proceeds; if the bucket is empty, the request is rejected [2].

```
capacity = 100 tokens
refill_rate = 10 tokens/second

Scenario:
- Start: 100 tokens available
- 50 requests arrive instantly: 50 tokens consumed, 50 remain
- 5 seconds pass: 50 tokens refilled, back to 100
- If 150 requests arrive at once: 100 succeed, 50 rejected
```

### Anthropic Rate Limit Response Headers

Every API response includes headers showing current rate limit status [1]:

```
anthropic-ratelimit-requests-limit: 4000
anthropic-ratelimit-requests-remaining: 3950
anthropic-ratelimit-requests-reset: 2026-03-01T12:01:00Z
anthropic-ratelimit-input-tokens-limit: 2000000
anthropic-ratelimit-input-tokens-remaining: 1500000
anthropic-ratelimit-input-tokens-reset: 2026-03-01T12:01:00Z
anthropic-ratelimit-output-tokens-limit: 400000
anthropic-ratelimit-output-tokens-remaining: 350000
anthropic-ratelimit-output-tokens-reset: 2026-03-01T12:01:00Z
```

Reset times are in RFC 3339 format. The `tokens-*` headers display values for the most restrictive limit currently in effect [1].

### IETF RateLimit Header Draft Standard

A draft IETF standard (draft-ietf-httpapi-ratelimit-headers) proposes standardized headers [3]:

```
RateLimit-Policy: "burst";q=100;w=60,"daily";q=1000;w=86400
RateLimit: "default";r=50;t=30
```

The `q` parameter indicates quota allocation, `w` the time window in seconds, `r` remaining quota, and `t` seconds until restoration [3]. When both `Retry-After` and `RateLimit` headers are present, `Retry-After` takes precedence [3].

### Exponential Backoff with Jitter Implementation

```python
import random
import time

def retry_with_backoff(func, max_retries=5, base_delay=1, max_delay=60):
    """Retry with exponential backoff and full jitter."""
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise

            # Respect retry-after if provided
            if e.retry_after:
                delay = e.retry_after
            else:
                # Exponential backoff with full jitter
                exp_delay = min(base_delay * (2 ** attempt), max_delay)
                delay = random.uniform(0, exp_delay)

            time.sleep(delay)
```

Full jitter randomizes the entire sleep time within `[0, min(cap, base * 2^attempt)]` [4]. This approach significantly reduces contention compared to no-jitter exponential backoff [4].

## Common Patterns

### Proactive Rate Monitoring

Monitor the `anthropic-ratelimit-*-remaining` headers to track consumption before hitting limits [1]. Implement throttling when remaining capacity drops below a threshold:

```python
def check_rate_limits(response):
    remaining = int(response.headers['anthropic-ratelimit-requests-remaining'])
    if remaining < 10:
        # Slow down request rate
        time.sleep(1)
```

### Prompt Caching for ITPM Optimization

For most Claude models, only uncached input tokens count toward ITPM limits [1]. With an 80% cache hit rate and a 2,000,000 ITPM limit, you can effectively process 10,000,000 total input tokens per minute [1]. Cache system prompts, tool definitions, and repeated context:

```python
# Cache large system context
messages = [
    {"role": "user", "content": [
        {"type": "text", "text": large_system_context, "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": user_query}
    ]}
]
```

### Batch API for High-Volume Workloads

The Message Batches API has separate rate limits with a processing queue model [1]. Tier 4 allows 500,000 batch requests in the processing queue simultaneously [1]. Use batching when latency requirements permit to avoid real-time rate limits entirely.

### Gradual Traffic Ramp-Up

To avoid acceleration limits that trigger 429 errors during sharp usage increases, ramp up traffic gradually and maintain consistent usage patterns [1].

## Gotchas

- **HTTP 402 vs 429 on Max Plans** — Claude Max subscription plans return HTTP 402 (payment required) instead of 429 when rate limited [1]. Tools should recognize that 402 from Anthropic on a Max plan may indicate rate limiting, not billing exhaustion.

- **Short Burst Enforcement** — A rate of 60 RPM may be enforced as 1 request per second [1]. Short bursts at high volume can trigger rate limits even when your average is within bounds.

- **Workspace vs Organization Limits** — The `anthropic-ratelimit-tokens-*` headers display the most restrictive limit currently in effect [1]. If you exceed Workspace limits, headers show Workspace values, not Organization values.

- **Model-Specific Limits Are Shared** — Opus 4.x rate limits apply across combined traffic for Opus 4.6, 4.5, 4.1, and 4 [1]. Similarly for Sonnet 4.x models. Splitting traffic across model versions does not increase total capacity.

- **Older Models Count Cached Tokens** — Models marked with dagger (such as Haiku 3 and Haiku 3.5) also count `cache_read_input_tokens` toward ITPM limits [1]. Prompt caching provides less rate limit benefit for these models.

- **X-RateLimit Header Inconsistencies** — The `X-RateLimit-*` headers are not standardized [3]. Different providers use inconsistent formats for the reset value: seconds remaining, milliseconds, UNIX timestamps, or datetimes [3]. Always check provider documentation.

- **No-Jitter Backoff Creates Thundering Herds** — Pure exponential backoff without jitter causes synchronized retries that re-trigger overload [4]. Always add jitter to spread retry attempts across time.

- **Remaining Quota Is Not a Guarantee** — Clients must not consider the quota in `remaining` parameters as a service level agreement. Servers may artificially lower returned values or reject requests regardless of advertised quotas [3].

## Sources

[1] **Anthropic Claude API Rate Limits Documentation**
    URL: https://platform.claude.com/docs/en/api/rate-limits
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Token bucket algorithm confirmation, rate limit types (RPM/ITPM/OTPM), usage tier tables, response headers, cache-aware ITPM details, 429 error handling, Workspace limits, and model-specific limit sharing rules.

[2] **Rate Limiting Algorithms Explained with Code - AlgoMaster**
    URL: https://blog.algomaster.io/p/rate-limiting-algorithms-explained-with-code
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Token bucket algorithm mechanics including capacity/refill rate parameters, burst handling explanation, comparison with other algorithms.

[3] **RateLimit Header Fields for HTTP (IETF Draft)**
    URL: https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Standardized RateLimit-Policy and RateLimit header formats, parameter definitions (q, w, r, t), relationship between Retry-After and RateLimit headers, interoperability issues with X-RateLimit-* variants.

[4] **AWS Builders' Library: Timeouts, Retries and Backoff with Jitter**
    URL: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Exponential backoff with jitter patterns, thundering herd problem explanation, types of jitter (full, equal, decorrelated), best practices for retry strategies including capping delays and limiting retry counts.

[5] **KrakenD: Token Bucket Algorithm for API Traffic Throttling**
    URL: https://www.krakend.io/docs/throttling/token-bucket/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Practical token bucket configuration examples, relationship between capacity and max_rate parameters, continuous refill mechanics.
