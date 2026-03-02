# Agent Skills Overview

**Source:** https://docs.anthropic.com/en/docs/agents (Redirects to https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
**Extraction ID Prefix:** EXT-4
**Extracted:** 2026-03-01T00:00:00Z

## Summary

Agent Skills are modular capabilities that extend Claude's functionality by packaging instructions, metadata, and optional resources (scripts, templates) that Claude uses automatically when relevant. Skills leverage a filesystem-based architecture with progressive disclosure to efficiently manage context, loading information in stages rather than consuming context upfront.

## Key Facts

- `EXT-4-fact-1`: Skills are filesystem-based resources that provide Claude with domain-specific expertise, workflows, context, and best practices
- `EXT-4-fact-2`: Skills work differently than prompts — prompts are conversation-level instructions for one-off tasks, while Skills load on-demand and eliminate repetition
- `EXT-4-fact-3`: Anthropic provides pre-built Agent Skills for common document tasks (PowerPoint, Excel, Word, PDF)
- `EXT-4-fact-4`: Custom Skills can be created by users and are available across Claude's products (claude.ai, Claude API, Claude Code, Agent SDK)
- `EXT-4-fact-5`: Skills run in a code execution environment where Claude has filesystem access, bash commands, and code execution capabilities
- `EXT-4-fact-6`: Progressive disclosure ensures only relevant content occupies the context window at any given time
- `EXT-4-fact-7`: Custom Skills uploaded to one surface (claude.ai, API, Claude Code) do not sync across surfaces
- `EXT-4-fact-8`: Claude API Skills are workspace-wide (all workspace members can access), but claude.ai Skills are individual user only
- `EXT-4-fact-9`: Skills architecture uses three levels of loading: metadata (always loaded, ~100 tokens per Skill), instructions (loaded when triggered, under 5k tokens), and resources (loaded as needed, effectively unlimited)
- `EXT-4-fact-10`: Using Skills via the API requires three beta headers: `code-execution-2025-08-25`, `skills-2025-10-02`, and `files-api-2025-04-14`

## Definitions

- `EXT-4-def-1`: **Agent Skills** — Modular capabilities that extend Claude's functionality by packaging instructions, metadata, and optional resources (scripts, templates) that Claude uses automatically when relevant
- `EXT-4-def-2`: **Progressive disclosure** — Claude loads information in stages as needed, rather than consuming context upfront. Files don't consume context until accessed.
- `EXT-4-def-3`: **Pre-built Agent Skills** — Skills provided by Anthropic for common document tasks (PowerPoint/pptx, Excel/xlsx, Word/docx, PDF/pdf), available to all users on claude.ai and via the Claude API
- `EXT-4-def-4`: **Custom Skills** — User-created Skills that package domain expertise and organizational knowledge, available across Claude's products
- `EXT-4-def-5`: **Level 1: Metadata** — YAML frontmatter containing `name` and `description`, always loaded at startup (~100 tokens per Skill)
- `EXT-4-def-6`: **Level 2: Instructions** — Main SKILL.md body containing procedural knowledge, workflows, best practices, loaded when Skill is triggered (under 5k tokens)
- `EXT-4-def-7`: **Level 3: Resources and code** — Additional markdown files (instructions), executable scripts (code), and reference materials (resources) loaded only when referenced

## Code Examples

### `EXT-4-code-1`: Skill YAML frontmatter structure

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

### `EXT-4-code-2`: Minimal Skill structure with required fields

```yaml
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
[Clear, step-by-step guidance for Claude to follow]

## Examples
[Concrete examples of using this Skill]
```

### `EXT-4-code-3`: Example PDF processing instruction from SKILL.md

````markdown
# PDF Processing

## Quick start

Use pdfplumber to extract text from PDFs:

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

For advanced form filling, see [FORMS.md](FORMS.md).
````

### `EXT-4-code-4`: Skill directory structure with multiple resource types

```text
pdf-skill/
├── SKILL.md (main instructions)
├── FORMS.md (form-filling guide)
├── REFERENCE.md (detailed API reference)
└── scripts/
    └── fill_form.py (utility script)
```

## Patterns and Best Practices

- `EXT-4-pattern-1`: **Skill naming conventions** — Maximum 64 characters, lowercase letters/numbers/hyphens only, cannot contain XML tags or reserved words ("anthropic", "claude")
- `EXT-4-pattern-2`: **Description best practice** — Should include both what the Skill does and when Claude should use it (maximum 1024 characters)
- `EXT-4-pattern-3`: **Progressive disclosure loading** — Claude reads SKILL.md via bash when triggered, then reads additional files only when those instructions reference them
- `EXT-4-pattern-4`: **Efficient script execution** — When Claude runs a script (e.g., `validate_form.py`), the script code never loads into context; only the output consumes tokens
- `EXT-4-pattern-5`: **On-demand file access** — Claude reads only the files needed for each specific task; unused bundled content consumes zero tokens
- `EXT-4-pattern-6`: **Filesystem-based access** — Claude uses bash commands to read SKILL.md and other files from the filesystem, bringing content into context only when needed
- `EXT-4-pattern-7`: **Three content types** — Instructions (flexible guidance), code (reliable deterministic operations), resources (factual lookup)

## Important Warnings

- `EXT-4-warn-1`: **Security risk of untrusted Skills** — Use Skills only from trusted sources (self-created or from Anthropic). Malicious Skills can direct Claude to invoke tools or execute code in harmful ways including data exfiltration, unauthorized system access, or other security risks
- `EXT-4-warn-2`: **No cross-surface sync** — Custom Skills uploaded to one surface are not automatically available on others; must manage and upload separately for claude.ai, API, and Claude Code
- `EXT-4-warn-3`: **Claude.ai sharing limitation** — Custom Skills are individual user only; each team member must upload separately, no centralized admin management or org-wide distribution
- `EXT-4-warn-4`: **API runtime constraints** — No network access, no runtime package installation, pre-configured dependencies only (check code execution tool documentation for available packages)
- `EXT-4-warn-5`: **External sources risk** — Skills that fetch data from external URLs pose particular risk, as fetched content may contain malicious instructions; even trustworthy Skills can be compromised if external dependencies change
- `EXT-4-warn-6`: **Security audit required** — If using Skills from untrusted sources, thoroughly audit all files including SKILL.md, scripts, images, and other resources; look for unusual patterns like unexpected network calls or operations that don't match stated purpose
- `EXT-4-warn-7`: **Treat like installing software** — Only use Skills from trusted sources, especially when integrating into production systems with access to sensitive data or critical operations

## Tables

### Three Levels of Skill Loading

| Level | When Loaded | Token Cost | Content |
|-------|------------|------------|---------|
| **Level 1: Metadata** | Always (at startup) | ~100 tokens per Skill | `name` and `description` from YAML frontmatter |
| **Level 2: Instructions** | When Skill is triggered | Under 5k tokens | SKILL.md body with instructions and guidance |
| **Level 3+: Resources** | As needed | Effectively unlimited | Bundled files executed via bash without loading contents into context |

### Pre-built Agent Skills

| Skill | ID | Capabilities |
|-------|-----|--------------|
| PowerPoint | pptx | Create presentations, edit slides, analyze presentation content |
| Excel | xlsx | Create spreadsheets, analyze data, generate reports with charts |
| Word | docx | Create documents, edit content, format text |
| PDF | pdf | Generate formatted PDF documents and reports |

### Skills Sharing Models by Surface

| Surface | Sharing Scope | Notes |
|---------|---------------|-------|
| Claude.ai | Individual user only | Each team member must upload separately; no centralized admin management |
| Claude API | Workspace-wide | All workspace members can access uploaded Skills |
| Claude Code | Personal or project-based | `~/.claude/skills/` for personal, `.claude/skills/` for project; can share via Claude Code Plugins |

### Runtime Environment Constraints by Surface

| Surface | Network Access | Package Installation | Dependencies |
|---------|----------------|---------------------|--------------|
| Claude.ai | Varying (depends on user/admin settings) | - | - |
| Claude API | No network access | No runtime installation | Pre-configured only (see code execution tool docs) |
| Claude Code | Full network access | Local only (discouraged global) | Same as user's computer |

## Architecture Details

### How Claude Accesses Skill Content

1. When a Skill is triggered, Claude uses bash to read SKILL.md from the filesystem
2. Instructions are brought into the context window
3. If instructions reference other files (FORMS.md, database schema), Claude reads those via additional bash commands
4. When instructions mention executable scripts, Claude runs them via bash and receives only the output
5. Script code itself never enters context

### Example Loading Sequence

1. **Startup**: System prompt includes: `PDF Processing - Extract text and tables from PDF files, fill forms, merge documents`
2. **User request**: "Extract the text from this PDF and summarize it"
3. **Claude invokes**: `bash: read pdf-skill/SKILL.md` → Instructions loaded into context
4. **Claude determines**: Form filling is not needed, so FORMS.md is not read
5. **Claude executes**: Uses instructions from SKILL.md to complete the task

### Where Skills Work

**Claude API**:
- Supports both pre-built and custom Skills
- Specify `skill_id` in `container` parameter with code execution tool
- Custom Skills uploaded via Skills API (`/v1/skills` endpoints)
- Organization-wide sharing

**Claude Code**:
- Custom Skills only
- Filesystem-based, no API uploads required
- Auto-discovery from `.claude/skills/` directories

**Claude Agent SDK**:
- Custom Skills via filesystem-based configuration
- Create in `.claude/skills/` directory
- Enable by including `"Skill"` in `allowed_tools`

**Claude.ai**:
- Both pre-built and custom Skills
- Pre-built Skills work automatically
- Custom Skills via zip upload in Settings > Features
- Available on Pro, Max, Team, Enterprise plans with code execution enabled
- Individual user only, not shared organization-wide

## Required API Headers

Using Skills via the API requires three beta headers:

- `code-execution-2025-08-25` — Skills run in the code execution container
- `skills-2025-10-02` — Enables Skills functionality
- `files-api-2025-04-14` — Required for uploading/downloading files to/from the container

## YAML Field Requirements

**name**:
- Maximum 64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot contain XML tags
- Cannot contain reserved words: "anthropic", "claude"

**description**:
- Must be non-empty
- Maximum 1024 characters
- Cannot contain XML tags
