# Skill Creation

**Topic ID:** claude-code.skills.creation
**Researched:** 2026-03-01T12:00:00Z

## Overview

Claude Code skills are modular, filesystem-based instruction sets that extend Claude's capabilities for specialized tasks. A skill is defined by a SKILL.md file containing YAML frontmatter and markdown instructions that Claude follows when the skill is invoked [1]. Skills represent a fundamental shift from custom-building separate agents for each use case toward composable, shareable procedural knowledge that anyone can create and distribute [3].

Skills differ from CLAUDE.md files in a critical way: CLAUDE.md content is always loaded at session start and provides universal project conventions, while skills load on-demand when relevant and provide modular, task-specific workflows [4]. This on-demand loading is important because Claude's instruction-following quality decreases uniformly as instruction count increases [4]. Skills can be invoked automatically when Claude determines relevance, or manually via slash commands like `/skill-name` [1].

As of January 2026, Anthropic merged the legacy slash commands system into skills [2]. Existing `.claude/commands/` files continue to work, but skills add additional capabilities: supporting file directories, frontmatter for invocation control, subagent execution, and cross-platform portability to Claude.ai and Claude Desktop [1][2].

## Key Concepts

- **SKILL.md** — The required entry point file for any skill, containing YAML frontmatter (between `---` markers) and markdown body with procedural instructions [1]. The frontmatter defines metadata; the body becomes part of Claude's system instructions when active.

- **Skill directory structure** — Skills are folders, not single files. The directory contains SKILL.md plus optional supporting files like templates, examples, scripts, and reference documentation [1][5].

- **Personal vs. project skills** — Personal skills in `~/.claude/skills/` are available across all projects; project skills in `.claude/skills/` apply only to that project [1]. Enterprise-managed skills take highest priority, then personal, then project.

- **Description field** — The most critical frontmatter field. Claude uses this to decide when to automatically load a skill [1]. Directive descriptions with explicit trigger guidance ("ALWAYS invoke when..." rather than passive "Use when...") achieve significantly higher activation rates [6].

- **Invocation control** — Two frontmatter fields control who can invoke: `disable-model-invocation: true` prevents Claude from auto-triggering (user-only), while `user-invocable: false` hides from the slash menu (Claude-only) [1].

- **Context budget** — Skill descriptions consume context space. The budget defaults to approximately 16,000 characters (2% of context window) [1][6]. Exceeding this causes skills to be silently dropped without warning.

- **Supporting files** — Reference documents, templates, and scripts that SKILL.md can point to, loaded only when needed to keep context lean [1][5].

## Technical Details

### SKILL.md File Structure

Every skill requires this minimal structure [1]:

```yaml
---
name: my-skill-name
description: What this skill does and when to trigger it
---

# My Skill Name

[Procedural instructions here]
```

### Complete Frontmatter Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Display name and slash command. Defaults to directory name. Lowercase, numbers, hyphens only (max 64 chars) [1] |
| `description` | Recommended | Trigger guidance for Claude. If omitted, uses first markdown paragraph [1] |
| `argument-hint` | No | Autocomplete hint like `[issue-number]` [1] |
| `disable-model-invocation` | No | `true` = user-only invocation [1] |
| `user-invocable` | No | `false` = hidden from slash menu, Claude-only [1] |
| `allowed-tools` | No | Tools Claude can use without per-use approval [1] |
| `model` | No | Override model when skill is active [1] |
| `context` | No | Set to `fork` to run in isolated subagent [1] |
| `agent` | No | Subagent type when `context: fork` (e.g., `Explore`, `Plan`) [1] |
| `hooks` | No | Skill-scoped hooks for lifecycle events [1] |

### Variable Substitution

Skills support dynamic placeholders [1]:

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed to skill |
| `$ARGUMENTS[N]` or `$N` | Specific argument by 0-based index |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Shell command output (executed before Claude sees prompt) |

### Directory Structure Example

```
my-skill/
├── SKILL.md           # Required: main instructions
├── template.md        # Optional: fill-in template
├── reference.md       # Optional: detailed docs (loaded when needed)
├── examples/
│   └── sample.md      # Optional: expected output examples
└── scripts/
    └── helper.py      # Optional: executable scripts
```

Reference supporting files from SKILL.md so Claude knows when to load them [1][5]:

```markdown
## Additional resources
- For API details, see [reference.md](reference.md)
- For examples, see [examples/](examples/)
```

## Common Patterns

### Pattern 1: Read-Only Exploration Skill

Restrict tools for safe codebase exploration [1]:

```yaml
---
name: safe-reader
description: Explore code without making changes. Use for code review or learning.
allowed-tools: Read, Grep, Glob
---

When exploring this codebase:
1. Start with the entry point
2. Trace dependencies
3. Note patterns and anti-patterns
```

### Pattern 2: Deployment Skill with User-Only Trigger

Prevent accidental auto-deployment [1]:

```yaml
---
name: deploy
description: Deploy application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:
1. Run test suite
2. Build application
3. Push to deployment target
4. Verify deployment succeeded
```

### Pattern 3: Background Knowledge Skill

Provide context without cluttering the slash menu [1]:

```yaml
---
name: legacy-system-context
description: Historical context about the legacy authentication system
user-invocable: false
---

The legacy auth system was built in 2019 and uses...
```

### Pattern 4: Forked Subagent Research

Run isolated research without affecting conversation context [1]:

```yaml
---
name: deep-research
description: Research a topic thoroughly using codebase exploration
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze code
3. Summarize findings with file references
```

## Gotchas

**Silent skill exclusion due to character budget** — If you have many skills or long descriptions, skills may be silently dropped from Claude's context with no warning [6]. Run `/context` to check for warnings. Set `SLASH_COMMAND_TOOL_CHAR_BUDGET=30000` to increase headroom.

**Prettier reformats YAML frontmatter** — Prettier can break multi-line descriptions, causing skills to disappear from Claude's list [6]. Use single-line descriptions with `# prettier-ignore` comment.

**Wrong directory placement is silent** — Files in `.claude/slash/` or `commands/` (wrong paths) are ignored without error [6]. Skills must be in `.claude/skills/skill-name/SKILL.md` or `~/.claude/skills/skill-name/SKILL.md`.

**Passive descriptions have low activation rates** — Standard "Use when..." descriptions achieve only 37-77% activation [6]. Directive descriptions with imperative commands ("ALWAYS invoke this skill when...") achieve near-100% activation.

**`disable-model-invocation` vs `user-invocable`** — These are commonly confused [1]. Use `disable-model-invocation: true` to prevent Claude from auto-triggering a skill with side effects. Use `user-invocable: false` for background knowledge that users should not invoke directly. The former blocks the Skill tool; the latter only hides from the menu.

**Skills vs CLAUDE.md scope confusion** — CLAUDE.md is always loaded (universal conventions); skills load on-demand (specific workflows) [4]. Do not put task-specific workflows in CLAUDE.md—use skills instead. Keep CLAUDE.md under 150 lines; keep SKILL.md under 500 lines.

**Supporting files must be referenced** — Simply placing files in the skill directory does not make them available [1][5]. SKILL.md must explicitly reference them with guidance on when Claude should read them.

**Plugin installed but not enabled** — A known bug causes plugins to appear in `installed_plugins.json` but not `enabledPlugins` in `settings.json` [6]. Manually verify enablement.

## Sources

[1] **Extend Claude with skills - Claude Code Docs**
    URL: https://code.claude.com/docs/en/skills
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Complete SKILL.md structure, frontmatter reference, directory layout, invocation control, variable substitution, supporting files, context forking, troubleshooting section

[2] **Why did Anthropic merge slash commands into skills? - Dev Genius**
    URL: https://blog.devgenius.io/why-did-anthropic-merge-slash-commands-into-skills-4bf6464c96ca
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: January 2026 merge of slash commands into skills, backward compatibility, added capabilities

[3] **Equipping agents for the real world with Agent Skills - Anthropic**
    URL: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Conceptual framing of skills as composable procedural knowledge, onboarding guide analogy

[4] **Claude Skills and CLAUDE.md: a practical 2026 guide for teams**
    URL: https://www.gend.co/blog/claude-skills-claude-md-guide
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Skills vs CLAUDE.md comparison, instruction-following limits, context drift, recommended line counts

[5] **Skill Creator SKILL.md - GitHub anthropics/skills**
    URL: https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Three-level loading system (metadata, body, resources), writing guidelines, progressive disclosure, bundled resources pattern, testing workflow

[6] **Common Mistakes and Troubleshooting - Multiple Sources**
    URL: https://institute.sfeir.com/en/claude-code/claude-code-custom-commands-and-skills/errors/
    URL: https://medium.com/@ivan.seleznov1/why-claude-code-skills-dont-activate-and-how-to-fix-it-86f679409af1
    URL: https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Character budget limits and silent exclusion, Prettier YAML issues, wrong directory placement, directive vs passive description activation rates, plugin enablement bug, diagnostic checklist
