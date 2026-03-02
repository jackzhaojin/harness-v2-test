# System Prompt Structure

**Topic ID:** prompt-engineering.system-prompts.structure
**Researched:** 2026-03-01T12:00:00Z

## Overview

System prompts are the foundational instructions that define how an AI model behaves throughout a conversation. A well-structured system prompt acts like a "short contract" that is explicit, bounded, and easy to verify [1]. The system prompt sets persistent characteristics including role definitions, output formatting requirements, safety constraints, and operational boundaries that apply consistently across all user interactions [3].

Structuring system prompts effectively is critical because Claude and similar models respond significantly better to clear, explicit instructions than to vague or implicit expectations [1]. Anthropic recommends thinking of Claude as "a brilliant but new employee who lacks context on your norms and workflows" - the more precisely you explain what you want, the better the result [1]. This mental model guides the core principle: be explicit about role, goals, constraints, fallback behavior, and output format rather than assuming the model will infer these from context.

The system prompt serves a distinct purpose from user prompts. System prompts establish application-level behavior that persists across sessions and users, while user prompts contain the specific task or query [3]. Anything requiring consistency across sessions belongs in the system prompt [3].

## Key Concepts

- **Role Definition** - A single-sentence statement in the system prompt that focuses Claude's behavior and tone for your use case. Even a brief role statement like "You are a helpful coding assistant specializing in Python" significantly improves response relevance [1]. Role prompting enhances accuracy in complex scenarios, tailors communication style, and helps Claude stay within task-specific requirements [2].

- **Goals/Success Criteria** - Explicit bullets describing what constitutes successful task completion. The recommended "contract" format includes success criteria that define measurable outcomes [2]. Being specific about desired output helps enhance results rather than relying on the model to infer this from vague prompts [1].

- **Constraints** - Specific rules defining boundaries on what the model should and should not do. Constraints guide response scope and prevent unwanted behaviors [3]. These should be stated as positive instructions ("Your response should be composed of smoothly flowing prose paragraphs") rather than negative prohibitions ("Do not use markdown") whenever possible [1].

- **Fallback/Uncertainty Handling** - Instructions for how to behave when unsure, such as "If unsure, say so explicitly. Do not guess" [4]. This is one of the most effective techniques for reducing hallucinations since LLMs tend to fabricate information when unsure unless explicitly instructed not to [4].

- **Output Format Specification** - Explicit guidance on the structure, length, and format of responses. This includes specifying formats like JSON with well-defined attributes, using XML tags to indicate output sections, or providing constraints like "Summarize in exactly 3 sentences, each under 20 words" [1][3].

- **XML Tags for Structure** - Anthropic's recommended method for organizing complex prompts. Wrapping content in descriptive tags like `<instructions>`, `<context>`, and `<input>` helps Claude parse prompts unambiguously [1]. Nesting tags creates natural hierarchy for complex documents.

- **Few-Shot Examples** - Concrete input-output pairs wrapped in `<example>` tags that demonstrate expected behavior. Examples are "one of the most reliable ways to steer Claude's output format, tone, and structure" [1]. Include 3-5 diverse examples covering edge cases for best results [1].

## Technical Details

The recommended system prompt structure follows a "contract" format with these components [2]:

```text
Role (one line)
Success criteria (bullets)
Constraints (bullets)
Uncertainty handling rule
Output format specification
```

Example implementation using the Messages API [1]:

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful coding assistant specializing in Python.",
    messages=[
        {"role": "user", "content": "How do I sort a list of dictionaries by key?"}
    ],
)
```

For complex system prompts, use XML tags to separate sections [1]:

```xml
<role>You are a financial analyst assistant.</role>

<constraints>
- Only analyze data provided in the conversation
- Do not provide specific investment advice
- All numerical claims must reference source data
</constraints>

<output_format>
Provide analysis in 2-3 paragraphs. Use bullet points only for
discrete lists of items. Include confidence levels for predictions.
</output_format>

<uncertainty_handling>
If you cannot determine the answer from provided data, state
"I cannot determine this from the available information" and
explain what additional data would be needed.
</uncertainty_handling>
```

For long-context prompts (20K+ tokens), place documents at the top above instructions [1]. Queries at the end can improve response quality by up to 30% with complex multi-document inputs [1].

Multi-document structure example [1]:

```xml
<documents>
  <document index="1">
    <source>annual_report_2023.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
</documents>

[Instructions and queries follow below the documents]
```

## Common Patterns

**Pattern 1: Conservative Action Mode**

When you want the model to analyze and recommend rather than take action [1]:

```text
<do_not_act_before_instructions>
Do not jump into implementation or change files unless clearly
instructed to make changes. When the user's intent is ambiguous,
default to providing information, doing research, and providing
recommendations rather than taking action. Only proceed with edits,
modifications, or implementations when the user explicitly requests them.
</do_not_act_before_instructions>
```

**Pattern 2: Hallucination Prevention**

Combining uncertainty handling with source grounding [1][4]:

```text
<investigate_before_answering>
Never speculate about code you have not opened. If the user
references a specific file, you MUST read the file before answering.
Make sure to investigate and read relevant files BEFORE answering
questions about the codebase. Never make any claims about code
before investigating unless you are certain of the correct answer.
</investigate_before_answering>

If unsure, clearly state "I don't know" rather than guessing.
```

**Pattern 3: Structured Output Control**

For applications requiring specific formats [1]:

```text
<output_requirements>
Respond in JSON format with the following schema:
{
  "summary": "string (max 100 words)",
  "key_findings": ["string array, 3-5 items"],
  "confidence": "high|medium|low",
  "sources_used": ["reference numbers from input"]
}

Do not include any text outside the JSON object.
</output_requirements>
```

**Pattern 4: Self-Verification**

Asking Claude to validate its own output [1]:

```text
Before you finish, verify your answer against these criteria:
1. All claims are supported by provided sources
2. No assumptions stated as facts
3. Format matches specification exactly
```

## Gotchas

**Negative vs. Positive Instructions**: Telling Claude what NOT to do ("Do not use markdown") is less effective than telling it what TO do ("Your response should be composed of smoothly flowing prose paragraphs") [1]. Positive framing gives Claude clearer guidance.

**Over-Prompting Modern Models**: Claude Opus 4.5+ and Claude 4.6 are significantly more responsive to system prompts than previous versions. Instructions that said "CRITICAL: You MUST use this tool when..." will cause overtriggering in newer models [1]. Use normal prompting like "Use this tool when..." instead.

**The "Think" Word Sensitivity**: When extended thinking is disabled, Claude Opus 4.5 is particularly sensitive to the word "think" and its variants, which can inadvertently trigger reasoning modes [1]. Use alternatives like "consider," "evaluate," or "reason through" in those cases.

**Prefilled Responses Deprecated**: Starting with Claude 4.6 models, prefilled responses on the last assistant turn are no longer supported [1]. Use direct instructions like "Respond directly without preamble. Do not start with phrases like 'Here is...', 'Based on...'" instead.

**System Prompt vs. User Prompt Confusion**: Role definitions and persistent constraints belong in the system prompt. Task-specific instructions go in the user turn [2]. Mixing these reduces consistency.

**Verbosity in Constraints**: Longer prompts are only better when they add structure and meaningful constraints [2]. Verbosity alone makes outputs worse, not better.

**Format Matching**: The formatting style used in your prompt influences Claude's response style [1]. If you want plain prose output, remove markdown formatting from your prompt itself.

**Example Consistency**: Few-shot examples must have consistent formatting across all examples, especially XML tags, whitespace, newlines, and example separators [3]. Inconsistent examples lead to inconsistent outputs.

## Sources

[1] **Prompting best practices - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core principles for system prompt structure including role definition, XML tags, output formatting, constraint specification, example usage, uncertainty handling prompts, and gotchas about negative instructions and model version differences.

[2] **Giving Claude a role with a system prompt - Claude API Docs**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/system-prompts
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Role definition benefits (enhanced accuracy, tailored tone, improved focus), the "contract" format structure, system vs. user prompt distinction, and best practices for role prompting.

[3] **LLM System Prompt Design Patterns**
    URL: https://tetrate.io/learn/ai/system-prompts-vs-user-prompts
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: System vs. user prompt distinctions, constraint design patterns, output format specification techniques including exclusion constraints and attribute definitions, few-shot formatting consistency requirements.

[4] **Best Practices for Mitigating Hallucinations in LLMs - Microsoft**
    URL: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/best-practices-for-mitigating-hallucinations-in-large-language-models-llms/4403129
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: The ICE method (Instructions, Constraints, Escalation), specific phrasing for uncertainty handling ("If unsure, respond with 'I don't know'"), and reinforcement of fallback behavior at prompt end.

[5] **Anthropic's Interactive Prompt Engineering Tutorial**
    URL: https://github.com/anthropics/prompt-eng-interactive-tutorial
    Accessed: 2026-03-01
    Relevance: background
    Extracted: Curriculum structure covering basic prompt structure, role assignment, separating data from instructions, output formatting, chain-of-thought reasoning, and avoiding hallucinations.
