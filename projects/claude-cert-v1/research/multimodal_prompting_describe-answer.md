# Describe Then Answer Pattern

**Topic ID:** multimodal.prompting.describe-answer
**Researched:** 2026-03-01T12:00:00Z

## Overview

The Describe Then Answer pattern is a multimodal prompting technique that instructs Claude to first describe what it observes in an image before answering a specific question about it. This approach applies chain-of-thought reasoning to visual tasks, forcing the model to articulate its interpretation explicitly before committing to an answer [1][2]. The technique significantly improves accuracy and transparency, particularly for tasks involving counting objects, reading charts, analyzing complex diagrams, or interpreting visual information where mistakes are common.

The pattern works because it gives Claude "time to think" about the image, similar to how chain-of-thought prompting improves text-based reasoning [3]. By describing visual elements first, the model grounds its subsequent answer in concrete observations rather than jumping to potentially incorrect conclusions. This is especially valuable for high-stakes use cases where visual interpretation errors could have consequences.

The Describe Then Answer pattern fits within Claude's broader set of vision best practices, which emphasize structured prompting, image-before-text placement, and clear output formatting. It represents the intersection of two well-established techniques: multimodal input processing and chain-of-thought reasoning [2][3].

## Key Concepts

- **Chain-of-Thought for Vision** — Applying the same "think step-by-step" principle used in text tasks to visual analysis. This forces Claude to reason through what it sees before answering [2][3].

- **Thinking Tags** — XML tags like `<thinking>` and `<answer>` that separate Claude's reasoning process from its final output, making the analysis transparent and structured [3].

- **Image-Before-Text Placement** — Claude performs best when images come before text in the prompt. This ensures complete visual context is available before instructions are processed [2][4].

- **Role/Persona Setting** — Assigning Claude a role such as "a bird expert who has perfect vision and pays attention to detail" improves accuracy on visual tasks by setting appropriate expectations [2][5].

- **Grounded Responses** — The description phase anchors Claude's answer in concrete observations, reducing hallucinations and speculative responses [2][5].

- **Structured Output** — Using XML tags or explicit format instructions ensures Claude's description and answer are cleanly separated and easy to parse [3][4].

- **Multi-Step Visual Analysis** — For complex images, instructing Claude to analyze systematically (e.g., "left to right" or "section by section") prevents overlooking elements [2][5].

## Technical Details

The Describe Then Answer pattern can be implemented with varying levels of structure:

**Basic Pattern:**
```
First describe everything you observe in the image, then answer the question: [question]
```
This simple approach works for straightforward visual tasks [1].

**Structured Pattern with Thinking Tags:**
```python
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "url", "url": "image_url_here"}
                },
                {
                    "type": "text",
                    "text": """You are a detail-oriented analyst with perfect vision.

Before providing your answer in <answer> tags, take time to think in
<thinking> tags, analyzing each part of the image systematically.

Question: How many birds are in this picture?"""
                }
            ]
        }
    ]
)
```
This structured approach yields better results for complex counting or analysis tasks [2][3].

**With Role Assignment:**
```
You are a chart expert who has perfect vision and pays great attention to
detail. First describe all data points, labels, and visual elements you
observe. Then answer: What is the trend shown in this graph?
```
Role assignment combined with description improves accuracy significantly [2][5].

**Image Sizing Considerations:**
For optimal performance with the Describe Then Answer pattern, resize images to no more than 1.15 megapixels (within 1568 pixels in both dimensions). Very small images under 200 pixels may degrade performance. For small images, upsampling to 800 pixels on the longer edge has shown 3-4% improvement [4][5].

## Common Patterns

**Counting Objects:**
The most common use case where describe-then-answer excels. Direct counting often fails, but asking Claude to analyze systematically succeeds:
```
Before counting, describe where each [object] is located in the image,
going from left to right, top to bottom. Then provide your count in
<answer> tags.
```
This pattern improved accuracy from miscounting to correct identification in benchmark tests [2][5].

**Chart and Data Analysis:**
```
Analyze this chart and first describe:
1) All axis labels and scales
2) Each data series and its visual representation
3) Any annotations or legends

Then answer: What is the peak value shown?
```
Forcing explicit description of chart elements prevents misreading values [1][5].

**Document and Form Processing:**
```
First transcribe all text visible in this document, noting any headers,
tables, or structured sections. Then extract: [specific field]
```
Description ensures no content is overlooked during extraction [4].

**Complex Scene Understanding:**
```
Describe the scene systematically: background elements, main subjects,
foreground details, any text or signage. Then answer: [question]
```
Systematic description prevents tunnel vision on obvious elements while missing subtle details [2].

**Multi-Image Comparison:**
```
Image 1: [image]
First describe the key features of Image 1.

Image 2: [image]
Now describe the key features of Image 2.

Based on your descriptions, how do these images differ?
```
Description of each image before comparison ensures balanced analysis [4].

## Gotchas

**Common Mistakes:**

- **Skipping the Description Requirement** — If you only ask a question without explicitly requesting description first, Claude may skip the reasoning step and provide a potentially less accurate direct answer [1].

- **Not Using Output Tags** — Without `<thinking>` and `<answer>` tags, Claude's description may blend into its answer, making it harder to verify reasoning or parse output programmatically [3].

- **Post-Image Instructions** — While Claude can handle instructions after images, placing the describe-then-answer instructions before the image may cause the model to start answering before fully processing visual context. Always put images first [2][4].

- **Confusing "Think" Without Thinking Enabled** — When extended thinking is disabled, using the word "think" can trigger unexpected behavior in some models. Use alternatives like "analyze," "examine," or "describe" if you encounter issues [3].

- **Over-Reliance for Simple Tasks** — The pattern adds latency. For simple, obvious visual questions, a direct query may be sufficient. Reserve describe-then-answer for tasks prone to error: counting, reading charts, analyzing complex diagrams [1][2].

**Limitations to Know:**

- Claude cannot identify (name) people in images and will refuse [4].
- Spatial reasoning has limits; precise localization tasks like reading analog clocks may still fail even with description [4].
- Counting large numbers of small objects remains approximate even with systematic description [4].
- The pattern does not help with AI-generated image detection; Claude cannot reliably determine if images are synthetic [4].

**Version-Specific Notes:**

- Claude 4.6 models use adaptive thinking, which can handle much of this reasoning internally when enabled. For these models, explicit describe-then-answer prompting may be less necessary but still useful for transparency [3].
- The technique is equally effective across Claude Opus, Sonnet, and Haiku models [4].

## Sources

[1] **Claude Vision: Practical Use Cases for Images, PDFs, and Diagrams**
    URL: https://c-ai.chat/blog/claude-vision/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Definition of the Describe Then Answer pattern, basic prompt structure, and explanation of why it forces explicit articulation before answering.

[2] **Best Practices for Vision - Claude Cookbooks**
    URL: https://github.com/anthropics/anthropic-cookbook/blob/main/multimodal/best_practices_for_vision.ipynb
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Chain-of-thought reasoning with images, counting improvement examples (dogs benchmark), role assignment technique, image-before-text placement, and systematic analysis approaches.

[3] **Prompting Best Practices - Claude API Docs**
    URL: https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Chain-of-thought prompting techniques, XML tag usage for structured output (thinking/answer tags), adaptive thinking in Claude 4.6, and detailed prompt engineering guidelines.

[4] **Vision - Claude API Docs**
    URL: https://platform.claude.com/docs/en/docs/build-with-claude/vision
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Official documentation on image placement, sizing recommendations (1.15 megapixels), multi-image support (up to 100 per API request), limitations (people identification, spatial reasoning), and API code examples.

[5] **7 Best Practices for Using Vision with Claude - LLM Notes**
    URL: https://llm-notes-lightbridge.netlify.app/content/anthropic/best_practices_for_vision
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Detailed examples of thinking tags with counting tasks, role/persona assignment for vision, few-shot prompting with images, image upsampling improvement (3-4%), and highlighting techniques.
