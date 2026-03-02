# Batch API Implementation

**Topic ID:** api-integration.batching.implementation
**Researched:** 2026-03-01T00:00:00Z

## Overview

The Message Batches API is Anthropic's asynchronous processing system for handling large volumes of Claude API requests. Rather than sending requests one at a time and waiting for immediate responses, you submit a collection of requests that are processed in the background, with results available within 24 hours [1]. This approach trades latency for significant cost savings and higher throughput.

The core value proposition is straightforward: batches cost 50% less than standard API calls while allowing you to submit up to 100,000 requests or 256 MB of data per batch [1]. Most batches complete within one hour, though the system guarantees processing within 24 hours [1]. This makes the Batch API ideal for workloads like large-scale evaluations, content moderation pipelines, bulk content generation, and dataset analysis where real-time responses are not required.

The Batch API supports all features available in the standard Messages API, including vision, tool use, system messages, multi-turn conversations, and beta features [1]. Each request in a batch is processed independently, which means you can mix different models, parameters, and request types within a single batch [1].

## Key Concepts

- **Message Batch** — A container holding up to 100,000 individual Message requests or 256 MB total, whichever limit is reached first [1]. Batches are scoped to a Workspace and can only be accessed by API keys from that Workspace [1].

- **custom_id** — A developer-provided unique identifier for each request within a batch [2]. Essential for matching results to requests since results are not guaranteed to return in submission order [1].

- **processing_status** — The batch lifecycle state: `in_progress` (actively processing), `canceling` (cancellation requested), or `ended` (all requests processed) [2].

- **request_counts** — A breakdown of request outcomes: `processing`, `succeeded`, `errored`, `canceled`, and `expired` [1]. The sum always equals the total number of requests in the batch [1].

- **results_url** — A URL provided when processing ends, pointing to a `.jsonl` file containing all results [1]. Results remain available for 29 days after batch creation [1].

- **expires_at** — The deadline for batch processing, set to 24 hours after creation [2]. Requests not processed by this time receive an `expired` result [1].

- **Prompt caching with batches** — Cache hits are best-effort due to concurrent processing, with typical hit rates of 30-98% depending on traffic patterns [1]. Use the 1-hour cache duration for better hit rates since batches can take longer than the standard 5-minute cache TTL [1].

## Technical Details

### API Endpoint and Authentication

```
POST https://api.anthropic.com/v1/messages/batches
```

Required headers [2]:
```
x-api-key: $ANTHROPIC_API_KEY
anthropic-version: 2023-06-01
content-type: application/json
```

### Request Structure

Each batch request requires a `requests` array containing objects with `custom_id` and `params` [2]:

```json
{
  "requests": [
    {
      "custom_id": "request-001",
      "params": {
        "model": "claude-opus-4-6",
        "max_tokens": 1024,
        "messages": [
          {"role": "user", "content": "Hello, world"}
        ]
      }
    },
    {
      "custom_id": "request-002",
      "params": {
        "model": "claude-sonnet-4-6",
        "max_tokens": 2048,
        "system": "You are a helpful assistant.",
        "messages": [
          {"role": "user", "content": "Explain quantum computing"}
        ]
      }
    }
  ]
}
```

The `params` object accepts all standard Messages API parameters: `model`, `max_tokens`, `messages`, `system`, `temperature`, `top_p`, `top_k`, `stop_sequences`, `tools`, `tool_choice`, and `metadata` [2].

### Response Object

When a batch is created, the response includes [1][2]:

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

### Result Types

When processing ends, each request has one of four result types [1]:

| Type | Description | Billing |
|------|-------------|---------|
| `succeeded` | Request completed successfully with message result | Charged |
| `errored` | Request failed (invalid request or server error) | Not charged |
| `canceled` | Batch canceled before request was processed | Not charged |
| `expired` | 24-hour deadline reached before processing | Not charged |

### Results Format

Results are returned as a `.jsonl` file where each line is a JSON object [1]:

```jsonl
{"custom_id":"request-001","result":{"type":"succeeded","message":{"id":"msg_...","role":"assistant","content":[{"type":"text","text":"Hello!"}],"stop_reason":"end_turn","usage":{"input_tokens":10,"output_tokens":5}}}}
{"custom_id":"request-002","result":{"type":"errored","error":{"type":"invalid_request_error","message":"max_tokens must be positive"}}}
```

### Python SDK Example

The following pattern demonstrates batch creation and result retrieval using the official Python SDK [1]:

```python
import anthropic
import time

client = anthropic.Anthropic()

# Create batch
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": f"request-{i}",
            "params": {
                "model": "claude-sonnet-4-6",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}]
            }
        }
        for i, prompt in enumerate(prompts)
    ]
)

# Poll until complete
while batch.processing_status != "ended":
    time.sleep(60)
    batch = client.messages.batches.retrieve(batch.id)

# Stream results
for result in client.messages.batches.results(batch.id):
    if result.result.type == "succeeded":
        print(f"{result.custom_id}: {result.result.message.content[0].text}")
    elif result.result.type == "errored":
        print(f"{result.custom_id}: Error - {result.result.error.message}")
```

## Common Patterns

**Mixing models within a batch**: Since each request is processed independently, you can use different models for different tasks [1]. For example, use Haiku for simple classification and Opus for complex analysis within the same batch:

```python
requests = [
    {"custom_id": "classify-1", "params": {"model": "claude-haiku-4-5", ...}},
    {"custom_id": "analyze-1", "params": {"model": "claude-opus-4-6", ...}},
]
```

**Combining with prompt caching**: For batches with shared context (like analyzing the same document with different questions), include identical `cache_control` blocks in every request to maximize cache hits [1]:

```python
system = [
    {"type": "text", "text": "You are an analyst."},
    {"type": "text", "text": large_document, "cache_control": {"type": "ephemeral"}}
]

requests = [
    {"custom_id": f"q-{i}", "params": {"model": "claude-sonnet-4-6", "system": system, "messages": [{"role": "user", "content": q}]}}
    for i, q in enumerate(questions)
]
```

**Splitting large datasets**: For datasets exceeding 100,000 requests, split into multiple batches and track them with a naming convention in `custom_id` (e.g., `batch1-request-001`) [1].

**Retry logic for failures**: Build retry handling that resubmits only failed requests [1]:

```python
failed_requests = [
    r for r in results
    if r.result.type in ("errored", "expired")
    and r.result.error.type != "invalid_request"  # Don't retry validation errors
]
```

## Gotchas

**Results are unordered**: The most common mistake is assuming results return in the same order as submitted requests. Always use `custom_id` to match results to their original requests [1].

**Validation is asynchronous**: Unlike the synchronous Messages API, parameter validation errors are not returned immediately. You will only discover invalid requests when the batch processing ends [1]. Always test individual request shapes with the Messages API before batch submission [1].

**24-hour hard limit**: Batches that do not complete within 24 hours will have remaining requests marked as `expired` [1]. During high-demand periods or with very large batches, this can happen. Plan for retry logic.

**Spend limits may be exceeded**: Due to concurrent processing, batches may slightly exceed your Workspace's configured spend limit [1]. If budget control is critical, monitor batch costs closely.

**29-day result retention**: Results are only available for 29 days after batch creation (not completion) [1]. Download and store results promptly for long-term needs.

**No streaming support**: While the Messages API supports streaming, batch requests cannot use streaming since they are processed asynchronously [1].

**Rate limits are separate**: The Batch API has its own rate limits (requests per minute to batch endpoints, and number of requests in the processing queue) that are independent of Messages API rate limits [1]. Creating a batch with thousands of requests counts against the queue limit.

**ZDR not supported**: The Message Batches API is not covered by Zero Data Retention arrangements [1]. If ZDR is a requirement for your use case, you cannot use the Batch API.

**Cache hit rates vary**: Prompt caching with batches provides 30-98% cache hit rates, not guaranteed hits [1]. The asynchronous, concurrent nature of batch processing means cache entries may expire before related requests are processed.

## Sources

[1] **Batch processing - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/batch-processing
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete guide on batch processing including limits (100K requests/256MB), pricing (50% discount), processing workflow, result types, prompt caching integration, best practices, troubleshooting, and FAQ. Main source for implementation details, code examples in Python/TypeScript/Shell/Java, and gotchas.

[2] **Create a Message Batch - Claude API Reference**
    URL: https://platform.claude.com/docs/en/api/creating-message-batches
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: API endpoint specification, request/response schemas, required headers, custom_id and params structure, processing_status values, available models list, and example curl request.

[3] **Introducing the Message Batches API - Anthropic Blog**
    URL: https://www.anthropic.com/news/message-batches-api
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Background on the feature launch and high-level benefits (50% cost savings, 24-hour processing, enhanced throughput).
