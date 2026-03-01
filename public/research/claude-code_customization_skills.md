# Custom Skills and Commands

**Topic ID:** claude-code.customization.skills
**Researched:** 2025-03-01T12:00:00Z

## Overview

Claude Code skills are a mechanism for extending Claude's capabilities through instruction files that teach it how to perform specific tasks in a repeatable way. Skills follow the open [Agent Skills](https://agentskills.io) standard, which means they work across multiple AI tools including Claude.ai, Claude Code CLI, and the API. A skill is essentially a folder containing a `SKILL.md` file with YAML frontmatter (metadata) and markdown instructions, plus optional supporting files like scripts, templates, or reference documentation.

Skills evolved from the earlier "custom commands" feature, and the two have now been merged. Files in `.claude/commands/` continue to work, but skills offer additional capabilities: directory structures for supporting files, frontmatter for controlling invocation behavior, and automatic loading when relevant to user tasks. When you create a skill, Claude adds it to its toolkit and can either invoke it automatically when the task matches the skill's description, or you can trigger it manually using `/skill-name` syntax.

The practical value of skills lies in workflow standardization. Rather than explaining your deployment process, code review checklist, or documentation format every session, you encode that knowledge once in a skill. Claude then follows those instructions consistently, whether it decides to apply them or you explicitly invoke them.

## Key Concepts

- **SKILL.md**: The required entry point file for every skill. Contains YAML frontmatter between `---` markers followed by markdown instructions that Claude follows when the skill is invoked.

- **Frontmatter**: YAML metadata at the top of `SKILL.md` that configures skill behavior. Key fields include `name`, `description`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, and `context`.

- **Skill discovery**: Claude Code automatically discovers skills from `~/.claude/skills/` (personal/global), `.claude/skills/` (project-level), and nested `.claude/skills/` directories in subdirectories you're working in (supporting monorepos).

- **Auto-invocation**: By default, Claude can invoke skills automatically when the task matches the skill's description. The description field is crucial—it's how Claude decides when to apply the skill.

- **Manual invocation**: Users can trigger any user-invocable skill directly using `/skill-name` followed by optional arguments.

- **Context budget**: Skill descriptions are loaded into context so Claude knows what's available. The budget is 2% of the context window (fallback: 16,000 characters). Run `/context` to check for warnings about excluded skills.

- **Subagent execution**: Adding `context: fork` to frontmatter runs the skill in an isolated subagent context, useful for tasks that shouldn't share conversation history.

- **String substitutions**: Skills support `$ARGUMENTS` (all arguments), `$ARGUMENTS[N]` or `$N` (specific argument by index), and `${CLAUDE_SESSION_ID}` for dynamic content.

## Technical Details

### Directory Structure

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill in
├── examples/
│   └── sample.md      # Example output showing expected format
└── scripts/
    └── validate.sh    # Script Claude can execute
```

### Storage Locations (Priority Order)

| Location   | Path                                      | Applies to                     |
|------------|-------------------------------------------|--------------------------------|
| Enterprise | Managed settings                          | All users in organization      |
| Personal   | `~/.claude/skills/<skill-name>/SKILL.md`  | All your projects              |
| Project    | `.claude/skills/<skill-name>/SKILL.md`    | This project only              |
| Plugin     | `<plugin>/skills/<skill-name>/SKILL.md`   | Where plugin is enabled        |

Higher-priority locations win when skills share the same name.

### Frontmatter Reference

```yaml
---
name: my-skill                    # Display name, becomes /slash-command
description: What this skill does # How Claude decides when to use it
argument-hint: [filename]         # Shown during autocomplete
disable-model-invocation: true    # Only user can invoke (manual only)
user-invocable: false             # Only Claude can invoke (hidden from menu)
allowed-tools: Read, Grep, Glob   # Tools allowed without per-use approval
model: sonnet                     # Model to use when skill is active
context: fork                     # Run in isolated subagent context
agent: Explore                    # Subagent type when context: fork
---
```

### Dynamic Context Injection

The `!`command`` syntax runs shell commands before sending content to Claude:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`

Summarize this pull request...
```

## Common Patterns

### Reference/Knowledge Skills

Add conventions or domain knowledge Claude applies to your work:

```yaml
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

### Task/Workflow Skills

Step-by-step instructions for specific actions, typically manually invoked:

```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:
1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

### Documentation Fetching Skills

Fetch current documentation to avoid outdated training data:

```yaml
---
name: dexie-expert
description: Get Dexie.js guidance with current documentation
allowed-tools: Read, Grep, Glob, WebFetch
---

First, fetch the documentation index from https://dexie.org/llms.txt
Then fetch relevant documentation pages based on the user's question.
Finally, answer: $ARGUMENTS
```

### Read-Only Exploration Skills

Restrict tools for safe exploration:

```yaml
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---

Explore the codebase without modifying any files.
```

## Gotchas

- **`disable-model-invocation` vs `user-invocable` confusion**: These control different things. `disable-model-invocation: true` prevents Claude from auto-triggering the skill—only you can invoke it with `/skill-name`. `user-invocable: false` hides it from the `/` menu—only Claude can invoke it. The `user-invocable` field does NOT block the Skill tool access; use `disable-model-invocation` for that.

- **Known bug with `disable-model-invocation`**: There have been reports that skills with `disable-model-invocation: true` may cause Claude to refuse invoking them even when the user explicitly types the slash command. The model misinterprets the setting as "I cannot use this skill at all" rather than "don't auto-trigger without user request."

- **Skills aren't separate processes**: Skills are injected instructions within the main conversation, not sub-agents or external tools. They expand the prompt dynamically.

- **`context: fork` requires explicit instructions**: If your skill contains only guidelines without a task (e.g., "use these API conventions"), the subagent receives guidelines but no actionable prompt and returns without meaningful output.

- **Commands migration**: Both `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` create `/review`. If both exist with the same name, the skill takes precedence.

- **Context budget overflow**: If you have many skills, descriptions may exceed the 2% budget. Check `/context` for warnings. Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

- **Description quality matters**: Claude uses the description to decide when to auto-invoke. Vague descriptions lead to inconsistent triggering. Be specific about when the skill should activate.

- **Supporting files aren't auto-loaded**: Files beyond `SKILL.md` must be explicitly referenced in your instructions so Claude knows when to load them. Keep `SKILL.md` under 500 lines and move detailed reference material to separate files.

## Sources

- [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills) — Official documentation covering full SKILL.md structure, frontmatter reference, storage locations, and advanced patterns
- [Inside Claude Code Skills: Structure, prompts, invocation](https://mikhail.io/2025/10/claude-code-skills/) — Technical deep-dive on how skills work internally as injected instructions rather than separate processes
- [Claude Code Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/) — Practical patterns for skills, slash commands, and subagent orchestration
- [GitHub Issue #19141: Clarify distinction between user-invocable and disable-model-invocation](https://github.com/anthropics/claude-code/issues/19141) — Discussion of common confusion between the two frontmatter fields
