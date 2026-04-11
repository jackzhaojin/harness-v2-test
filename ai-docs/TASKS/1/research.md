Confirmed - there is no hello.js, hello.test.js, or package.json at the repository root. Now I have all the information needed to write the research document.

# Research: Task 1 - Implement hello function with test suite and package config

**Task ID**: 1
**Researched**: 2026-04-11
**Dependencies**: None
**Estimated Complexity**: Small

---

## Relevant Project Context

**Project Type**: Node.js hello-world smoke test (greenfield implementation at repo root)

**Key Files**:
- `ai-docs/SPEC/HOW.md` - Architecture patterns and file structure (lines 15-27, 36-75)
- `ai-docs/SPEC/WHY_WHAT.md` - Requirements and acceptance criteria
- `ai-docs/SPEC/CONSTITUTION.md` - Immutable principles (zero dependencies, pure functions)

**Patterns in Use**:
- **Pattern 1: Pure Function Export** - Single named export, no side effects (HOW.md lines 36-45)
- **Pattern 2: Native Test Module** - Use node:test and node:assert (HOW.md lines 47-61)
- **Pattern 3: Minimal Package Config** - Only required fields, no dependencies (HOW.md lines 63-75)

**Relevant Prior Tasks**: None - this is the first task in a greenfield implementation.

---

## Functional Requirements

### Primary Objective
Create a minimal Node.js hello-world smoke test consisting of exactly three files at the repository root. This validates the v2.2 generic harness shell-out runner with the simplest possible implementation. The smoke test establishes baseline confidence that the harness can execute Node.js projects correctly before tackling complex builds.

### Acceptance Criteria
From task packet - restated for clarity:

1. **hello.js exists**: File must be at repository root with a named export called `hello`
2. **Pure function behavior**: `hello('world')` returns exactly `'Hello, world!'` and `hello('Alice')` returns `'Hello, Alice!'` - no console output or side effects
3. **hello.test.js exists**: File at repository root using node:test module (built-in, no external frameworks)
4. **Test coverage**: Test imports hello from ./hello.js and asserts `hello('world') === 'Hello, world!'`
5. **Test execution**: Running `node --test hello.test.js` exits with code 0
6. **package.json config**: Valid JSON with `"type": "module"` and `scripts.test` set to `"node --test"`
7. **npm test passes**: Running `npm test` exits with code 0
8. **Zero dependencies**: No dependencies or devDependencies entries in package.json

### Scope Boundaries

**In Scope**:
- Create hello.js with pure hello(name) function
- Create hello.test.js with node:test assertions
- Create package.json with minimal configuration
- Verify npm test passes

**Out of Scope**:
- CLI argument parsing or interactive features
- Multiple functions or modules
- TypeScript or transpilation
- Code coverage or linting
- Any external npm dependencies
- Documentation files
- Error handling beyond basic operation

---

## Technical Approach

### Implementation Strategy

The implementation follows a straightforward three-file approach as defined in HOW.md. All files are created at the repository root (not in a subdirectory like projects/).

**Step 1: Create hello.js**
Create a single ES Module file that exports a named function `hello`. The function takes a name parameter and returns a formatted greeting string. The function must be pure - no console.log, no state mutation, no side effects.

**Step 2: Create hello.test.js**
Create a test file using Node.js built-in `node:test` module. Import the `test` function from `node:test`, `assert` from `node:assert`, and the `hello` function from `./hello.js`. Write a test case that validates the hello function returns the expected greeting format.

**Step 3: Create package.json**
Create a minimal package.json with only required fields: name, type (set to "module" for ES Module support), and scripts.test (set to "node --test"). No dependencies or devDependencies blocks should be present.

### Files to Modify
| File | Changes |
|------| --------|
| None | No existing files need modification |

### Files to Create
| File | Purpose |
|------|---------|
| `hello.js` | Export pure hello(name) function returning greeting string |
| `hello.test.js` | Test file using node:test to validate hello function |
| `package.json` | Minimal config with ES Module type and test script |

### Code Patterns to Follow

From `SPEC/HOW.md`:

**Pure Function Export Pattern (HOW.md lines 36-45)**:
- Single named export using ES Module syntax
- Function takes name parameter, returns template string with greeting
- No side effects, no console output, no state

**Native Test Module Pattern (HOW.md lines 47-61)**:
- Import test from 'node:test' and assert from 'node:assert'
- Import hello function from './hello.js' (relative path with .js extension)
- Use test() function with descriptive name and callback
- Use assert.strictEqual() for exact string comparison

**Minimal Package Config Pattern (HOW.md lines 63-75)**:
- name field for project identification
- type: "module" for ES Module support
- scripts.test: "node --test" for npm test command
- No dependencies or devDependencies blocks

### Integration Points

**npm → Node.js Test Runner Integration** (HOW.md lines 109-116):
The integration flow is: `npm test` → `node --test` → discovers `hello.test.js` → imports `hello.js` → runs assertions → exit code 0 (success)

**Harness Integration**:
The v2.2 generic harness shell-out runner validates via:
1. `npm install` (no-op since zero dependencies)
2. `npm test` → verifies exit code 0

---

## Testing Strategy

### Smoke Test
- [x] App loads without errors - verified by running `node hello.js` without errors
- [x] Existing features still work - N/A (greenfield implementation)

### Functional Tests
- [x] `node hello.js` executes without error
- [x] `hello('world')` returns exactly `'Hello, world!'`
- [x] `hello('Alice')` returns exactly `'Hello, Alice!'`
- [x] `node --test hello.test.js` exits with code 0
- [x] `npm test` exits with code 0
- [x] package.json has valid JSON syntax
- [x] package.json has `"type": "module"`
- [x] package.json has no dependencies entries

### Regression Check
- [x] Existing projects/ directory structure unchanged
- [x] Existing README.md unchanged
- [x] Existing .github/ workflows unchanged

### E2E Test Recommendations

- **Is this task user-facing?** No - this is a backend smoke test validating harness execution
- **e2eRequired**: false (per TASKS.json)
- No E2E tests needed for this task. The validation is performed through unit tests via `npm test`.

---

## Considerations

### Potential Pitfalls

1. **Forgetting .js extension in imports**: ES Modules require the .js extension in relative imports. Ensure `import { hello } from './hello.js'` includes the extension.

2. **Using default export instead of named export**: The pattern specifies named exports. Use `export function hello(name)` not `export default function hello(name)`.

3. **Node.js version compatibility**: Node.js 18+ is required for node:test module. The harness environment must have Node.js 18 or later.

4. **Accidentally adding console.log**: The hello function must be pure - any console output would violate the acceptance criteria.

### Edge Cases

1. **Empty string input**: While not explicitly required to test, `hello('')` would return `'Hello, !'` which is technically correct per the implementation pattern.

2. **Special characters in name**: The function should handle names with special characters since it's a simple string template.

3. **package.json placement**: Must be at repository root, not in a subdirectory, to ensure `npm test` works from the root.

---

```json
{
  "task": "1",
  "role": "research",
  "filesReviewed": [
    "ai-docs/SPEC/HOW.md",
    "ai-docs/SPEC/WHY_WHAT.md",
    "ai-docs/SPEC/CONSTITUTION.md",
    "ai-docs/SPEC/TASKS.json",
    "ai-docs/SPEC/PROGRESS_LOG.md",
    "README.md"
  ],
  "planSummary": "Create three files at repository root: hello.js (pure function with named export), hello.test.js (using node:test and node:assert), and package.json (minimal config with type:module and test script). All patterns are clearly defined in HOW.md. Implementation is straightforward greenfield work with no dependencies on existing code.",
  "scope": {
    "level": "minor",
    "rationale": "Localized change creating 3 new files at repo root. No architecture shifts, no existing code modification, limited file surface. Simple smoke test implementation following established patterns in HOW.md."
  }
}
```