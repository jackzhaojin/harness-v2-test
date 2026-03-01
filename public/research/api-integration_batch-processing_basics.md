# Message Batches API

**Topic ID:** api-integration.batch-processing.basics
**Researched:** 2026-03-01T00:00:00Z

## Overview

The Message Batches API is Anthropic's asynchronous processing system for handling large volumes of Claude API requests. Instead of sending requests one at a time and waiting for immediate responses, you submit up to 100,000 requests in a single batch. The system processes them within 24 hours (typically under 1 hour) at 50% of standard API pricing—making it ideal for workloads where latency isn't critical.

This pattern fits naturally into data pipelines, offline processing, and cost-sensitive operations. Use cases include large-scale evaluations (processing thousands of test cases), content moderation (analyzing user-generated content asynchronously), bulk content generation (product descriptions, summaries), and dataset analysis. Each request in a batch is processed independently, so you can mix different request types—vision, tool use, multi-turn conversations—within the same batch.

The API is generally available on Anthropic's platform and follows the same request format as the standard Messages API, with the addition of a `custom_id` field for matching results to requests since results may return out of order.

## Key Concepts

- **Batch**: A collection of up to 100,000 Message requests (or 256 MB total size, whichever limit hits first) submitted for asynchronous processing.

- **custom_id**: A developer-provided unique identifier for each request within a batch. Required because results are not guaranteed to return in submission order.

- **processing_status**: The batch lifecycle state—`in_progress` (processing), `canceling` (cancellation initiated), or `ended` (all requests completed/expired/canceled).

- **request_counts**: An object tracking how many requests are in each state: `processing`, `succeeded`, `errored`, `canceled`, and `expired`.

- **results_url**: A URL to download the `.jsonl` file containing all batch results. Only populated after `processing_status` becomes `ended`.

- **Expiration**: Batches expire after 24 hours if processing doesn't complete. Results remain available for 29 days after batch creation.

- **Result types**: Each request resolves to one of four states: `succeeded` (completed normally), `errored` (validation or server error), `canceled` (user-initiated), or `expired` (24-hour timeout reached).

- **50% discount**: All batch usage—input tokens, output tokens, and special tokens—costs half the standard Messages API price.

## Technical Details

### API Endpoint

```
POST https://api.anthropic.com/v1/messages/batches
```

### Request Structure

```json
{
  "requests": [
    {
      "custom_id": "request-001",
      "params": {
        "model": "claude-sonnet-4-5",
        "max_tokens": 1024,
        "messages": [
          {"role": "user", "content": "Summarize this document..."}
        ]
      }
    }
  ]
}
```

The `params` object accepts all standard Messages API parameters: `model`, `messages`, `max_tokens`, `system`, `temperature`, `tools`, `tool_choice`, and beta features.

### Response Structure

```json
{
  "id": "msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d",
  "type": "message_batch",
  "processing_status": "in_progress",
  "request_counts": {
    "processing": 2,
    "succeeded": 0,
    "errored": 0,
    "canceled": 0,
    "expired": 0
  },
  "created_at": "2024-09-24T18:37:24.100435Z",
  "expires_at": "2024-09-25T18:37:24.100435Z",
  "ended_at": null,
  "results_url": null
}
```

### Polling for Completion

```python
import anthropic
import time

client = anthropic.Anthropic()

while True:
    batch = client.messages.batches.retrieve(batch_id)
    if batch.processing_status == "ended":
        break
    time.sleep(60)
```

### Retrieving Results

Results come as a `.jsonl` file (one JSON object per line):

```python
for result in client.messages.batches.results(batch_id):
    if result.result.type == "succeeded":
        print(f"{result.custom_id}: {result.result.message.content}")
    elif result.result.type == "errored":
        print(f"{result.custom_id}: Error - {result.result.error}")
```

### Batch Pricing (50% of standard)

| Model | Batch Input | Batch Output |
|-------|-------------|--------------|
| Claude Opus 4.5/4.6 | $2.50/MTok | $12.50/MTok |
| Claude Sonnet 4/4.5/4.6 | $1.50/MTok | $7.50/MTok |
| Claude Haiku 4.5 | $0.50/MTok | $2.50/MTok |
| Claude Haiku 3.5 | $0.40/MTok | $2/MTok |

## Common Patterns

### Bulk Classification Pipeline

Submit thousands of items for classification, then process results asynchronously:

```python
requests = [
    {
        "custom_id": f"doc-{doc.id}",
        "params": {
            "model": "claude-haiku-4-5",
            "max_tokens": 100,
            "messages": [{"role": "user", "content": f"Classify: {doc.text}"}]
        }
    }
    for doc in documents
]

batch = client.messages.batches.create(requests=requests)
```

### Combining with Prompt Caching

For batches with shared context (same system prompt or reference documents), use prompt caching to reduce costs further. Cache hit rates in batches typically range 30-98% depending on traffic patterns.

```python
{
    "custom_id": "analysis-1",
    "params": {
        "model": "claude-sonnet-4-5",
        "max_tokens": 2048,
        "system": [
            {"type": "text", "text": "You are analyzing..."},
            {
                "type": "text",
                "text": "<large_reference_document>",
                "cache_control": {"type": "ephemeral"}
            }
        ],
        "messages": [{"role": "user", "content": "Analyze section 3..."}]
    }
}
```

### Breaking Large Jobs into Manageable Batches

For datasets exceeding 100,000 items, split into multiple batches and track them separately. This improves manageability and allows partial retries if some batches fail.

## Gotchas

- **Results are unordered**: Never assume results match submission order. Always use `custom_id` to correlate results with requests.

- **Validation is asynchronous**: Request body validation happens during processing, not at submission. Test individual requests with the synchronous Messages API first to catch schema errors.

- **24-hour expiration is hard**: If processing doesn't complete within 24 hours, remaining requests expire. You're not charged for expired requests, but you must resubmit them.

- **Results expire after 29 days**: Download results promptly. After 29 days from batch creation (not completion), results become unavailable.

- **Streaming not supported**: The `stream` parameter is ignored in batch requests. All responses are complete messages.

- **Spend limits can be exceeded**: Due to concurrent processing, batches may slightly exceed your workspace's configured spend limit.

- **Cache hits are best-effort**: Unlike synchronous requests, batch processing is concurrent and unordered, so cache hits aren't guaranteed even with identical cache_control blocks.

- **Not covered by Zero Data Retention**: Batch data follows standard retention policies, not ZDR arrangements.

- **Rate limits are separate**: Batch API has its own rate limits (HTTP requests and queued request count) that don't affect standard Messages API limits.

## Sources

- [Batch Processing Guide](https://platform.claude.com/docs/en/docs/build-with-claude/batch-processing) — Primary documentation covering lifecycle, code examples in multiple languages, and best practices
- [Create a Message Batch API Reference](https://platform.claude.com/docs/en/api/creating-message-batches) — Technical API specification with request/response schemas
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Official pricing tables showing 50% batch discount across all models
- [Introducing the Message Batches API](https://www.anthropic.com/news/message-batches-api) — Launch announcement with feature overview
