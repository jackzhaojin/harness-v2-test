# Image Formats and Limits

**Topic ID:** multimodal.vision.image-formats
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude's vision capabilities enable multimodal interactions where users can include images alongside text prompts. Understanding the supported formats, size constraints, and optimization strategies is essential for building reliable applications that leverage Claude's image analysis features [1].

The API enforces strict dimensional and file size limits that differ between single-image and multi-image requests. Images exceeding these thresholds are either automatically downscaled (within certain bounds) or rejected outright with an error [1]. Knowing these limits prevents runtime failures and helps optimize for both performance and cost, since image tokens directly impact API pricing [1].

Images can be provided via three methods: base64-encoded data inline in the request, URL references to hosted images, or through the Files API for reusable uploads [1]. Each approach has tradeoffs in terms of request size, latency, and convenience for repeated use.

## Key Concepts

- **Supported Formats** — Claude accepts four image formats: JPEG, PNG, GIF, and WebP. The corresponding MIME types are `image/jpeg`, `image/png`, `image/gif`, and `image/webp` [1]. Formats like BMP, TIFF, and SVG are not supported and must be converted before upload [2].

- **Maximum Dimensions** — Single images or requests with 20 or fewer images are limited to 8000x8000 pixels [1]. Requests with more than 20 images have a stricter limit of 2000x2000 pixels per image [1].

- **Optimal Dimensions** — For best performance, keep images within 1568 pixels on the longest edge and under 1.15 megapixels total [1]. Images exceeding these thresholds are automatically downscaled, which adds latency without improving analysis quality [1].

- **File Size Limits** — The API enforces a 5MB per-image limit; claude.ai allows up to 10MB per image [1]. The total API request payload cannot exceed 32MB [1].

- **Image Count Limits** — The Messages API supports up to 100 images per request; claude.ai allows up to 20 images per conversation turn [1].

- **Token Calculation** — Image tokens are calculated as: `tokens = (width * height) / 750` [1]. A 1000x1000 pixel image consumes approximately 1,334 tokens [1].

- **Minimum Size** — Images smaller than 200 pixels on any edge may degrade analysis quality [1].

- **Animated GIFs** — Only the first frame of animated GIFs is analyzed [2]. For animations, upload multiple static frames as separate images.

## Technical Details

### Image Source Types

Images can be provided in three ways within the Messages API [1]:

**Base64-encoded inline:**
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "<base64-encoded-data>"
  }
}
```

**URL reference:**
```json
{
  "type": "image",
  "source": {
    "type": "url",
    "url": "https://example.com/image.jpg"
  }
}
```

**Files API reference:**
```json
{
  "type": "image",
  "source": {
    "type": "file",
    "file_id": "file_abc123"
  }
}
```

### Dimension Constraints Table

| Constraint | Limit |
|------------|-------|
| Max dimensions (1-20 images) | 8000 x 8000 px [1] |
| Max dimensions (>20 images) | 2000 x 2000 px [1] |
| Optimal long edge | 1568 px [1] |
| Optimal total resolution | 1.15 megapixels [1] |
| Minimum recommended | 200 px any edge [1] |
| Max images per API request | 100 [1] |
| Max images per claude.ai turn | 20 [1] |
| Max file size (API) | 5 MB [1] |
| Max file size (claude.ai) | 10 MB [1] |
| Max request payload | 32 MB [1] |

### Optimal Sizes by Aspect Ratio

These sizes use approximately 1,600 tokens and avoid automatic downscaling [1]:

| Aspect Ratio | Optimal Size |
|--------------|--------------|
| 1:1 | 1092 x 1092 px |
| 3:4 | 951 x 1268 px |
| 2:3 | 896 x 1344 px |
| 9:16 | 819 x 1456 px |
| 1:2 | 784 x 1568 px |

### Token Cost Examples

Based on Claude Opus 4.6 pricing at $3 per million input tokens [1]:

| Image Size | Tokens | Cost per Image | Cost per 1K Images |
|------------|--------|----------------|-------------------|
| 200 x 200 px | ~54 | ~$0.00016 | ~$0.16 |
| 1000 x 1000 px | ~1,334 | ~$0.004 | ~$4.00 |
| 1092 x 1092 px | ~1,590 | ~$0.0048 | ~$4.80 |

## Common Patterns

### Pre-processing Images Before Upload

Resize images client-side to avoid server-side downscaling latency. Using a library like Sharp in Node.js [1]:

```javascript
const sharp = require('sharp');

async function prepareImage(inputPath) {
  return await sharp(inputPath)
    .resize(1568, 1568, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}
```

### Multiple Image Comparison

When comparing images, label them explicitly in the prompt structure [1]:

```python
messages=[
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "Image 1:"},
            {"type": "image", "source": {"type": "url", "url": url1}},
            {"type": "text", "text": "Image 2:"},
            {"type": "image", "source": {"type": "url", "url": url2}},
            {"type": "text", "text": "How are these images different?"},
        ],
    }
]
```

### Image Placement Best Practice

Place images before text in prompts for optimal analysis. Claude performs best when images precede the questions or instructions about them [1].

## Gotchas

- **Multi-image dimension trap** — The 2000x2000 pixel limit kicks in when you exceed 20 images in a single request [1]. A batch of 25 images that each worked individually at 4000x3000 pixels will fail when combined [3].

- **Session corruption on oversized images** — In Claude Code, submitting an image exceeding 8000 pixels can permanently brick the session, requiring `/clear` to recover [3]. The error persists even for subsequent valid requests.

- **Automatic downscaling adds latency** — Large images are silently downscaled, but this happens server-side and increases time-to-first-token without improving quality [1]. Pre-resize to avoid the penalty.

- **No metadata parsing** — Claude does not read EXIF or other image metadata [1]. Orientation information embedded in metadata is ignored, which can cause rotated images to be analyzed incorrectly.

- **GIF animation limitation** — Only the first frame of animated GIFs is processed [2]. If you need multiple frames analyzed, extract and upload them as separate static images.

- **Unsupported formats silently confuse** — BMP, TIFF, and SVG are not supported [2]. Convert these to PNG or JPEG before upload rather than expecting an informative error.

- **32MB total payload limit** — Even if individual images are under 5MB, a request with many images can exceed the 32MB total payload limit [1]. With base64 encoding overhead (33% larger than binary), 20 images at 2MB each approaches this limit.

- **Minimum size matters** — Images under 200 pixels on any edge may produce degraded analysis [1]. Thumbnails and icons may not analyze well.

- **No AI-generated image detection** — Claude cannot reliably determine if an image is AI-generated or synthetic [1]. Do not rely on it for authenticity verification.

## Sources

[1] **Vision - Anthropic Claude API Documentation**
    URL: https://platform.claude.com/docs/en/docs/build-with-claude/vision
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive details on supported formats (JPEG, PNG, GIF, WebP), dimension limits (8000x8000 for single/few images, 2000x2000 for >20 images), optimal dimensions (1568px long edge, 1.15 megapixels), file size limits (5MB API, 10MB claude.ai), token calculation formula, image count limits (100 API, 20 claude.ai), 32MB request limit, code examples for base64/URL/Files API methods, optimal sizes by aspect ratio, cost calculations, placement best practices, and limitations.

[2] **Uploading Files to Claude - Claude Help Center**
    URL: https://support.claude.com/en/articles/8241126-uploading-files-to-claude
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Confirmation of supported formats, 30MB claude.ai limit mentioned (may vary by interface), recommendation for 1000x1000 minimum for best results, note that animated GIFs only have first frame analyzed, and that unsupported formats (BMP, TIFF, SVG) need conversion.

[3] **GitHub Issues - Claude Code Image Dimension Errors**
    URL: https://github.com/anthropics/claude-code/issues/12351
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Documentation of the 8000-pixel and 2000-pixel (multi-image) error messages, session corruption behavior when limits are exceeded, and community workarounds including manual image resizing and session recovery via /clear command.
