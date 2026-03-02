# Web Search Tool

**Topic ID:** tool-use.server-tools.web-search
**Researched:** 2026-03-01T00:00:00Z

## Overview

The web search tool is a server-executed tool that gives Claude direct access to real-time web content, allowing it to answer questions with up-to-date information beyond its knowledge cutoff [1]. Unlike browser plugins or retrieval sidebars, Anthropic operates this tool server-side on behalf of the model, with Brave Search powering the backend [3]. Claude automatically decides when to search based on the prompt, executes searches through the API, and provides responses with cited sources [1].

The tool is available in two versions: `web_search_20250305` (the original version) and `web_search_20260209` (the latest version with dynamic filtering support) [1]. Dynamic filtering, available with Claude Opus 4.6 and Sonnet 4.6, allows Claude to write and execute code to post-process search results before they reach the context window, reducing token consumption by approximately 24% while improving accuracy by 11% [1][2].

Web search is a server tool, meaning Claude invokes it during generation and the API executes the actual search. This distinguishes it from client-side tools where the developer must handle tool execution. The tool supports domain filtering, localization, and usage limits, making it suitable for enterprise deployments requiring content governance [1].

## Key Concepts

- **Server Tool** — A tool type where the API executes the operation on Claude's behalf, rather than returning a tool_use block for client-side execution. Web search uses the `server_tool_use` content block type [1].

- **Dynamic Filtering** — Available in `web_search_20260209` with Opus 4.6 and Sonnet 4.6. Claude writes code to filter search results before loading them into context, discarding irrelevant HTML markup and boilerplate. Requires the code execution tool to be enabled [1].

- **Domain Filtering** — Restricts which websites Claude can retrieve results from using `allowed_domains` or `blocked_domains` parameters. You cannot use both in the same request [1].

- **Encrypted Content** — Search results contain `encrypted_content` and citations contain `encrypted_index` fields. These must be passed back in multi-turn conversations for Claude to reference previous search results [1][3].

- **max_uses** — Parameter limiting the number of searches per request. If exceeded, returns a `max_uses_exceeded` error [1].

- **user_location** — Optional parameter for localizing search results with city, region, country, and timezone fields [1].

- **Citations** — Always enabled for web search (unlike web fetch where they are optional). Each citation includes URL, title, and up to 150 characters of cited text [1][4].

- **Zero Data Retention (ZDR)** — Web search is ZDR-eligible; when an organization has a ZDR arrangement, data is not stored after the API response [1].

## Technical Details

### Tool Definition

The web search tool is defined in the `tools` array with the following structure [1]:

```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "max_uses": 5,
  "allowed_domains": ["example.com", "trusteddomain.org"],
  "user_location": {
    "type": "approximate",
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

### Domain Filtering Rules

Domain filtering follows specific rules [1]:

- Omit the HTTP/HTTPS scheme (use `example.com`, not `https://example.com`)
- Subdomains are automatically included (`example.com` covers `docs.example.com`)
- Specific subdomains restrict results (`docs.example.com` only returns that subdomain)
- Subpaths are supported (`example.com/blog` matches `example.com/blog/post-1`)
- Wildcards: Only one `*` allowed per entry, must appear in the path portion
  - Valid: `example.com/*`, `example.com/*/articles`
  - Invalid: `*.example.com`, `ex*.com`

### Response Structure

A typical response includes multiple content blocks [1]:

```json
{
  "content": [
    {"type": "text", "text": "I'll search for..."},
    {
      "type": "server_tool_use",
      "id": "srvtoolu_01WYG3...",
      "name": "web_search",
      "input": {"query": "claude shannon birth date"}
    },
    {
      "type": "web_search_tool_result",
      "tool_use_id": "srvtoolu_01WYG3...",
      "content": [{
        "type": "web_search_result",
        "url": "https://en.wikipedia.org/wiki/Claude_Shannon",
        "title": "Claude Shannon - Wikipedia",
        "encrypted_content": "EqgfCio...",
        "page_age": "April 30, 2025"
      }]
    },
    {
      "text": "Claude Shannon was born on April 30, 1916",
      "type": "text",
      "citations": [{
        "type": "web_search_result_location",
        "url": "https://en.wikipedia.org/wiki/Claude_Shannon",
        "cited_text": "Claude Elwood Shannon (April 30, 1916 – February 24, 2001)..."
      }]
    }
  ],
  "usage": {
    "input_tokens": 6039,
    "output_tokens": 931,
    "server_tool_use": {"web_search_requests": 1}
  }
}
```

### Supported Models

Web search is available on Claude Opus 4.6, 4.5, 4.1, 4.0; Claude Sonnet 4.6, 4.5, 4.0, 3.7; and Claude Haiku 4.5, 3.5 [1].

### Pricing

Web search costs $10 per 1,000 searches plus standard token costs [1][3]. Search results are counted as input tokens. If an error occurs during web search, the search is not billed [1]. Citation fields (`cited_text`, `title`, `url`) do not count toward token usage [1].

## Common Patterns

### Basic Web Search Request

The simplest pattern includes the tool in your request [1]:

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "What's the weather in NYC?"}],
    tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
)
```

### Multi-Turn Conversations with Caching

For multi-turn conversations, pass back the encrypted content and use cache breakpoints [1]:

```python
messages.append({"role": "assistant", "content": response1.content})
messages.append({
    "role": "user",
    "content": "Should I expect rain later this week?",
    "cache_control": {"type": "ephemeral"}
})
```

### Dynamic Filtering for Reduced Token Usage

Use the latest tool version with code execution for better efficiency [1]:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "Search for current prices of AAPL and GOOGL, calculate P/E ratio."
    }],
    tools=[{"type": "web_search_20260209", "name": "web_search"}],
)
```

### Combining Web Search with Web Fetch

Use web search to find URLs, then web fetch to deeply analyze content [4]:

1. Web search finds relevant URLs based on a query
2. Web fetch retrieves and analyzes the full content of those URLs
3. Web fetch can only access URLs that appeared in previous search results or were provided by the user

## Gotchas

- **Cannot use both allowed_domains and blocked_domains** — You must choose one or the other in the same request. Using both returns a validation error [1].

- **Organization-level restrictions override request-level** — Request-level domain restrictions can only further restrict, not expand beyond organization settings [1][2].

- **Web search does not always trigger** — Claude may not invoke web search even when fresh data would help. For time-sensitive queries, prompt explicitly: "Search the web for current information on X" [3].

- **Web fetch URL restriction** — Web fetch can only access URLs that already exist in the conversation (from user input or previous search results). Claude cannot dynamically construct URLs [4]. This is a security measure against exfiltration attacks.

- **JavaScript-rendered content not supported** — Web fetch does not support websites dynamically rendered via JavaScript [4].

- **Encrypted content must be preserved** — In multi-turn conversations, you must pass back the encrypted_content and encrypted_index fields for Claude to reference previous search results [1].

- **Citations always enabled for search** — Unlike web fetch where citations are optional, web search always includes citations. This is a key distinction between the two tools [4].

- **pause_turn stop reason** — Long-running turns may return with `pause_turn` stop reason. You must send the response back as-is in a subsequent request to let Claude continue [1].

- **VPC-SC blocks web search on Vertex AI** — VPC Service Controls configurations will block web search requests entirely on Google Cloud [5].

- **Vertex AI lacks dynamic filtering** — On Google Vertex AI, only the basic web search tool (without dynamic filtering) is available. Dynamic filtering requires Claude API or Microsoft Azure [1][5].

- **Hallucination still possible** — Web search reduces but does not eliminate hallucination. Claude can still misread, misattribute, or extrapolate beyond source material [3].

- **Wildcard placement** — Wildcards in domain patterns must appear in the path portion only, not the domain itself. `example.com/*` is valid; `*.example.com` is invalid [1].

## Sources

[1] **Web search tool - Claude API Docs**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete technical documentation including tool definition, parameters, response structure, domain filtering rules, pricing, error codes, streaming behavior, and code examples.

[2] **Claude API web search domain filtering (WebSearch results)**
    URL: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Domain filtering rules, organization-level restrictions, dynamic filtering efficiency improvements (24% token reduction, 11% accuracy improvement).

[3] **Introducing web search on the Anthropic API (Blog)**
    URL: https://claude.com/blog/web-search-api
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: How web search works (reasoning, query generation, retrieval, analysis), agentic multi-search behavior, use cases (financial services, legal research, developer tools), and governance controls.

[4] **Inside Claude Code's Web Tools: WebFetch vs WebSearch**
    URL: https://mikhail.io/2025/10/claude-code-web-tools/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Key distinctions between web search and web fetch tools, URL restrictions for web fetch, citation behavior differences, combined workflow patterns.

[5] **Web search with Anthropic Claude models - Vertex AI Documentation**
    URL: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/web-search
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Vertex AI-specific configuration, beta header requirement, VPC-SC limitations, data governance constraints (CMEK and Data Residency do not apply during third-party search processing).
