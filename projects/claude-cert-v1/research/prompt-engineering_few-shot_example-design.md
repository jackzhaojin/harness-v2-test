# Example Design and Selection

**Topic ID:** prompt-engineering.few-shot.example-design
**Researched:** 2026-03-01T14:32:00Z

## Overview

Example design and selection is arguably the most critical factor determining the success of few-shot prompting. While providing examples to guide model behavior is a well-established technique, the quality, diversity, and structure of those examples dramatically impacts output quality. According to Anthropic's documentation, "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure" [1].

The core principle is that examples function as implicit specifications. Rather than explicitly describing every rule the model should follow, well-crafted examples demonstrate the desired behavior through concrete input-output pairs. This "show don't tell" approach is particularly effective because models excel at pattern recognition and generalization from demonstrations [2]. However, this power comes with responsibility: poorly designed examples can introduce biases, encourage surface-level pattern matching, or fail to generalize to edge cases that matter most.

For certification exam preparation, understanding example design is essential because it underpins effective prompt engineering. Questions often present scenarios asking which approach would yield better results, requiring both conceptual understanding of why examples work and practical knowledge of how to craft them effectively.

## Key Concepts

- **In-Context Learning (ICL)** - The mechanism by which LLMs learn directly from examples embedded in the prompt rather than requiring additional training [3]. Few-shot prompting is a direct application of ICL where examples guide the model's output.

- **Example Diversity** - Ensuring examples cover different scenarios, edge cases, and variations within the task domain to prevent the model from overfitting to narrow patterns [1][4]. Anthropic specifically advises that examples should "cover edge cases and vary enough that Claude doesn't pick up unintended patterns" [1].

- **Example Relevance** - Examples must closely mirror the actual use case to be effective [1]. Irrelevant examples can confuse the model and degrade performance rather than improve it [4].

- **Format Consistency** - Maintaining identical structure across all examples to establish clear patterns for the model to follow [2][4]. Research by Min et al. (2022) found that consistent formatting "substantially outperforms random or absent labels" [2].

- **Positive and Negative Examples** - Including both desired outputs and examples of what not to do, as models learn significantly from understanding what constitutes a "bad" output [4].

- **Recency Bias** - The tendency for models to place significant weight on the last example they process, making example ordering strategically important [4][5].

- **Majority Label Bias** - When the distribution of labels among examples is unbalanced, models tend to favor the more frequently appearing answers [2][5].

- **XML Tag Structure** - Claude specifically benefits from wrapping examples in `<example>` tags (multiple examples in `<examples>` tags) to clearly distinguish them from instructions [1].

## Technical Details

### Optimal Number of Examples

Research and practice converge on 3-5 examples as the sweet spot for most tasks [1][4]. Anthropic recommends starting with one example (one-shot) and adding more only if output quality remains insufficient [1]. The guidance is clear: "More examples = better performance, especially for complex tasks" but with diminishing returns after 2-3 examples in many cases [4].

```
Simple tasks:      2-5 examples
Complex tasks:     Up to 10 examples
Research contexts: 100+ examples (rare)
Maximum recommended: 8 examples (beyond this burns tokens without value)
```

### Example Structure for Claude

Claude expects examples wrapped in XML tags for unambiguous parsing [1]:

```xml
<examples>
  <example>
    <input>Customer complaint about late delivery</input>
    <output>
      Category: Logistics
      Priority: Medium
      Suggested Action: Apologize, provide tracking update, offer expedited shipping credit
    </output>
  </example>
  <example>
    <input>Question about product compatibility</input>
    <output>
      Category: Technical Support
      Priority: Low
      Suggested Action: Provide compatibility matrix link, offer to connect with specialist
    </output>
  </example>
</examples>
```

### Incorporating Reasoning (Chain-of-Thought)

For complex reasoning tasks, examples should demonstrate the thinking process, not just the final answer [1][2]:

```xml
<example>
  <input>Is 17 a prime number?</input>
  <thinking>
    To determine if 17 is prime, I need to check if it has any divisors other than 1 and itself.
    17 / 2 = 8.5 (not divisible)
    17 / 3 = 5.67 (not divisible)
    17 / 4 = 4.25 (not divisible)
    I only need to check up to sqrt(17) which is approximately 4.1.
    No divisors found.
  </thinking>
  <answer>Yes, 17 is a prime number.</answer>
</example>
```

Anthropic notes that "Multishot examples work with thinking. Use `<thinking>` tags inside your few-shot examples to show Claude the reasoning pattern. It will generalize that style to its own extended thinking blocks" [1].

### Dynamic Example Selection

Advanced implementations use semantic similarity to select the most relevant examples for each query [3][5]:

1. Store examples in a vector database
2. When a query arrives, compute embeddings
3. Retrieve k-nearest examples based on cosine similarity
4. Construct prompt with retrieved examples

This RAG-enhanced approach ensures examples are always contextually appropriate to the specific input [5].

## Common Patterns

### Pattern 1: Classification with Edge Cases

When building classification examples, include both clear-cut cases and ambiguous edge cases:

```xml
<examples>
  <!-- Clear positive -->
  <example>
    <text>This product exceeded all my expectations!</text>
    <sentiment>Positive</sentiment>
  </example>

  <!-- Clear negative -->
  <example>
    <text>Worst purchase I've ever made. Complete waste of money.</text>
    <sentiment>Negative</sentiment>
  </example>

  <!-- Edge case: mixed sentiment -->
  <example>
    <text>The quality is good but the price is way too high.</text>
    <sentiment>Mixed</sentiment>
  </example>

  <!-- Edge case: sarcasm -->
  <example>
    <text>Oh great, another product that breaks after a week. Just what I needed.</text>
    <sentiment>Negative</sentiment>
  </example>
</examples>
```

### Pattern 2: Strategic Example Ordering

Place your most representative or complex example last due to recency bias [4][5]. A common strategy:

1. Start with a simple, clear example to establish the pattern
2. Add moderately complex examples in the middle
3. End with your most critical or complex example

### Pattern 3: Code Generation with Error Handling

For code generation, examples should demonstrate input validation and edge case handling [4]:

```xml
<example>
  <task>Write a function to calculate factorial</task>
  <output>
def factorial(n):
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        raise ValueError("Factorial not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)
  </output>
</example>
```

### Pattern 4: Curated Canonical Set

Rather than stuffing many edge cases into prompts, Anthropic recommends "working to curate a set of diverse, canonical examples that effectively portray the expected behavior" [1]. For an LLM, "examples are the 'pictures' worth a thousand words" [1].

## Gotchas

**Claude 4.x literal interpretation**: Unlike earlier versions that would infer intent and expand on vague requests, Claude 4.x "takes you literally and does exactly what you ask for, nothing more" [1]. Examples must be precise because the model will closely replicate their patterns, including any unintended characteristics.

**Overfitting to examples**: Models can memorize specific details from examples rather than learning general patterns. To prevent this, "vary your examples across different scenarios, input lengths, and complexity levels" [4][5]. Using too many similar examples degrades performance.

**Format mimicry**: "The way that we structure Few-Shot Prompts is very important because output format directly influences model behavior" [6]. If examples show single-word responses, the model generates single words; complete sentences produce sentence-length outputs.

**Context window constraints**: Every example consumes tokens. With limited context windows, you must balance example quality against quantity. More examples are not always better and "just burn tokens without adding much value" beyond a certain point [4].

**Order effects causing dramatic variance**: Research shows that example ordering can cause performance to range from "near state-of-the-art" with optimal ordering to "nearly chance levels" with poor ordering [4].

**Few-shot vs complex reasoning**: Standard few-shot prompting "works well for many tasks but is still not a perfect technique, especially when dealing with more complex reasoning tasks" [2]. Studies show that few-shot examples can "sometimes hurt performance by biasing the model toward surface patterns rather than allowing it to fully reason through the problem" [2]. For complex reasoning, combine with chain-of-thought or consider zero-shot CoT.

**When few-shot is wrong**: If you have "lots of domain-specific edge cases that can't fit in a context window, few-shot prompting may not be the best approach, and fine-tuning or RAG may be needed" [5].

## Sources

[1] **Anthropic Claude Prompting Best Practices**
    URL: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: XML tag usage, example structure, Claude-specific guidance on few-shot examples, thinking tag integration, literal interpretation in Claude 4.x, curated canonical examples approach

[2] **Prompt Engineering Guide - Few-Shot Prompting**
    URL: https://www.promptingguide.ai/techniques/fewshot
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: In-context learning definition, Min et al. research on format importance, limitations with complex reasoning tasks, chain-of-thought integration

[3] **IBM - What is Few-Shot Prompting**
    URL: https://www.ibm.com/think/topics/few-shot-prompting
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Vector store retrieval process, prompt construction pipeline, practical applications, integration with chain-of-thought

[4] **PromptHub - The Few Shot Prompting Guide**
    URL: https://www.prompthub.us/blog/the-few-shot-prompting-guide
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Positive/negative examples, example ordering strategies, recency bias, majority label bias, diminishing returns research, overfitting risks

[5] **Amazon Nova - Provide Examples (Few-Shot Prompting)**
    URL: https://docs.aws.amazon.com/nova/latest/userguide/prompting-examples.html
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Diversity and coverage principles, edge case importance, semantic similarity selection, RAG-enhanced retrieval

[6] **Learn Prompting - Shot-Based Prompting**
    URL: https://learnprompting.org/docs/basics/few_shot
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Format consistency importance, simple vs complex task example counts, formatting guidelines for different content lengths
