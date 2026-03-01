# CLAUDE.md and Memory

**Topic ID:** claude-code.cli.memory
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude Code uses a dual memory system to maintain context across sessions: **CLAUDE.md files** that you write to provide persistent instructions, and **auto memory** that Claude writes to accumulate learnings automatically. Both systems load at the start of every conversation, giving Claude immediate access to project standards, coding conventions, debugging insights, and workflow preferences without requiring you to repeat information each session.

CLAUDE.md files function as onboarding documentation—the equivalent of briefing a new team member on your project's architecture, coding standards, and common commands. They live in your repository and can be version-controlled, ensuring your entire team's Claude assistants follow the same standards. Auto memory complements this by letting Claude take notes for itself: build commands it discovers, debugging patterns it learns, and preferences you correct it on.

The memory system operates hierarchically, with more specific locations taking precedence over broader ones. This allows organization-wide policies, project standards, and personal preferences to coexist without conflict. Understanding this hierarchy is essential for teams deploying Claude Code at scale.

## Key Concepts

- **CLAUDE.md files**: Markdown files you create that provide persistent instructions to Claude. They're loaded into context at session start and treated as guidance, not enforced configuration.

- **Auto memory**: Notes Claude writes for itself based on corrections and discoveries. Stored in `~/.claude/projects/<project>/memory/` and loaded automatically (first 200 lines of MEMORY.md).

- **Memory hierarchy**: Files load in priority order—managed policy → project instructions → user instructions → local instructions. More specific locations override broader ones.

- **Project CLAUDE.md**: Lives at `./CLAUDE.md` or `./.claude/CLAUDE.md`. Shared with team via version control. Contains build commands, coding standards, and architecture decisions.

- **User CLAUDE.md**: Lives at `~/.claude/CLAUDE.md`. Personal preferences that apply to all your projects across your machine.

- **Local CLAUDE.md**: Lives at `./CLAUDE.local.md`. Personal project-specific preferences not checked into git.

- **Rules directory**: `.claude/rules/` contains modular instruction files. Can be scoped to specific file patterns using YAML frontmatter with the `paths` field.

- **Import syntax**: Use `@path/to/file` to include additional files in CLAUDE.md. Paths resolve relative to the containing file.

- **The 200-line limit**: Only the first 200 lines of MEMORY.md load at session start. CLAUDE.md files load in full but shorter files produce better adherence.

## Technical Details

### CLAUDE.md File Locations

| Scope | Location | Shared With |
|-------|----------|-------------|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | All org users |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team via git |
| User | `~/.claude/CLAUDE.md` | Just you (all projects) |
| Local | `./CLAUDE.local.md` | Just you (current project) |

### Auto Memory Structure

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Index file, first 200 lines loaded at startup
├── debugging.md       # Detailed debugging patterns
├── api-conventions.md # API design decisions
└── patterns.md        # Code patterns Claude discovered
```

### Path-Scoped Rules

Create files in `.claude/rules/` with YAML frontmatter to apply rules only when Claude works with matching files:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Development Rules

- All endpoints must include input validation
- Use standard error response format
- Include OpenAPI documentation comments
```

Glob patterns supported: `**/*.ts` (all TypeScript), `src/**/*` (everything under src), `*.md` (markdown in root).

### Import Syntax

Reference external files with `@` syntax:

```markdown
See @README for project overview and @package.json for npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal settings: @~/.claude/my-project-prefs.md
```

Maximum import depth: five hops. Relative paths resolve from the containing file.

### Key Commands

| Command | Purpose |
|---------|---------|
| `/init` | Generate starter CLAUDE.md by analyzing codebase |
| `/memory` | Browse and edit all memory files |
| `#` key | Add rule inline during conversation |

### Configuration Settings

Disable auto memory project-wide in `.claude/settings.json`:
```json
{
  "autoMemoryEnabled": false
}
```

Exclude irrelevant CLAUDE.md files in monorepos:
```json
{
  "claudeMdExcludes": [
    "**/other-team/CLAUDE.md",
    "/path/to/monorepo/.claude/rules/**"
  ]
}
```

Environment variable for CI: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`

## Common Patterns

### Minimal Project CLAUDE.md

```markdown
# Project Context

FastAPI REST API for user authentication.

## Key Directories
- app/models/ - database models
- app/api/ - route handlers
- app/core/ - configuration

## Standards
- Type hints required on all functions
- pytest for testing (fixtures in tests/conftest.py)
- PEP 8 with 100 character lines

## Commands
uvicorn app.main:app --reload  # dev server
pytest tests/ -v               # run tests
```

### Modular Organization for Large Projects

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # Main project instructions
│   └── rules/
│       ├── code-style.md   # Loaded for all files
│       ├── frontend/
│       │   └── react.md    # paths: ["src/components/**"]
│       └── backend/
│           └── api.md      # paths: ["src/api/**"]
```

### Team + Personal Preferences

Project CLAUDE.md (committed to git):
```markdown
# Team Standards
- Use pnpm, not npm
- Run `pnpm test` before committing
```

Personal CLAUDE.local.md (gitignored):
```markdown
# My Preferences
- I prefer verbose explanations
- My sandbox URL: http://localhost:3001
```

### Explicit Memory Saves

When solving hard problems, tell Claude directly:
- "Remember that the API tests require a local Redis instance"
- "Remember we use pnpm, not npm"
- "Remember this debugging approach for auth token issues"

Claude writes these to auto memory immediately.

## Gotchas

- **CLAUDE.md is guidance, not enforcement**: Claude reads instructions and tries to follow them, but there's no guarantee of strict compliance. Vague instructions ("format code properly") work poorly; specific instructions ("use 2-space indentation") work better.

- **The 200-line cutoff applies only to MEMORY.md**: CLAUDE.md files load in full, but files over 200 lines consume excessive context and reduce adherence. Keep CLAUDE.md concise.

- **Auto memory is machine-local**: It's stored in `~/.claude/projects/` and not shared via git. Team members don't see each other's auto memory.

- **Conflicting instructions produce arbitrary results**: If two CLAUDE.md files give different guidance for the same behavior, Claude picks one arbitrarily. Review for conflicts periodically.

- **Instructions don't survive `/compact` unless written to files**: Anything given only in conversation disappears after compaction. Write important instructions to CLAUDE.md.

- **Import approval dialog appears once**: The first time Claude encounters external imports (`@path`), it shows an approval dialog. If declined, imports stay disabled permanently for that project.

- **Subdirectory CLAUDE.md files load on demand**: Only CLAUDE.md files in the current directory and ancestors load at startup. Subdirectory files load when Claude reads files in those directories.

- **`/init` doesn't overwrite existing files**: If CLAUDE.md exists, `/init` suggests improvements rather than replacing it.

- **Different worktrees get separate auto memory**: This is intentional—different branches often have different states. Use `@~/.claude/my-project-prefs.md` imports if you need shared personal preferences across worktrees.

- **Managed policy CLAUDE.md cannot be excluded**: Organization-wide instructions deployed via IT always apply, regardless of `claudeMdExcludes` settings.

## Sources

- [How Claude remembers your project - Claude Code Docs](https://code.claude.com/docs/en/memory) — Official documentation covering CLAUDE.md files, auto memory, rules directory, and troubleshooting
- [Using CLAUDE.md files: Customizing Claude Code for your codebase](https://claude.com/blog/using-claude-md-files) — Anthropic blog post on CLAUDE.md structure, best practices, and the /init command
- [The CLAUDE.md Memory System - Tutorial | SFEIR Institute](https://institute.sfeir.com/en/claude-code/claude-code-memory-system-claude-md/tutorial/) — Step-by-step setup guide covering memory hierarchy and glob patterns
- [Claude Code Auto Memory: How Your AI Learns Your Project](https://claudefa.st/blog/guide/mechanics/auto-memory) — Technical deep-dive on auto memory internals, MEMORY.md structure, and management commands
