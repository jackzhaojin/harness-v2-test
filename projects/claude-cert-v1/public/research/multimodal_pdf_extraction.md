# PDF Content Extraction

**Topic ID:** multimodal.pdf.extraction
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude processes PDFs through a dual-modal approach: the system extracts text content from each page while simultaneously converting each page into an image [1]. This combined text-and-image processing allows Claude to understand both the textual content and visual elements like charts, diagrams, tables, and graphics within the same document [1]. The approach differs from traditional text-only PDF parsing by enabling analysis of visual layouts, relationships between elements, and non-textual content.

Each PDF page typically consumes 1,500 to 3,000 tokens depending on content density, with standard API pricing applied and no additional PDF-specific fees [1]. Since pages are also converted to images, image-based token costs apply as well [1]. This makes understanding token economics critical for cost estimation, especially when processing large document volumes. For PDFs under 100 pages, Claude provides full visual analysis including charts and graphics; PDFs over 1,000 pages receive text-only processing [2].

The capability supports use cases including financial report analysis with charts and tables, legal document extraction, translation assistance, and converting document information into structured formats like JSON [1]. Claude can cite passages, report page numbers, and reformat content into various output types.

## Key Concepts

- **Dual-Modal Processing** — Every PDF page is both text-extracted and image-converted, feeding both streams to Claude's reasoning engine [1]. This enables understanding of content placement, visual relationships, and non-textual elements that pure text extraction would miss.

- **Token Economics** — PDF processing has two cost components: text tokens (1,500-3,000 per page based on density) and image tokens (calculated using `tokens = (width * height) / 750`) [1][3]. A standard page at 1092x1092 pixels uses approximately 1,590 image tokens [3].

- **Three Input Methods** — PDFs can be submitted via URL reference, base64 encoding in document blocks, or through the Files API using a `file_id` [1]. The Files API is recommended for repeated use to avoid re-sending large files.

- **Automatic OCR** — For scanned PDFs lacking a text layer, Claude performs automatic optical character recognition on documents under 100 pages, available in all 4.x models without requiring special flags [2].

- **Page Limits** — Maximum of 100 pages per PDF for full visual+text analysis; 32MB maximum file size; must be unencrypted standard PDFs [1].

- **Amazon Bedrock Citations Requirement** — When using PDF support through Bedrock's Converse API, citations must be enabled to access full visual PDF understanding; without it, the API falls back to basic text extraction only [1].

- **Document Content Blocks** — PDFs are passed using `type: "document"` content blocks with source specifications for URL, base64, or file references [1].

## Technical Details

### API Request Structure

PDFs are included in the messages array using document content blocks. Here is the URL-based approach [1]:

```python
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/document.pdf"
                    }
                },
                {"type": "text", "text": "What are the key findings?"}
            ]
        }
    ]
)
```

For base64 encoding with local files [1]:

```python
import base64

with open("document.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
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
                {"type": "text", "text": "Summarize this document."}
            ]
        }
    ]
)
```

### Files API Approach

For repeated document analysis, upload once and reference by ID [1]:

```python
# Upload the PDF file
with open("document.pdf", "rb") as f:
    file_upload = client.beta.files.upload(
        file=("document.pdf", f, "application/pdf")
    )

# Use the uploaded file in messages
message = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    betas=["files-api-2025-04-14"],
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {"type": "file", "file_id": file_upload.id}
                },
                {"type": "text", "text": "Extract the data tables."}
            ]
        }
    ]
)
```

### Prompt Caching for Repeated Analysis

Enable caching to improve performance when asking multiple questions about the same PDF [1]:

```python
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
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
                {"type": "text", "text": "Analyze this document."}
            ]
        }
    ]
)
```

### Token Cost Calculation

For images (and thus PDF pages rendered as images) [3]:

| Image Size | Approximate Tokens | Cost per Image (Claude Opus 4.6) |
|------------|-------------------|----------------------------------|
| 200x200 px | ~54 | ~$0.00016 |
| 1000x1000 px | ~1,334 | ~$0.004 |
| 1092x1092 px | ~1,590 | ~$0.0048 |

## Common Patterns

**Financial Report Analysis**: Extract data from annual reports including understanding visual charts, interpreting key metrics from tables, and summarizing trends across multiple pages [1]. Claude can cross-reference chart visuals with textual explanations.

**Legal Document Summarization**: Quickly extract essential clauses, key terms, and obligations from contracts [1]. Claude can identify specific sections and cite page numbers in responses.

**Structured Data Extraction**: Convert tabular data from PDFs into JSON or other structured formats [2]. This is valuable for invoice processing, form extraction, and data migration workflows.

**Batch Processing for High Volume**: Use the Message Batches API for processing many documents [1]:

```python
message_batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "doc1",
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
                                    "data": pdf_data
                                }
                            },
                            {"type": "text", "text": "Summarize this document."}
                        ]
                    }
                ]
            }
        }
    ]
)
```

**Tool Use Integration**: Extract specific information from documents for use as inputs to other tools, enabling automated document-to-action workflows [1].

## Gotchas

**Amazon Bedrock Converse API Trap**: This is a critical exam topic. The Converse API has two modes: without citations enabled, it falls back to basic text extraction only and cannot analyze charts, images, or visual layouts [1]. Developers who forget to enable citations will wonder why Claude "cannot see" their charts. Token usage also differs dramatically: ~1,000 tokens for a 3-page PDF in text-only mode vs ~7,000 tokens in full visual mode [1].

**100-Page Cliff**: PDFs with more than 100 pages lose visual analysis capabilities entirely [1][2]. Claude will only process extracted text, missing charts, diagrams, and visual layouts. To work around this, split large PDFs into smaller segments [2].

**32MB Applies to Entire Request**: The 32MB limit applies to the entire request payload, not just the PDF [1]. If you are sending multiple files or additional content alongside PDFs, you may hit this limit unexpectedly.

**Request Size vs Per-File Limits**: These are distinct constraints. While there is a 32MB request limit, individual PDFs must also meet page and size requirements. Very large PDFs with many pages should be segmented.

**OCR Quality Variability**: For scanned documents, OCR accuracy depends heavily on scan quality [2]. Low resolution, unusual fonts, rotated pages, or heavy degradation can produce errors. Consider preprocessing (deskewing, quality enhancement) before submitting problematic scans.

**Vision Limitations Apply**: Since PDF support relies on Claude's vision capabilities, all standard vision limitations apply [1][3]. These include difficulties with precise spatial reasoning, counting large numbers of small objects, and interpreting very small text (under 200 pixels).

**Image Sizing Before Pages Are Rendered**: If page images exceed 8000x8000 pixels, they are rejected; images over 1568 pixels on the long edge are resized [3]. This adds latency without improving performance.

**Precise Numeric Extraction Limitations**: Claude excels at trend detection and pattern recognition in charts but is not optimized for extracting precise numeric values from image-only charts unless values are clearly labeled [4]. For exact numbers, supplement with underlying tabular data.

**Very Large Tables**: Tables exceeding approximately 100 rows may need to be split across multiple prompts or images for accurate extraction [2]. Handwritten annotations within tables parse poorly.

## Sources

[1] **PDF support - Anthropic Platform Documentation**
    URL: https://platform.claude.com/docs/en/build-with-claude/pdf-support
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core PDF processing mechanics, API code examples, token costs (1,500-3,000 per page), page limits (100 pages, 32MB), three input methods (URL, base64, Files API), Amazon Bedrock citations requirement, prompt caching and batch processing patterns, best practices for document placement and optimization.

[2] **How Claude Reads PDF Files in 2025: Workflow, Capabilities, and Limitations - DataStudios**
    URL: https://www.datastudios.org/post/how-claude-reads-pdf-files-in-2025-workflow-capabilities-and-limitations
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Dual-modal processing explanation, automatic OCR for scanned documents in 4.x models, 100-page visual analysis limit, text-only processing for 1000+ page PDFs, OCR quality considerations, large table handling limitations.

[3] **Vision - Anthropic Platform Documentation**
    URL: https://platform.claude.com/docs/en/build-with-claude/vision
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Image token calculation formula (width * height / 750), image size limits (8000x8000 max, 1568 resize threshold), cost tables for image processing, vision-specific limitations (spatial reasoning, counting, small objects), supported formats, quality best practices.

[4] **Claude Vision: Practical Use Cases for Images, PDFs, and Diagrams - C-AI Chat**
    URL: https://c-ai.chat/blog/claude-vision/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Limitations on precise numeric extraction from charts, accuracy concerns with small fonts and dense tables, recommendation to supplement with tabular data for exact values.
