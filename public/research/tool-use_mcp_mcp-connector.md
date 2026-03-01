# MCP Connector and Tool Conversion

**Topic ID:** tool-use.mcp.mcp-connector
**Researched:** 2026-03-01T12:00:00Z

## Overview

The MCP Connector is a beta feature in Claude's Messages API that enables direct connection to remote Model Context Protocol (MCP) servers without implementing a separate MCP client. This eliminates the complexity of managing MCP client connections while providing access to external tools through a standardized interface.

MCP itself is an open-source standard introduced by Anthropic for connecting AI applications to external systems—data sources, tools, and workflows. Think of it as a USB-C port for AI: just as USB-C standardizes device connectivity, MCP standardizes how AI applications interact with external capabilities. The MCP Connector specifically handles the tool-calling subset of the MCP specification, allowing Claude to invoke functions exposed by MCP servers.

The connector bridges two worlds: the Claude Messages API and the MCP ecosystem. When you include an `mcp_servers` configuration in your API request, Claude handles the MCP protocol negotiation, tool discovery, and invocation automatically. This is particularly valuable for accessing third-party integrations, enterprise systems, or custom tooling without building and maintaining MCP client infrastructure.

## Key Concepts

- **MCP Server Definition**: A configuration object in the `mcp_servers` array specifying how to connect to an MCP server—URL, authentication, and a unique name identifier.

- **MCPToolset**: A tool configuration object in the `tools` array that references an MCP server by name and controls which tools are enabled, disabled, or deferred.

- **Tool Conversion**: The process of transforming MCP tool definitions (using JSON Schema) into Claude-compatible tool formats. The TypeScript SDK provides helper functions like `mcpTools()` for manual client implementations.

- **Streamable HTTP vs SSE**: Two supported transport protocols for MCP servers. Both work with the connector, though SSE (Server-Sent Events) may be deprecated in favor of Streamable HTTP.

- **defer_loading**: A tool configuration option that prevents tool descriptions from being sent to the model initially. Used with Tool Search to reduce context window consumption when many tools are available.

- **Authorization Token**: An OAuth Bearer token passed in the MCP server configuration for authenticated servers. The API consumer handles OAuth flows externally.

- **inputSchema**: The JSON Schema (draft-07) definition in each MCP tool that specifies expected parameters, their types, descriptions, and validation constraints.

- **Tool Annotations**: Behavioral hints (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) that guide LLM decisions about when and how to use tools.

## Technical Details

### API Request Structure

The MCP connector uses the beta header `anthropic-beta: mcp-client-2025-11-20` and requires two components:

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1000,
  "messages": [{"role": "user", "content": "Your prompt"}],
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://mcp.example.com/sse",
      "name": "my-mcp-server",
      "authorization_token": "YOUR_OAUTH_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "my-mcp-server",
      "default_config": {
        "enabled": true,
        "defer_loading": false
      },
      "configs": {
        "specific_tool": {
          "enabled": true,
          "defer_loading": true
        }
      }
    }
  ]
}
```

### MCP Tool Schema Format

MCP tools follow JSON Schema draft-07:

```json
{
  "name": "search_events",
  "description": "Search calendar events by keyword",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search keyword"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum results to return"
      }
    },
    "required": ["query"]
  }
}
```

### Response Content Types

MCP tool invocations return two special content block types:

```json
{
  "type": "mcp_tool_use",
  "id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "name": "search_events",
  "server_name": "google-calendar-mcp",
  "input": {"query": "meeting", "limit": 10}
}
```

```json
{
  "type": "mcp_tool_result",
  "tool_use_id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "is_error": false,
  "content": [{"type": "text", "text": "Found 3 events..."}]
}
```

### Client-Side Helpers (TypeScript SDK)

For local STDIO servers or when you need prompts/resources (not just tools):

```typescript
import { mcpTools, mcpMessages, mcpResourceToContent } from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const { tools } = await mcpClient.listTools();
const runner = await anthropic.beta.messages.toolRunner({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Use the tools" }],
  tools: mcpTools(tools, mcpClient)  // Automatic conversion
});
```

## Common Patterns

### Enable All Tools (Simplest)
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server"
}
```

### Allowlist Pattern (Security-First)
Disable everything by default, explicitly enable safe tools:
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server",
  "default_config": {"enabled": false},
  "configs": {
    "read_data": {"enabled": true},
    "search": {"enabled": true}
  }
}
```

### Denylist Pattern (Convenience)
Enable everything, block dangerous operations:
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "my-server",
  "configs": {
    "delete_all": {"enabled": false},
    "drop_database": {"enabled": false}
  }
}
```

### Multiple Servers
Connect to several MCP servers in one request—each needs a unique name and corresponding toolset:
```json
{
  "mcp_servers": [
    {"type": "url", "url": "https://server1.com/mcp", "name": "server1"},
    {"type": "url", "url": "https://server2.com/mcp", "name": "server2"}
  ],
  "tools": [
    {"type": "mcp_toolset", "mcp_server_name": "server1"},
    {"type": "mcp_toolset", "mcp_server_name": "server2", "default_config": {"defer_loading": true}}
  ]
}
```

## Gotchas

- **Only Tools Supported**: The MCP connector only accesses the `tools/list` and `tools/call` endpoints. MCP resources and prompts are not available through the connector—use client-side helpers for those.

- **HTTPS Required**: Server URLs must use HTTPS. Local STDIO servers cannot connect directly; use the TypeScript SDK helpers or expose the server via a tunnel (e.g., ngrok).

- **Beta Header Required**: Without `anthropic-beta: mcp-client-2025-11-20`, requests will fail. The older `mcp-client-2025-04-04` header is deprecated.

- **Server-Toolset Mapping**: Every MCP server in `mcp_servers` must have exactly one MCPToolset referencing it—no orphan servers, no duplicate references.

- **Unknown Tool Names Silently Ignored**: If you configure a tool name in `configs` that doesn't exist on the server, no error is thrown (just a backend warning). This accommodates dynamic tool availability but can mask typos.

- **UnsupportedMCPValueError**: The client-side helper functions throw this error for unsupported content types, MIME types, or non-HTTP resource links. Handle it explicitly when using `mcpTools()` or `mcpResourceToContent()`.

- **Zero Data Retention Exclusion**: The MCP connector beta is explicitly excluded from ZDR arrangements. Don't use it for sensitive data if ZDR compliance is required.

- **OAuth Token Management**: You must handle the OAuth flow externally and refresh tokens as needed—the API doesn't manage token lifecycle.

- **Platform Availability**: The MCP connector is not supported on Amazon Bedrock or Google Vertex AI—only direct Anthropic API access.

- **Tool Search Model Requirements**: Using `defer_loading: true` with Tool Search requires Sonnet 4+ or Opus 4+. Haiku models don't support tool search.

## Sources

- [MCP Connector - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) — Primary reference for API structure, configuration patterns, migration guide, and response types
- [What is the Model Context Protocol?](https://modelcontextprotocol.io/) — Overview of MCP architecture and ecosystem purpose
- [MCP Schema Reference](https://modelcontextprotocol.io/specification/2025-06-18/schema) — Complete tool schema specification including inputSchema, outputSchema, and annotations
- [Anthropic API + FastMCP Integration](https://gofastmcp.com/integrations/anthropic) — Tutorial on deploying MCP servers and connecting via Messages API
- [MCP Tool Schema Explained - Merge.dev](https://www.merge.dev/blog/mcp-tool-schema) — Detailed breakdown of inputSchema structure and best practices
