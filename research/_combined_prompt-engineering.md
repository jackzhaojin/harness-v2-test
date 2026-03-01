# Combined Research: Prompt Engineering


---

# Clarity and XML Structuring

**Topic ID:** prompt-engineering.fundamentals.clarity-and-structure
**Researched:** 2026-02-28T12:00:00Z

## Overview

Clarity and structure form the foundation of effective prompt engineering. When working with large language models, the way you organize and present your instructions directly determines the quality and consistency of outputs. Clear prompts reduce ambiguity, while structured formatting helps models parse complex requests without conflating instructions with context or examples.

XML tags have emerged as a particularly powerful structuring mechanism, especially for Claude models which were trained to recognize XML as an organizational tool. By wrapping different prompt components—instructions, context, examples, and input data—in descriptive tags, you create unambiguous boundaries that prevent misinterpretation. This separation is critical when prompts mix multiple elements, such as system instructions, user-provided documents, and expected output formats.

The practical impact is significant: structured prompts produce more consistent outputs, reduce the need for iterative correction, and make prompts easier to maintain and modify. Rather than hoping a model correctly infers which parts of your prompt are instructions versus examples, explicit structure removes that guesswork entirely.

## Key Concepts

- **Directive clarity**: The main instruction should use action verbs (write, analyze, summarize) and explicitly state the task. Avoid vague requests; be specific about what "done" looks like.

- **XML tag separation**: Wrap distinct prompt components in tags like `<instructions>`, `<context>`, `<examples>`, and `<input>`. This prevents Claude from mixing up instructions with examples or treating context as commands.

- **Consistent tag naming**: Use the same tag names throughout your prompts and reference those names when discussing content. There are no "magic" tags—descriptive, consistent naming matters more than specific tag choices.

- **Nested hierarchy**: Use nested tags for structured content, such as `<documents><document index="1"><source>...</source><document_content>...</document_content></document></documents>` for multi-document inputs.

- **Output specification**: Define the exact format, length, tone, and structure you expect. Saying "respond in JSON" is clearer than "format your response nicely."

- **Few-shot examples**: Providing 3-5 well-crafted examples inside `<example>` tags dramatically improves accuracy and consistency, especially for structured outputs or specific tones.

- **Prompt order**: Place long-form data at the top, followed by context, role definition, and the directive last. Ending with the instruction keeps the model focused on execution rather than elaborating on context.

- **Positive framing**: Instead of "don't use jargon," say "use simple language." Models perform better with positive instructions than negated ones.

## Technical Details

### Basic XML Structure

```xml
<instructions>
Summarize the document below in 3 bullet points, focusing on key findings.
</instructions>

<context>
This document is a quarterly financial report for internal stakeholders.
</context>

<document>
{{DOCUMENT_CONTENT}}
</document>

<output_format>
- Bullet point 1
- Bullet point 2
- Bullet point 3
</output_format>
```

### Multi-Document Handling

When processing multiple documents, use indexed tags with metadata:

```xml
<documents>
  <document index="1">
    <source>annual_report_2025.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
  <document index="2">
    <source>competitor_analysis.xlsx</source>
    <document_content>
      {{COMPETITOR_ANALYSIS}}
    </document_content>
  </document>
</documents>

Analyze both documents and identify strategic advantages.
```

### Few-Shot Example Structure

```xml
<examples>
  <example>
    <input>The product arrived damaged and customer service was unhelpful.</input>
    <output>sentiment: negative</output>
  </example>
  <example>
    <input>Fast shipping, exactly as described!</input>
    <output>sentiment: positive</output>
  </example>
</examples>

<input>
{{USER_TEXT}}
</input>
```

### Chain-of-Thought with XML

Combine XML structure with reasoning tags:

```xml
<instructions>
Analyze the math problem step by step.
</instructions>

<thinking>
Show your reasoning process here.
</thinking>

<answer>
Provide the final answer here.
</answer>
```

## Common Patterns

**The CO-STAR Framework**: Structure prompts with Context, Objective, Style, Tone, Audience, and Response format. This checklist ensures comprehensive prompt specification.

**Role-Task-Tone Pattern**: Begin every prompt with three elements: who the AI should act as (role), what it should do (task), and how it should communicate (tone). Example: "You are a senior software engineer. Review this code for security vulnerabilities. Respond in a direct, technical tone."

**Ground-then-Analyze**: For long document tasks, ask the model to quote relevant passages before synthesizing:

```xml
<instructions>
First, extract relevant quotes in <quotes> tags.
Then, provide your analysis in <analysis> tags.
</instructions>
```

**Constraint-Based Design**: Use explicit constraints rather than hoping for implicit understanding:

```xml
<constraints>
- Maximum 200 words
- No technical jargon
- Include exactly 3 examples
- Format as numbered list
</constraints>
```

**Incremental Prompting**: For complex tasks, break into sequential prompts rather than overloading a single request. Create outline → Draft introduction → Develop body → Polish.

## Gotchas

- **Tag consistency matters more than tag names**: There are no canonical "best" XML tags. Using `<ctx>` consistently works better than mixing `<context>`, `<background>`, and `<info>` randomly.

- **Negative instructions often fail**: "Don't include headers" frequently gets ignored. Rephrase as "Write in flowing paragraphs without section headings."

- **Prompt style influences output style**: If your prompt uses heavy markdown, the output often will too. Match your prompt formatting to your desired output formatting.

- **Overloading causes drift**: Cramming multiple unrelated tasks into one prompt degrades quality. Split complex requests into focused prompts.

- **Example quality affects output quality**: Low-quality or inconsistent examples teach bad patterns. Make examples diverse enough to avoid the model picking up unintended patterns.

- **Word "think" triggers extended behavior**: In some Claude models, using "think" can activate extended reasoning. Use "consider" or "evaluate" if you want concise responses.

- **Prefilled responses deprecated**: Starting with Claude 4.6, prefilled assistant responses are no longer supported. Use explicit instructions or structured outputs instead.

- **Model-specific formatting**: XML tags work exceptionally well for Claude but may have different effects on other LLMs. Test across models if building multi-model systems.

- **Long prompts need structure most**: The more complex your prompt, the more critical XML structuring becomes. Simple one-line prompts rarely need tags.

## Sources

- [Anthropic Claude Documentation - Use XML tags to structure your prompts](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) — Official Anthropic guidance on XML tag usage, benefits, and best practices for Claude models
- [Anthropic Claude Documentation - Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — Comprehensive Claude prompt engineering guide covering clarity, examples, tool use, and agentic systems
- [DigitalOcean - Prompt Engineering Best Practices](https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices) — Practical techniques for clarity, iterative prompting, and avoiding common mistakes
- [Learn Prompting - Understanding Prompt Structure](https://learnprompting.org/docs/basics/prompt_structure) — Key components of prompts including directives, examples, roles, and output formatting
- [Prompt Engineering Guide - Examples of Prompts](https://www.promptingguide.ai/introduction/examples) — Practical patterns for structured prompts and formatting techniques


---

# Role Prompting and System Prompts

**Topic ID:** prompt-engineering.fundamentals.role-prompting
**Researched:** 2026-02-28T12:00:00Z

## Overview

Role prompting is a prompt engineering technique where you assign a specific persona to a large language model (LLM) to guide its behavior, tone, and focus. Rather than interacting with a generic assistant, you instruct the model to "act as" a particular expert, professional, or character—such as "You are a Python coding assistant" or "You are a CFO analyzing financial data." This technique leverages the model's training data to produce responses that match the expected style and expertise of that role.

System prompts are the foundational instructions that shape how an AI assistant behaves throughout a conversation. In API-based interactions with Claude, the system prompt is passed separately from user messages and establishes the baseline context, rules, and persona. While role prompting can appear anywhere in a prompt, placing roles in system prompts creates persistent behavioral anchoring that influences all subsequent interactions.

The effectiveness of role prompting varies significantly based on the task type. Research shows it works well for creative writing, tone adjustment, and style matching, but provides limited benefit for factual accuracy or reasoning tasks—especially with modern, more capable models like Claude's latest versions. Understanding when and how to apply roles is essential for effective prompt engineering.

## Key Concepts

- **System Prompt**: The special instruction block passed via the `system` parameter in API calls that establishes foundational context, rules, and behavioral guidelines before user interaction begins.

- **Role Prompting (Persona Prompting)**: Assigning a specific identity or expertise to the model using phrases like "You are a [role]" to influence response style, tone, and focus.

- **Speaker-Specific vs. Audience-Specific Prompts**: Speaker-specific prompts define who the model is ("You are a lawyer"), while audience-specific prompts define who it's talking to ("Explain this to a beginner").

- **Behavioral Anchoring**: When placed in system prompts, roles establish persistent behavior patterns that carry throughout the conversation, creating consistent tone and expertise alignment.

- **Domain Alignment**: Matching the assigned role to the task domain (e.g., "lawyer" for legal analysis) can provide minor performance improvements, though effect sizes are typically small.

- **Tone vs. Accuracy Distinction**: Role prompting primarily affects communication style and tone rather than factual accuracy. A "professor" role changes how information is presented, not what information is retrieved.

- **Explicitness Over Role Assignment**: Modern models often perform better with explicit behavioral instructions ("Focus on risk tolerance and growth potential") rather than vague role assignments ("You are a financial advisor").

## Technical Details

### Basic System Prompt Structure

In the Claude API, roles are set via the `system` parameter:

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
print(message.content)
```

### Effective System Prompt Pattern

A well-structured system prompt reads like a contract with clear sections:

```text
Role: You are a senior data analyst specializing in marketing metrics.

Success criteria:
- Provide actionable insights, not just raw numbers
- Flag anomalies and explain their potential causes
- Recommend specific next steps based on findings

Constraints:
- Do not make predictions beyond the data provided
- Acknowledge uncertainty when confidence is low
- Use plain language; avoid jargon unless asked

Output format: Start with a 2-sentence executive summary, then provide detailed analysis.
```

### Using XML Tags for Complex Prompts

XML structuring helps Claude parse multi-part system prompts:

```xml
<role>
You are a technical documentation writer for developer tools.
</role>

<guidelines>
- Write in second person ("you" not "the user")
- Include code examples for every concept
- Prefer concrete examples over abstract descriptions
</guidelines>

<constraints>
- Maximum 3 levels of heading depth
- Code blocks must specify language for syntax highlighting
</constraints>
```

### Combining Role with Behavioral Instructions

Rather than relying solely on role implication, combine roles with explicit behavioral guidance:

```text
You are a security-focused code reviewer.

When reviewing code:
1. First identify potential security vulnerabilities (injection, auth issues, data exposure)
2. Then note performance concerns
3. Finally suggest style improvements

Always explain the security implications of issues you find, including potential exploit scenarios.
```

## Common Patterns

### Pattern 1: Expert Consultation
Assign a domain expert role when you need specialized analysis:

```text
You are a board-certified cardiologist reviewing patient case summaries.
Analyze the following case and identify key clinical concerns that warrant
further investigation. Cite relevant clinical guidelines where applicable.
```

### Pattern 2: Communication Style Adjustment
Use roles to match output to a specific audience:

```text
You are a science communicator who explains complex topics to general audiences.
Avoid technical jargon. Use analogies and everyday examples. If you must use
technical terms, define them immediately.
```

### Pattern 3: Constraint-Focused Roles
Define what the role should and shouldn't do:

```text
You are a customer support agent for a SaaS product.

You CAN:
- Answer questions about features and pricing
- Walk users through troubleshooting steps
- Escalate complex issues by providing ticket templates

You CANNOT:
- Make promises about future features
- Offer refunds or credits (direct to billing team)
- Access or discuss specific account data
```

### Pattern 4: Two-Stage Role Establishment
For complex roles, establish the persona before posing questions:

```text
# Message 1 (System)
You are a senior software architect with 15 years of experience in
distributed systems and cloud infrastructure.

# Message 2 (User)
I'm designing a real-time notification system that needs to handle
10M concurrent users. What architectural patterns should I consider?
```

### Pattern 5: Minimal Effective Role
Modern models often work best with concise, task-specific roles:

```text
You are a code review assistant. Focus on correctness, security, and readability.
```

## Gotchas

### Role Prompting Doesn't Guarantee Factual Accuracy
Assigning "expert" roles doesn't make the model more knowledgeable or accurate. Research shows that personas like "You are a world-renowned expert" provide minimal accuracy improvements and can sometimes harm performance. A model playing a doctor doesn't have access to more medical knowledge—it just adjusts its communication style.

### Heavy-Handed Roles Can Backfire
Overly specific or aggressive role definitions may constrain helpful behavior. "You are a world-renowned expert who only speaks in technical jargon and never makes mistakes" is worse than "You are a helpful assistant." The model may become rigid or produce unnatural outputs.

### Modern Models Need Less Role Prompting
Research indicates that newer models (Claude 4.x, GPT-4) are sophisticated enough that heavy role prompting is often unnecessary. Explicit instructions about what you want often outperform role assignments. Instead of "You are a financial advisor," try "Analyze this investment portfolio, focusing on risk tolerance and long-term growth potential."

### Conflicting Research Results
Studies show mixed effectiveness. Some found accuracy improvements on math problems (53.5% to 63.8% with GPT-3.5), while others found "adding personas in system prompts does not improve model performance" across factual tasks. Effect sizes from domain alignment are consistently small.

### System Prompt vs. User Message Placement
Roles in system prompts create persistent behavioral anchoring. Roles in user messages may be overridden or forgotten in long conversations. For API usage, prefer the `system` parameter for consistent behavior.

### The "Idiot Persona" Paradox
In controlled experiments, personas like "You are an idiot" sometimes outperformed "You are a genius" on reasoning tasks. This suggests that simple persona labels may not function as intuitively expected—performance depends on complex interactions with training data rather than literal role interpretation.

### Gender and Stereotype Biases
Research shows male roles often outperform female roles in benchmarks, reflecting biases in training data. Gender-neutral, professional terminology produces more consistent results. Avoid intimate or relationship-based roles (partner, spouse) in favor of occupational or neutral descriptors.

## Sources

- [Prompting Best Practices - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/system-prompts) — Official Anthropic documentation on system prompts and role assignment with code examples
- [Claude 4 Best Practices](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices) — Comprehensive guide covering role prompting, XML structuring, and modern prompting techniques
- [Role Prompting Guide - Learn Prompting](https://learnprompting.org/docs/advanced/zero_shot/role_prompting) — Definition, categories of roles, research findings, and best practices for persona assignment
- [Role-Prompting: Does Adding Personas Really Make a Difference? - PromptHub](https://www.prompthub.us/blog/role-prompting-does-adding-personas-to-your-prompts-really-make-a-difference) — Research analysis showing mixed effectiveness results and task-dependent outcomes


---

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


---

# Structured Outputs and JSON

**Topic ID:** prompt-engineering.output-control.structured-outputs
**Researched:** 2026-02-28T12:00:00Z

## Overview

Structured outputs enable LLMs to generate responses that strictly conform to a predefined JSON schema, eliminating parsing errors and schema violations that plague traditional prompt-based approaches. While basic "JSON mode" only guarantees syntactically valid JSON, structured outputs go further by enforcing schema adherence—ensuring required fields are present, data types are correct, and enum values are valid. This distinction is critical: JSON mode might return `{"name": "John"}` when you expected `{"name": "John", "email": "...", "age": 30}`, but structured outputs guarantee the complete schema is followed.

The technology works through **constrained decoding** (also called grammar-based decoding). At each token generation step, the system masks out tokens that would violate the schema, forcing the model to only select from valid continuations. This achieves 100% schema compliance by construction—invalid outputs literally cannot be produced. Major providers including OpenAI, Anthropic (Claude), and Cohere have implemented this capability, with OpenAI's gpt-4o achieving perfect scores on complex JSON schema benchmarks compared to under 40% for earlier models without constrained decoding.

Structured outputs serve two primary use cases: controlling model response format (extracting data, generating reports, formatting API responses) and validating tool/function parameters in agentic workflows. When building agents that call external functions, strict mode ensures the model provides correctly-typed arguments every time, eliminating runtime errors and retry logic.

## Key Concepts

- **JSON Mode vs. Structured Outputs**: JSON mode guarantees valid JSON syntax; structured outputs guarantee schema conformance. Always prefer structured outputs when schema adherence matters.

- **Constrained Decoding**: The underlying technique that masks invalid tokens during generation. At each step, only tokens that continue a valid schema-conformant output are allowed, achieving 100% compliance by construction.

- **Grammar Compilation**: Schemas are compiled into grammar artifacts (finite state machines or pushdown automata) that efficiently determine valid next tokens. First-request latency is higher due to compilation; subsequent requests benefit from caching.

- **Strict Mode (`strict: true`)**: The API parameter that enables schema enforcement for tool/function calls. When enabled, all tool inputs are guaranteed to match the defined `input_schema`.

- **Response Format (`json_schema`)**: Specifies the expected output structure for model responses. In OpenAI's API, use `response_format: {type: "json_schema", json_schema: {...}}`; in Claude's API, use `output_config.format`.

- **Schema Validation vs. Content Accuracy**: Structured outputs guarantee format, not factual correctness. The model can still hallucinate values that match the schema perfectly—a `{"price": 99.99}` response is schema-valid even if the actual price is different.

- **SDK Helpers**: Pydantic (Python), Zod (TypeScript), and native class definitions (Java/Ruby) can automatically generate JSON schemas from type definitions, with SDK methods like `client.messages.parse()` providing automatic validation.

## Technical Details

### API Implementation Patterns

**OpenAI API** - Two approaches:
```python
# Response format for direct JSON output
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "extraction",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "email": {"type": "string"}
                },
                "required": ["name", "email"],
                "additionalProperties": False
            }
        }
    },
    messages=[{"role": "user", "content": "Extract: John at john@example.com"}]
)

# Function calling with strict mode
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["location", "unit"],
            "additionalProperties": False
        }
    }
}]
```

**Claude API** - Similar dual approach:
```python
# JSON outputs via output_config
response = client.messages.create(
    model="claude-sonnet-4-6",
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {"name": {"type": "string"}},
                "required": ["name"],
                "additionalProperties": False
            }
        }
    },
    messages=[{"role": "user", "content": "..."}]
)

# Strict tool use
tools = [{
    "name": "search",
    "strict": True,
    "input_schema": {...}
}]
```

### JSON Schema Limitations

Both OpenAI and Claude impose restrictions on supported schema features:

| Supported | Not Supported |
|-----------|---------------|
| Basic types (object, array, string, number, boolean, null) | Recursive schemas |
| `enum`, `const`, `anyOf`, `allOf` | External `$ref` |
| `$ref`/`$defs` (internal only) | Numerical constraints (`minimum`, `maximum`) |
| `required`, `additionalProperties: false` | String constraints (`minLength`, `maxLength`) |
| String formats: `date`, `email`, `uri`, `uuid` | `additionalProperties: true` |

**Critical requirement**: `additionalProperties` must be set to `false` for all objects, and all properties should typically be marked as `required`.

### Performance Characteristics

- **First-request latency**: Grammar compilation adds 100-500ms+ overhead
- **Caching**: Compiled grammars cached for 24 hours (invalidated on schema changes)
- **Token overhead**: System prompt injected to explain expected format (adds to input tokens)
- **Complexity limits**: OpenAI/Claude limit strict tools per request (~20), optional parameters (~24), and union types (~16)

## Common Patterns

### Data Extraction
```python
from pydantic import BaseModel
from typing import List

class Invoice(BaseModel):
    invoice_number: str
    date: str
    total: float
    line_items: List[dict]

response = client.messages.parse(
    model="claude-sonnet-4-6",
    output_format=Invoice,
    messages=[{"role": "user", "content": f"Extract from: {invoice_text}"}]
)
# response.parsed_output is typed Invoice object
```

### Agentic Tool Validation
Define strict tools to ensure agents pass correctly-typed parameters:
```python
tools = [
    {"name": "book_flight", "strict": True, "input_schema": {
        "type": "object",
        "properties": {
            "destination": {"type": "string"},
            "passengers": {"type": "integer", "enum": [1,2,3,4,5,6]},
            "date": {"type": "string", "format": "date"}
        },
        "required": ["destination", "passengers", "date"],
        "additionalProperties": False
    }}
]
```

### Classification with Enums
```python
schema = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": ["bug", "feature", "question"]},
        "priority": {"type": "string", "enum": ["low", "medium", "high"]},
        "confidence": {"type": "number"}
    },
    "required": ["category", "priority", "confidence"],
    "additionalProperties": False
}
```

## Gotchas

- **All fields must be required**: When `strict: true` is enabled, OpenAI requires all properties to be listed in `required`. Optional fields must be handled via union types with `null` (e.g., `"type": ["string", "null"]`).

- **Refusals bypass schema**: If the model refuses a request for safety reasons (`stop_reason: "refusal"`), the output will not match your schema. Always check `stop_reason` before parsing.

- **`max_tokens` truncation**: If output is cut off due to token limits (`stop_reason: "max_tokens"`), the JSON will be incomplete and unparseable. Set generous `max_tokens` values.

- **Parallel tool calls disabled**: OpenAI's structured outputs are incompatible with parallel function calls. Set `parallel_tool_calls: false` when using strict mode.

- **Property ordering**: Required properties appear first in output, followed by optional properties, regardless of schema definition order.

- **Schema complexity limits**: Complex schemas with many optional fields, union types, or nested objects can exceed compilation limits, causing 400 errors. Simplify schemas or split across multiple tools.

- **No content validation**: A response like `{"email": "not-an-email"}` is schema-valid if `email` is type `string`. Use `format: "email"` for basic format checking, but validate critical fields in application code.

- **Caching invalidation**: Changing the schema structure (not just `name` or `description`) invalidates the grammar cache, reintroducing first-request latency.

- **Provider differences**: OpenAI uses `response_format.json_schema`, Claude uses `output_config.format`. Tool schemas differ slightly between providers—always consult provider-specific docs.

## Sources

- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — Comprehensive guide to Claude's JSON outputs and strict tool use features
- [OpenAI Introducing Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) — Announcement explaining 100% schema compliance and constrained decoding approach
- [Cohere Structured Outputs](https://docs.cohere.com/docs/structured-outputs) — Documentation on strict_tools and JSON mode implementations
- [A Guide to Structured Outputs Using Constrained Decoding](https://www.aidancooper.co.uk/constrained-decoding/) — Technical explanation of grammar-based decoding mechanics
- [Modelmetry: How to Ensure LLM Output Adheres to JSON Schema](https://modelmetry.com/blog/how-to-ensure-llm-output-adheres-to-a-json-schema) — Comparison of approaches including prompting, JSON mode, and constrained decoding
- [Let's Data Science: How Structured Outputs Work](https://www.letsdatascience.com/blog/structured-outputs-making-llms-return-reliable-json) — Overview of token masking and 100% compliance guarantees


---

# Verbosity and Communication Style

**Topic ID:** prompt-engineering.output-control.verbosity-and-style
**Researched:** 2026-02-28T12:00:00Z

## Overview

Verbosity and communication style control is the practice of explicitly directing how an LLM structures, formats, and delivers its responses. This encompasses three interconnected concerns: response length (how much the model outputs), formatting (markdown, prose, lists, JSON), and tone (formal, casual, technical, conversational). Without explicit guidance, models default to verbose, generically helpful responses that may include unwanted preambles, excessive explanation, or inconsistent structure.

This topic matters because uncontrolled output undermines production systems. Verbose responses inflate token costs, break parsing pipelines, and create poor user experiences. Inconsistent formatting prevents downstream automation. Mismatched tone damages brand voice and user trust. The difference between a demo and a production-ready AI system often comes down to how precisely you control these dimensions.

Verbosity and style control sits within the broader output-control pillar of prompt engineering, alongside structured output (JSON schemas, XML), response validation, and stop sequences. Mastering these techniques enables reliable, cost-effective, and user-appropriate AI outputs across applications from chatbots to code generation agents.

## Key Concepts

- **Explicit length constraints**: Terms like "brief" or "detailed" are subjective and interpreted inconsistently. Specify measurable limits: word counts, sentence budgets, bullet counts, or section limits. Example: "Summarize in exactly 3 bullet points, each under 20 words."

- **Positive framing**: Tell the model what to do, not what to avoid. Instead of "Do not use markdown," write "Respond in smoothly flowing prose paragraphs." Models follow affirmative instructions more reliably.

- **Role prompting**: Assigning a persona shapes tone and vocabulary. "You are a senior tax attorney speaking to a non-technical client" produces different output than "You are a witty tech blogger." Combine with system messages for reinforcement.

- **Few-shot examples**: 3-5 well-crafted examples are the most reliable way to steer format, tone, and structure. Wrap examples in `<example>` tags to distinguish them from instructions. Ensure examples mirror your instructions exactly.

- **XML tags for structure**: Tags like `<instructions>`, `<context>`, `<output>` help models parse complex prompts unambiguously. Claude documentation explicitly recommends this; it reduces misinterpretation when prompts mix multiple content types.

- **Instruction placement**: For long contexts, place formatting instructions at both the beginning and end. For shorter prompts, positioning instructions near the end—just before expected output—often yields better adherence.

- **Conditional verbosity**: Specify when elaboration is acceptable. "Keep responses under 50 words unless the user asks for implementation details" lets the model stay terse until a trigger justifies expansion.

- **Output anchoring**: Start the desired structure yourself to steer continuation. Providing a skeleton like "Summary: / Impact: / Recommendation:" forces the model to complete that pattern.

## Technical Details

### API-Level Controls

API parameters provide hard boundaries but don't directly control content length:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,  # Hard cutoff, not target length
    stop_sequences=["Best regards,", "---"],  # Stop on specific tokens
    messages=[...]
)
```

`max_tokens` truncates output at a limit—useful as a safety net, not a precision tool. Stop sequences halt generation when encountered, enabling patterns like stopping before email signatures or section delimiters.

### Prompt-Level Verbosity Control

Effective verbosity control happens in the prompt itself:

```text
# Response Format
- Maximum 3 sentences per response
- No preambles ("Here is...", "I'd be happy to...")
- If the answer requires more detail, ask clarifying questions instead

# When responding:
1. Lead with the direct answer
2. Add one supporting detail if essential
3. Stop
```

### Markdown and Formatting Control

Claude's documentation provides a detailed example for minimizing markdown:

```text
<avoid_excessive_markdown>
When writing reports or technical content, use clear flowing prose
with standard paragraphs. Reserve markdown primarily for:
- `inline code` and code blocks
- Simple headings (### level)

DO NOT use bullet lists unless presenting truly discrete items or
the user explicitly requests them. Incorporate information naturally
into sentences rather than fragmenting into isolated points.
</avoid_excessive_markdown>
```

For the opposite—enforcing structured output:

```text
Return only a JSON object with these fields: task, status, confidence.
Do not include any explanation or surrounding text.
IMPORTANT: Respond only with the structure above.
```

### Tone Control Patterns

Combine explicit tone instructions with examples:

```text
System: You are a customer support agent. Your tone is warm but efficient—
acknowledge the user's concern in one sentence, then provide the solution.
Never apologize more than once. Never use exclamation marks.

<example>
User: My order hasn't arrived
Assistant: I understand waiting is frustrating. Your order shipped yesterday
and tracking shows delivery by Thursday. Here's the tracking link: [link]
</example>
```

### Model-Specific Considerations

Different models respond differently to formatting cues:

| Model Family | Format Preference | Verbosity Notes |
|--------------|-------------------|-----------------|
| Claude 4.x | XML tags, explicit prose instructions | More concise by default; may skip summaries after tool use |
| GPT-4.1+ | Markdown, numbered instruction lists | Literal instruction-following; explicit length limits needed |
| GPT-5.x | Flexible; steerable via natural language | More verbose baseline; explicit compactness rules help |

## Common Patterns

### The Compactness Ladder

Define graduated response lengths based on task complexity:

```text
Response length rules:
- Simple factual questions: 1-2 sentences
- How-to explanations: 3-5 bullet points
- Complex analysis: up to 3 paragraphs with headings
- Full tutorials: use sections, but each under 200 words
```

### Style Mirroring

Match your prompt formatting to desired output formatting. If you write your prompt in flowing prose without bullets, the model is more likely to respond similarly. If you write terse, comma-separated instructions, expect terse output.

### The Personal Writing Kit

For consistent brand voice, maintain a reusable document containing:
- 3-5 sample passages exemplifying target style
- Bullet points describing style characteristics
- List of signature phrases to use ("real talk," "bottom line")
- List of phrases to avoid ("I'd be happy to," "certainly")

Feed this kit into the system prompt for every request.

### Feedback Loop Integration

Ask the model to explain its choices, then iterate:

```text
Write two versions of this announcement:
1. Version A: formal corporate tone
2. Version B: casual startup tone

Then explain the key differences in word choice and structure.
```

This surfaces the model's understanding of style distinctions, enabling refinement.

## Gotchas

- **"Brief" doesn't mean brief**: Subjective terms like "concise," "short," or "detailed" are interpreted inconsistently across models and even across prompts. Always quantify: word limits, sentence counts, or bullet limits.

- **Emphasis is weak steering**: Research shows bold/italic emphasis has surprisingly little effect on LLM behavior. Structural guidance (headings, XML tags, numbered lists) outperforms typographic emphasis significantly.

- **Newer models may skip summaries**: Claude 4.x models default to jumping directly to the next action after tool calls without verbal summaries. If you need visibility into reasoning, explicitly request: "After completing each step, provide a one-sentence summary."

- **Instruction placement matters for long contexts**: In prompts with 20K+ tokens of context, instructions placed only at the beginning may be partially forgotten. Repeat critical formatting rules at the end, near where output begins.

- **Model-specific format preferences**: GPT-3.5 prefers JSON prompts while GPT-4 favors markdown. Claude responds well to XML tags. Testing your specific model is essential—no single format works universally.

- **Preamble creep**: Models have a "helpful assistant" tendency to add commentary like "Great question!" or "Here's what I found." Combat this with explicit exclusions: "Respond only with the requested format. Do not explain your answer."

- **Example-instruction mismatch**: If your examples contradict your instructions (e.g., instructions say "3-5 bullets" but examples show 7), the model may follow either inconsistently. Ensure perfect alignment between stated rules and demonstrated examples.

## Sources

- [Claude Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — Primary source for Claude-specific verbosity control, XML tag usage, markdown control prompts, and communication style guidance
- [Lakera Prompt Engineering Guide 2026](https://www.lakera.ai/blog/prompt-engineering-guide) — Format constraints, tone/role assignment, output anchoring techniques, and model-specific recommendations
- [GPT-4.1 Prompting Guide - OpenAI Cookbook](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide) — Instruction placement strategy, response rules sections, verbosity control for GPT models
- [God of Prompt - Train Claude Writing Style](https://www.godofprompt.ai/blog/train-claude-to-understand-writing-style) — Personal writing kit concept, style breakdown methodology, phrase seeding techniques


---

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

