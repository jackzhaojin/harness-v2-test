# Document Structuring and Placement

**Topic ID:** prompt-engineering.long-context.document-structure
**Researched:** 2026-02-28T14:30:00Z

## Overview

Document structuring and placement is a critical prompt engineering technique for working with large language models when processing lengthy inputs. The core principle is straightforward: how you organize and position documents within your prompt significantly affects model performance, with studies showing up to 30% improvement in response quality when using optimal placement strategies.

Modern LLMs like Claude (200K+ tokens) and GPT-4.1 (1M tokens) can process book-length content, but raw capacity doesn't guarantee effective comprehension. Without proper structuring, models exhibit "lost in the middle" effects where information buried deep in context gets overlooked. Strategic use of XML tags creates clear semantic boundaries, while grounding responses in direct quotes forces the model to anchor its reasoning in the actual source material rather than generating plausible-sounding but unsupported claims.

This topic sits at the intersection of prompt architecture and retrieval-augmented generation (RAG) patterns. Whether you're building document Q&A systems, summarization pipelines, or multi-document analysis tools, mastering these techniques directly impacts accuracy and reliability.

## Key Concepts

- **Document-first ordering**: Place long documents and data (20K+ tokens) at the top of your prompt, with instructions and queries at the bottom. This "documents above, questions below" pattern leverages how transformer attention mechanisms process context and can improve response quality by up to 30% on complex multi-document tasks.

- **XML tag structuring**: Use hierarchical XML tags to create unambiguous boundaries between content types. Tags like `<documents>`, `<document>`, `<source>`, and `<document_content>` help the model parse complex prompts without misinterpreting where context ends and instructions begin.

- **Quote grounding**: Explicitly instruct the model to extract and cite relevant quotes before answering. This technique forces the model to locate supporting evidence first, reducing hallucination and improving factual accuracy—especially valuable for legal, medical, or compliance use cases.

- **Section chunking**: Break large documents into labeled logical units (e.g., `[Part 1 – Overview]`, `[Part 2 – Financials]`). This enables precise reference anchoring and helps the model navigate massive contexts by summarizing or citing specific sections.

- **Metadata tagging**: Include source identifiers, document indices, and other metadata within your XML structure. When the model needs to attribute information, it can reference `<source>annual_report_2023.pdf</source>` rather than making vague claims.

- **Instruction echoing**: For critical tasks, repeat key instructions both before and after document content. This "bookend" pattern ensures instructions aren't lost in long contexts.

- **Scratchpad patterns**: Have the model extract relevant quotes into a `<quotes>` or `<scratchpad>` section before generating its final answer, improving accuracy through explicit evidence gathering.

## Technical Details

### Canonical Multi-Document Structure

The recommended XML pattern for multiple documents:

```xml
<documents>
  <document index="1">
    <source>annual_report_2023.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
  <document index="2">
    <source>competitor_analysis_q2.xlsx</source>
    <document_content>
      {{COMPETITOR_ANALYSIS}}
    </document_content>
  </document>
</documents>

Analyze the annual report and competitor analysis. Identify strategic
advantages and recommend Q3 focus areas.
```

### Quote Extraction Pattern

For tasks requiring high accuracy, use a two-phase approach:

```xml
<documents>
  <document index="1">
    <source>patient_records.txt</source>
    <document_content>{{PATIENT_RECORDS}}</document_content>
  </document>
</documents>

Find quotes from the patient records relevant to the reported symptoms.
Place these in <quotes> tags. Then, based on these quotes, provide your
diagnostic assessment in <analysis> tags.
```

### Delimiter Format Comparison

Different formats show varying performance characteristics:

| Format | Recommendation | Notes |
|--------|---------------|-------|
| XML tags | **Preferred** | Best parsing accuracy, hierarchical support |
| Pipe-delimited | Acceptable | `ID: 1 \| TITLE: Title \| CONTENT: ...` |
| JSON | Avoid | Notably poor performance in testing |

### Context-Only Grounding Instruction

When you need responses strictly based on provided documents:

```text
Only use the provided documents to answer. If the information is not
present in the documents, respond: "I don't have that information in
the provided documents."
```

## Common Patterns

### Pattern 1: Long Document Q&A

```xml
<document>
{{LENGTHY_DOCUMENT_CONTENT}}
</document>

<instructions>
Before answering, extract the 3-5 most relevant quotes from the document
that relate to the question. Place them in <relevant_quotes> tags. Then
provide your answer in <answer> tags, citing the quotes by number.
</instructions>

<question>
What were the primary risk factors identified in the 2023 assessment?
</question>
```

### Pattern 2: Multi-Document Synthesis

```xml
<documents>
  <document index="1">
    <source>Q1_earnings.pdf</source>
    <document_content>{{Q1_CONTENT}}</document_content>
  </document>
  <document index="2">
    <source>Q2_earnings.pdf</source>
    <document_content>{{Q2_CONTENT}}</document_content>
  </document>
  <document index="3">
    <source>analyst_commentary.txt</source>
    <document_content>{{ANALYST_CONTENT}}</document_content>
  </document>
</documents>

Compare the earnings reports and synthesize with analyst commentary.
For each claim, cite the specific document (e.g., "In Q1_earnings.pdf...").
```

### Pattern 3: Chunked Document Navigation

For documents exceeding comfortable processing, use explicit section markers:

```text
[Section 1 – Executive Summary]
{{EXEC_SUMMARY}}

[Section 2 – Financial Performance]
{{FINANCIALS}}

[Section 3 – Risk Factors]
{{RISK_FACTORS}}

When answering, reference sections by name (e.g., "According to Section 2...").
```

## Gotchas

- **Tag consistency matters**: Use identical tag names throughout your prompt. Mixing `<doc>` and `<document>` creates parsing ambiguity. Pick a convention and stick to it.

- **Avoid vague references**: Phrases like "this document" or "the above passage" lose clarity when multiple documents are present. Always reference specific sources or indices: "In document 2" or "According to annual_report_2023.pdf".

- **JSON underperforms for documents**: Despite being widely used for structured data, JSON-formatted document collections show notably poor performance compared to XML or pipe-delimited formats in retrieval tasks.

- **Middle content gets lost**: Information in the middle of very long contexts receives less attention than content at the beginning or end. Put the most critical context near the top, and repeat key instructions at the bottom.

- **Generic examples don't help**: Including general-knowledge example Q&A pairs (like "Who was the first U.S. president?") doesn't improve performance on domain-specific document tasks. Use examples drawn from similar documents instead.

- **Quote grounding adds latency**: The extract-then-answer pattern increases token usage and response time. Use it when accuracy matters more than speed.

- **Metadata placement**: Source and metadata tags should appear before `<document_content>`, not after. This lets the model "know" what it's reading before processing the content.

- **Context window ≠ equal attention**: Just because a model accepts 200K tokens doesn't mean all tokens receive equal processing. Performance can degrade for multi-item retrieval or complex reasoning requiring full-context awareness.

## Sources

- [Anthropic Long Context Prompting Tips](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/long-context-tips) — Official Claude documentation on document placement, XML structuring, and quote grounding
- [Anthropic Prompt Engineering Best Practices](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/use-xml-tags) — Comprehensive guide to XML tag usage and prompt structuring
- [Anthropic Blog: Prompting for Long Context](https://www.anthropic.com/news/prompting-long-context) — Research findings on scratchpads, example quantity, and instruction placement
- [OpenAI GPT-4.1 Prompting Guide](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide) — Guidance on long context handling, delimiter formats, and grounding approaches
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering) — General prompt engineering principles applicable to long-context scenarios
