# Refactor & Cleanup Specification

## Objective
Address technical debt, fix all ESLint errors/warnings to ensure a clean build, and verify the test suite.

## Scope
- Fix `any` typings across test files and components.
- Fix React unescaped entity warnings.
- Update `@ts-ignore` to `@ts-expect-error` in `pedagogical-schema.test.ts`.
- Run full test suite and confirm 100% pass rate.