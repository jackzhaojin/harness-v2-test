# Task 1: Implement hello function with test suite and package config

## Goal
Create the complete Node.js hello-world smoke test with all three required files: hello.js (pure function), hello.test.js (native node:test), and package.json (minimal config). This validates the v2.2 generic harness shell-out runner with the simplest possible implementation.

## Acceptance Criteria
- [ ] hello.js file exists at repository root
- [ ] hello.js exports a named function called 'hello'
- [ ] hello('world') returns exactly 'Hello, world!'
- [ ] hello('Alice') returns exactly 'Hello, Alice!'
- [ ] hello function is pure (no console output, no side effects)
- [ ] hello.test.js file exists at repository root
- [ ] hello.test.js uses node:test module (no external test frameworks)
- [ ] hello.test.js imports hello function from ./hello.js
- [ ] hello.test.js asserts hello('world') === 'Hello, world!'
- [ ] Running 'node --test hello.test.js' exits with code 0
- [ ] package.json file exists at repository root
- [ ] package.json contains valid JSON with 'type': 'module'
- [ ] package.json scripts.test is set to 'node --test'
- [ ] Running 'npm test' exits with code 0
- [ ] package.json has no dependencies or devDependencies entries

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
