# PDF Batch Processing

**Topic ID:** multimodal.pdf.batch-processing
**Researched:** 2026-03-01T09:30:00Z

## Overview

PDF batch processing with Claude combines two powerful API features: native PDF understanding and the Message Batches API for high-volume asynchronous processing. When Claude processes a PDF, the system extracts document contents and converts each page into an image, enabling analysis of both textual content and visual elements like charts, tables, and diagrams [1]. This dual-mode processing allows Claude to answer questions about any content within a PDF, from text extraction to visual chart interpretation.

The Message Batches API enables processing up to 100,000 requests or 256 MB per batch asynchronously, with a 50% cost reduction on all tokens compared to synchronous API calls [2]. For high-volume document workflows—such as processing hundreds of invoices, analyzing legal contract portfolios, or extracting data from annual reports—this combination delivers significant cost savings and throughput improvements. Most batches complete within one hour, though the system allows up to 24 hours for completion [2].

Tool use integration transforms PDF processing from simple Q&A into structured data extraction pipelines [3]. By defining JSON schemas for expected outputs, Claude can extract specific information from documents—invoice line items, contract clauses, financial figures—in validated, machine-readable formats suitable for downstream processing.

## Key Concepts

- **PDF Document Content Blocks** — PDFs are sent to Claude as `document` content blocks with three source options: URL reference, base64 encoding, or file_id from the Files API [1]. The `type: "document"` block is used alongside text blocks in the messages array.

- **Page-to-Image Conversion** — When processing a PDF, Claude converts each page into an image and extracts text simultaneously [1]. This enables visual understanding of charts, graphs, diagrams, and layouts that pure text extraction would miss.

- **Message Batches API** — Anthropic's asynchronous processing endpoint that accepts up to 100,000 requests (or 256 MB total) per batch [2]. Each request includes a `custom_id` for result matching and standard Messages API parameters.

- **50% Batch Discount** — All batch processing usage is charged at half the standard API prices for both input and output tokens [2]. This stacks with other optimizations like prompt caching.

- **Structured Outputs** — JSON schema-constrained responses using `output_config.format` that guarantee valid, parseable output matching your defined schema [3]. Essential for reliable data extraction pipelines.

- **Strict Tool Use** — Tool definitions with `strict: true` that guarantee Claude's tool calls will have correctly-typed parameters matching your `input_schema` [3]. Eliminates parsing errors in agentic workflows.

- **Prompt Caching for Batches** — Adding `cache_control: {"type": "ephemeral"}` to document blocks enables cache reuse across batch requests [2]. Cache hits in batches are best-effort, with typical hit rates of 30-98% depending on traffic patterns.

- **Custom ID Matching** — Each batch request requires a unique `custom_id` string [2]. Results are returned in arbitrary order, so custom IDs are essential for matching responses to their original requests.

## Technical Details

### PDF Processing Limits

| Requirement | Limit |
|------------|--------|
| Maximum request size | 32 MB |
| Maximum pages per request | 100 |
| Format | Standard PDF (no passwords/encryption) |

Token costs per page range from 1,500-3,000 tokens for text plus image-based calculations for each page render [1].

### Batch API Constraints

| Constraint | Value |
|-----------|-------|
| Maximum requests per batch | 100,000 |
| Maximum batch size | 256 MB |
| Processing time | Most < 1 hour, max 24 hours |
| Results availability | 29 days after creation |
| Scope | Workspace-isolated |

### Creating a PDF Batch Request

```python
import anthropic

client = anthropic.Anthropic()

message_batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "invoice-001",
            "params": {
                "model": "claude-opus-4-6",
                "max_tokens": 1024,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": "application/pdf",
                                    "data": pdf_data_base64,
                                },
                            },
                            {"type": "text", "text": "Extract the invoice number, date, and total amount."},
                        ],
                    }
                ],
            },
        }
        # Add more requests for additional PDFs
    ]
)
```

This example is adapted from the official documentation [1][2].

### Structured Extraction with Tool Use

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_data},
                },
                {"type": "text", "text": "Extract all invoice data from this document."},
            ],
        }
    ],
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "invoice_number": {"type": "string"},
                    "date": {"type": "string"},
                    "total_amount": {"type": "number"},
                    "line_items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "description": {"type": "string"},
                                "quantity": {"type": "integer"},
                                "unit_price": {"type": "number"},
                            },
                            "required": ["description", "quantity", "unit_price"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["invoice_number", "date", "total_amount", "line_items"],
                "additionalProperties": False,
            },
        }
    },
)
```

This pattern combines PDF input with structured outputs for validated JSON extraction [1][3].

### Polling for Batch Completion

```python
import time

while True:
    message_batch = client.messages.batches.retrieve(batch_id)
    if message_batch.processing_status == "ended":
        break
    time.sleep(60)

# Stream results
for result in client.messages.batches.results(batch_id):
    if result.result.type == "succeeded":
        print(f"Success: {result.custom_id}")
    elif result.result.type == "errored":
        print(f"Error: {result.custom_id} - {result.result.error}")
```

Results are returned in `.jsonl` format, one JSON object per line [2].

## Common Patterns

### High-Volume Document Analysis Pipeline

For processing large document repositories, the recommended pattern combines prompt caching with batch processing [1][2]:

1. **Upload PDFs via Files API** — For PDFs used repeatedly, upload once and reference by `file_id` to avoid re-encoding overhead.

2. **Structure requests with caching** — Include `cache_control` blocks on shared system prompts or context to maximize cache hits across batch requests.

3. **Use meaningful custom IDs** — Match IDs to your internal document identifiers (e.g., `"invoice-2024-001"`) for easy result correlation.

4. **Stream results** — Use the results streaming endpoint rather than downloading the full results file to process responses efficiently.

### Structured Data Extraction at Scale

When extracting structured data from many similar documents [3]:

1. **Define a precise JSON schema** — Include all required fields and use `additionalProperties: false` for strict validation.

2. **Set a domain-specific system role** — "You are an Invoice Processing Specialist" helps Claude understand field semantics without explicit definitions.

3. **Split large PDFs** — For documents exceeding 100 pages, split into logical sections (chapters, years) and process as separate batch requests.

4. **Validate results** — Even with structured outputs, implement application-level validation for business rules (e.g., totals matching line item sums).

### Cost Optimization Strategy

Combine discounts for maximum savings [1][2]:

- **Batch discount**: 50% off input and output tokens
- **Prompt caching**: Up to 90% off cached input tokens
- **Combined**: Up to 95% savings under optimal conditions

For a 100-page PDF analyzed 10 times with different questions, caching the PDF content and using batch processing can reduce costs from ~$15 to under $1.

## Gotchas

- **Result order is not preserved** — Batch results return in arbitrary order, not request order [2]. Always use `custom_id` to match results to requests. This is a common source of bugs when developers assume sequential processing.

- **Amazon Bedrock PDF visual analysis requires citations** — When using the Converse API on Bedrock, visual PDF analysis (charts, images) only works with citations enabled [1]. Without citations, Bedrock falls back to basic text extraction only. Use InvokeModel API for visual analysis without forced citations.

- **Batch caching is best-effort** — Cache hits in batches range from 30-98% due to concurrent, asynchronous processing [2]. Don't assume consistent caching behavior across batch requests like you would with synchronous calls.

- **Structured outputs vs. prompt caching conflict** — Changing `output_config.format` invalidates prompt cache for that conversation thread [3]. Design your schema once and reuse it to maintain cache efficiency.

- **24-hour expiration** — Batches that don't complete within 24 hours will have remaining requests marked as `expired` [2]. Large batches during high-demand periods may hit this limit.

- **No Zero Data Retention for batches** — The Message Batches API is not covered by ZDR arrangements [2]. Data follows standard retention policies. Do not use for sensitive data requiring ZDR.

- **32 MB limit includes everything** — The 32 MB PDF limit applies to the entire request payload, including any other content [1]. If sending multiple PDFs or large prompts alongside a PDF, account for total size.

- **Encrypted PDFs fail silently** — Password-protected or encrypted PDFs are not supported [1]. Validate PDFs before batch submission to avoid wasted requests.

- **Grammar compilation latency** — First use of a JSON schema has additional latency for grammar compilation [3]. Compiled grammars cache for 24 hours. For time-sensitive batches, warm the cache with a single synchronous request first.

## Sources

[1] **PDF support - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/pdf-support
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: PDF processing limits (32MB, 100 pages), three input methods (URL, base64, Files API), page-to-image conversion mechanism, token cost estimates (1,500-3,000 per page), integration with batch processing and tool use, Bedrock citations requirement for visual analysis.

[2] **Batch processing - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/batch-processing
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Batch limits (100,000 requests, 256 MB), 50% pricing discount, processing time expectations, result retrieval patterns, cache_control usage for batches, ZDR exclusion, result ordering behavior, polling implementation, custom_id requirements.

[3] **Structured outputs - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: JSON schema constraints via output_config.format, strict tool use with strict: true, schema limitations, grammar compilation caching, Pydantic/Zod SDK integration, combined usage with tool use, prompt cache invalidation on schema change.

[4] **Introducing the Message Batches API | Claude Blog**
    URL: https://claude.com/blog/message-batches-api
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Use case examples (content moderation, data analysis, bulk content generation), cost optimization strategies, cache hit rate expectations (30-98%).

[5] **Tarka Labs - Extracting Structured Data from PDFs with Claude Sonnet**
    URL: https://tarkalabs.com/blogs/extracting-structured-data/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Domain-specific system role pattern, practical extraction workflow examples, Bedrock Converse API vs InvokeModel considerations.
