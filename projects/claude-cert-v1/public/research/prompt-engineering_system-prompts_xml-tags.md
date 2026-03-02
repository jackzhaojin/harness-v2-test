# XML Tags and Formatting

**Topic ID:** prompt-engineering.system-prompts.xml-tags
**Researched:** 2026-03-01T12:00:00Z

## Overview

XML tags are a fundamental prompt engineering technique for Claude that provides structure, clarity, and precision when crafting complex prompts. Unlike other LLMs, Claude was specifically trained to recognize XML tags as a prompt organizing mechanism, making them more effective than arbitrary formatting delimiters [1]. When prompts involve multiple components such as instructions, context, examples, and variable inputs, XML tags help Claude parse the prompt unambiguously, leading to higher-quality outputs [1][2].

The technique is particularly valuable for exam scenarios because it addresses one of the most common prompt failures: Claude misinterpreting which parts of a prompt are instructions versus input data. By wrapping content in descriptive tags, you create explicit boundaries that prevent the model from conflating different prompt sections [3]. This becomes critical in multi-document scenarios, long context windows, and agentic systems where precision is essential.

XML tags also enable bidirectional structuring: you can use them to organize your input prompts AND instruct Claude to use specific tags in its output, making response parsing straightforward for downstream processing [1][2].

## Key Concepts

- **Structural clarity** — XML tags clearly separate different parts of your prompt (instructions, context, examples, input), ensuring the prompt is well structured and reducing ambiguity [1].

- **Accuracy improvement** — Tags reduce errors caused by Claude misinterpreting parts of your prompt, particularly when instructions could be confused with input data [1][2].

- **Flexibility** — You can easily find, add, remove, or modify parts of your prompt without rewriting everything, since each component is discretely tagged [1].

- **Parseability** — Having Claude use XML tags in its output makes it easier to extract specific parts of its response through post-processing [1][2].

- **No canonical tags** — There are no "magic" tag names that Claude is specifically trained to recognize. You can use any descriptive names that make sense for your content, such as `<instructions>`, `<context>`, `<document>`, or `<example>` [1][3].

- **Consistency requirement** — Use the same tag names throughout your prompts and reference those names when talking about the content, e.g., "Using the contract in `<contract>` tags..." [1][2].

- **Nesting for hierarchy** — Tags can be nested to represent hierarchical relationships, such as `<documents>` containing multiple `<document index="n">` elements [1][2].

- **Position sensitivity** — For long prompts, Claude gives more attention to the end. Place long documents at the top and queries/instructions at the bottom for up to 30% improvement in response quality [1].

## Technical Details

### Basic Tag Structure

The fundamental pattern uses opening and closing tags with descriptive names:

```xml
<instructions>Analyze the provided code for security issues</instructions>
<context>This is a production authentication module</context>
<input>
def authenticate(username, password):
    query = f"SELECT * FROM users WHERE name='{username}'"
    ...
</input>
```

### Multi-Document Formatting

When working with multiple documents, use a structured hierarchy with metadata [1]:

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

Analyze the annual report and competitor analysis. Identify strategic advantages and recommend Q3 focus areas.
```

### Example Structuring

Wrap few-shot examples clearly to distinguish them from instructions [1]:

```xml
<examples>
  <example>
    <input>What is the capital of France?</input>
    <output>Paris</output>
  </example>
  <example>
    <input>What is the capital of Japan?</input>
    <output>Tokyo</output>
  </example>
</examples>

Now answer: What is the capital of Brazil?
```

### Chain of Thought with Tags

Combine XML tags with reasoning techniques [1][2]:

```xml
<instructions>
Solve this math problem step by step.
</instructions>

<problem>
If a train travels 120 miles in 2 hours, what is its average speed?
</problem>

<output_format>
Use <thinking> tags for your reasoning process.
Use <answer> tags for the final answer.
</output_format>
```

### Quote Extraction for Long Documents

For tasks involving specific information extraction from long documents, ask Claude to quote relevant sections first [1]:

```xml
<instructions>
Find quotes from the patient records that are relevant to diagnosing the symptoms.
Place these in <quotes> tags.
Then provide your diagnostic analysis in <info> tags.
</instructions>

<documents>
  <document index="1">
    <source>patient_symptoms.txt</source>
    <document_content>{{PATIENT_SYMPTOMS}}</document_content>
  </document>
  <document index="2">
    <source>patient_records.txt</source>
    <document_content>{{PATIENT_RECORDS}}</document_content>
  </document>
</documents>
```

## Common Patterns

### Separating Data from Instructions

The most common pattern prevents Claude from confusing instructions with input [3]:

```xml
<task>
Rewrite the following text in a formal tone.
</task>

<text_to_rewrite>
Yo, the meeting's at 3pm. Don't be late!
</text_to_rewrite>
```

Without tags, Claude might interpret "Yo" as addressing itself and include "Dear Claude" in the rewrite [3].

### Role Definition with Context

Combine system role with tagged context [1]:

```xml
<role>
You are a senior code reviewer specializing in Python security.
</role>

<code_to_review>
{{USER_CODE}}
</code_to_review>

<review_criteria>
- Check for SQL injection vulnerabilities
- Identify hardcoded credentials
- Flag unsafe deserialization
</review_criteria>
```

### Output Format Control

Use tags to enforce specific output structures [1][2]:

```xml
<output_requirements>
Your response must include:
- A <summary> section (2-3 sentences)
- A <detailed_analysis> section with bullet points
- A <recommendations> section with prioritized action items
</output_requirements>
```

### Agentic System Prompts

XML tags help control agent behavior in complex workflows [1]:

```xml
<default_to_action>
By default, implement changes rather than only suggesting them.
If the user's intent is unclear, infer the most useful likely action and proceed.
</default_to_action>

<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between the calls,
make all independent calls in parallel.
</use_parallel_tool_calls>
```

## Gotchas

- **Inconsistent tag naming** — Using different names for the same concept (e.g., `<text>` in one place, `<content>` in another) confuses Claude about what refers to what. Always reference tags by their exact names in instructions [1][3].

- **Missing closing tags** — Forgetting `</>` or mismatching open/close tag names leads to unpredictable behavior. Always verify tag pairs are complete [3].

- **Flat structures for hierarchical data** — When content has natural hierarchy (multiple documents, nested examples), failing to nest tags makes relationships harder to parse. Use `<documents><document index="1">...</document></documents>` patterns [1][2].

- **Over-reliance on XML for simple prompts** — Modern Claude models handle structure well with clear headings, whitespace, and explicit language. For simple prompts, XML may add unnecessary overhead [3]. Reserve XML for complex multi-component prompts.

- **Important instructions at wrong position** — For long context prompts (20K+ tokens), Claude gives more weight to content at the end. Place documents at the top and instructions/queries at the bottom [1].

- **Not referencing tags in instructions** — Simply wrapping content in tags is not enough. Explicitly tell Claude to "use the information in `<context>` tags" so it knows how to use each section [3].

- **Expecting "magic" tags** — There are no special tag names that automatically improve performance. Choose logical, descriptive names that match your content. `<code>` is not inherently better than `<source_code>` [1][3].

- **Examples not clearly separated** — If Claude ignores your examples, verify they are wrapped in `<example>` tags within an `<examples>` container and appear early in the prompt [1].

- **Typos in tag names** — Small errors matter. If you open with `<instrucions>` and close with `</instructions>`, Claude may not parse correctly. Proofread tag names [3].

- **Claude 4.x literal interpretation** — Earlier Claude versions inferred intent from vague prompts. Claude 4.x models take instructions literally, making explicit XML structuring even more important for precise results [2].

## Sources

[1] **Anthropic Claude Platform Documentation: Prompting Best Practices**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core XML tag benefits (clarity, accuracy, flexibility, parseability), multi-document structure patterns, nesting conventions, long context positioning guidance, example formatting with tags, and chain-of-thought tag combinations.

[2] **Anthropic Claude Platform Documentation: Claude Prompting Best Practices**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive prompting guidance including XML tag usage for structuring prompts, agentic system patterns with tagged instructions, output format control, quote extraction patterns, and Claude 4.x model-specific considerations.

[3] **Vellum: 12 Prompt Engineering Tips to Boost Claude's Output Quality**
    URL: https://www.vellum.ai/blog/prompt-engineering-tips-for-claude
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Common mistakes and gotchas including inconsistent naming, missing tags, over-engineering with XML, and the importance of explicitly referencing tag names in instructions.
