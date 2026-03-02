# MCP Connector

**Topic ID:** claude-code.mcp.connector
**Researched:** 2026-03-01T12:00:00Z

## Overview

The MCP Connector is a feature in the Anthropic Messages API that enables developers to connect Claude to remote Model Context Protocol (MCP) servers without implementing their own MCP client [1]. Released on May 22, 2025 [2], this capability eliminates the previous requirement to build custom client harnesses for MCP connections by having Anthropic's infrastructure handle connection management, tool discovery, and error handling automatically [1].

The connector works by adding a remote MCP server URL directly to API requests via the `mcp_servers` parameter, combined with tool configuration in the `tools` array [1]. This is particularly valuable because it allows developers to leverage the growing ecosystem of remote MCP servers (including integrations from companies like Zapier and Asana) without building one-off integrations [2]. The connector currently supports only the tool-calling subset of the MCP specification — resources, prompts, and other MCP primitives are not yet available through this feature [1].

This feature requires the beta header `anthropic-beta: mcp-client-2025-11-20` and is currently in beta, meaning it is not covered by Zero Data Retention (ZDR) arrangements [1]. The MCP connector is not supported on Amazon Bedrock or Google Vertex AI platforms [1].

## Key Concepts

- **MCP Connector** — A Messages API feature that acts as a managed MCP client, connecting to remote MCP servers on your behalf without requiring you to implement the MCP client protocol [1].

- **`mcp_servers` parameter** — An array in the API request that defines connection details for each remote MCP server, including type, URL, name, and optional authorization token [1].

- **MCPToolset** — A special tool type (`type: "mcp_toolset"`) in the `tools` array that configures which tools from an MCP server are enabled and how they should behave [1].

- **Tool-only support** — The connector currently only accesses tools via the `list_tools` endpoint; other MCP primitives like resources and prompts are not supported [1].

- **Transport requirements** — Remote servers must be publicly exposed via HTTP, supporting either Streamable HTTP or SSE transports. Local STDIO servers cannot connect directly through the connector [1].

- **MCP Server vs MCP Client** — In MCP architecture, the server exposes tools/data while the client maintains connections. The connector acts as Anthropic's managed client connecting to your server [3].

- **Tool configuration patterns** — Three main patterns exist: enable all tools (default), allowlist (disable all, enable specific), and denylist (enable all, disable specific) [1].

- **`defer_loading`** — A per-tool option that prevents a tool's description from being sent to the model initially, useful with the Tool Search feature for servers with many tools [1].

## Technical Details

### API Request Structure

The MCP connector uses two components that must be coordinated [1]:

```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1000,
  "messages": [{"role": "user", "content": "What tools do you have?"}],
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://example-server.modelcontextprotocol.io/sse",
      "name": "example-mcp",
      "authorization_token": "YOUR_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "example-mcp"
    }
  ]
}
```

### MCP Server Configuration Fields

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | Yes | Currently only "url" is supported [1] |
| `url` | string | Yes | Must start with https:// [1] |
| `name` | string | Yes | Unique identifier, referenced by MCPToolset [1] |
| `authorization_token` | string | No | OAuth bearer token if required [1] |

### MCPToolset Configuration Fields

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | Yes | Must be "mcp_toolset" [1] |
| `mcp_server_name` | string | Yes | Must match a server name in `mcp_servers` [1] |
| `default_config` | object | No | Default settings for all tools [1] |
| `configs` | object | No | Per-tool overrides (keys are tool names) [1] |

### Response Content Types

Claude's responses include two new content block types when using MCP tools [1]:

```json
{
  "type": "mcp_tool_use",
  "id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "name": "echo",
  "server_name": "example-mcp",
  "input": { "param1": "value1" }
}
```

```json
{
  "type": "mcp_tool_result",
  "tool_use_id": "mcptoolu_014Q35RayjACSWkSj4X2yov1",
  "is_error": false,
  "content": [{"type": "text", "text": "Hello"}]
}
```

### Required Headers

Python SDK example showing beta header usage [1]:

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-opus-4-6",
    max_tokens=1000,
    messages=[{"role": "user", "content": "What tools do you have?"}],
    mcp_servers=[
        {
            "type": "url",
            "url": "https://mcp.example.com/sse",
            "name": "example-mcp",
            "authorization_token": "YOUR_TOKEN",
        }
    ],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "example-mcp"}],
    betas=["mcp-client-2025-11-20"],
)
```

## Common Patterns

### Enable All Tools (Simplest Pattern)

When you trust all tools on a server and want them all available [1]:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "google-calendar-mcp"
}
```

### Allowlist Pattern (Enable Only Specific Tools)

For restricting Claude to a safe subset of tools [1]:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "google-calendar-mcp",
  "default_config": { "enabled": false },
  "configs": {
    "search_events": { "enabled": true },
    "create_event": { "enabled": true }
  }
}
```

### Denylist Pattern (Disable Dangerous Tools)

When most tools are safe but a few should be blocked [1]:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "google-calendar-mcp",
  "configs": {
    "delete_all_events": { "enabled": false },
    "share_calendar_publicly": { "enabled": false }
  }
}
```

### Multiple MCP Servers

Connect to multiple servers by including multiple entries in both arrays [1]:

```json
{
  "mcp_servers": [
    { "type": "url", "url": "https://mcp1.example.com/sse", "name": "server-1" },
    { "type": "url", "url": "https://mcp2.example.com/sse", "name": "server-2" }
  ],
  "tools": [
    { "type": "mcp_toolset", "mcp_server_name": "server-1" },
    { "type": "mcp_toolset", "mcp_server_name": "server-2", "default_config": { "defer_loading": true } }
  ]
}
```

### OAuth Authentication Flow

For authenticated MCP servers, obtain tokens externally and pass them in the request. You handle the OAuth flow; the connector just uses the token [1]:

1. Use the MCP Inspector (`npx @modelcontextprotocol/inspector`) to test OAuth flows
2. Obtain an access token through your OAuth provider
3. Include it in `authorization_token` field
4. Handle token refresh in your application code

## Gotchas

- **Beta header version matters**: The deprecated header `mcp-client-2025-04-04` uses a different schema where tool configuration was inside `mcp_servers`. The current header `mcp-client-2025-11-20` requires tool configuration in the `tools` array as MCPToolset objects [1]. Using the wrong schema with the wrong header will cause errors.

- **Every MCP server must have exactly one MCPToolset**: The API validates that each server in `mcp_servers` is referenced by exactly one toolset in `tools`, and every toolset must reference an existing server [1]. Missing or duplicate references cause validation errors.

- **Tools only, not full MCP**: The connector only supports `tools/list` and `tools/call`. If your server exposes resources or prompts, they will not be accessible through the connector [1]. Use client-side helpers or implement your own MCP client for full MCP support.

- **ZDR exclusion**: Beta features like the MCP connector are explicitly excluded from Zero Data Retention arrangements [1]. This may be relevant for compliance-sensitive applications.

- **Unknown tool names silently warn**: If you specify a tool name in `configs` that does not exist on the server, the API logs a warning but does not return an error [1]. This allows for servers with dynamic tool availability but can mask typos.

- **Client-side helpers are alternative, not replacement**: The TypeScript SDK's helper functions (`mcpTools`, `mcpMessages`, etc.) are for when you manage your own MCP client connection — they do not use the MCP connector [1]. Choose one approach or the other.

- **HTTPS required**: URLs must start with `https://` — plain HTTP is not supported [1]. Local development servers need HTTPS termination or tunneling.

- **Bedrock and Vertex unsupported**: The MCP connector is not available on Amazon Bedrock or Google Vertex AI deployments [1]. Those platforms require traditional tool use patterns.

- **Agent SDK handles MCP automatically**: If you are using the Claude Agent SDK rather than the raw Messages API, MCP connections are managed automatically and you should not use the `mcp_servers` parameter directly [1].

## Sources

[1] **MCP connector - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical specification including API parameters, request/response formats, configuration patterns, validation rules, authentication, migration guide, and all code examples.

[2] **New capabilities for building agents on the Anthropic API**
    URL: https://claude.com/blog/agent-capabilities-api
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Release date (May 22, 2025), high-level capabilities overview, ecosystem context with Zapier/Asana integrations, and positioning within Anthropic's agent toolkit.

[3] **Architecture overview - Model Context Protocol**
    URL: https://modelcontextprotocol.io/docs/learn/architecture
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: MCP architecture concepts (hosts, clients, servers), transport layer details (STDIO vs Streamable HTTP), JSON-RPC 2.0 protocol foundation, and lifecycle management sequence.

[4] **Remote MCP servers - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/remote-mcp-servers
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Third-party remote MCP server ecosystem context and connection guidance.

[5] **What is the Model Context Protocol (MCP)?**
    URL: https://modelcontextprotocol.io/
    Accessed: 2026-03-01
    Relevance: background
    Extracted: MCP overview and "USB-C for AI" analogy explaining the standardization concept.
