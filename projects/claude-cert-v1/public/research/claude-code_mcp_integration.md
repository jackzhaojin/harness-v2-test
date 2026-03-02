# MCP Integration

**Topic ID:** claude-code.mcp.integration
**Researched:** 2026-03-01T12:00:00Z

## Overview

Model Context Protocol (MCP) is an open standard created by Anthropic that enables Claude Code to connect with external tools, databases, and APIs through a standardized communication interface [1]. MCP servers act as bridges between Claude Code and external systems, exposing tools that Claude can invoke to perform actions like querying databases, managing GitHub repositories, or automating browser interactions [1][2]. The protocol has been widely adopted across the AI ecosystem, with OpenAI adding MCP support to ChatGPT in March 2025 and Google confirming Gemini support in April 2025 [1].

MCP integration in Claude Code transforms the assistant from a standalone conversational AI into a connected agent capable of taking real-world actions. When properly configured, Claude Code can implement features from issue trackers, query production databases, analyze monitoring data, integrate design assets, and automate multi-step workflows across different services [1]. The current MCP specification version is 2025-03-26, with the official SDK at version 1.12 as of February 2026 [1].

## Key Concepts

- **Transport Types** — MCP servers communicate via three transport mechanisms: stdio (standard input/output for local processes, under 5ms latency), SSE (Server-Sent Events for remote servers, deprecated), and HTTP streamable (the recommended replacement for SSE since MCP 2025-03 specification) [1][3].

- **Configuration Scopes** — Server configurations can be stored at three levels: local (default, private to current project in `~/.claude.json`), project (shared via `.mcp.json` in project root, version-controlled), and user (available across all projects in `~/.claude.json`) [1][4].

- **MCP Server Registry** — Anthropic maintains an official registry at `@modelcontextprotocol` containing vetted servers. Over 3,000 community servers are listed in the ecosystem [1][5].

- **Tool Discovery** — Claude Code automatically discovers available tools from connected MCP servers. The `/mcp` slash command displays connected servers and their exposed tools [1].

- **OAuth Authentication** — Remote HTTP servers often require OAuth 2.0 authentication. Claude Code handles the flow via browser redirect and stores tokens securely in the system keychain [1].

- **Dynamic Tool Updates** — Claude Code supports MCP `list_changed` notifications, allowing servers to dynamically update their available tools without requiring reconnection [1].

- **MCP Tool Search** — When many servers are configured, Claude Code can dynamically load tools on-demand instead of preloading all definitions, activating when tool descriptions exceed 10% of the context window [1].

## Technical Details

### Adding MCP Servers via CLI

The primary method for adding MCP servers uses the `claude mcp add` command with transport-specific options [1]:

```bash
# HTTP server (recommended for remote)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# SSE server (deprecated but still supported)
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Stdio server (for local processes)
claude mcp add --transport stdio --env GITHUB_TOKEN=ghp_xxx github \
  -- npx -y @modelcontextprotocol/server-github
```

All options (`--transport`, `--env`, `--scope`, `--header`) must come before the server name. The `--` double dash separates Claude's flags from arguments passed to the MCP server [1].

### JSON Configuration Structure

Direct configuration in `.mcp.json` or `~/.claude.json` uses this format [4]:

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_abc123"
      }
    },
    "database": {
      "type": "http",
      "url": "https://mcp.company.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

Environment variable expansion is supported using `${VAR}` or `${VAR:-default}` syntax in command, args, env, url, and headers fields [1].

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `MCP_TIMEOUT` | Server startup timeout in milliseconds (e.g., `MCP_TIMEOUT=10000`) [1][6] |
| `MAX_MCP_OUTPUT_TOKENS` | Maximum tokens for MCP tool output, default 25,000 [1] |
| `ENABLE_TOOL_SEARCH` | Controls tool search behavior: `auto`, `auto:N`, `true`, or `false` [1] |
| `ENABLE_CLAUDEAI_MCP_SERVERS` | Set to `false` to disable Claude.ai synced servers [1] |

### Management Commands

```bash
claude mcp list              # List all configured servers
claude mcp get github        # Get details for specific server
claude mcp remove github     # Remove a server
/mcp                         # In-session: view status, authenticate, clear auth
```

## Common Patterns

### GitHub Integration for Code Reviews

The GitHub MCP server is among the most common integrations, enabling Claude to work with repositories, issues, and pull requests [1][5]:

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

After adding, authenticate via `/mcp` in Claude Code. Claude can then review PRs, create issues, and search repositories.

### Database Queries with PostgreSQL

For read-only database access, configure a database server with connection credentials [5]:

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"
```

Claude can then query the database naturally: "What's our total revenue this month?" or "Show me the schema for the orders table."

### Browser Automation with Playwright

The Playwright MCP server enables browser automation for testing and web scraping [5]:

```bash
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest
```

Claude can then navigate pages, take screenshots, fill forms, and verify UI elements.

### Team-Shared Configuration

For consistent tooling across a team, use project-scoped configuration by adding `--scope project` [1]:

```bash
claude mcp add --transport http stripe --scope project https://mcp.stripe.com
```

This creates or updates `.mcp.json` in the project root, which can be committed to version control. Claude Code prompts for approval before using project-scoped servers from `.mcp.json` files [1].

## Gotchas

- **Windows npx Requires cmd Wrapper** — On native Windows (not WSL), local MCP servers using npx require the `cmd /c` wrapper: `claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package`. Without this, you get "Connection closed" errors [1].

- **Scope Naming Changed** — The scope names were renamed in recent versions: "project" became "local" (private to you in current project), and "global" became "user" (available across all projects). The old names may appear in older documentation [1][4].

- **Local Scope Storage Location Differs** — MCP local-scoped servers are stored in `~/.claude.json`, while general local settings use `.claude/settings.local.json` in the project directory. These are different locations despite similar naming [1].

- **Token Expiration Causes 70% of Failures** — The most common MCP failure is missing or expired tokens. Verify environment variables first using `/mcp` diagnostics before deeper troubleshooting [3][6].

- **Timeout Configuration May Be Ignored** — A known bug causes Claude Code to not respect MCP timeout settings in certain SSE/HTTP configurations, using default values instead. HTTP MCP servers may appear "offline" due to premature disconnections [6].

- **Server Approval Required for Project Scope** — When using `.mcp.json` files from a project, Claude Code prompts for approval before using those servers. Use `claude mcp reset-project-choices` to reset these approval decisions [1].

- **Order of CLI Options Matters** — All options like `--transport`, `--env`, `--scope` must come before the server name in the command. The `--` separator must come after the server name and before the command arguments [1].

- **stdio Servers Run with User Permissions** — Local stdio MCP servers execute with your system user permissions, meaning a malicious server can access any file readable by your account. Only use packages from trusted sources, preferably the official `@modelcontextprotocol` registry [1][5].

- **Tool Search Only Works on Newer Models** — MCP Tool Search requires models that support `tool_reference` blocks: Sonnet 4 and later, or Opus 4 and later. Haiku models do not support tool search [1].

## Sources

[1] **Connect Claude Code to tools via MCP - Claude Code Docs**
    URL: https://code.claude.com/docs/en/mcp
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive details on transport types, configuration scopes, CLI commands, JSON configuration format, environment variables, OAuth authentication, managed MCP configuration, tool search, and all major features of MCP integration in Claude Code.

[2] **Connect to local MCP servers - Model Context Protocol**
    URL: https://modelcontextprotocol.io/docs/develop/connect-local-servers
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Tutorial-style walkthrough of connecting to local MCP servers, understanding MCP server concepts, and troubleshooting guidance for Claude Desktop (concepts apply to Claude Code).

[3] **MCP Cheatsheet - SFEIR Institute**
    URL: https://institute.sfeir.com/en/claude-code/claude-code-mcp-model-context-protocol/cheatsheet/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Quick reference for essential commands, transport types, configuration locations, top recommended servers, and the statistic that 70% of failures stem from token issues.

[4] **Configuring MCP Tools in Claude Code**
    URL: https://scottspence.com/posts/configuring-mcp-tools-in-claude-code
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Details on `~/.claude.json` as primary configuration location, JSON structure format, advantages of direct config file editing, and scope explanations.

[5] **Model Context Protocol Servers - GitHub**
    URL: https://github.com/modelcontextprotocol/servers
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: List of official reference servers (filesystem, git, memory, fetch), database servers (PostgreSQL, SQLite, ClickHouse, MongoDB, Neo4j), and Playwright browser automation server.

[6] **Claude Code MCP Troubleshooting - SFEIR Institute / GitHub Issues**
    URL: https://institute.sfeir.com/en/claude-code/claude-code-mcp-model-context-protocol/troubleshooting/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Common error categories (connection, schema, timeout), diagnostic commands sequence, timeout configuration details, debug mode (`CLAUDE_CODE_DEBUG=1`), and known timeout configuration bugs.
