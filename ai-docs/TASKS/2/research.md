The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/2/research.md`. Here's a summary of the findings:

## Research Summary: Task 2 - Type Definitions and Mock Data Setup

**Scope**: Minor — only 2 files to modify, both currently empty placeholders.

**Current State**: Task 1 scaffolded the entire project with all placeholder files. `src/types/index.ts` and `src/data/mockData.ts` both contain only `export {};` stubs. TypeScript is configured in strict mode with `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, and `noUnusedParameters`.

**Implementation Plan**:
1. **`src/types/index.ts`** — Define 4 union types (`TaskStatus`, `ProjectStatus`, `Priority`, `TeamRole`) and 4 interfaces (`Project`, `Task`, `TeamMember`, `Activity`) following HOW.md conventions (interface for objects, type for unions, no enums)
2. **`src/data/mockData.ts`** — Create 4 typed export arrays: 10 projects, 15+ tasks, 8 team members, 10 activities with consistent cross-references

**Key Design Decisions**:
- String IDs throughout (aligned with HOW.md DataContext `MOVE_TASK` action payload)
- Field names follow acceptance criteria over PROMPT.md examples (`teamLead` not `lead`, `isOnline` not `online`)
- Activity timestamps as relative strings per PROMPT.md pattern
- Avatar URLs using placeholder service for realistic rendering

**Pitfalls Identified**: ID type consistency with downstream DataContext, field name alignment between PROMPT.md examples and acceptance criteria, ensuring cross-referential integrity across all entity arrays, and ensuring all status/role categories have representation in mock data.