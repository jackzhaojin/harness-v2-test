# Few-Shot and Multishot Prompting

**Topic ID:** prompt-engineering.fundamentals.few-shot-examples
**Researched:** 2026-02-28T12:00:00Z

## Overview

Few-shot prompting (also called multishot prompting) is a prompt engineering technique where you provide a language model with a small number of examples demonstrating the desired task within the prompt itself. Each example is called a "shot." By showing the model 2-5 well-crafted input-output pairs, you guide its behavior without requiring fine-tuning or additional training data. The model learns the pattern in-context and applies it to new inputs.

This technique sits between zero-shot prompting (no examples, relying entirely on instructions) and full supervised fine-tuning (which requires thousands of labeled examples). Few-shot prompting is particularly valuable when you need precise control over output format, tone, or structure—areas where natural language instructions alone often fall short. It's also essential for domain-specific tasks in legal, medical, or technical fields where gathering large datasets is expensive or impractical.

The effectiveness of few-shot prompting depends heavily on example selection, ordering, and structure. Research shows that the format and diversity of examples matter more than perfect label accuracy. A few well-chosen, diverse examples can dramatically improve model performance, while poorly selected or redundant examples may actually degrade output quality.

## Key Concepts

- **Shot**: A single example within a prompt. "Few-shot" typically means 2-5 examples; "one-shot" means exactly one example; "zero-shot" means no examples.

- **In-Context Learning (ICL)**: The mechanism by which language models learn from examples embedded in the prompt without weight updates. The model pattern-matches from demonstrations to generate appropriate responses.

- **Example Diversity**: Providing examples that cover different scenarios, edge cases, and output variations. Prevents the model from overfitting to narrow patterns.

- **Positive and Negative Examples**: Including examples of both correct outputs and incorrect outputs (clearly labeled). Models learn effectively from seeing what "bad" outputs look like.

- **Recency Bias**: Models tend to weight the last examples in a prompt more heavily. Strategic ordering of examples can leverage or mitigate this bias.

- **Majority Label Bias**: When examples skew toward one outcome, models may favor that outcome regardless of the actual input. Balance your example distribution.

- **XML Tag Wrapping**: Structuring examples within tags like `<example>` and `<examples>` to help models clearly distinguish demonstrations from instructions and input data.

- **Dynamic Few-Shot**: Selecting relevant examples at runtime based on the current query, rather than using a fixed set. Reduces token usage while improving relevance.

## Technical Details

### Basic Structure

A few-shot prompt follows this pattern:

```
[System instructions or role definition]

<examples>
<example>
Input: [Example input 1]
Output: [Example output 1]
</example>

<example>
Input: [Example input 2]
Output: [Example output 2]
</example>
</examples>

Input: [Actual user input]
Output:
```

### Anthropic Claude Implementation

Claude models are trained to recognize XML tag structures. Use `<example>` tags nested within `<examples>` tags:

```xml
<examples>
<example>
<user_query>What's the weather like?</user_query>
<response>I'd be happy to help with weather information! Could you tell me your location?</response>
</example>

<example>
<user_query>Book a flight to Paris</user_query>
<response>I'd be glad to assist with flight booking. What are your preferred travel dates?</response>
</example>
</examples>
```

### Including Reasoning with Examples

You can embed chain-of-thought reasoning in your examples using `<thinking>` tags. The model will generalize this reasoning pattern:

```xml
<example>
<input>Is 17 a prime number?</input>
<thinking>
A prime number is only divisible by 1 and itself.
Let me check divisibility: 17/2=8.5, 17/3=5.67, 17/4=4.25...
No integers divide 17 evenly except 1 and 17.
</thinking>
<output>Yes, 17 is a prime number.</output>
</example>
```

### Format Patterns

Common formatting conventions for examples:

| Format | Use Case |
|--------|----------|
| `Input: / Output:` | Concise, general purpose |
| `Q: / A:` | Question-answering tasks |
| `User: / Assistant:` | Conversational contexts |
| JSON structures | API responses, structured data |

### Optimal Example Count

Research indicates diminishing returns after 3-5 examples. Guidelines:

- **2-3 examples**: Good starting point for most tasks
- **3-5 examples**: Recommended for complex tasks requiring format precision
- **5-8 examples**: Maximum useful range; more rarely helps
- **8+ examples**: Risk of token waste and potential accuracy reduction

## Common Patterns

### Pattern 1: Format Enforcement

When you need consistent output structure:

```xml
<examples>
<example>
<product>Wireless Mouse</product>
<review>Great mouse, works perfectly with my laptop.</review>
<analysis>
{
  "sentiment": "positive",
  "confidence": 0.92,
  "key_phrases": ["works perfectly"],
  "product_aspects": ["compatibility"]
}
</analysis>
</example>
</examples>
```

### Pattern 2: Tone Matching

For brand voice or writing style consistency, provide examples of your actual content:

```
Here are examples of our company's email style:

<example>
Subject: Welcome to TechCorp!
Body: Hey there! Super excited to have you on board. Let's get you set up...
</example>

<example>
Subject: Quick update on your order
Body: Good news! Your order just shipped. Here's what to expect...
</example>

Now write an email about: [new prompt]
```

### Pattern 3: Classification with Edge Cases

Include examples that cover boundary conditions:

```xml
<examples>
<example>
<text>This product is absolutely terrible!</text>
<label>negative</label>
</example>

<example>
<text>It's okay, nothing special but does the job.</text>
<label>neutral</label>
</example>

<example>
<text>Not what I expected, but actually better!</text>
<label>positive</label>
</example>
</examples>
```

### Pattern 4: Domain-Specific Translation

For technical or specialized content:

```
Translate technical English to simplified Chinese. Follow these examples:

<example>
English: The API endpoint returns a JSON payload with nested objects.
Chinese: API 端点返回包含嵌套对象的 JSON 数据。
</example>
```

## Gotchas

- **Example ordering matters significantly**: Research found identical examples in different sequences produced "near state-of-the-art performance" versus "nearly chance levels." Test multiple orderings with your specific model.

- **Recency bias affects output**: Models weight final examples more heavily. If your last few examples share characteristics (all negative sentiment, all short responses), the model may bias toward those patterns.

- **More examples can hurt performance**: Adding examples beyond 5-8 often provides no benefit and may reduce accuracy by introducing noise or conflicting patterns.

- **Random labels still work (partially)**: Research by Min et al. (2022) showed that label accuracy matters less than format consistency and label space definition. However, correct labels still improve performance.

- **Few-shot fails on complex reasoning**: Multi-step arithmetic, logical deduction, and other reasoning-heavy tasks often require chain-of-thought prompting or other techniques rather than pure few-shot examples.

- **Context window constraints**: Each example consumes tokens. With limited context windows, balance example quantity against leaving room for actual content.

- **Overfitting to superficial patterns**: Models may latch onto incidental features of your examples (length, specific words) rather than the intended pattern. Use diverse examples to prevent this.

- **Claude vs. GPT structural differences**: Claude models respond well to XML tag structures; GPT models may perform better with role-based formatting or markdown. Match your structure to your model.

## Sources

- [Anthropic Claude Documentation - Multishot Prompting](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting) — Official guidance on XML tag usage, example counts (3-5 recommended), and integration with thinking capabilities
- [Prompting Guide - Few-Shot Prompting](https://www.promptingguide.ai/techniques/fewshot) — Research findings from Min et al. (2022) on label accuracy, limitations with complex reasoning tasks
- [Learn Prompting - Shot-Based Prompting](https://learnprompting.org/docs/basics/few_shot) — Definitions of zero/one/few-shot, format patterns, and selection criteria
- [PromptHub - The Few Shot Prompting Guide](https://www.prompthub.us/blog/the-few-shot-prompting-guide) — Practical guidance on example ordering, diversity, and common mistakes
- [IBM - What is Few-Shot Prompting](https://www.ibm.com/think/topics/few-shot-prompting) — Enterprise perspective on efficiency benefits, semantic retrieval of examples, and real-world applications
