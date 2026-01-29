Now I have a complete picture. Let me write the research document.

# Research: Task 3 - Core Context Providers and Custom Hooks

**Task ID**: 3
**Researched**: 2026-01-28
**Dependencies**: Task 2 (types and mock data)
**Estimated Complexity**: Major (9 files: 4 hooks, 4 contexts, 1 app integration)

---

## Relevant Project Context

> Task 3 has already been **fully implemented and validated** in build attempt 1. This research documents the existing implementation to confirm it meets all acceptance criteria and to inform any future iteration.

**Project Type**: React 18 + TypeScript + Vite project management dashboard SPA

**Key Files**:
- `ai-docs/SPEC/HOW.md` — Architecture patterns (Patterns 1, 4, 7 are relevant)
- `src/types/index.ts` — Type definitions (Project, Task, TeamMember, Activity, TaskStatus, etc.)
- `src/data/mockData.ts` — Mock data exports (projects, tasks, teamMembers, activities)

**Patterns in Use**:
- **Pattern 1**: Context + useReducer for Domain State (DataContext)
- **Pattern 4**: Custom Hook for localStorage Sync (useLocalStorage, consumed by ThemeContext and SidebarContext)
- **Pattern 7**: Accessible Focus Management (useFocusTrap)

**Relevant Prior Tasks**:
- **Task 2**: Established all TypeScript interfaces (Project, Task, TeamMember, Activity) and mock data. Created empty stub files for all hooks and contexts.

---

## Functional Requirements

### Primary Objective
Implement the complete state management foundation for the application: four React Context providers (Theme, Sidebar, Toast, Data) for global state management, four custom hooks (useLocalStorage, useDebounce, useClickOutside, useFocusTrap) for reusable behavior, and wire everything together through App.tsx's provider hierarchy. This layer sits between the data/types layer (Task 2) and the UI component layer (Task 4+).

### Acceptance Criteria
From task packet — restated for clarity:

1. **ThemeContext provides theme state**: Exposes theme value ('light' | 'dark' | 'system') and a setTheme function via context
2. **Theme persists to localStorage**: Uses localStorage key 'theme', loads saved preference on app initialization
3. **System theme respects OS preference**: When set to 'system', reads matchMedia('(prefers-color-scheme: dark)') and listens for changes
4. **SidebarContext collapsed state**: Provides isCollapsed boolean and toggle function via context
5. **Sidebar persists to localStorage**: Uses localStorage key 'sidebar-collapsed'
6. **ToastContext showToast function**: Accepts message (string) and type ('success' | 'error' | 'info')
7. **Toast queue with auto-dismiss**: Manages array of toasts, auto-removes each after 3 seconds
8. **DataContext with useReducer**: State shape holds projects, tasks, and team arrays
9. **DataContext 7 actions**: ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, ADD_TASK, UPDATE_TASK, DELETE_TASK, MOVE_TASK
10. **DataContext localStorage sync**: Writes state to localStorage on every change, reads on initialization
11. **useLocalStorage hook**: useState-like API with automatic localStorage read/write
12. **useClickOutside hook**: Detects mouse/touch events outside a ref element and calls handler
13. **useFocusTrap hook**: Traps Tab/Shift+Tab focus cycling within a container when active
14. **useDebounce hook**: Returns debounced value after configurable delay
15. **App.tsx provider hierarchy**: All contexts wrapped around routes in correct order

### Scope Boundaries
**In Scope**:
- All 4 custom hooks implementation
- All 4 context providers implementation
- App.tsx wiring with provider hierarchy
- localStorage persistence for theme, sidebar, and app data
- OS theme preference detection and real-time listener

**Out of Scope**:
- UI components that consume these contexts (Task 4+)
- Toast rendering component (Task 4+ ui components)
- Page implementations (later tasks)
- E2E tests (separate test task)

---

## Technical Approach

### Implementation Strategy

The implementation follows a bottom-up build order: hooks first (since contexts depend on them), then contexts, then App.tsx wiring.

**Layer 1 — Custom Hooks (no dependencies on contexts)**:
- useLocalStorage: Foundation hook consumed by ThemeContext and SidebarContext. Generic type parameter, lazy initialization from localStorage, useState-like tuple return, functional update support, try/catch error boundaries.
- useDebounce: Standalone utility. Generic type, setTimeout with cleanup, configurable delay.
- useClickOutside: Standalone utility. Takes RefObject and handler, listens for both mousedown and touchstart events on document, checks element.contains() for outside detection.
- useFocusTrap: Standalone utility. Returns a RefObject to attach to container. When isActive is true, queries focusable elements within container, handles Tab/Shift+Tab key events to cycle focus, auto-focuses first element.

**Layer 2 — Context Providers (depend on useLocalStorage)**:
- ThemeContext: Uses useLocalStorage for persistence. Effect applies/removes 'dark' class on document.documentElement. When theme is 'system', sets up matchMedia listener with cleanup. Exports ThemeProvider and useTheme hook with context guard.
- SidebarContext: Uses useLocalStorage for persistence. Simple boolean collapsed state with toggle convenience function. Exports SidebarProvider and useSidebar hook.
- ToastContext: No localStorage (transient). useState for toast array, useCallback-wrapped showToast and removeToast. Generates unique IDs with Date.now() + Math.random(). setTimeout for 3-second auto-dismiss. Exports ToastProvider and useToast hook.
- DataContext: Uses useReducer with typed discriminated union actions. getInitialState reads from localStorage with fallback to mock data imports. useEffect syncs state to localStorage on every change. All 7 CRUD actions use immutable spread-based updates. Exports DataProvider and useData hook.

**Layer 3 — App.tsx Wiring**:
- Provider hierarchy (outermost to innermost): ThemeProvider → SidebarProvider → ToastProvider → DataProvider → BrowserRouter → Routes
- Theme outermost because it modifies document.documentElement
- BrowserRouter innermost so all providers are available in routed pages

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap existing Routes/BrowserRouter with 4 provider components in correct nesting order |

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useLocalStorage.ts` | Replace empty stub with full hook implementation |
| `src/hooks/useDebounce.ts` | Replace empty stub with full hook implementation |
| `src/hooks/useClickOutside.ts` | Replace empty stub with full hook implementation |
| `src/hooks/useFocusTrap.ts` | Replace empty stub with full hook implementation |
| `src/context/ThemeContext.tsx` | Replace empty stub with full provider implementation |
| `src/context/SidebarContext.tsx` | Replace empty stub with full provider implementation |
| `src/context/ToastContext.tsx` | Replace empty stub with full provider implementation |
| `src/context/DataContext.tsx` | Replace empty stub with full provider implementation |

### Code Patterns to Follow
From `SPEC/HOW.md` (described in prose):

- **Pattern 1 (Context + useReducer)**: DataContext follows this exactly. State interface defines the shape, discriminated union type defines actions, pure reducer function handles state transitions with immutable updates, Provider component creates reducer and wraps children, custom hook accesses context with null guard.
- **Pattern 4 (localStorage sync hook)**: useLocalStorage implements this directly. Generic type parameter for flexibility, lazy useState initializer reads from localStorage, setter function writes to localStorage synchronously (or in the existing implementation, via useEffect). Try/catch around all localStorage operations.
- **Pattern 7 (Focus Management)**: useFocusTrap follows this. Ref-based container identification, query focusable elements by selector, keydown listener for Tab wrapping, cleanup on deactivation.

### Integration Points
- useLocalStorage is consumed by ThemeContext (key: 'theme') and SidebarContext (key: 'sidebar-collapsed')
- DataContext imports types from `src/types/index.ts` (Project, Task, TeamMember)
- DataContext imports mock data from `src/data/mockData.ts` as initialization fallback
- App.tsx imports all 4 Provider components from their context files
- All contexts export custom hooks (useTheme, useSidebar, useToast, useData) for downstream component consumption

---

## Testing Strategy

### Smoke Test
- App loads without console errors after provider wiring
- TypeScript compilation passes with strict mode (npx tsc --noEmit)
- Production build succeeds (npm run build)

### Functional Tests
- ThemeContext: Theme value is accessible, setTheme changes value, localStorage stores preference, system mode reads OS preference, dark class toggles on document element
- SidebarContext: isCollapsed starts false, toggle flips value, localStorage persists state
- ToastContext: showToast adds toast to queue, toast auto-removes after 3 seconds, removeToast immediately removes by ID
- DataContext: state.projects/tasks/team populated from mock data, dispatch ADD_PROJECT adds project, UPDATE_PROJECT modifies project, DELETE_PROJECT removes project, ADD_TASK/UPDATE_TASK/DELETE_TASK work similarly, MOVE_TASK changes task status, state syncs to localStorage on every dispatch
- useLocalStorage: Returns initial value on first call, setValue updates state and localStorage, persists across re-reads
- useClickOutside: Calls handler when clicking outside ref element, does not call handler when clicking inside
- useFocusTrap: Tab from last element wraps to first, Shift+Tab from first wraps to last, first element focused on activation
- useDebounce: Returns initial value immediately, returns updated value after delay, properly cancels on rapid updates

### Regression Check
- Existing page routes still render (Dashboard, Projects, Tasks, Team, Settings)
- No TypeScript errors introduced in existing files
- Development server starts without warnings

---

## Considerations

### Potential Pitfalls
- **React StrictMode double-mount**: Effects will fire twice in development. Cleanup functions must be correct to avoid duplicate event listeners. The existing implementation handles this via proper cleanup returns in all useEffect hooks.
- **localStorage unavailable**: In private browsing or when storage is full, localStorage operations can throw. All operations are wrapped in try/catch with console.warn fallbacks.
- **Corrupted localStorage data**: If stored JSON is malformed, JSON.parse will throw. The try/catch in getInitialState and useLocalStorage gracefully falls back to initial/mock values.
- **noUnusedLocals strict checking**: TypeScript config has noUnusedLocals: true. All imported values must be used; no dead code allowed.

### Edge Cases
- **Media query listener cleanup**: When theme changes from 'system' to 'light'/'dark', the matchMedia listener must be removed. The useEffect cleanup handles this.
- **Toast ID uniqueness**: Using Date.now() + Math.random() for toast IDs. Extremely unlikely collision but sufficient for notification use case.
- **Empty focusable elements**: useFocusTrap handles the case where container has no focusable elements (optional chaining on firstElement/lastElement focus calls).
- **DataContext initial state race**: getInitialState is called synchronously during useReducer initialization, before any effects run. This ensures data is available on first render without loading states.

### Current Implementation Status
Task 3 build attempt 1 passed all checks. All 9 files are implemented and the application builds successfully (168.65 kB / 54.38 kB gzipped). The implementation is complete and ready for UI component consumption in subsequent tasks.

---

```json
{
  "task": "3",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/CURRENT_STATE.md",
    "ai-docs/SPEC/PROMPT.md",
    "ai-docs/TASKS/3/research.md",
    "ai-docs/TASKS/3/build_attempt_1.md",
    "ai-docs/TASKS/3/build_attempt_1_handoff.json",
    "ai-docs/TASKS/3/test-results.md",
    "src/App.tsx",
    "src/main.tsx",
    "src/types/index.ts",
    "src/data/mockData.ts",
    "src/hooks/useLocalStorage.ts",
    "src/hooks/useDebounce.ts",
    "src/hooks/useClickOutside.ts",
    "src/hooks/useFocusTrap.ts",
    "src/context/ThemeContext.tsx",
    "src/context/SidebarContext.tsx",
    "src/context/ToastContext.tsx",
    "src/context/DataContext.tsx",
    "package.json",
    "tsconfig.json",
    "tailwind.config.js",
    "vite.config.ts"
  ],
  "planSummary": "Task 3 is already fully implemented (build attempt 1 passed). All 4 custom hooks (useLocalStorage, useDebounce, useClickOutside, useFocusTrap) and 4 context providers (Theme, Sidebar, Toast, Data) are complete with App.tsx provider hierarchy wired. Implementation follows HOW.md Patterns 1, 4, and 7. Bottom-up build order: hooks first, then contexts, then App.tsx wiring. All acceptance criteria verified, TypeScript strict mode compliant, production build successful.",
  "scope": {
    "level": "major",
    "rationale": "Cross-cutting state management foundation touching 9 files across 3 directories (hooks, context, root). Establishes architectural patterns (Context+useReducer, localStorage sync, focus management) consumed by all subsequent UI tasks. Already successfully implemented in build attempt 1."
  }
}
```