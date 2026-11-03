# Pilot report: dashboard typecheck and lint

- Base SHA: `cc7808c541ca1cac810a7cd74f34520f748aef5b`
- Branch: `pilot/cloud-wb-typecheck-lint`
- Date: 2026-11-03
- Environment: Node v22.23.4, npm 10.9.9, TypeScript 5.9.3
- Mode: check and report only. No source file was changed. Nothing was fixed. No secret, no `.env`, no network call except `npm ci`.

## Commands and exit codes

| # | Command (run in `dashboard/`) | Exit code |
|---|---|---|
| 1 | `npm ci` | 0 |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx eslint . --format json -o /tmp/eslint.json` | 1 |
| 4 | `npx eslint .` | 1 |

ESLint exits 1 because it found errors. Steps 3 and 4 report the same 5 problems.

## Counts

- tsc errors: **0** (no output)
- ESLint files linted: 333
- ESLint problems: **5** (3 errors, 2 warnings) in 4 files
- Fixable with `--fix`: 0 errors, 1 warning

### ESLint by rule

| Rule | Errors | Warnings |
|---|---|---|
| `react-hooks/rules-of-hooks` | 3 | 0 |
| `@typescript-eslint/no-unused-vars` | 0 | 1 |
| (unused eslint-disable directive, no rule ID) | 0 | 1 |

### ESLint by file (top 20; only 4 files have problems)

| File | Errors | Warnings |
|---|---|---|
| `dashboard/scripts/plan-dedup.ts` | 2 | 0 |
| `dashboard/lib/lesson-package/bank-plan.ts` | 1 | 0 |
| `dashboard/__tests__/plan-level-bank-5-9.test.ts` | 0 | 1 |
| `dashboard/app/review/sheet/[book]/page.tsx` | 0 | 1 |

## Findings

Format: `file:line | severity | text`

### tsc

None.

### ESLint

- `dashboard/lib/lesson-package/bank-plan.ts:396 | error | react-hooks/rules-of-hooks: React Hook "use" is called in function "place" that is neither a React function component nor a custom React Hook function.`
- `dashboard/scripts/plan-dedup.ts:40 | error | react-hooks/rules-of-hooks: React Hook "use" is called in function "better" that is neither a React function component nor a custom React Hook function. (column 12)`
- `dashboard/scripts/plan-dedup.ts:40 | error | react-hooks/rules-of-hooks: React Hook "use" is called in function "better" that is neither a React function component nor a custom React Hook function. (column 21)`
- `dashboard/__tests__/plan-level-bank-5-9.test.ts:7 | warning | @typescript-eslint/no-unused-vars: 'LEVEL_BOOKS' is defined but never used.`
- `dashboard/app/review/sheet/[book]/page.tsx:55 | warning | Unused eslint-disable directive (no problems were reported from '@next/next/no-img-element').`

## Notes (no action taken)

- The 3 `rules-of-hooks` errors are false positives. These are not React code. Each file defines a local arrow function named `use` (`bank-plan.ts:392` counts word use; `plan-dedup.ts:39` sums article use). The rule mistakes it for React's `use` hook. Renaming the helper to a name that does not start with `use` (for example `markUsed`, `usageOf`) would clear them.
- The 2 warnings are cleanup items: an unused import and a stale disable comment.
