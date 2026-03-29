# Enhancement: teach-back-skill-schema

**Date:** 2026-03-29
**Status:** Applied and verified

## Summary

Upgraded the teach-back grading system to use the skill-aligned schema from
`.claude/skills/score-explanation/SKILL.md`, replacing the simplified grading
schema with a richer evaluation framework that produces higher-quality Socratic
coaching feedback.

## Files Modified

### 1. `src/lib/claude-client.js`

**Old schema (removed):**
- `logicAccuracy` (number 0-100)
- `depth` (number 0-100)
- `flow` ("Optimal" | "Good" | "Fair" | "Needs Work")
- `suggestions` (string[])
- `semanticGaps` ({ name, status }[])

**New schema (aligned with score-explanation skill):**
- `completeness` (number 0-100) — percentage of key concepts covered
- `accuracy` (number 0-100) — technical correctness of statements
- `depth` ("surface" | "moderate" | "deep") — categorical depth classification
- `coveredWell` (string[]) — concepts explained accurately and thoroughly
- `partiallyCorrect` (string[]) — concepts addressed but with missing nuance
- `missing` (string[]) — key concepts not mentioned at all
- `followUpQuestion` (string) — Socratic question targeting the weakest area
- `overallFeedback` (string) — 2-3 sentence summary with actionable next steps

**System prompt additions:**
- Ported all evaluation dimensions from the score-explanation skill
- Added coaching principles:
  - "Do not penalize for informal language or unconventional structure. Judge understanding, not polish."
  - "A learner who uses their own examples or analogies demonstrates deeper understanding than one who parrots the source material."

**Preserved:**
- Model: `claude-haiku-4-5`
- CORS header: `anthropic-dangerous-direct-browser-access: true`
- Markdown fence stripping before `JSON.parse()`
- Error handling (network, 401, 429, non-OK, parse failure)
- Field validation with sensible defaults

### 2. `src/components/TeachBackInput.jsx`

**Grading Dashboard (side panel) changes:**
- Removed: "Logic Accuracy" DotBar, "Depth of Understanding" percentage bar, "Instructional Flow" segment bar, "Neural Suggestions" list
- Added: `MetricBar` for **Completeness** (secondary/green color)
- Added: `MetricBar` for **Accuracy** (primary/purple color)
- Added: `DepthBadge` component — renders "surface" (error/red), "moderate" (primary/purple), "deep" (secondary/green with glow)
- Added: **Follow-Up Question** coaching card with left-border accent and italic text
- Added: **Overall Feedback** paragraph section

**Main panel (post-submit) changes:**
- Removed: "Node Map" bar chart panel and flat "Semantic Gaps" two-column list
- Added: Three-tier concept breakdown:
  - **Covered Well** section (secondary/green border and color)
  - **Partially Correct** section (tertiary color, conditionally rendered)
  - **Missing** section (error/red border and color, conditionally rendered)

**Preserved:**
- `ApiKeyModal` integration and API key check flow
- Research content fetch via `getAssetUrl`
- Loading overlay with spinner
- Error banner with dismiss button
- Topic selector chip buttons
- Textarea input and SUBMIT LOGIC button
- Mastery Progress card
- handleReset, handleApiKeySave handlers

## Build Verification

```
> aem-devops-cert-v1@0.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
v 215 modules transformed.
dist/index.html                   1.85 kB | gzip:   0.89 kB
dist/assets/index-Dal_T5hC.css   38.92 kB | gzip:   6.98 kB
dist/assets/index-DH98gZ-3.js   378.68 kB | gzip: 114.55 kB
v built in 708ms
```

Zero errors. Zero warnings.

## Acceptance Criteria Verified

- claude-client.js system prompt includes completeness, accuracy, depth (surface/moderate/deep), coveredWell, partiallyCorrect, missing, followUpQuestion, overallFeedback — confirmed via grep
- API response parsed into new schema with all fields validated and defaulted — confirmed in source
- Grading dashboard renders completeness and accuracy as separate MetricBar components — confirmed in JSX
- Depth shows as a qualitative DepthBadge (surface/moderate/deep) not a percentage bar — confirmed in JSX
- Covered Well, Partially Correct, and Missing sections render with distinct styling (secondary/tertiary/error colors) — confirmed in JSX
- Follow-up question displays in a coaching card with left-border accent — confirmed in JSX
- Overall feedback displays as a paragraph — confirmed in JSX
- Markdown fence stripping preserved before JSON.parse() — confirmed via grep on line 103
- npm run build succeeds with zero errors — confirmed above
- Old fields (logicAccuracy, flow, suggestions, semanticGaps, DotBar) fully removed — confirmed via grep showing zero matches
