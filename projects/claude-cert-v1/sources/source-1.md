# Claude Developer Platform Documentation

**Source:** https://docs.anthropic.com (redirects to https://platform.claude.com/docs/)
**Extraction ID Prefix:** EXT-1
**Extracted:** 2026-03-01T00:00:00Z

## Summary

Official documentation for the Claude Developer Platform, covering API basics, authentication, model capabilities, built-in tools, and advanced features. Provides comprehensive technical specifications including endpoints, model names, context limits, and code examples across multiple programming languages.

## Key Facts

- `EXT-1-fact-1`: The main API endpoint is `https://api.anthropic.com/v1/messages`
- `EXT-1-fact-2`: Required headers for API calls are: `Content-Type: application/json`, `x-api-key: $ANTHROPIC_API_KEY`, and `anthropic-version: 2023-06-01`
- `EXT-1-fact-3`: The primary model referenced in examples is `claude-opus-4-6`
- `EXT-1-fact-4`: API keys are obtained from the Claude Console at `/settings/keys`
- `EXT-1-fact-5`: The API key should be set as the `ANTHROPIC_API_KEY` environment variable
- `EXT-1-fact-6`: Official SDKs are available for Python, TypeScript, Java, and other languages
- `EXT-1-fact-7`: Python SDK is installed via `pip install anthropic`
- `EXT-1-fact-8`: TypeScript SDK is installed via `npm install @anthropic-ai/sdk`
- `EXT-1-fact-9`: Java SDK is available on Maven Central as `com.anthropic:anthropic-java`
- `EXT-1-fact-10`: API responses include fields: `id`, `type`, `role`, `content`, `model`, `stop_reason`, and `usage`
- `EXT-1-fact-11`: The `usage` object tracks `input_tokens` and `output_tokens` for billing
- `EXT-1-fact-12`: Messages are structured with `role` (user/assistant) and `content` fields
- `EXT-1-fact-13`: The `max_tokens` parameter controls the maximum response length
- `EXT-1-fact-14`: Claude offers a 1M token context window for extended document processing
- `EXT-1-fact-15`: Batch API calls cost 50% less than standard API calls
- `EXT-1-fact-16`: Prompt caching provides standard 5-minute cache duration and extended 1-hour cache duration
- `EXT-1-fact-17`: Data residency can be controlled via the `inference_geo` parameter with values `"global"` or `"us"`
- `EXT-1-fact-18`: Adaptive thinking mode is recommended for Opus 4.6 with controllable effort parameter
- `EXT-1-fact-19`: Code execution tool runs in a sandboxed environment and is free when used with web search or web fetch
- `EXT-1-fact-20`: Tool search enables scaling to thousands of tools using regex-based search
- `EXT-1-fact-21`: Context compaction automatically summarizes conversations when approaching window limits (Opus 4.6 and Haiku 4.5)
- `EXT-1-fact-22`: Automatic prompt caching simplifies caching to a single API parameter

## Definitions

- `EXT-1-def-1`: **Messages API** — The core API interface for interacting with Claude, supporting multi-turn conversations, system prompts, and structured message exchanges
- `EXT-1-def-2`: **Adaptive thinking** — A mode where Claude dynamically decides when and how much to think, with controllable effort depth
- `EXT-1-def-3`: **Extended thinking** — Enhanced reasoning capabilities that provide transparency into Claude's step-by-step thought process before delivering final answers
- `EXT-1-def-4`: **Batch processing** — Asynchronous processing of large volumes of requests with 50% cost savings compared to standard API calls
- `EXT-1-def-5`: **Citations** — Feature that allows Claude to provide detailed references to exact sentences and passages used to generate responses
- `EXT-1-def-6`: **Structured outputs** — Guarantees schema conformance through JSON outputs or strict tool use validation
- `EXT-1-def-7`: **Server-side tools** — Built-in tools run by the platform (code execution, memory, web fetch, web search)
- `EXT-1-def-8`: **Client-side tools** — Tools implemented and executed by the developer (bash, computer use, text editor)
- `EXT-1-def-9`: **MCP (Model Context Protocol)** — Protocol for connecting remote MCP servers directly from the Messages API
- `EXT-1-def-10`: **Prompt caching** — System for reducing costs and latency by caching frequently used context
- `EXT-1-def-11`: **Context editing** — Automatic conversation context management with configurable strategies
- `EXT-1-def-12`: **Compaction** — Server-side context summarization for long-running conversations

## Code Examples

### `EXT-1-code-1`: Basic API call using cURL

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1000,
    "messages": [
      {
        "role": "user",
        "content": "What should I search for to find the latest developments in renewable energy?"
      }
    ]
  }'
```

### `EXT-1-code-2`: Python SDK basic usage

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1000,
    messages=[
        {
            "role": "user",
            "content": "What should I search for to find the latest developments in renewable energy?",
        }
    ],
)
print(message.content)
```

### `EXT-1-code-3`: TypeScript SDK basic usage

```typescript
import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const anthropic = new Anthropic();

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content:
          "What should I search for to find the latest developments in renewable energy?"
      }
    ]
  });
  console.log(msg);
}

main().catch(console.error);
```

### `EXT-1-code-4`: Java SDK basic usage

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

public class QuickStart {

  public static void main(String[] args) {
    AnthropicClient client = AnthropicOkHttpClient.fromEnv();

    MessageCreateParams params = MessageCreateParams.builder()
      .model("claude-opus-4-6")
      .maxTokens(1000)
      .addUserMessage(
        "What should I search for to find the latest developments in renewable energy?"
      )
      .build();

    Message message = client.messages().create(params);
    System.out.println(message.content());
  }
}
```

### `EXT-1-code-5`: Example API response structure

```json
{
  "id": "msg_01HCDu5LRGeP2o7s2xGmxyx8",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Response text here..."
    }
  ],
  "model": "claude-opus-4-6",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 21,
    "output_tokens": 305
  }
}
```

## Patterns and Best Practices

- `EXT-1-pattern-1`: Set API keys as environment variables rather than hardcoding them in source code
- `EXT-1-pattern-2`: Use SDK clients initialized with `fromEnv()` or default constructors to automatically load credentials from environment
- `EXT-1-pattern-3`: Structure conversations using the messages array with `role` and `content` fields for multi-turn interactions
- `EXT-1-pattern-4`: Monitor token usage via the `usage` object in responses to track costs
- `EXT-1-pattern-5`: Use batch processing for large volumes of requests to achieve 50% cost savings
- `EXT-1-pattern-6`: Leverage prompt caching for repeated context to reduce costs and latency
- `EXT-1-pattern-7`: Implement automatic prompt caching with a single parameter for simplified cache management
- `EXT-1-pattern-8`: Use context editing strategies to manage conversation length as it approaches token limits
- `EXT-1-pattern-9`: Enable citations when source attribution is critical for verifiable outputs
- `EXT-1-pattern-10`: Choose adaptive thinking mode for Opus 4.6 and control depth with the effort parameter
- `EXT-1-pattern-11`: Utilize structured outputs to guarantee schema conformance in responses or tool inputs
- `EXT-1-pattern-12`: Deploy server-side tools (code execution, web search, web fetch, memory) for reduced implementation overhead
- `EXT-1-pattern-13`: Implement tool search when scaling to hundreds or thousands of tools
- `EXT-1-pattern-14`: Use programmatic tool calling to reduce latency in multi-tool workflows
- `EXT-1-pattern-15`: Upload files via the Files API to avoid re-uploading content with each request

## Feature Availability Table

Key features and their platform availability:

| Feature | API | Bedrock | Vertex AI | Azure AI | Status |
|---------|-----|---------|-----------|----------|--------|
| 1M token context window | Beta | Beta | Beta | Beta | Beta |
| Adaptive thinking | GA | GA | GA | Beta | Mostly GA |
| Batch processing | GA | GA | GA | — | GA (select platforms) |
| Citations | GA | GA | GA | Beta | Mostly GA |
| Data residency | GA | — | — | — | API only |
| Effort | GA | GA | GA | Beta | Mostly GA |
| Extended thinking | GA | GA | GA | Beta | Mostly GA |
| PDF support | GA | GA | GA | Beta | Mostly GA |
| Search results | GA | GA | GA | Beta | Mostly GA |
| Structured outputs | GA | GA | — | Beta | Partial |
| Code execution | GA | — | — | Beta | API + Azure |
| Memory | GA | GA | GA | Beta | Mostly GA |
| Web fetch | GA | — | — | Beta | API + Azure |
| Web search | GA | — | GA | Beta | API + Vertex + Azure |
| Agent Skills | Beta | — | — | Beta | Beta (select) |
| MCP connector | Beta | — | — | Beta | Beta (select) |
| Compaction | Beta | — | — | — | API Beta only |
| Context editing | Beta | Beta | Beta | Beta | Beta |
| Automatic prompt caching | GA | — | — | Beta | API + Azure |
| Prompt caching (5m) | GA | GA | GA | Beta | Mostly GA |
| Prompt caching (1hr) | GA | — | — | Beta | API + Azure |
| Files API | Beta | — | — | Beta | Beta (select) |

## Model Capabilities Summary

Claude offers five categories of capabilities:

1. **Model capabilities** — Control reasoning depth, response format, and input modalities
2. **Tools** — Built-in server-side and client-side tools for extended functionality
3. **Tool infrastructure** — Discovery, orchestration, and scaling infrastructure
4. **Context management** — Optimize long-running sessions and manage context windows
5. **Files and assets** — Manage documents and data provided to Claude

## Important Warnings

- `EXT-1-warn-1`: API keys must be kept secure and should never be committed to source control or exposed in client-side code
- `EXT-1-warn-2`: The `anthropic-version` header is required for API calls and should be set to `2023-06-01`
- `EXT-1-warn-3`: Token limits are enforced — requests exceeding context windows will fail unless context management strategies are used
- `EXT-1-warn-4`: Feature availability varies by platform (Claude API, Bedrock, Vertex AI, Azure AI) — verify support before implementation
- `EXT-1-warn-5`: Computer use tool is in beta across all platforms and should be used with caution in production
- `EXT-1-warn-6`: Batch processing is not available on Azure AI platform
- `EXT-1-warn-7`: Data residency controls are only available on the Claude API platform, not on cloud provider platforms
- `EXT-1-warn-8`: Compaction feature is currently only available in beta on the Claude API platform
