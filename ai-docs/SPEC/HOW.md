# Architecture

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js >= 18 | Required for native `node:test` module support |
| Language | Vanilla JavaScript (ES Modules) | Zero transpilation, maximum simplicity |
| Package Manager | npm | Bundled with Node.js, sole build/run tool per CONSTITUTION |
| Testing | `node:test` (built-in) | Native testing module, zero external dependencies |
| Dependencies | None | Absolute minimalism principle - zero npm packages |

## File Structure

```
harness-v2-test/          # Repository root
├── hello.js              # Single source file with hello() function
├── hello.test.js         # Single test file using node:test
├── package.json          # Minimal config with test script only
├── projects/             # (Existing - unrelated to this implementation)
├── ai-docs/              # (Existing - spec documentation)
└── ...                   # (Other existing repo files)
```

### File Purposes

| File | Purpose | Size Expectation |
|------|---------|------------------|
| `hello.js` | Export pure `hello(name)` function | ~3-5 lines |
| `hello.test.js` | Validate hello() output with node:test | ~8-12 lines |
| `package.json` | Define `npm test` script | ~6-8 lines |

## Design Patterns

### Pattern 1: Pure Function Export

- **When to use**: All source module implementations
- **Implementation**: Single named export, no side effects, no state
- **Example**:
```javascript
// hello.js
export function hello(name) {
  return `Hello, ${name}!`;
}
```

### Pattern 2: Native Test Module

- **When to use**: All test files
- **Implementation**: Use `node:test` built-in module with `assert`
- **Example**:
```javascript
// hello.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { hello } from './hello.js';

test('hello returns greeting', () => {
  assert.strictEqual(hello('world'), 'Hello, world!');
});
```

### Pattern 3: Minimal Package Config

- **When to use**: Package.json structure
- **Implementation**: Only required fields, no dependencies
- **Example**:
```json
{
  "name": "hello-world-smoke-test",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

## Conventions

### Naming

- Files: lowercase, dot-separated for test suffix (`hello.js`, `hello.test.js`)
- Functions: camelCase (`hello`)
- Test descriptions: Present tense, behavior-focused ("returns greeting")

### Code Organization

- One function per file (this project has only one function)
- Test file mirrors source file name with `.test.js` suffix
- All files at repository root (flat structure)

### Module System

- ES Modules (`"type": "module"` in package.json)
- Named exports only (no default exports)
- Relative imports with `.js` extension

### Testing

- Use `node:test` for test runner
- Use `node:assert` for assertions
- One test case minimum, covering happy path
- Test file discoverable via `node --test` glob

## Integration Points

### npm → Node.js Test Runner

```
npm test
  └── node --test
        └── discovers hello.test.js
              └── imports hello.js
                    └── runs assertions
                          └── exit code 0 (success) or 1 (failure)
```

### Harness Integration

The v2.2 generic harness shell-out runner validates via:
1. `npm install` (no-op, zero dependencies)
2. `npm test` → exit code 0

## Anti-Patterns (Avoid)

| Anti-Pattern | Why to Avoid | Do Instead |
|--------------|--------------|------------|
| External test frameworks (Jest, Mocha) | Violates zero-dependency principle | Use `node:test` |
| Console.log in hello() | Side effect, breaks pure function principle | Return string only |
| Default exports | Less explicit, harder to tree-shake | Named exports |
| TypeScript | Requires transpilation, adds complexity | Vanilla JavaScript |
| Multiple source files | Over-engineering for single function | Single hello.js |
| Config files (tsconfig, eslint, etc.) | Unnecessary for smoke test | Only package.json |
| CLI argument parsing | Out of scope per CONSTITUTION | Return value only |

## Technical Notes

### Node.js Version Requirement

Node.js 18+ is required because:
- `node:test` module was added in Node.js 18.0.0
- The `--test` flag for auto-discovery was stabilized in Node.js 18

### ES Module Configuration

Setting `"type": "module"` in package.json enables:
- `import`/`export` syntax without `.mjs` extension
- Top-level await (not used here, but available)
- Stricter mode by default

### Test Discovery

`node --test` without arguments:
- Recursively finds files matching `**/*.test.js` and `**/*.test.mjs`
- Also matches `**/*_test.js` and `**/test-*.js`
- Runs all discovered tests and reports aggregate results
