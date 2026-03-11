# Implementation Plan: Goal Setting Worksheet Generator

- [ ] Task 1: Create `goal-setting.ts` generator in `dashboard/lib/document-wrapper/sections/` and add corresponding CSS to `styles.ts`.
- [ ] Task 2: Update `types.ts` and `workbook-document-wrapper.ts` to support the new `includeGoalSetting` option.
- [ ] Task 3: Update `dashboard/app/api/projects/[projectId]/compile/route.ts` to parse the new option.
- [ ] Task 4: Update the frontend UI (`dashboard/app/projects/[projectId]/compile/page.tsx`) to add the toggle.
- [ ] Task 5: Add unit tests for the new generator in `dashboard/__tests__/workbook-document-wrapper.test.ts`.