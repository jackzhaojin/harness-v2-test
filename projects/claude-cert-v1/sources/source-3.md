# Tool use with Claude

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/tool-use
**Extraction ID Prefix:** EXT-3
**Extracted:** 2026-03-01T00:00:00Z

## Summary

This page is the official Anthropic documentation for implementing tool use (function calling) with Claude. It covers both client-side and server-side tools, explains the complete tool use workflow from definition to execution, and provides detailed implementation patterns for single, parallel, and sequential tool calling scenarios.

## Key Facts

- `EXT-3-fact-1`: Claude supports two types of tools: Client tools (execute on your systems, including custom tools and Anthropic-defined tools like computer use and text editor) and Server tools (execute on Anthropic's servers, like web search and web fetch).
- `EXT-3-fact-2`: Anthropic-defined tools use versioned types (e.g., `web_search_20250305`, `text_editor_20250124`) to ensure compatibility across model versions.
- `EXT-3-fact-3`: For client tools, the API response has a `stop_reason` of `tool_use` when Claude decides to use a tool.
- `EXT-3-fact-4`: Server tools run in a sampling loop with a default limit of 10 iterations.
- `EXT-3-fact-5`: When the server-side sampling loop reaches its iteration limit, the API returns `stop_reason="pause_turn"` which may include a `server_tool_use` block without a corresponding `server_tool_result`.
- `EXT-3-fact-6`: MCP tool definitions use `inputSchema` which must be renamed to `input_schema` when converting to Claude's tool format.
- `EXT-3-fact-7`: Claude can call multiple tools in parallel within a single response when operations are independent.
- `EXT-3-fact-8`: All `tool_use` blocks from parallel calls are included in a single assistant message, and all corresponding `tool_result` blocks must be provided in the subsequent user message.
- `EXT-3-fact-9`: Claude Opus is more likely to recognize missing required parameters and ask for them, while Claude Sonnet may attempt to infer reasonable values.
- `EXT-3-fact-10`: For sequential tool use, Claude will call one tool at a time, using the output of one tool as input to another.
- `EXT-3-fact-11`: Claude Opus is prompted by default to think before answering tool use queries to determine if a tool is necessary, which tool to use, and appropriate parameters.
- `EXT-3-fact-12`: Claude Sonnet and Haiku are prompted to try to use tools as much as possible and are more likely to call unnecessary tools or infer missing parameters.
- `EXT-3-fact-13`: Tool use adds performance gains on benchmarks like LAB-Bench FigQA (scientific figure interpretation) and SWE-bench (real-world software engineering), often surpassing human expert baselines.
- `EXT-3-fact-14`: Structured Outputs with `strict: true` in tool definitions guarantees schema validation for tool inputs, ensuring tool calls always match your schema exactly.
- `EXT-3-fact-15`: Steps 3 and 4 of the client tool workflow (executing the tool and returning results to Claude) are optional - for some workflows, Claude's tool use request might be all you need.

## Definitions

- `EXT-3-def-1`: **Client tools** — Tools that execute on your systems, including user-defined custom tools and Anthropic-defined tools like computer use and text editor that require client implementation.
- `EXT-3-def-2`: **Server tools** — Tools that execute on Anthropic's servers, like web search and web fetch tools. Must be specified in the API request but don't require implementation on your part.
- `EXT-3-def-3`: **Tool use contract** — You specify what operations are available and what they return; Claude decides when and how to call them.
- `EXT-3-def-4`: **pause_turn stop reason** — A response stop reason indicating the server-side sampling loop reached its iteration limit (default 10 iterations) while executing server tools.
- `EXT-3-def-5`: **Parallel tool use** — Claude calling multiple tools in parallel within a single response when operations are independent.
- `EXT-3-def-6`: **Sequential tool use** — Tasks requiring multiple tools called in sequence, using the output of one tool as input to another.

## Code Examples

### `EXT-3-code-1`: Basic tool definition with Messages API (Python)

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    }
                },
                "required": ["location"],
            },
        }
    ],
    messages=[{"role": "user", "content": "What's the weather like in San Francisco?"}],
)
print(response)
```

### `EXT-3-code-2`: Tool use response structure

```json
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-opus-4-6",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll check the current weather in San Francisco for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA", "unit": "celsius" }
    }
  ]
}
```

### `EXT-3-code-3`: Returning tool results to Claude (Python)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The unit of temperature, either 'celsius' or 'fahrenheit'",
                    },
                },
                "required": ["location"],
            },
        }
    ],
    messages=[
        {"role": "user", "content": "What's the weather like in San Francisco?"},
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "I'll check the current weather in San Francisco for you.",
                },
                {
                    "type": "tool_use",
                    "id": "toolu_01A09q90qw90lq917835lq9",
                    "name": "get_weather",
                    "input": {"location": "San Francisco, CA", "unit": "celsius"},
                },
            ],
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": "toolu_01A09q90qw90lq917835lq9",  # from the API response
                    "content": "65 degrees",  # from running your tool
                }
            ],
        },
    ],
)

print(response)
```

### `EXT-3-code-4`: Converting MCP tools to Claude format (Python)

```python
from mcp import ClientSession


async def get_claude_tools(mcp_session: ClientSession):
    """Convert MCP tools to Claude's tool format."""
    mcp_tools = await mcp_session.list_tools()

    claude_tools = []
    for tool in mcp_tools.tools:
        claude_tools.append(
            {
                "name": tool.name,
                "description": tool.description or "",
                "input_schema": tool.inputSchema,  # Rename inputSchema to input_schema
            }
        )

    return claude_tools
```

### `EXT-3-code-5`: Converting MCP tools to Claude format (TypeScript)

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

async function getClaudeTools(mcpClient: Client) {
  // Convert MCP tools to Claude's tool format
  const mcpTools = await mcpClient.listTools();

  return mcpTools.tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    input_schema: tool.inputSchema // Rename inputSchema to input_schema
  }));
}
```

### `EXT-3-code-6`: Multiple tool definition example (Python)

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The unit of temperature, either 'celsius' or 'fahrenheit'",
                    },
                },
                "required": ["location"],
            },
        },
        {
            "name": "get_time",
            "description": "Get the current time in a given time zone",
            "input_schema": {
                "type": "object",
                "properties": {
                    "timezone": {
                        "type": "string",
                        "description": "The IANA time zone name, e.g. America/Los_Angeles",
                    }
                },
                "required": ["timezone"],
            },
        },
    ],
    messages=[
        {
            "role": "user",
            "content": "What is the weather like right now in New York? Also what time is it there?",
        }
    ],
)
print(response)
```

### `EXT-3-code-7`: Sequential tool use with empty schema (Python)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[
        {
            "name": "get_location",
            "description": "Get the current user location based on their IP address. This tool has no parameters or arguments.",
            "input_schema": {"type": "object", "properties": {}},
        },
        {
            "name": "get_weather",
            "description": "Get the current weather in a given location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The unit of temperature, either 'celsius' or 'fahrenheit'",
                    },
                },
                "required": ["location"],
            },
        },
    ],
    messages=[{"role": "user", "content": "What's the weather like where I am?"}],
)
```

## Patterns and Best Practices

- `EXT-3-pattern-1`: Tool definitions should include a name, description, and input_schema (JSON Schema object type with properties and required fields).
- `EXT-3-pattern-2`: When handling `pause_turn` with server tools, continue the conversation by sending the response back to let Claude finish processing.
- `EXT-3-pattern-3`: For parallel tool use, all tool results must be formatted correctly in a single user message to avoid API errors and ensure Claude continues using parallel tools.
- `EXT-3-pattern-4`: Tool descriptions should be detailed enough to ensure best performance (the examples shown use brief descriptions for brevity).
- `EXT-3-pattern-5`: When MCP servers provide tools via `list_tools()`, rename `inputSchema` to `input_schema` before passing to Claude's Messages API.
- `EXT-3-pattern-6`: When Claude responds with a `tool_use` block for MCP tools, execute the tool on the MCP server using `call_tool()` and return the result in a `tool_result` block.
- `EXT-3-pattern-7`: For tools with no parameters, use an empty properties object in the input_schema: `{"type": "object", "properties": {}}`.
- `EXT-3-pattern-8`: To improve tool assessment for Sonnet/Haiku, add a chain-of-thought prompt asking Claude to analyze which tool is relevant and verify all required parameters before calling.

## Important Warnings

- `EXT-3-warn-1`: Tool results must be provided in the correct format for parallel tool use to avoid API errors - see the implementation guide for detailed formatting requirements.
- `EXT-3-warn-2`: When the server-side sampling loop reaches 10 iterations, it returns `pause_turn` - you must continue the conversation by sending the response back for Claude to finish.
- `EXT-3-warn-3`: Claude Sonnet and Haiku may call unnecessary tools or infer missing parameters - consider using the chain-of-thought prompt to improve parameter validation.
- `EXT-3-warn-4`: If prompted to call dependent tools all at once, Claude is likely to guess parameters for downstream tools instead of waiting for upstream tool results.
- `EXT-3-warn-5`: The MCP connector provides direct connection to remote MCP servers from the Messages API without implementing a client - useful for those who don't want to build their own MCP client.

## Pricing Details

- `EXT-3-fact-16`: Tool use requests are priced based on total input tokens (including the `tools` parameter), output tokens generated, and for server-side tools, additional usage-based pricing.
- `EXT-3-fact-17`: Client-side tools are priced the same as any other Claude API request; server-side tools may incur additional charges based on specific usage.
- `EXT-3-fact-18`: Tool use token costs come from: the `tools` parameter in API requests, `tool_use` content blocks in requests/responses, and `tool_result` content blocks in requests.
- `EXT-3-fact-19`: A special system prompt for tool use is automatically included when using `tools`, with token counts varying by model and tool choice.

### Tool Use System Prompt Token Counts by Model

- `EXT-3-fact-20`: Claude Opus 4.6/4.5/4.1/4: 346 tokens for `auto`/`none`, 313 tokens for `any`/`tool`.
- `EXT-3-fact-21`: Claude Sonnet 4.6/4.5/4: 346 tokens for `auto`/`none`, 313 tokens for `any`/`tool`.
- `EXT-3-fact-22`: Claude Haiku 4.5: 346 tokens for `auto`/`none`, 313 tokens for `any`/`tool`.
- `EXT-3-fact-23`: Claude Haiku 3.5: 264 tokens for `auto`/`none`, 340 tokens for `any`/`tool`.
- `EXT-3-fact-24`: Claude Opus 3 (deprecated): 530 tokens for `auto`/`none`, 281 tokens for `any`/`tool`.
- `EXT-3-fact-25`: Claude Sonnet 3: 159 tokens for `auto`/`none`, 235 tokens for `any`/`tool`.
- `EXT-3-fact-26`: Claude Haiku 3: 264 tokens for `auto`/`none`, 340 tokens for `any`/`tool`.
- `EXT-3-fact-27`: If no tools are provided, tool choice of `none` uses 0 additional system prompt tokens.

## Chain of Thought Prompt for Sonnet/Haiku

```
Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters. DO NOT ask for more information on optional parameters if it is not provided.
```
