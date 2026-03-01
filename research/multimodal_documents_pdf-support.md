# PDF Processing

**Topic ID:** multimodal.documents.pdf-support
**Researched:** 2026-03-01T12:00:00Z

## Overview

PDF processing in the Claude API enables extraction and analysis of both textual and visual content from PDF documents. When you submit a PDF, Claude converts each page into an image while simultaneously extracting the text, allowing it to understand charts, diagrams, tables, and other visual elements alongside the written content. This dual-processing approach makes Claude effective for document analysis tasks that require comprehending both what is written and what is visually represented.

The feature operates through the Messages API using a `document` content block type. You can provide PDFs via URL reference, base64 encoding, or the Files API. All active Claude models support PDF processing, with availability on direct API access and Google Vertex AI. Amazon Bedrock also supports PDFs but with specific constraints around visual analysis requiring citations to be enabled.

Common use cases include analyzing financial reports with embedded charts, extracting key information from legal documents, translating document content, and converting complex document data into structured formats. The token cost combines both text extraction (1,500-3,000 tokens per page) and image processing costs since each page is rendered as an image.

## Key Concepts

- **Document content block**: The API structure for including PDFs in requests. Uses `"type": "document"` with a `source` object specifying how the PDF is provided (URL, base64, or file_id).

- **Dual-mode processing**: Claude processes PDFs by converting pages to images AND extracting text simultaneously. This enables analysis of visual elements like charts and diagrams that pure text extraction would miss.

- **Three input methods**: PDFs can be provided via URL reference (simplest for hosted files), base64 encoding (for local files or when URLs unavailable), or Files API file_id (for reusable documents).

- **Files API**: A beta feature (`anthropic-beta: files-api-2025-04-14`) allowing upload-once, use-many-times workflow. Upload returns a `file_id` that can be referenced in subsequent requests without re-uploading.

- **Token calculation**: Costs combine text tokens (content density dependent, typically 1,500-3,000 per page) plus image tokens (each page rendered as image using standard vision pricing).

- **Prompt caching**: Use `cache_control: {"type": "ephemeral"}` on document blocks to cache PDFs for repeated queries, improving performance and reducing costs.

- **Batch processing**: The Message Batches API supports PDF processing for high-volume workflows with multiple documents.

## Technical Details

### Request Structure

PDFs are included as content blocks within messages:

```python
import anthropic
import base64

client = anthropic.Anthropic()

# Option 1: URL-based
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "url",
                    "url": "https://example.com/document.pdf"
                }
            },
            {"type": "text", "text": "Summarize this document."}
        ]
    }]
)

# Option 2: Base64-encoded
with open("document.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": pdf_data
                }
            },
            {"type": "text", "text": "What are the key findings?"}
        ]
    }]
)
```

### Files API Integration

```python
# Upload once
with open("document.pdf", "rb") as f:
    file_upload = client.beta.files.upload(
        file=("document.pdf", f, "application/pdf")
    )

# Use repeatedly via file_id
message = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    betas=["files-api-2025-04-14"],
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {"type": "file", "file_id": file_upload.id}
            },
            {"type": "text", "text": "Analyze this document."}
        ]
    }]
)
```

### Limits

| Constraint | Value |
|------------|-------|
| Maximum request size | 32 MB |
| Maximum pages per request | 100 |
| Files API max file size | 500 MB |
| Files API org storage | 100 GB |
| Format | Standard PDF (no passwords/encryption) |

### Caching for Repeated Queries

```python
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": pdf_data
                },
                "cache_control": {"type": "ephemeral"}
            },
            {"type": "text", "text": "First question about the document."}
        ]
    }]
)
```

## Common Patterns

### Document Analysis Pipeline

For production document processing:
1. Upload documents via Files API to get reusable file_ids
2. Enable caching for documents that will receive multiple queries
3. Place PDF content blocks before text in requests (best practice per docs)
4. Use batch processing for high-volume workflows

### Financial Report Analysis

```python
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {"type": "file", "file_id": annual_report_id}
            },
            {
                "type": "text",
                "text": "Extract Q4 revenue figures from the charts and compare year-over-year growth."
            }
        ]
    }]
)
```

### Multi-Document Comparison

Include multiple document blocks in a single request:

```python
messages=[{
    "role": "user",
    "content": [
        {"type": "document", "source": {"type": "file", "file_id": contract_v1_id}},
        {"type": "document", "source": {"type": "file", "file_id": contract_v2_id}},
        {"type": "text", "text": "What clauses changed between these contract versions?"}
    ]
}]
```

### Structured Data Extraction

```python
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "document", "source": {"type": "file", "file_id": invoice_id}},
            {
                "type": "text",
                "text": """Extract invoice data as JSON:
                {"vendor": "", "invoice_number": "", "date": "", "line_items": [], "total": ""}"""
            }
        ]
    }]
)
```

## Gotchas

- **Amazon Bedrock visual analysis requires citations**: When using the Converse API on Bedrock, visual PDF understanding (charts, images, diagrams) only works if you enable citations. Without citations, it falls back to basic text extraction only. Use InvokeModel API if you need visual analysis without citations.

- **Token costs are higher than expected**: Each page incurs BOTH text tokens AND image tokens since pages are converted to images. A 3-page PDF might use ~7,000 tokens with full visual analysis versus ~1,000 tokens for text-only extraction.

- **100-page hard limit**: Exceeding 100 pages returns an error. For larger documents, split into chunks before processing.

- **Password-protected/encrypted PDFs fail**: Only standard, unencrypted PDFs are supported.

- **Files API is beta**: Requires header `anthropic-beta: files-api-2025-04-14`. Not covered by Zero Data Retention arrangements.

- **Handwritten or stylized fonts**: Complex handwriting or unusual fonts may challenge text extraction accuracy.

- **Page orientation matters**: Rotate pages to proper upright orientation for best results.

- **Files API not on Bedrock/Vertex**: The Files API currently only works with direct API access, not Amazon Bedrock or Google Vertex AI.

- **Uploaded files cannot be downloaded**: You can only download files created by skills or the code execution tool, not files you uploaded.

- **Use logical page numbers**: When prompting about specific pages, use page numbers as shown in a PDF viewer, not internal indices.

## Sources

- [PDF Support - Anthropic Documentation](https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support) — Official documentation covering all methods to provide PDFs, supported models, token costs, best practices, and code examples in multiple languages.

- [Files API - Anthropic Documentation](https://platform.claude.com/docs/en/docs/build-with-claude/files) — Official documentation on the Files API beta including upload, download, file management, supported file types, storage limits, and integration patterns.

- [Claude API: PDF Support (beta) - Simon Willison](https://simonwillison.net/2024/Nov/1/claude-api-pdf-support-beta/) — Developer perspective on PDF support release, practical usage patterns with llm-claude-3 plugin, and notes on the complementary token counting API.
