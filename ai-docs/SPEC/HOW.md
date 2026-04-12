# Architecture

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Browser (ES6+) | Aligns with "Zero dependencies" principle; no server required |
| Framework | Vanilla JavaScript | No frameworks per constitution; instant load, no build step |
| Styling | Plain CSS | No build tools, single file, easy to customize |
| Storage | In-Memory Only | Per constitution: "Memory-only storage", fresh start on reload |
| Testing | Playwright MCP | E2E validation for user stories |

## File Structure

```
todo-list-v1/
├── index.html      # Single HTML entry with embedded CSS/JS
└── tests/
    └── e2e/        # Playwright end-to-end tests
        ├── playwright.config.js
        └── todo.spec.js
```

> **Note**: For v1, all code resides in `index.html` per "Single-file deployability" principle. CSS is in `<style>` block, JS in `<script>` block.

## Design Patterns

### Pattern 1: IIFE Module
- **When to use**: Encapsulating all application logic without polluting global namespace
- **Implementation**: Wrap code in Immediately Invoked Function Expression
- **Example**:
```javascript
(function() {
  'use strict';
  
  // State
  let todos = [];
  let nextId = 1;
  
  // DOM references
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  
  // ... functions
})();
```

### Pattern 2: State-Driven Rendering
- **When to use**: Keeping UI in sync with data changes
- **Implementation**: Modify state first, then call render() to rebuild UI
- **Example**:
```javascript
function addTodo(text) {
  todos.unshift({ id: nextId++, text, completed: false });
  render();
}

function render() {
  list.innerHTML = todos.map(todo => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}">
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <span>${escapeHtml(todo.text)}</span>
      <button class="delete">×</button>
    </li>
  `).join('');
}
```

### Pattern 3: Event Delegation
- **When to use**: Handling events on dynamically created elements
- **Implementation**: Single listener on parent, check event.target
- **Example**:
```javascript
list.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  
  const id = Number(item.dataset.id);
  
  if (e.target.matches('input[type="checkbox"]')) {
    toggleTodo(id);
  } else if (e.target.matches('.delete')) {
    deleteTodo(id);
  }
});
```

### Pattern 4: Progressive Enhancement (Accessibility)
- **When to use**: Ensuring keyboard and screen reader support
- **Implementation**: Semantic HTML first, enhance with JS
- **Example**:
```html
<!-- Base is functional without JS -->
<form id="todo-form">
  <input type="text" 
         id="todo-input" 
         placeholder="Add a todo..."
         aria-label="New todo text"
         required>
  <button type="submit" aria-label="Add todo">Add</button>
</form>
<ul id="todo-list" role="list" aria-label="Todo items">
  <!-- Items with proper ARIA states -->
</ul>
```

## Conventions

### Naming
- **Files**: lowercase, hyphenated (`index.html`)
- **Functions**: camelCase (`addTodo`, `toggleTodo`, `render`)
- **Variables**: camelCase (`todos`, `nextId`, `input`)
- **CSS classes**: kebab-case (`todo-item`, `delete-btn`, `is-completed`)
- **IDs**: camelCase (`todoInput`, `todoList`)
- **Data attributes**: kebab-case (`data-id`, `data-completed`)

### Code Organization (within single file)
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Meta, title, inline CSS -->
  <style>
    /* CSS organized: reset → layout → components → states */
  </style>
</head>
<body>
  <!-- Semantic HTML structure -->
  
  <script>
    // JS organized:
    // 1. Configuration/constants
    // 2. State variables
    // 3. DOM element references
    // 4. Core functions (add, toggle, delete)
    // 5. Render function
    // 6. Event listeners
    // 7. Initialization
    
    (function() {
      'use strict';
      // ... all code
    })();
  </script>
</body>
</html>
```

### CSS Conventions
- Use CSS custom properties for theme values (colors, spacing)
- Mobile-first responsive design
- Focus visible styles for keyboard navigation
- No animations beyond basic transitions

## Integration Points

### Data Flow
```
User Input → Event Handler → State Update → Render → DOM Update
                ↓
         (No persistence - memory only)
```

### Component Relationships
```
index.html
├── <header> - App title
├── <main>
│   ├── <form> - Input + Add button
│   └── <ul> - Todo list container
│       └── <li> × N - Todo items (dynamic)
│           ├── <input type="checkbox"> - Complete toggle
│           ├── <span> - Todo text
│           └── <button> - Delete
└── <script> - Application logic
```

## Anti-Patterns (Avoid)

| Anti-Pattern | Why Avoid | Alternative |
|--------------|-----------|-------------|
| localStorage persistence | Violates "Memory-only storage" principle | In-memory arrays only |
| External CDN dependencies | Violates "Zero dependencies" principle | Inline everything |
| Direct DOM mutation without state | Causes sync bugs, hard to test | State → Render pattern |
| Inline event handlers (`onclick=""`) | Hard to maintain, mixes concerns | addEventListener |
| Global variables | Namespace pollution, collision risk | IIFE encapsulation |
| Complex build tools | Violates "No build step" principle | Direct file open |
| Framework usage (React, Vue, etc.) | Violates "Zero dependencies" principle | Vanilla JS |
| Animations beyond CSS transitions | Violates constitution simplicity | Simple CSS transitions only |

## Testing Strategy

### Manual Testing Checklist
- [ ] Page loads instantly (no spinners, no delays)
- [ ] Input focused on load
- [ ] Add via button click
- [ ] Add via Enter key
- [ ] Empty input blocked
- [ ] Checkbox toggles completion
- [ ] Strikethrough appears on complete
- [ ] Delete removes immediately
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Works offline (airplane mode)

### E2E Testing (Playwright)
```javascript
// Core test patterns
test('adds todo', async ({ page }) => {
  await page.goto('file://' + path.resolve('index.html'));
  await page.fill('[aria-label="New todo text"]', 'Test todo');
  await page.click('text=Add');
  await expect(page.locator('text=Test todo')).toBeVisible();
});
```

## Performance Budgets

| Metric | Target | Max |
|--------|--------|-----|
| HTML file size | < 15KB | 50KB |
| First Paint | < 50ms | 100ms |
| Interaction response | < 16ms | 50ms |
| Total blocking time | 0ms | 0ms |

## Accessibility Requirements

- Semantic HTML5 elements (`<header>`, `<main>`, `<form>`, `<ul>`, `<li>`)
- ARIA labels on all interactive elements
- Keyboard operability (Tab, Enter, Space)
- Focus management (visible focus rings)
- Screen reader announcements for dynamic content
- Sufficient color contrast (WCAG AA)

---

## Handoff Notes

This architecture supports the 5 user stories defined in WHY_WHAT:
1. **Add New Todo** - Form submission with validation
2. **Mark Complete** - Checkbox toggle with visual feedback
3. **Delete Todo** - Immediate removal via delegated click
4. **View List** - State-driven render with empty state
5. **Keyboard Accessibility** - Native form behavior + focus management

Ready for WHEN agent to implement.
