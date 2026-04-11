# Requirements: Node Hello World Smoke Test

## Why This Iteration
Validate the v2.2 generic harness shell-out runner with the simplest possible Node.js implementation. This smoke test establishes baseline confidence that the harness can execute Node.js projects correctly before tackling complex builds.

## Existing Features
None - greenfield implementation in an otherwise-empty repo root.

## Scope

### In Scope
- Single `hello.js` source file with one exported function
- Single `hello.test.js` test file using `node:test`
- Minimal `package.json` with test script
- Passing `npm test` execution

### Out of Scope (This Iteration)
- CLI argument parsing or interactive features
- Multiple functions or modules
- TypeScript or transpilation
- Code coverage or linting
- Any external npm dependencies
- Documentation beyond inline clarity
- Error handling beyond basic operation
- Any files beyond the three specified

## User Stories

### Story 1: Hello Function Implementation
As a developer, I want a `hello(name)` function that returns a greeting so that I can verify the harness executes Node.js code correctly.

**Acceptance Criteria:**
- [ ] `hello.js` file exists at repository root
- [ ] `hello.js` exports a function named `hello`
- [ ] `hello("world")` returns exactly `"Hello, world!"`
- [ ] `hello("Alice")` returns exactly `"Hello, Alice!"`
- [ ] Function is pure (no side effects, no console output)

### Story 2: Test Suite
As a developer, I want a test that validates the hello function so that I can confirm test execution works in the harness.

**Acceptance Criteria:**
- [ ] `hello.test.js` file exists at repository root
- [ ] Test file uses `node:test` module (no external test frameworks)
- [ ] Test imports `hello` function from `./hello.js`
- [ ] Test asserts `hello("world") === "Hello, world!"`
- [ ] Running `node --test hello.test.js` exits with code 0

### Story 3: Package Configuration
As a developer, I want a package.json with a test script so that `npm test` runs the test suite.

**Acceptance Criteria:**
- [ ] `package.json` file exists at repository root
- [ ] `package.json` contains valid JSON
- [ ] `scripts.test` is set to `"node --test"`
- [ ] Running `npm test` exits with code 0
- [ ] No `dependencies` or `devDependencies` entries (zero external deps)

## Success Metrics
- `npm test` passes with exit code 0
- Only three files created: `hello.js`, `hello.test.js`, `package.json`
- Zero npm dependencies installed

## Dependencies
- Node.js >= 18 (required for `node:test` module support)
- npm (included with Node.js)
