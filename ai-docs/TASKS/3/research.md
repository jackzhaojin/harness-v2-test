The research document has been written to `/Users/jackjin/dev/harness-v2-test/ai-docs/TASKS/3/research.md`. Here's a summary:

## Research Summary: Task 3 - Core Context Providers and Custom Hooks

**Scope**: Major — 9 files to implement (4 hooks, 4 contexts, App.tsx wiring), establishing the state management foundation for the entire application.

**Current State**: All 8 target files (4 contexts + 4 hooks) exist as empty stubs with placeholder comments (`// X will be implemented here\nexport {};`). App.tsx has BrowserRouter/Routes but no provider wrapping. Types and mock data are fully implemented from Task 2.

**Implementation Plan** (bottom-up build order):
1. **4 Custom Hooks** — `useLocalStorage` (foundation, consumed by ThemeContext/SidebarContext), `useDebounce`, `useClickOutside`, `useFocusTrap`
2. **4 Context Providers** — `ThemeContext` (light/dark/system with OS detection + document.documentElement class toggle), `SidebarContext` (collapsed boolean with persistence), `ToastContext` (queue with auto-dismiss after 3s), `DataContext` (useReducer with 7 typed actions + localStorage sync)
3. **App.tsx Wiring** — Wrap existing routes with provider hierarchy: Theme > Sidebar > Toast > Data > BrowserRouter

**Key Design Decisions**:
- HOW.md provides complete patterns for all implementations (Patterns 1, 4, 7)
- Each context exports: context object, Provider component, and custom `useX` hook with guard
- ThemeContext uses `matchMedia('(prefers-color-scheme: dark)')` for system theme detection
- DataContext initializes from localStorage, falls back to mock data imports
- All localStorage operations wrapped in try/catch for graceful degradation
- TypeScript strict mode compliance (no `any`, explicit returns, no unused vars)

**Pitfalls Identified**: React StrictMode double-mount, localStorage unavailability in private browsing, media query listener cleanup, noUnusedLocals strict checking, corrupted localStorage fallback handling.