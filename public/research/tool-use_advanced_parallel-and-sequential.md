# Parallel and Sequential Tool Calls

**Topic ID:** tool-use.advanced.parallel-and-sequential
**Researched:** 2025-02-28T12:00:00Z

## Overview

Parallel and sequential tool calling represents a fundamental architectural decision when building LLM-powered agents that interact with external systems. The distinction matters because it directly impacts latency, throughput, and correctness. When an LLM needs to gather data from multiple sources or perform multiple operations, it can either request all tools simultaneously (parallel) or chain them one at a time (sequential).

The performance difference is dramatic: four API calls taking 300ms each complete in roughly 300ms total when parallelized, versus 1.2 seconds when executed sequentially. For user-facing applications, this is the difference between feeling instantaneous (~500ms) and sluggish (3+ seconds). Beyond raw speed, parallel execution enables agents to cross-reference information from many sources without exhausting user patience—a capability essential for complex reasoning tasks.

Both OpenAI and Anthropic models support parallel tool calling by default, though the behavior varies by model family and can be controlled via API parameters. Understanding when to use each pattern—and how to implement hybrid approaches—is essential for building responsive, reliable AI agents.

## Key Concepts

- **Parallel tool calling**: The model requests multiple tool executions in a single response, allowing them to run concurrently. The response contains an array of `tool_calls` (OpenAI) or multiple `tool_use` blocks (Anthropic), each with a unique ID.

- **Sequential tool calling**: Tools execute one at a time, with each call waiting for the previous result before the next request. Required when one tool's output serves as input to another.

- **Data dependencies**: The primary determinant of execution strategy. If Tool B requires output from Tool A, sequential execution is mandatory. Independent operations are candidates for parallelization.

- **`parallel_tool_calls` parameter (OpenAI)**: Controls whether the model can request multiple tools in one turn. Default is `true`. Set to `false` to ensure exactly zero or one tool call per response.

- **`disable_parallel_tool_use` parameter (Anthropic)**: When set to `true` with `tool_choice: auto`, ensures Claude uses at most one tool. With `tool_choice: any` or `tool`, ensures exactly one tool.

- **Tool result correlation**: Each tool result must reference the original tool call's ID. OpenAI uses `tool_call_id`, Anthropic uses `tool_use_id`. Mismatched IDs cause API errors.

- **Hybrid execution**: Many workflows combine both patterns—parallel data gathering followed by sequential analysis. This maximizes throughput while respecting logical dependencies.

- **Error isolation**: In parallel execution, one failed tool shouldn't necessarily abort others. Use `return_exceptions=True` with `asyncio.gather()` to handle failures individually.

## Technical Details

### OpenAI API Structure

When the model requests parallel tool calls, the response contains multiple entries in the `tool_calls` array:

```json
{
  "role": "assistant",
  "tool_calls": [
    {"id": "call_abc123", "function": {"name": "get_weather", "arguments": "{\"location\": \"Tokyo\"}"}},
    {"id": "call_def456", "function": {"name": "get_weather", "arguments": "{\"location\": \"Paris\"}"}},
    {"id": "call_ghi789", "function": {"name": "get_time", "arguments": "{\"timezone\": \"Asia/Tokyo\"}"}}
  ]
}
```

You must return all results in a single user message, each referencing the corresponding `tool_call_id`:

```python
messages.append({
    "tool_call_id": "call_abc123",
    "role": "tool",
    "name": "get_weather",
    "content": '{"temperature": "10", "unit": "celsius"}'
})
```

### Anthropic API Structure

Claude returns multiple `tool_use` blocks within the assistant's content array:

```json
{
  "role": "assistant",
  "content": [
    {"type": "text", "text": "I'll check both locations."},
    {"type": "tool_use", "id": "toolu_01A", "name": "get_weather", "input": {"location": "Tokyo"}},
    {"type": "tool_use", "id": "toolu_01B", "name": "get_time", "input": {"location": "Tokyo"}}
  ]
}
```

Results must be provided in a user message with corresponding `tool_result` blocks:

```python
{
    "role": "user",
    "content": [
        {"type": "tool_result", "tool_use_id": "toolu_01A", "content": "10°C, cloudy"},
        {"type": "tool_result", "tool_use_id": "toolu_01B", "content": "3:15 AM"}
    ]
}
```

### Controlling Parallel Behavior

**OpenAI:**
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    parallel_tool_calls=False  # Force single tool per response
)
```

**Anthropic:**
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=messages,
    tools=tools,
    tool_choice={"type": "auto", "disable_parallel_tool_use": True}
)
```

### Async Execution Pattern

When you receive parallel tool calls, execute them concurrently:

```python
import asyncio

async def execute_tools_parallel(tool_calls):
    tasks = []
    for call in tool_calls:
        if call.function.name == "get_weather":
            tasks.append(fetch_weather(call.function.arguments))
        elif call.function.name == "get_time":
            tasks.append(fetch_time(call.function.arguments))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

## Common Patterns

### Pattern 1: Independent Data Gathering
Fetch user profile, preferences, and notifications from separate services simultaneously. All three calls execute in parallel, results combine for a unified response.

### Pattern 2: Multi-Location Queries
"What's the weather in Tokyo, Paris, and New York?" triggers three parallel `get_weather` calls. The model automatically parallelizes identical tool invocations with different parameters.

### Pattern 3: Sequential Dependency Chain
"What's the weather where I am?" requires: (1) `get_location` → returns "San Francisco", (2) `get_weather(location="San Francisco")`. The model correctly sequences these, calling location first, then using its result.

### Pattern 4: Hybrid Workflow
For travel planning: parallel fetch of flights, hotels, and weather data, followed by sequential analysis and recommendation generation. Implementation uses parallel gathering, then feeds combined results to a synthesis step.

### Pattern 5: Fan-Out Analysis
Analyzing multiple code files: spawn parallel analysis tasks for each file, aggregate results, then generate a unified report. Reduces latency from O(n) to O(1) for the analysis phase.

## Gotchas

- **Model support varies**: OpenAI reasoning models (o1, o3-mini, o4-mini) do not support parallel tool calls. Setting `parallel_tool_calls=True` with these models causes errors. GPT-4o and GPT-4o-mini support it.

- **Claude 3.7 Sonnet reluctance**: Claude 3.7 Sonnet may not parallelize even when appropriate. Enabling "token-efficient tool use" beta feature encourages parallel behavior. Claude 4 models parallelize reliably without prompting.

- **Streaming complexity**: Collecting parallel tool calls during streaming is challenging due to overlapping data chunks. Consider non-streaming calls for tool-heavy workloads or implement careful chunk reassembly.

- **ID matching is strict**: Every `tool_use` block requires exactly one corresponding `tool_result` with matching ID. Missing or duplicate results cause API errors.

- **Don't force parallelism on dependencies**: If prompted to call dependent tools in parallel, models may guess downstream parameters incorrectly. Let the model decide execution order based on tool descriptions.

- **Rate limiting risks**: Parallel execution can hit API rate limits faster than sequential. Implement throttling with semaphores when calling external services.

- **Deprecated parameters**: OpenAI's `functions` and `function_call` parameters are deprecated. Use `tools` and `tool_choice` instead (since API version 2023-12-01-preview).

- **Error handling strategy**: Decide upfront whether one failed parallel tool should abort the entire operation or allow others to complete. The `return_exceptions=True` pattern lets you handle each result individually.

## Sources

- [Tool use with Claude - Anthropic Documentation](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/overview) — Official Claude documentation covering parallel tool use, the `disable_parallel_tool_use` parameter, and implementation patterns with code examples.

- [How to use function calling with Azure OpenAI - Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/function-calling) — Comprehensive guide on parallel function calling with Azure OpenAI, including multi-function examples and model support matrix.

- [Why Parallel Tool Calling Matters for LLM Agents - CodeAnt](https://www.codeant.ai/blogs/parallel-tool-calling) — Analysis of performance benefits, latency reduction patterns, and implementation strategies for parallel tool execution.

- [Implementing Sequential and Parallel Tool Use - APXML](https://apxml.com/courses/building-advanced-llm-agent-tools/chapter-3-llm-tool-selection-orchestration/sequential-parallel-tool-use) — Course material covering when to use each pattern, hybrid approaches, and agent decision-making for tool orchestration.

- [OpenAI Developer Community - parallel_tool_calls parameter](https://community.openai.com/t/new-api-feature-disable-parallel-function-calling-via-parallel-tool-calls-false/805405) — Community discussion on the `parallel_tool_calls` parameter, model support, and configuration options.
