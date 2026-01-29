# Architecture

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Browser (ES2020+) | Modern SPA, no server-side rendering needed |
| Framework | React 18 + TypeScript | Constitution mandates React 18 + TS, strict mode for type safety |
| Build Tool | Vite | Constitution constraint, fast HMR, optimized production builds |
| Styling | Tailwind CSS | Constitution constraint, utility-first enables rapid UI development |
| Routing | React Router v6 | Industry standard for React SPAs, declarative routing |
| State | React Context + useState/useReducer | Constitution prohibits external state management |
| Charts | Recharts | Constitution constraint for data visualization |
| Icons | Lucide React | Constitution constraint, consistent icon library |
| Storage | localStorage | Constitution constraint, no backend/API |
| Testing | Playwright | Constitution mandates E2E testing for critical flows |

## File Structure

```
project/
├── index.html                    # Vite entry point
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript strict configuration
├── tailwind.config.js            # Tailwind theme customization
├── postcss.config.js             # PostCSS for Tailwind
├── vite.config.ts                # Vite configuration
├── playwright.config.ts          # E2E test configuration
│
├── public/
│   └── favicon.svg               # App icon
│
├── src/
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component with providers
│   ├── index.css                 # Tailwind imports + global styles
│   │
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces/types
│   │
│   ├── data/
│   │   └── mockData.ts           # Static mock data (projects, tasks, team, activities)
│   │
│   ├── context/
│   │   ├── ThemeContext.tsx      # Dark/light mode state
│   │   ├── SidebarContext.tsx    # Sidebar collapsed state
│   │   ├── ToastContext.tsx      # Toast notification state
│   │   └── DataContext.tsx       # App data state (projects, tasks, team)
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.ts    # localStorage sync hook
│   │   ├── useClickOutside.ts    # Click outside detection
│   │   ├── useFocusTrap.ts       # Modal/panel focus trap
│   │   └── useDebounce.ts        # Debounced value hook
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Main layout wrapper
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── Header.tsx        # Top header bar
│   │   │   └── MobileNav.tsx     # Mobile hamburger overlay
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx        # Button variants (primary, secondary, outline, ghost)
│   │   │   ├── Card.tsx          # Card container component
│   │   │   ├── Badge.tsx         # Status/priority badges
│   │   │   ├── Input.tsx         # Form input with label/error
│   │   │   ├── Select.tsx        # Dropdown select component
│   │   │   ├── Toggle.tsx        # Toggle switch component
│   │   │   ├── Modal.tsx         # Modal dialog component
│   │   │   ├── SlideOver.tsx     # Slide-over panel component
│   │   │   ├── Toast.tsx         # Toast notification component
│   │   │   ├── Avatar.tsx        # User avatar component
│   │   │   ├── ProgressBar.tsx   # Progress indicator
│   │   │   └── Dropdown.tsx      # Dropdown menu component
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx      # Metric stat card
│   │   │   ├── LineChart.tsx     # Task completion line chart
│   │   │   ├── PieChart.tsx      # Task status pie chart
│   │   │   └── ActivityFeed.tsx  # Recent activity list
│   │   │
│   │   ├── projects/
│   │   │   ├── ProjectsTable.tsx # Projects data table
│   │   │   ├── ProjectRow.tsx    # Single project row
│   │   │   ├── ProjectModal.tsx  # Create/edit project modal
│   │   │   ├── ProjectFilters.tsx# Search and filter controls
│   │   │   └── Pagination.tsx    # Table pagination controls
│   │   │
│   │   ├── tasks/
│   │   │   ├── KanbanBoard.tsx   # Kanban container
│   │   │   ├── KanbanColumn.tsx  # Single column (To Do/In Progress/Done)
│   │   │   ├── TaskCard.tsx      # Draggable task card
│   │   │   ├── TaskForm.tsx      # Add/edit task form
│   │   │   └── TaskPanel.tsx     # Task detail slide-over
│   │   │
│   │   ├── team/
│   │   │   ├── TeamGrid.tsx      # Team members grid
│   │   │   ├── MemberCard.tsx    # Team member card
│   │   │   ├── TeamFilters.tsx   # Search and role filter
│   │   │   └── InviteModal.tsx   # Invite member modal
│   │   │
│   │   └── settings/
│   │       ├── ProfileSection.tsx    # Profile settings
│   │       ├── NotificationsSection.tsx # Notification toggles
│   │       └── AppearanceSection.tsx # Theme and accent color
│   │
│   └── pages/
│       ├── Dashboard.tsx         # Dashboard overview page
│       ├── Projects.tsx          # Projects list page
│       ├── Tasks.tsx             # Kanban board page
│       ├── Team.tsx              # Team members page
│       └── Settings.tsx          # Settings page
│
└── tests/
    └── e2e/
        ├── navigation.spec.ts    # Sidebar navigation tests
        ├── theme.spec.ts         # Dark mode toggle tests
        ├── projects.spec.ts      # Projects CRUD tests
        ├── kanban.spec.ts        # Drag and drop tests
        ├── team.spec.ts          # Team filtering tests
        ├── settings.spec.ts      # Settings persistence tests
        └── mobile.spec.ts        # Mobile responsive tests
```

## Design Patterns

### Pattern 1: Context + useReducer for Domain State

- **When to use**: Managing app-wide state (projects, tasks, team members)
- **Implementation**: Create context with reducer for complex state updates, expose actions via context value
- **Example**:

```typescript
// context/DataContext.tsx
interface DataState {
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
}

type DataAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newStatus: TaskStatus } };

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, status: action.payload.newStatus }
            : task
        ),
      };
    // ... other cases
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Sync to localStorage on state change
  useEffect(() => {
    localStorage.setItem('appData', JSON.stringify(state));
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}
```

### Pattern 2: Compound Components for Complex UI

- **When to use**: Modal, Dropdown, and SlideOver components with multiple parts
- **Implementation**: Parent component provides context, children consume it
- **Example**:

```typescript
// components/ui/Modal.tsx
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function Modal({ isOpen, onClose, children }: ModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div className="fixed inset-0 bg-black/50" onClick={handleBackdropClick}>
        <div className="modal-content">{children}</div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
  const { onClose } = useContext(ModalContext)!;
  return (
    <div className="flex justify-between items-center p-4 border-b">
      {children}
      <button onClick={onClose} aria-label="Close modal">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

Modal.Body = function ModalBody({ children }) { /* ... */ };
Modal.Footer = function ModalFooter({ children }) { /* ... */ };
```

### Pattern 3: HTML5 Native Drag and Drop

- **When to use**: Kanban board task movement between columns
- **Implementation**: Use native dragstart, dragover, drop events with data transfer
- **Example**:

```typescript
// components/tasks/TaskCard.tsx
function TaskCard({ task }: { task: Task }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* card content */}
    </div>
  );
}

// components/tasks/KanbanColumn.tsx
function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { dispatch } = useData();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus: status } });
    setIsDragOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={isDragOver ? 'ring-2 ring-blue-500' : ''}
    >
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

### Pattern 4: Custom Hook for localStorage Sync

- **When to use**: Persisting state (theme, sidebar, settings) across sessions
- **Implementation**: useState wrapper that syncs to localStorage
- **Example**:

```typescript
// hooks/useLocalStorage.ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue];
}
```

### Pattern 5: Render Props for Table Sorting/Filtering

- **When to use**: Projects table with sort and filter logic
- **Implementation**: Separate data logic from UI, pass filtered/sorted data to children
- **Example**:

```typescript
// components/projects/ProjectsTable.tsx
interface UseProjectTableOptions {
  projects: Project[];
  pageSize: number;
}

function useProjectTable({ projects, pageSize }: UseProjectTableOptions) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Project>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() =>
    projects.filter(p =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [projects, debouncedSearch]
  );

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const cmp = a[sortKey] < b[sortKey] ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    }),
    [filtered, sortKey, sortDir]
  );

  const paginated = useMemo(() =>
    sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  );

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  return {
    data: paginated,
    totalCount: filtered.length,
    search, setSearch,
    sortKey, sortDir, toggleSort: (key: keyof Project) => { /* ... */ },
    page, setPage,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}
```

### Pattern 6: Component Variants with cva (class-variance-authority pattern)

- **When to use**: UI components with multiple variants (Button, Badge, etc.)
- **Implementation**: Tailwind class composition using template literals or utility function
- **Example**:

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-600',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

### Pattern 7: Accessible Focus Management

- **When to use**: Modals, slide-over panels, dropdown menus
- **Implementation**: useFocusTrap hook + keyboard event handlers
- **Example**:

```typescript
// hooks/useFocusTrap.ts
function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = containerRef.current.querySelectorAll(focusableSelector);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on open
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
```

## Conventions

### Naming

- **Files**: PascalCase for components (`Button.tsx`, `TaskCard.tsx`), camelCase for hooks/utils (`useLocalStorage.ts`)
- **Components**: PascalCase, match filename (`export function Button`)
- **Hooks**: camelCase with `use` prefix (`useLocalStorage`, `useDebounce`)
- **Types/Interfaces**: PascalCase, suffix Props for component props (`ButtonProps`, `Task`, `Project`)
- **Context**: PascalCase with Context suffix (`ThemeContext`, `DataContext`)
- **CSS Classes**: Tailwind utilities only, no custom class names except in index.css

### TypeScript

- **Strict mode enabled**: No implicit any, strict null checks
- **Explicit return types**: All exported functions have explicit return types
- **Interface over type**: Use `interface` for object shapes, `type` for unions/primitives
- **Props interface**: Each component has a named `[Component]Props` interface
- **No enums**: Use `as const` objects or union types instead

```typescript
// Prefer
const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;
type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

// Avoid
enum TaskStatus { TODO, IN_PROGRESS, DONE }
```

### Component Structure

Each component file follows this order:
1. Imports (React, third-party, local)
2. Types/interfaces
3. Constants (if any)
4. Component function
5. Sub-components (if compound pattern)
6. Default export (only if needed for lazy loading)

```typescript
// 1. Imports
import { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../../context/DataContext';

// 2. Types
interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

// 3. Constants
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
} as const;

// 4. Component
export function TaskCard({ task, onSelect }: TaskCardProps): JSX.Element {
  // hooks first
  const [isDragging, setIsDragging] = useState(false);

  // handlers
  const handleClick = () => onSelect(task);

  // render
  return (/* ... */);
}
```

### Tailwind Conventions

- **Mobile-first**: Start with mobile styles, add responsive prefixes (`md:`, `lg:`)
- **Dark mode**: Use `dark:` prefix for all color utilities
- **Spacing**: Use consistent scale (4, 8, 12, 16, 24, 32, 48)
- **Colors**: Use semantic naming via theme extension where possible
- **Transitions**: Standard duration `transition-all duration-200`

```typescript
// Example responsive + dark mode styling
<div className="p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
```

### State Management Rules

1. **Local state first**: Use `useState` for component-local state
2. **Lift when shared**: Lift to nearest common ancestor when 2+ components need same state
3. **Context for global**: Use Context only for truly global state (theme, auth, app data)
4. **Reducer for complex**: Use `useReducer` when state has multiple sub-values or complex update logic

### File Organization Rules

1. **One component per file**: Exception for tightly coupled sub-components
2. **Co-locate related files**: Keep component, its types, and tests together
3. **Index files only for re-exports**: No logic in index.ts files
4. **Hooks in /hooks**: Even component-specific hooks go in /hooks for discoverability

## Integration Points

### Data Flow

```
localStorage <-> DataContext <-> Components
                     |
                     v
              useReducer (state updates)
                     |
                     v
              dispatch(action) <-- User interactions
```

### Theme System

```
ThemeContext (light/dark/system)
      |
      v
document.documentElement.classList (add/remove 'dark')
      |
      v
Tailwind dark: variants activate automatically
```

### Toast Notifications

```
Component calls showToast(message, type)
      |
      v
ToastContext adds toast to queue
      |
      v
Toast component renders with animation
      |
      v
Auto-dismiss after 3s OR manual close
```

### Routing

```
App.tsx
  └── BrowserRouter
        └── Routes
              ├── / -> Dashboard
              ├── /projects -> Projects
              ├── /tasks -> Tasks (Kanban)
              ├── /team -> Team
              └── /settings -> Settings
```

### Modal/Panel System

```
Parent component owns isOpen state
      |
      v
Renders Modal/SlideOver with isOpen + onClose props
      |
      v
Portal renders to document.body
      |
      v
Focus trap activates, Escape key bound
      |
      v
onClose called -> Parent updates state -> Unmount
```

## Anti-Patterns (Avoid)

### No Any Types
```typescript
// BAD
function handleData(data: any) { ... }

// GOOD
function handleData(data: Project) { ... }
```

### No Prop Drilling Past 2 Levels
```typescript
// BAD - drilling theme through 4 components
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <NavItem theme={theme} />
    </Sidebar>
  </Layout>
</App>

// GOOD - use context
<ThemeProvider>
  <App>
    <Layout>
      <Sidebar>
        <NavItem /> // calls useTheme() internally
      </Sidebar>
    </Layout>
  </App>
</ThemeProvider>
```

### No Direct DOM Manipulation
```typescript
// BAD
document.getElementById('modal').style.display = 'block';

// GOOD
const [isOpen, setIsOpen] = useState(false);
return isOpen ? <Modal /> : null;
```

### No Inline Object/Array Creation in JSX
```typescript
// BAD - creates new object every render
<Button style={{ marginTop: 10 }} />

// GOOD - use Tailwind or extract constant
<Button className="mt-2" />
```

### No useEffect for Derived State
```typescript
// BAD
const [count, setCount] = useState(0);
const [doubled, setDoubled] = useState(0);
useEffect(() => {
  setDoubled(count * 2);
}, [count]);

// GOOD - compute during render
const [count, setCount] = useState(0);
const doubled = count * 2;
```

### No Business Logic in Components
```typescript
// BAD - complex filtering logic in component
function ProjectList() {
  const filtered = projects
    .filter(p => p.status === status)
    .filter(p => p.name.includes(search))
    .sort((a, b) => /* complex sort */);
  ...
}

// GOOD - extract to custom hook
function ProjectList() {
  const { data, setSearch, toggleSort } = useProjectTable({ projects });
  ...
}
```

### No Missing Loading/Error States
```typescript
// BAD - assumes data always exists
return <div>{data.name}</div>;

// GOOD - handle all states
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <div>{data.name}</div>;
```

## Performance Considerations

1. **Memoize expensive computations**: Use `useMemo` for filtering/sorting large lists
2. **Memoize callbacks for child components**: Use `useCallback` when passing to memoized children
3. **Lazy load pages**: Use `React.lazy()` for route-based code splitting
4. **Virtualize long lists**: If lists exceed 100 items, consider virtualization
5. **Debounce search inputs**: 300ms debounce on search/filter inputs
6. **Avoid layout thrashing**: Batch DOM reads/writes in drag handlers

## Accessibility Requirements

1. **Semantic HTML**: Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<button>`, `<table>`
2. **Keyboard navigation**: All interactive elements reachable via Tab, activatable via Enter/Space
3. **Focus visible**: All focusable elements have visible focus ring (`focus:ring-2`)
4. **ARIA labels**: Icons-only buttons have `aria-label`, modals have `aria-modal="true"`
5. **Color contrast**: Ensure 4.5:1 contrast ratio for text
6. **Motion preferences**: Respect `prefers-reduced-motion` for animations
