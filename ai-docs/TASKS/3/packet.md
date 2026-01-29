# Task 3: Core context providers and custom hooks

## Goal
Implement all React Context providers for global state management (theme, sidebar, toast notifications, app data) plus essential custom hooks (useLocalStorage, useClickOutside, useFocusTrap, useDebounce). These provide the state management foundation for the entire application.

## Acceptance Criteria
- [ ] ThemeContext provides theme state (light/dark/system) with toggle function
- [ ] Theme persists to localStorage and loads on app initialization
- [ ] System theme option respects OS prefers-color-scheme preference
- [ ] SidebarContext provides collapsed state with toggle function
- [ ] Sidebar collapsed state persists to localStorage
- [ ] ToastContext provides showToast function accepting message, type (success/error/info)
- [ ] ToastContext manages toast queue with auto-dismiss after 3 seconds
- [ ] DataContext provides projects, tasks, team data with useReducer
- [ ] DataContext actions: ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, ADD_TASK, UPDATE_TASK, DELETE_TASK, MOVE_TASK
- [ ] DataContext syncs state to localStorage on every change
- [ ] useLocalStorage hook provides useState-like API with localStorage sync
- [ ] useClickOutside hook detects clicks outside a ref element
- [ ] useFocusTrap hook traps focus within modal/panel when active
- [ ] useDebounce hook returns debounced value with configurable delay
- [ ] All contexts wrapped in App.tsx providers hierarchy

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
