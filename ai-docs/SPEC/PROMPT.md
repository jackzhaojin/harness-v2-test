# Smoke Test: Node Hello World

> Trivial smoke test for the v2.2 generic harness shell-out runner. Keep it small.

---

## Run Configuration

```yaml
target_dir: /Users/jackjin/dev/harness-v2-test
branch: main
baseline_branch: main
project_type: node
playwright_testing: false
incremental_e2e: false
```

---

## Goal

Create a Node.js hello-world CLI with a single function and one test.

**What success looks like**:
- A `hello.js` file exporting a `hello(name)` function that returns `"Hello, <name>!"`.
- A `hello.test.js` file with one Node `node:test` test asserting `hello("world") === "Hello, world!"`.
- `package.json` with `"test": "node --test"`.
- `npm test` passes.

---

## Project Context

- **Language**: Node.js (>=18)
- **Framework**: none
- **Build system**: npm
- **New project** - building from scratch in an otherwise-empty repo.

---

## Requirements

### Requirement 1: hello function

**Description**: Export a pure function that greets by name.

**Acceptance Criteria**:
- [ ] `hello.js` exports `hello(name)`
- [ ] Returns `"Hello, <name>!"` for any string input

### Requirement 2: Test

**Description**: One passing test using `node:test`.

**Acceptance Criteria**:
- [ ] `hello.test.js` exists
- [ ] `npm test` exits 0

---

## Out of Scope

- Any other files, deps, or features. This is a smoke test.
