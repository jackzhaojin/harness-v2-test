# Skills vs MCP

**Topic ID:** claude-code.skills.vs-mcp
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude Code offers two complementary extension mechanisms: Skills and the Model Context Protocol (MCP). Understanding when to use each is fundamental to building effective AI workflows. Skills are packaged bundles of instructions, templates, and scripts that teach Claude *how* to complete specific tasks [1][2]. MCP is an open protocol that gives Claude *access* to external data sources, tools, and APIs [3][4]. The critical distinction is that MCP connects Claude to data, while Skills teach Claude what to do with that data [1][5].

These two systems solve fundamentally different problems and work best when combined. An MCP connection to a database gives Claude the ability to query it; a skill teaches Claude your organization's specific patterns for filtering, formatting results, and handling edge cases [5]. Anthropic frames it this way: "MCP is like having access to the aisles. Skills, meanwhile, are like an employee's expertise" [5]. The separation keeps architecture composable - a single skill can orchestrate multiple MCP servers, and a single MCP server can support dozens of different skills [5].

## Key Concepts

- **Skills** - Reusable bundles of instructions stored as `SKILL.md` files with optional YAML frontmatter and supporting scripts [1][2]. Skills are Markdown with a tiny bit of YAML metadata, making them easy to version control and distribute [6].

- **MCP (Model Context Protocol)** - An open standard introduced by Anthropic in November 2024 for connecting AI systems to external tools, databases, and data sources [3][4]. Often described as "USB-C for AI agents" because it standardizes how AI applications connect to external systems [3].

- **Progressive loading** - Skills use progressive disclosure, meaning Claude determines which skills are relevant and loads only the information needed, preventing context window overload [2]. MCP servers, by contrast, can consume significant context upfront [6][7].

- **Token efficiency** - Skills offer minimal context consumption through progressive loading [6]. MCP servers can be token-heavy; GitHub's official MCP alone consumes tens of thousands of tokens [6][7].

- **Transport types** - MCP supports three transports: HTTP (recommended for cloud services), SSE (deprecated), and stdio (for local processes) [4]. Skills run entirely within Claude's context.

- **Cross-platform portability** - MCP is vendor-neutral and works across multiple AI systems including ChatGPT, Claude, and VS Code [3]. Skills work across Claude.ai, Claude Code, and the Claude API [1][2].

- **Tool Search** - When MCP tool definitions exceed 10% of context window, Claude Code automatically enables Tool Search to load tools on-demand rather than upfront [4].

## Technical Details

### Skill Structure

Every skill requires a `SKILL.md` file with two components [1]:

```yaml
---
name: my-skill
description: When to use this skill
disable-model-invocation: true  # Optional: manual-only invocation
allowed-tools: Read, Grep       # Optional: restrict tool access
context: fork                   # Optional: run in subagent
---

Your skill instructions here...
```

Skills can be stored at three levels [1]:
- Personal: `~/.claude/skills/<skill-name>/SKILL.md` (all your projects)
- Project: `.claude/skills/<skill-name>/SKILL.md` (this project only)
- Enterprise: Managed settings (all organization users)

### MCP Configuration

MCP servers are added via the `claude mcp add` command [4]:

```bash
# Remote HTTP server (recommended)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Local stdio server
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@host:5432/analytics"

# With authentication header
claude mcp add --transport http api https://api.example.com/mcp \
  --header "Authorization: Bearer token"
```

MCP servers can be scoped to [4]:
- `local` (default): Private to you in current project
- `project`: Shared via `.mcp.json` file in version control
- `user`: Available to you across all projects

### Invocation Control

Skills support fine-grained invocation control [1]:

| Frontmatter | User can invoke | Claude can invoke |
|-------------|-----------------|-------------------|
| (default) | Yes | Yes |
| `disable-model-invocation: true` | Yes | No |
| `user-invocable: false` | No | Yes |

## Common Patterns

### Pattern 1: MCP for Access, Skill for Workflow

Connect to Notion via MCP, then create a meeting prep skill [5]:

```bash
# MCP provides access
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

```yaml
# Skill provides expertise
---
name: meeting-prep
description: Prepare meeting summaries from Notion
---

When preparing meeting materials:
1. Search workspace for meeting agendas matching the date
2. Pull relevant project pages
3. Format prep document using our team template
4. Include action items from previous meeting
```

### Pattern 2: Database Query with Domain Knowledge

The MCP server handles connectivity; the skill encodes query patterns [5][4]:

```yaml
---
name: customer-analysis
description: Analyze customer data following our patterns
---

When querying customer data:
- Always filter by date range first
- Exclude test accounts (email contains @test.example.com)
- Apply our standard segmentation rules
- Format results using the analytics template
```

### Pattern 3: Dynamic Context Injection

Skills can execute shell commands before sending to Claude [1]:

```yaml
---
name: pr-summary
description: Summarize a pull request
context: fork
agent: Explore
---

## Context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`

Summarize this pull request...
```

## Gotchas

**MCP context consumption is the primary failure mode.** GitHub's official MCP alone can consume tens of thousands of tokens. If you're using more than 20k tokens of MCPs, you're significantly limiting Claude's working space [6][7]. Use `/context` to audit regularly and disable unused MCP servers.

**Skills can exceed character budget.** Skill descriptions load into context so Claude knows what's available. If you have many skills, they may exceed the budget (2% of context window, fallback 16,000 characters) [1]. Run `/context` to check for excluded skills.

**Don't conflate the two.** A common mistake is using MCP when you need a skill, or vice versa [5]:
- Need Claude to *access* something (database, API, file system)? That's MCP.
- Need Claude to *know how* to do something (workflow, formatting, domain rules)? That's a skill.

**Watch for conflicting instructions.** When MCP servers and skills both provide guidance, conflicts can arise [5]. Let MCP handle connectivity; let skills manage presentation, sequencing, and workflow logic.

**MCP security requires vetting.** Research has highlighted security vulnerabilities in MCP servers, including remote code execution flaws [7]. Use third-party MCP servers at your own risk and verify their correctness before installation [4].

**JSON configuration errors are common.** When configuring MCP via `.mcp.json`, watch for trailing commas (JSON doesn't allow them), missing quotes, and unescaped backslashes in Windows paths [7].

**Stdio servers on Windows need special handling.** On native Windows (not WSL), local MCP servers using `npx` require the `cmd /c` wrapper [4]:

```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```

**`context: fork` needs explicit instructions.** If your skill contains only guidelines without a task, the subagent receives guidelines but no actionable prompt and returns without meaningful output [1].

## Sources

[1] **Extend Claude with skills - Claude Code Docs**
    URL: https://code.claude.com/docs/en/skills
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Comprehensive skill documentation including structure, frontmatter options, invocation control, storage locations, supporting files, context injection, and troubleshooting. Core reference for all skill-related technical details.

[2] **What are Skills? - Claude Help Center**
    URL: https://support.claude.com/en/articles/12512176-what-are-skills
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Foundational definition of skills, progressive loading behavior, and cross-platform availability.

[3] **Model Context Protocol - Wikipedia**
    URL: https://en.wikipedia.org/wiki/Model_Context_Protocol
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: MCP history, industry adoption timeline (OpenAI March 2025, Linux Foundation December 2025), and ecosystem growth metrics.

[4] **Connect Claude Code to tools via MCP - Claude Code Docs**
    URL: https://code.claude.com/docs/en/mcp
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: MCP installation commands, transport types, scoping (local/project/user), authentication, Tool Search feature, output limits, Windows caveats, and managed configuration options.

[5] **Extending Claude's capabilities with skills and MCP - Claude Blog**
    URL: https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Core distinction ("MCP connects to data, Skills teach what to do"), decision framework, real-world examples (financial analysis, meeting prep), and architectural composability principles.

[6] **Claude Skills are awesome, maybe a bigger deal than MCP - Simon Willison**
    URL: https://simonwillison.net/2025/Oct/16/claude-skills/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Token efficiency comparison between skills and MCP, GitHub MCP context consumption issue, and the Markdown-based simplicity of skills.

[7] **Claude Code Best Practices and Gotchas**
    URL: https://rosmur.github.io/claudecode-best-practices/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Common mistakes (context bloat from MCP, kitchen sink sessions, over-specified CLAUDE.md), security considerations, and best practice recommendations for context management.
