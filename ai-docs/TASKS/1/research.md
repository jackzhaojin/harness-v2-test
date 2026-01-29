This confirms the project is a greenfield setup - only `ai-docs` (spec files) and git exist. Now I have complete context to write the research document.

---

# Research: Task 1 - Project Scaffolding with Vite, React, TypeScript, and Tailwind

**Task ID**: 1  
**Researched**: 2026-01-28  
**Dependencies**: None (foundation task)  
**Estimated Complexity**: Medium  

---

## Relevant Project Context

> This is a greenfield project. The working directory contains only `ai-docs/SPEC/` with specifications and an empty git repository.

**Project Type**: React 18 SPA - Project Management Dashboard

**Key Files**:
- `ai-docs/SPEC/CONSTITUTION.md` - Immutable principles (strict TypeScript, Tailwind only, no external state management)
- `ai-docs/SPEC/HOW.md` - Full architecture patterns, file structure, and conventions
- `ai-docs/SPEC/PROMPT.md` - Feature requirements and design guidelines
- `ai-docs/SPEC/TASKS.json` - Complete task breakdown (19 tasks)

**Patterns in Use** (from HOW.md):
- Pattern 4: Custom Hook for localStorage Sync
- Pattern 6: Component Variants with cva pattern (Tailwind class composition)
- Naming: PascalCase for components, camelCase for hooks
- TypeScript: Strict mode, explicit return types, interface over type

**Relevant Prior Tasks**: None - this is Task 1, the foundation task.

---

## Functional Requirements

### Primary Objective
Establish the complete project foundation with Vite, React 18, TypeScript (strict mode), Tailwind CSS, and all required dependencies. This creates the scaffolding that all 18 subsequent tasks will build upon, ensuring consistent tooling, configuration, and folder structure from the start.

### Acceptance Criteria
From task packet - restated for clarity:

1. **Vite initialization**: Create project using Vite's React TypeScript template
2. **TypeScript strict mode**: Configure tsconfig.json with strict:true, noImplicitAny:true
3. **Tailwind CSS setup**: Install and configure with dark mode class strategy
4. **PostCSS configuration**: Create postcss.config.js for Tailwind processing
5. **CSS imports**: index.css must import Tailwind base, components, and utilities
6. **React Router v6**: Install and configure BrowserRouter in App.tsx with placeholder routes
7. **Lucide React**: Install icons package
8. **Recharts**: Install charting library
9. **Playwright**: Install E2E testing framework with basic configuration
10. **Development server**: npm run dev works without errors
11. **Production build**: npm run build succeeds
12. **Folder structure**: Create src/types, src/data, src/context, src/hooks, src/components, src/pages
13. **Placeholder files**: Create empty/minimal placeholder files for main architectural pieces

### Scope Boundaries

**In Scope**:
- Vite project scaffolding with React TypeScript template
- All dependency installation (react-router-dom, lucide-react, recharts, playwright, tailwindcss, postcss, autoprefixer)
- Configuration files (tsconfig.json, tailwind.config.js, postcss.config.js, playwright.config.ts)
- Base folder structure with empty placeholder files
- Minimal App.tsx with BrowserRouter setup and placeholder routes
- Minimal index.css with Tailwind directives

**Out of Scope** (deferred to later tasks):
- Actual component implementations (Task 4+)
- Mock data content (Task 2)
- Context provider implementations (Task 3)
- Custom hook implementations (Task 3)
- Any styling beyond Tailwind setup

---

## Technical Approach

### Implementation Strategy

The implementation follows a standard Vite scaffolding workflow:

1. **Project Initialization**: Use npm create vite to scaffold a React TypeScript project in the working directory. Since ai-docs already exists, the scaffolding must be done carefully to not overwrite existing spec files.

2. **Dependency Installation**: After base scaffolding, install additional dependencies in groups - routing (react-router-dom), styling (tailwindcss, postcss, autoprefixer), icons (lucide-react), charts (recharts), and testing (playwright).

3. **Configuration Files**: Create/modify configuration files following the exact patterns from HOW.md:
   - tsconfig.json: Enable strict mode, noImplicitAny, strictNullChecks
   - tailwind.config.js: Configure dark mode with class strategy, extend theme if needed
   - postcss.config.js: Register tailwindcss and autoprefixer plugins
   - vite.config.ts: Base configuration (default from template is usually sufficient)
   - playwright.config.ts: Basic E2E test configuration pointing to tests/e2e/

4. **Folder Structure Creation**: Create the directory tree as defined in HOW.md (src/types, src/data, src/context, src/hooks, src/components with subdirectories, src/pages).

5. **Placeholder Files**: Create minimal placeholder files (empty exports or single-line comments) in each architectural location to establish the structure without implementing functionality.

6. **App.tsx Setup**: Configure BrowserRouter with routes for all five pages (Dashboard at /, Projects at /projects, Tasks at /tasks, Team at /team, Settings at /settings) with placeholder components.

### Files to Modify

| File | Changes |
|------|---------|
| `tsconfig.json` | Enable strict, noImplicitAny, strictNullChecks (generated by Vite, needs modification) |
| `src/App.tsx` | Add BrowserRouter, Routes, and placeholder route definitions |
| `src/index.css` | Replace content with Tailwind directives |
| `src/main.tsx` | Ensure standard React 18 createRoot pattern (usually correct from template) |

### Files to Create

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Tailwind configuration with dark mode class strategy |
| `postcss.config.js` | PostCSS plugins for Tailwind |
| `playwright.config.ts` | Playwright E2E test configuration |
| `src/types/index.ts` | Placeholder for type definitions |
| `src/data/mockData.ts` | Placeholder for mock data |
| `src/context/ThemeContext.tsx` | Placeholder for theme context |
| `src/context/SidebarContext.tsx` | Placeholder for sidebar context |
| `src/context/ToastContext.tsx` | Placeholder for toast context |
| `src/context/DataContext.tsx` | Placeholder for data context |
| `src/hooks/useLocalStorage.ts` | Placeholder for localStorage hook |
| `src/hooks/useClickOutside.ts` | Placeholder for click outside hook |
| `src/hooks/useFocusTrap.ts` | Placeholder for focus trap hook |
| `src/hooks/useDebounce.ts` | Placeholder for debounce hook |
| `src/components/layout/AppShell.tsx` | Placeholder component |
| `src/components/layout/Sidebar.tsx` | Placeholder component |
| `src/components/layout/Header.tsx` | Placeholder component |
| `src/components/layout/MobileNav.tsx` | Placeholder component |
| `src/components/ui/Button.tsx` | Placeholder component |
| `src/components/ui/Card.tsx` | Placeholder component |
| `src/components/ui/Badge.tsx` | Placeholder component |
| `src/components/ui/Input.tsx` | Placeholder component |
| `src/components/ui/Select.tsx` | Placeholder component |
| `src/components/ui/Toggle.tsx` | Placeholder component |
| `src/components/ui/Modal.tsx` | Placeholder component |
| `src/components/ui/SlideOver.tsx` | Placeholder component |
| `src/components/ui/Toast.tsx` | Placeholder component |
| `src/components/ui/Avatar.tsx` | Placeholder component |
| `src/components/ui/ProgressBar.tsx` | Placeholder component |
| `src/components/ui/Dropdown.tsx` | Placeholder component |
| `src/pages/Dashboard.tsx` | Placeholder page component |
| `src/pages/Projects.tsx` | Placeholder page component |
| `src/pages/Tasks.tsx` | Placeholder page component |
| `src/pages/Team.tsx` | Placeholder page component |
| `src/pages/Settings.tsx` | Placeholder page component |
| `tests/e2e/.gitkeep` | Placeholder for E2E tests directory |

### Code Patterns to Follow

From HOW.md - describe the patterns that will guide placeholder structure:

- **Component File Structure**: Imports, Types, Constants, Component function order
- **Naming**: PascalCase for components, camelCase for hooks
- **TypeScript**: All placeholder components should have proper Props interface stubs
- **Dark Mode**: tailwind.config.js must use darkMode: 'class' strategy

### Integration Points

- App.tsx will import placeholder page components and render them via React Router Routes
- main.tsx renders App component into root element (standard Vite pattern)
- index.css Tailwind directives are imported by main.tsx
- Playwright configuration points to tests/e2e/ directory for future test files

---

## Testing Strategy

### Smoke Test
- App loads at localhost:5173 without console errors
- Navigation works between placeholder routes
- Dark mode class can be toggled manually on html element

### Functional Tests
- npm install completes without errors
- npm run dev starts development server successfully
- npm run build produces production bundle without errors
- npx tsc --noEmit passes TypeScript compilation
- npx playwright test (may have no tests yet) does not crash

### Regression Check
- Not applicable (greenfield project)

---

## Considerations

### Potential Pitfalls

1. **Vite scaffolding in non-empty directory**: The ai-docs folder already exists. Vite's create command may refuse to scaffold in a non-empty directory. Solution: Use the --force flag or scaffold in a temporary directory and merge, being careful to preserve ai-docs.

2. **TypeScript strict mode breaking Vite defaults**: The Vite React TS template may not have strict mode fully enabled. Must manually verify and update tsconfig.json after scaffolding.

3. **Tailwind v4 vs v3**: As of 2026, Tailwind v4 may be available with different configuration syntax. Ensure compatibility with the documented patterns from HOW.md which appear to target Tailwind v3 syntax.

4. **Playwright installation**: Playwright requires browser binaries. The implementation should include npx playwright install to download browsers.

### Edge Cases

1. **Missing ai-docs preservation**: Must ensure the scaffolding process does not delete or overwrite the existing ai-docs directory.

2. **Node version compatibility**: Vite and Playwright have minimum Node version requirements. Assumes Node 18+ is available.

3. **Package lockfile**: Should generate package-lock.json for reproducible builds.

---

```json
{
  "task": "1",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/PROMPT.md",
    "ai-docs/SPEC/bootstrap.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/TASKS.json",
    "ai-docs/SPEC/bootstrap_handoff.json",
    "ai-docs/TASKS/1/packet.md"
  ],
  "planSummary": "Scaffold Vite React TypeScript project, install all dependencies (react-router-dom, tailwindcss, postcss, autoprefixer, lucide-react, recharts, playwright), configure TypeScript strict mode and Tailwind dark mode class strategy, create complete folder structure with placeholder files for all architectural components defined in HOW.md, set up basic BrowserRouter with five page routes.",
  "scope": {
    "level": "major",
    "rationale": "Foundation task that establishes the entire project architecture, folder structure, tooling configuration, and dependency baseline. All 18 subsequent tasks depend on this scaffolding. Creates 40+ files across multiple directories."
  }
}
```