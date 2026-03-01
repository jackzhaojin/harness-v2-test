# Combined Research: Multimodal Capabilities


---

# Image Processing and Analysis

**Topic ID:** multimodal.vision.image-processing
**Researched:** 2025-03-01T00:00:00Z

## Overview

Claude's vision capabilities enable the model to understand and analyze images as part of multimodal interactions. All Claude 3 and Claude 4 family models support image input, allowing developers to pass visual content alongside text prompts. This opens powerful use cases including document analysis, chart interpretation, UI screenshot debugging, OCR-style text extraction, and converting unstructured visual content into structured data formats like JSON.

Image processing in Claude works through the Messages API, where images are included as content blocks within user messages. The model processes visual information contextually—it doesn't just describe what it sees, but reasons about the content in relation to the accompanying text prompt. This makes Claude particularly effective for tasks requiring interpretation rather than pure perception, such as understanding what a chart reveals about trends rather than simply listing its data points.

The key constraint to understand: Claude is an image understanding model only. It can interpret, analyze, and extract information from images, but it cannot generate, edit, or manipulate images. For structured data extraction workflows, Claude's vision pairs effectively with tool use or JSON output modes to guarantee schema-compliant responses.

## Key Concepts

- **Content Blocks**: Images are passed to Claude as content blocks within the `messages` array. Each image block specifies a source type (base64, URL, or file) and the image data or reference.

- **Supported Formats**: Claude accepts JPEG, PNG, GIF, and WebP images (`image/jpeg`, `image/png`, `image/gif`, `image/webp`).

- **Image Limits**: The API supports up to 100 images per request (20 for claude.ai). Single images can be up to 8000×8000 pixels; when submitting more than 20 images, the limit drops to 2000×2000 pixels per image.

- **Token Calculation**: Image tokens are calculated as `(width × height) / 750`. A 1092×1092 image uses approximately 1,590 tokens.

- **Request Size Limit**: The API enforces a 32MB total request size limit, and individual images are capped at 5MB (10MB for claude.ai).

- **Image-First Ordering**: Claude performs best when images appear before the text prompt in the content array. While images placed after text still work, the image-then-text structure is recommended.

- **Structured Outputs**: Claude's vision can be combined with tool use or JSON output mode to extract data conforming to a specific schema, using constrained decoding to guarantee valid output.

## Technical Details

### Three Methods for Providing Images

**1. Base64 Encoding**
```python
import base64
from anthropic import Anthropic

client = Anthropic()

with open("document.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_data
                }
            },
            {"type": "text", "text": "Extract all text from this document."}
        ]
    }]
)
```

**2. URL Reference**
```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "url",
                    "url": "https://example.com/chart.png"
                }
            },
            {"type": "text", "text": "What trend does this chart show?"}
        ]
    }]
)
```

**3. Files API** (for repeated use)
```python
# Upload once
with open("image.jpg", "rb") as f:
    file_upload = client.beta.files.upload(file=("image.jpg", f, "image/jpeg"))

# Use file_id in subsequent requests
message = client.beta.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    betas=["files-api-2025-04-14"],
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "file", "file_id": file_upload.id}},
            {"type": "text", "text": "Describe this image."}
        ]
    }]
)
```

### Multiple Images

Label images explicitly when comparing or referencing multiple visuals:

```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Image 1:"},
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image1_data}},
            {"type": "text", "text": "Image 2:"},
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image2_data}},
            {"type": "text", "text": "Compare these two charts and identify key differences."}
        ]
    }]
)
```

### Structured Data Extraction with Tool Use

Use tool definitions to extract JSON-structured data from images:

```python
tools = [{
    "name": "extract_invoice_data",
    "description": "Extracts structured data from an invoice image.",
    "input_schema": {
        "type": "object",
        "properties": {
            "vendor_name": {"type": "string"},
            "invoice_number": {"type": "string"},
            "date": {"type": "string", "description": "Invoice date in YYYY-MM-DD format"},
            "total_amount": {"type": "number"},
            "line_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "quantity": {"type": "integer"},
                        "unit_price": {"type": "number"}
                    },
                    "required": ["description", "quantity", "unit_price"]
                }
            }
        },
        "required": ["vendor_name", "invoice_number", "date", "total_amount"]
    }
}]

response = client.messages.create(
    model="claude-sonnet-4-5-20250514",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": invoice_image}},
            {"type": "text", "text": "Extract all invoice information from this image."}
        ]
    }]
)

# Parse the tool use response
for block in response.content:
    if block.type == "tool_use" and block.name == "extract_invoice_data":
        invoice_data = block.input
```

## Common Patterns

**Document Processing Pipeline**: Upload documents as images, use Claude to extract text and structure, then output as JSON. Works well for invoices, forms, receipts, and contracts.

**Chart/Graph Interpretation**: Pass visualization images and ask for trend analysis, data point extraction, or anomaly identification. Request interpretation over description for better results.

**Multi-Image Comparison**: Include multiple images in one request for A/B comparisons, before/after analysis, or document page sequences.

**OCR with Context**: Extract text from screenshots or photos while preserving semantic meaning. Claude understands layout and can distinguish headers from body text.

**Staged Analysis**: For complex documents, use a multi-turn approach: first request a broad overview, then follow up with specific questions about sections or figures.

**Optimal Image Sizing**: Resize images to around 1.15 megapixels (max 1568px on longest edge) before upload. This reduces latency without sacrificing quality. Let the API handle sizing only when necessary.

## Gotchas

- **No Person Identification**: Claude cannot and will not identify (name) specific individuals in images. This is a policy constraint, not a technical limitation.

- **Spatial Reasoning Limitations**: Claude struggles with precise localization tasks—reading analog clock faces, describing exact chess piece positions, or identifying specific pixel coordinates.

- **Approximate Counting**: Object counts are estimates, especially for large numbers of small items. Don't rely on Claude for exact inventory counts.

- **Low-Quality Image Degradation**: Images under 200 pixels on any edge, or blurry/rotated images, significantly reduce accuracy. Always verify critical extractions from poor-quality inputs.

- **Base64 Format Specifics**: The API expects raw base64 data, not data URLs. Do not include the `data:image/png;base64,` prefix—just the encoded string.

- **Token Costs Add Up**: Large images consume significant tokens. A 1000×1000 image costs ~1,334 tokens. For batch processing, resize images proactively.

- **Structured Output Limitations**: When using JSON schema constraints, `additionalProperties` must be `false`. Citations are incompatible with structured outputs.

- **No Metadata Access**: Claude does not parse or receive EXIF or other image metadata.

- **AI Image Detection**: Claude cannot reliably determine if an image is AI-generated. Don't use it for synthetic image detection.

- **Healthcare Restrictions**: While Claude can analyze general medical images, it's not designed for diagnostic imaging like CTs or MRIs. Never substitute Claude's output for professional medical diagnosis.

## Sources

- [Vision - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/vision) — Official documentation covering image formats, limits, API structure, and code examples
- [Getting started - how to pass images into Claude](https://platform.claude.com/cookbook/multimodal-getting-started-with-vision) — Cookbook with practical code patterns for base64 and URL-based image handling
- [Extracting structured JSON using Claude and tool use](https://platform.claude.com/cookbook/tool-use-extracting-structured-json) — Tool use patterns for structured data extraction with schema definitions
- [Claude Vision for Document Analysis - GetStream](https://getstream.io/blog/anthropic-claude-visual-reasoning/) — Developer guide on document analysis patterns and prompt engineering for vision tasks
- [Structured outputs - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — Documentation on JSON output mode and strict tool use for schema-guaranteed responses


---

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

