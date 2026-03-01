# Web Search and Web Fetch Tools

**Topic ID:** tool-use.server-tools.web-search-fetch
**Researched:** 2026-03-01T12:00:00Z

## Overview

Web search and web fetch are server-side tools that enable Claude to access real-time information from the internet during API conversations. These tools address a fundamental limitation of LLMs: static training data with knowledge cutoffs. By enabling on-demand access to current web content, developers can build applications that provide up-to-date information, verify facts against live sources, and ground responses in authoritative documentation.

The web search tool allows Claude to query the web and receive search results, automatically citing sources in its responses. The web fetch tool retrieves full content from specific URLs, including web pages and PDF documents. Together, they enable powerful information retrieval workflows—Claude can search for relevant sources, then fetch and analyze the most promising results in detail.

Both tools are classified as "server tools" because Anthropic's infrastructure executes the actual searches and fetches. This differs from client-side tools where the developer's application handles tool execution. The server-side approach simplifies integration while providing built-in security controls like domain filtering and usage limits.

## Key Concepts

- **Server tool execution**: Unlike standard tool use where the client executes tools, web search and web fetch are executed by Anthropic's servers. Claude sends a `server_tool_use` block, and results appear as `web_search_tool_result` or `web_fetch_tool_result` blocks automatically.

- **Dynamic filtering**: With tool versions `web_search_20260209` and `web_fetch_20260209`, Claude can write and execute code to filter results before they reach the context window. This keeps only relevant information, reducing token costs while improving response quality.

- **Citation support**: Web search always includes citations linking response text to source URLs. Web fetch offers optional citations via the `citations.enabled` parameter. Citations include the source URL, title, and a snippet of the cited text.

- **Domain controls**: Both tools support `allowed_domains` and `blocked_domains` parameters for restricting which sites Claude can access. These work at both request and organization levels.

- **URL validation (web fetch)**: For security, web fetch can only access URLs that have previously appeared in the conversation—user messages, previous tool results, or URLs from web search. Claude cannot fetch arbitrary URLs it generates.

- **Content types**: Web fetch supports HTML pages (converted to text) and PDF documents (with automatic text extraction). JavaScript-rendered content is not supported.

- **Zero Data Retention (ZDR)**: Both tools are ZDR-eligible, meaning data is not stored after the API response returns when your organization has a ZDR arrangement.

## Technical Details

### Tool Definitions

**Web Search Tool:**
```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "max_uses": 5,
  "allowed_domains": ["docs.example.com"],
  "blocked_domains": ["untrusted.com"],
  "user_location": {
    "type": "approximate",
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

**Web Fetch Tool:**
```json
{
  "type": "web_fetch_20250910",
  "name": "web_fetch",
  "max_uses": 10,
  "allowed_domains": ["example.com"],
  "blocked_domains": ["private.example.com"],
  "citations": { "enabled": true },
  "max_content_tokens": 100000
}
```

### Supported Models

Both tools work with Claude Opus 4.x, Sonnet 4.x and 3.7, and Haiku 4.5 and 3.5. Dynamic filtering (latest tool versions) requires Opus 4.6 or Sonnet 4.6 and the code execution tool.

### Response Structure

Search results include `url`, `title`, `page_age`, and `encrypted_content`. The encrypted content must be passed back in multi-turn conversations for citations to work.

Fetch results include the full document content, either as plain text or base64-encoded PDF data, plus a `retrieved_at` timestamp.

### Error Handling

Errors return within a 200 response (not as HTTP errors):
```json
{
  "type": "web_search_tool_result",
  "content": {
    "type": "web_search_tool_result_error",
    "error_code": "max_uses_exceeded"
  }
}
```

Common error codes: `too_many_requests`, `invalid_input`, `max_uses_exceeded`, `url_not_accessible`, `unsupported_content_type`.

### Pricing

- **Web search**: $10 per 1,000 searches, plus standard token costs for search results
- **Web fetch**: No additional cost beyond standard token costs for fetched content

Token estimates: average web page ~2,500 tokens; large documentation page ~25,000 tokens; research paper PDF ~125,000 tokens.

## Common Patterns

### Search Then Fetch Workflow

The most powerful pattern combines both tools for comprehensive research:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Find recent articles about quantum computing and analyze the most relevant one"
    }],
    tools=[
        {"type": "web_search_20250305", "name": "web_search", "max_uses": 3},
        {"type": "web_fetch_20250910", "name": "web_fetch", "max_uses": 5,
         "citations": {"enabled": True}}
    ]
)
```

Claude will search for articles, select promising results, fetch full content, and provide cited analysis.

### Domain-Restricted Research

For applications requiring authoritative sources only:

```python
tools=[{
    "type": "web_search_20250305",
    "name": "web_search",
    "allowed_domains": ["docs.aws.amazon.com", "cloud.google.com", "docs.microsoft.com"]
}]
```

### Location-Aware Search

For queries benefiting from geographic context:

```python
tools=[{
    "type": "web_search_20250305",
    "name": "web_search",
    "user_location": {
        "type": "approximate",
        "city": "London",
        "country": "GB",
        "timezone": "Europe/London"
    }
}]
```

### Token-Conscious Fetching

Use `max_content_tokens` to prevent runaway costs with large documents:

```python
tools=[{
    "type": "web_fetch_20250910",
    "name": "web_fetch",
    "max_content_tokens": 50000  # Cap at ~50K tokens
}]
```

## Gotchas

- **Web fetch cannot dynamically construct URLs**: Claude can only fetch URLs explicitly provided by users or appearing in previous results. This is a security measure against data exfiltration, but means you cannot ask Claude to "fetch the first Google result for X" without first using web search.

- **JavaScript-rendered content not supported**: Web fetch retrieves raw HTML, so single-page applications and dynamically loaded content will return incomplete results.

- **Domain filtering is additive, not override**: Request-level domain restrictions must be compatible with organization-level settings. You can only further restrict, not expand, what the organization allows.

- **Unicode homograph attacks**: Domain filters can be bypassed using visually similar Unicode characters (e.g., Cyrillic 'а' vs ASCII 'a'). Use ASCII-only domains when possible and audit configurations.

- **Subdomains are auto-included**: Specifying `example.com` allows `docs.example.com`. To restrict to a specific subdomain, specify it explicitly.

- **Encrypted content for multi-turn citations**: Search results include `encrypted_content` that must be passed back verbatim in subsequent turns. Modifying or omitting this breaks citation functionality.

- **Cache behavior on fetch**: Web fetch caches results automatically, so content may not be the absolute latest version. The cache behavior is managed by Anthropic and may vary.

- **`pause_turn` stop reason**: Long-running web searches may return a `pause_turn` stop reason. Pass the response back as-is to continue, or modify content to interrupt.

- **Dynamic filtering requires code execution**: The latest tool versions (`web_search_20260209`, `web_fetch_20260209`) require the code execution tool to be enabled for dynamic filtering to work.

## Sources

- [Web search tool - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) — Official documentation covering tool definition, parameters, response structure, pricing, and usage examples
- [Web fetch tool - Claude API Docs](https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/web-fetch-tool) — Official documentation for web fetch including URL validation rules, PDF support, and security considerations
- [Introducing web search on the Anthropic API](https://claude.com/blog/web-search-api) — Anthropic blog post covering use cases, governance features, and integration points
- [Web Grounding LLMs - DigitalOcean](https://www.digitalocean.com/community/tutorials/web-grounding-llms) — Tutorial on LLM grounding concepts and implementation patterns
- [LLM Grounding with Fresh Web Data Pipelines - Grepsr](https://www.grepsr.com/blog/llm-grounding-fresh-web-data-pipelines/) — Enterprise considerations for grounding LLMs with web data
