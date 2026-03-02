# Negative Examples

**Topic ID:** prompt-engineering.few-shot.negative-examples
**Researched:** 2026-03-01T12:00:00Z

## Overview

Negative examples in few-shot prompting are demonstrations that show Claude what undesirable outputs look like, helping the model understand boundaries and avoid specific patterns. While few-shot prompting typically focuses on showing correct outputs, including negative examples can dramatically improve accuracy by clarifying the decision boundary between acceptable and unacceptable responses [1][3].

The key distinction in this topic is between two different concepts often conflated: **negative examples** (showing bad outputs within few-shot demonstrations) versus **negative instructions** (telling Claude what not to do in prose). These behave very differently. Negative examples in few-shot prompts are highly effective because they demonstrate patterns to avoid through concrete illustration [1][3]. Negative instructions in prose, however, can backfire due to what researchers call the "Pink Elephant Problem" - telling an LLM not to do something can paradoxically increase the likelihood of that behavior [4][5].

Understanding when to use each approach - and when to avoid negative instructions entirely - is critical for effective prompt engineering. Anthropic explicitly recommends "tell Claude what to do instead of what not to do" for prose instructions, while simultaneously endorsing the use of negative examples within structured few-shot demonstrations [2].

## Key Concepts

- **Negative Examples** - Demonstrations within few-shot prompts that show incorrect, undesirable, or poorly-formatted outputs. These help Claude learn what to avoid by seeing concrete counter-examples alongside positive examples [1][3].

- **Positive Reframing** - The technique of converting negative instructions ("Don't use markdown") into positive directives ("Use smoothly flowing prose paragraphs"). Anthropic's official best practice for prose instructions [2].

- **Pink Elephant Problem** - A cognitive phenomenon (also called Ironic Process Theory) where attempting to suppress a thought makes it more likely to surface. LLMs trained on human language may exhibit similar patterns, making explicit "DO NOT" instructions counterproductive [4].

- **Boundary Definition** - Using negative examples to clarify the edge between acceptable and unacceptable outputs, particularly useful for classification tasks, format adherence, and tone control [1][3].

- **Example Diversity** - The practice of including varied examples that cover edge cases. Negative examples contribute to diversity by showing the model what lies outside the acceptable range [2].

- **Recency Bias** - LLMs tend to favor patterns from the most recent examples. If the last few examples are negative, the model may be more likely to produce negative-like outputs. Balance example ordering carefully [3].

- **Label Distribution** - Research shows that the distribution and format of labels in examples matters significantly, even if individual labels are incorrect. Both positive and negative example labels contribute to teaching the pattern [3].

## Technical Details

### Structuring Negative Examples

Anthropic recommends wrapping examples in XML tags for clear separation from instructions [2]:

```xml
<examples>
  <example type="positive">
    <input>The product arrived damaged and customer service was unhelpful.</input>
    <output>sentiment: negative</output>
  </example>

  <example type="negative" note="incorrect format - do not produce this">
    <input>The product arrived damaged and customer service was unhelpful.</input>
    <output>This review expresses negative sentiment because...</output>
  </example>

  <example type="positive">
    <input>Fast shipping, exactly as described!</input>
    <output>sentiment: positive</output>
  </example>
</examples>
```

The `type="negative"` attribute with a `note` attribute explicitly signals this is a counter-example [2].

### Positive Reframing in Practice

When you need to constrain Claude's output format, reframe negatives as positives [2][4]:

| Negative Instruction (Avoid) | Positive Reframing (Preferred) |
|------------------------------|-------------------------------|
| "Don't use markdown" | "Use smoothly flowing prose paragraphs" |
| "Never use bullet points" | "Incorporate items naturally into sentences" |
| "Don't be verbose" | "Be concise and direct" |
| "Avoid mock data" | "Use only real-world data" |
| "Don't create new files" | "Apply all changes to existing files" |

### When Negative Instructions ARE Appropriate

Despite the general guidance to avoid them, negative instructions work well in specific contexts [4][5]:

1. **Hard ethical boundaries** - System prompts preventing harmful outputs
2. **Absolute constraints** - Where no positive alternative is sufficiently clear
3. **System-level guardrails** - Safety constraints in system prompts (not user prompts)

When using negative instructions, make them specific rather than vague [4]:
- Instead of: "Don't be verbose"
- Use: "Don't include explanatory comments in code output"

## Common Patterns

### Pattern 1: Classification with Boundary Cases

For sentiment or category classification, include examples that show both correct classifications and common misclassifications:

```xml
<examples>
  <example>
    <review>The battery life is okay but nothing special.</review>
    <classification>neutral</classification>
  </example>

  <example type="negative" note="common mistake - 'okay' is not positive">
    <review>The battery life is okay but nothing special.</review>
    <classification>positive</classification>
  </example>

  <example>
    <review>Absolutely love this product!</review>
    <classification>positive</classification>
  </example>
</examples>
```

This pattern explicitly addresses borderline cases that commonly trip up the model [3].

### Pattern 2: Format Enforcement

When strict output formatting is required, show both compliant and non-compliant examples:

```xml
<examples>
  <example type="positive">
    <input>What is the capital of France?</input>
    <output>Paris</output>
  </example>

  <example type="negative" note="do not include explanations">
    <input>What is the capital of France?</input>
    <output>The capital of France is Paris, which has been the capital since...</output>
  </example>
</examples>
```

### Pattern 3: Thinking Tag Demonstrations

Negative examples can show incorrect reasoning patterns when using thinking tags [2]:

```xml
<example type="negative" note="reasoning jumps to conclusion">
  <thinking>The user asked about Python sorting, so I'll explain quicksort.</thinking>
  <answer>Quicksort works by selecting a pivot element...</answer>
</example>

<example type="positive">
  <thinking>The user asked about Python sorting. I should consider whether they want built-in methods (sorted(), .sort()) or algorithm explanations. Given the context of a beginner question, I'll focus on practical built-in approaches.</thinking>
  <answer>Python offers two main ways to sort: the sorted() function returns a new sorted list, while .sort() modifies the original list in place...</answer>
</example>
```

## Gotchas

- **Negative instructions can backfire** - Multiple users report that loading prompts with "DON'T" statements produces worse outputs, not better. One documented case: "Claude Code created multiple versions of files despite explicit rules stating 'NEVER create duplicate files'" [4][5]. The more negatives you add, the worse the outputs may become.

- **Negative examples vs. negative instructions are different** - Showing a bad output in a few-shot example (negative example) is effective. Telling Claude "don't do X" in prose (negative instruction) is often ineffective. Do not conflate these approaches [1][4].

- **Recency bias affects example ordering** - If your last 2-3 examples happen to show negative patterns (even as counter-examples), Claude may lean toward producing similar patterns. Balance the order with positive examples at the end [3].

- **Positive reframing requires specificity** - Simply inverting a negative ("don't be verbose" to "be concise") may be too vague. Provide concrete details: "Respond in 2-3 sentences maximum" [2].

- **System prompt negatives work better than user prompt negatives** - Negative constraints in system prompts (preventing harmful behavior) are more reliable than negative constraints in user prompts (style preferences) [4][5].

- **3-5 examples is the sweet spot** - More examples consume tokens without proportional benefit. Include 1-2 negative examples within this range, not in addition to it [2][3].

- **Negative examples need explicit labeling** - Without clear markers (`type="negative"`, `note="incorrect"`), Claude may interpret counter-examples as additional patterns to follow rather than avoid [2].

- **Format consistency matters even for negative examples** - Negative examples should use the same structural format as positive examples. Only the content/output should differ, not the XML structure or input format [2].

## Sources

[1] **Anthropic Prompting Best Practices - Multishot Prompting**
    URL: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core guidance on using examples effectively, XML tag structure for examples, recommendation for 3-5 diverse examples, emphasis on showing Claude desired and undesired behaviors.

[2] **Anthropic Prompting Best Practices - Claude 4 Best Practices**
    URL: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Official recommendation to "tell Claude what to do instead of what not to do," positive reframing examples, XML tag structuring, thinking tag examples with multishot prompts.

[3] **PromptHub - The Few Shot Prompting Guide**
    URL: https://www.prompthub.us/blog/the-few-shot-prompting-guide
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Five design principles including "use both positive and negative examples," recency bias considerations, 2-5 example recommendation, label distribution research.

[4] **16x Engineer - The Pink Elephant Problem**
    URL: https://eval.16x.engineer/blog/the-pink-elephant-negative-instructions-llms-effectiveness-analysis
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Ironic Process Theory explanation, real-world failure cases of negative instructions, when negative instructions work vs. fail, positive reframing conversion table.

[5] **Anthropic Prompt Engineering Interactive Tutorial**
    URL: https://github.com/anthropics/prompt-eng-interactive-tutorial
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Course structure confirming "Using Examples" as Chapter 7, pointer to answer key with detailed examples.
