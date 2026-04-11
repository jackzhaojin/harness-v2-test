# Project Constitution

## Mission
Provide a minimal Node.js hello-world CLI that validates the v2.2 generic harness shell-out runner through the simplest possible implementation.

## Immutable Principles
1. Absolute minimalism - only the files explicitly required, nothing more
2. Zero dependencies - no npm packages beyond Node.js built-ins
3. Pure functions - hello() takes input, returns output, no side effects
4. Native testing only - use `node:test` module, no test frameworks

## Vibe / Style Guide
- Tone: Utilitarian, no-frills smoke test
- Complexity: Bare minimum viable implementation
- UX Priority: Correctness over elegance; passing tests over polish

## Constraints
- Node.js >= 18 required (for `node:test` support)
- npm as sole build/run tool
- Single test file, single source file
- No configuration files beyond package.json

## Out of Scope
- CLI argument parsing or interactive features
- Multiple functions or modules
- TypeScript or transpilation
- Code coverage or linting
- Any external dependencies
- Documentation beyond inline clarity
- Error handling beyond basic operation
