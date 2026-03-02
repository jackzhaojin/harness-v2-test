# MCP Tool Search

**Topic ID:** claude-code.mcp.tool-search
**Researched:** 2026-03-01T12:00:00Z

## Overview

MCP Tool Search is Claude Code's lazy loading system for Model Context Protocol (MCP) servers that dramatically reduces context window consumption. Before this feature, all tool definitions from configured MCP servers were loaded into the conversation context at session start, consuming significant tokens regardless of whether those tools would actually be used [1]. With a typical multi-server setup (GitHub, Slack, Sentry, Grafana, Splunk), tool definitions alone could consume approximately 55,000 tokens before any work begins [3]. In extreme cases documented by users, MCP tool definitions consumed over 134,000 tokens of the 200,000 token context limit [1].

MCP Tool Search solves this by loading a lightweight search index instead of full tool definitions, then fetching tool details on-demand when Claude actually needs them [1][2]. The feature was released in Claude Code version 2.1.7 in January 2026 and is now enabled by default for all users when MCP tool descriptions would consume more than 10% of the context window [1]. Anthropic's benchmarks show this approach reduces initial context consumption by up to 95% while maintaining high tool selection accuracy [2].

## Key Concepts

- **Lazy Loading** - Tools are loaded on-demand when needed rather than upfront at session start. Claude receives a Tool Search tool instead of all tool definitions, and only 3-5 relevant tools are loaded per query [1][2].

- **Automatic Activation Threshold** - Tool Search activates automatically when MCP tool descriptions would exceed 10% of the context window. No manual opt-in required, though the threshold is configurable via `ENABLE_TOOL_SEARCH` environment variable [1].

- **defer_loading Flag** - Tools marked with `defer_loading: true` are not loaded into context initially. They become discoverable through search but only consume tokens when Claude actually needs them [3].

- **Tool Reference Blocks** - When Claude searches for tools, the API returns `tool_reference` blocks pointing to discovered tools. These are automatically expanded into full tool definitions before being shown to Claude [3].

- **Server Instructions** - The `serverInstructions` field in MCP server definitions becomes critical with Tool Search. It helps Claude understand when to search for your tools, functioning similarly to skill descriptors [1][2].

- **Search Modes** - Two search variants exist: Regex for precise pattern matching and BM25 for natural language queries. Both search tool names, descriptions, argument names, and argument descriptions [3].

## Technical Details

### Search Modes

**Regex Mode** (`tool_search_tool_regex_20251119`): Claude constructs regex patterns using Python's `re.search()` syntax. Common patterns include simple matches like `"weather"`, wildcard patterns like `"get_.*_data"`, and OR patterns like `"database.*query|query.*database"`. Maximum query length is 200 characters [3].

**BM25 Mode** (`tool_search_tool_bm25_20251119`): Claude uses natural language queries with BM25 relevance ranking. Default parameters are k1=0.9 and b=0.4, optimized for semantic density rather than term frequency. Recommended for very large catalogs approaching 10,000 tools [3].

### Configuration Options

Environment variable control in Claude Code [1]:

```bash
# Activate at custom threshold (5% instead of default 10%)
ENABLE_TOOL_SEARCH=auto:5 claude

# Always enabled
ENABLE_TOOL_SEARCH=true claude

# Disabled - all MCP tools loaded upfront
ENABLE_TOOL_SEARCH=false claude
```

API-level tool definition with deferred loading [3]:

```json
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" },
      "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
    },
    "required": ["location"]
  },
  "defer_loading": true
}
```

### Response Format

When Claude uses Tool Search, responses include new block types [3]:

```json
{
  "type": "server_tool_use",
  "name": "tool_search_tool_regex",
  "input": { "query": "weather" }
}
```

Followed by:

```json
{
  "type": "tool_search_tool_result",
  "content": {
    "type": "tool_search_tool_search_result",
    "tool_references": [
      { "type": "tool_reference", "tool_name": "get_weather" }
    ]
  }
}
```

### Technical Limits

| Constraint | Value |
|-----------|-------|
| Maximum tools in catalog | 10,000 |
| Maximum regex query length | 200 characters |
| Tools returned per search | 3-5 most relevant |
| Tool Search tool overhead | ~500 tokens |
| Model support | Sonnet 4.0+, Opus 4.0+ (no Haiku) |

## Common Patterns

### Optimizing for Discovery

Keep 3-5 most frequently used tools as non-deferred for immediate availability. Write clear, descriptive tool names using consistent namespacing by service (e.g., `github_create_pr`, `slack_send_message`). Add semantic keywords to descriptions that match how users describe tasks [3].

### System Prompt Enhancement

Add a system prompt section describing available tool categories to help Claude understand when to search [3]:

```
You can search for tools to interact with Slack, GitHub, Jira,
PostgreSQL, and Sentry using the tool search capability.
```

### MCP Integration Pattern

Configure MCP servers with default deferred loading while keeping critical tools immediately available [3]:

```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "database-server",
  "default_config": { "defer_loading": true },
  "configs": {
    "search_events": { "defer_loading": false }
  }
}
```

## Gotchas

- **Regex vs BM25 Query Format** - A common mistake is using natural language queries with the regex variant. Regex mode requires Python `re.search()` syntax, not plain English. Use BM25 for natural language discovery [3].

- **All Tools Deferred Error** - At least one tool must be non-deferred. The Tool Search tool itself should never have `defer_loading: true`. This causes a 400 error [3].

- **Case Sensitivity** - Regex searches are case-sensitive by default. Use `(?i)` prefix for case-insensitive matching, e.g., `"(?i)slack"` [3].

- **Haiku Model Incompatibility** - Tool Search only works with Sonnet 4.0+ and Opus 4.0+. Haiku models do not support tool search [1][3].

- **Server Instructions Now Critical** - Before Tool Search, the `serverInstructions` field was optional. With lazy loading, it directly affects whether Claude will search for your tools. Poorly documented MCP servers become effectively invisible [1][2].

- **Tool Use Examples Incompatible** - Tool Search is not compatible with providing tool use examples. If you need to demonstrate tool usage patterns, use standard tool calling without search [3].

- **Prompt Caching Compatibility** - Tool Search does not break prompt caching because deferred tools are excluded from the initial prompt entirely. They are only added after search, so system prompts and core tools remain cacheable [3].

- **Zero Data Retention (ZDR)** - Server-side Tool Search is not covered by ZDR arrangements. For ZDR compliance, implement custom client-side tool search using `tool_reference` blocks [3].

## Sources

[1] **Claude Code MCP Documentation**
    URL: https://code.claude.com/docs/en/mcp
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Official documentation on MCP Tool Search configuration, environment variables, activation thresholds, scope hierarchy, and managed MCP configurations. Includes details on ENABLE_TOOL_SEARCH settings and automatic activation behavior.

[2] **Lazy Loading Feature Request - GitHub Issue #7336**
    URL: https://github.com/anthropics/claude-code/issues/7336
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Original feature request with detailed token consumption analysis showing 54% context usage before conversation starts, proposed configuration schema, and community-validated 95% token reduction estimates.

[3] **Tool Search Tool - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Authoritative API documentation covering defer_loading flag, regex and BM25 search modes, response format, error handling, MCP integration patterns, streaming, batch support, and technical limits.
