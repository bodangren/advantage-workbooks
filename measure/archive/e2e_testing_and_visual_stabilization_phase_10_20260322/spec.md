# Specification: E2E Testing & Visual Stabilization Phase 10

## Goal
Stabilize the UI, address security vulnerabilities, and expand E2E test coverage.

## Scope
- **Fix "Add Lesson" functionality**: Implement a functional `CreateLessonDialog` and the corresponding `POST` API in `dashboard/app/api/projects/[projectId]/lessons/route.ts`.
- **Address NPM vulnerabilities**: Run `npm audit fix` and manually update `flatted` and `next` if needed to resolve high/moderate vulnerabilities.
- **Consolidate Workbook Levels**: Move `SECONDARY_LEVELS` and `PRIMARY_LEVELS` into a shared constants file to ensure consistency across `CreateProjectDialog` and `ProjectSettingsDialog`.
- **Expand E2E Coverage**: Add Playwright tests for:
    - Adding a new lesson to a project.
    - Updating project settings.
    - Verifying the "Add Lesson" and "Project Settings" flows.
- **Visual Stabilization**: Standardize any remaining CSS and ensure layout consistency in Paged.js templates.

## Success Criteria
- [ ] "Add Lesson" button successfully creates a new lesson file and redirects to it.
- [ ] `npm audit` shows 0 high-severity vulnerabilities (ignoring unavoidable moderate/low if they require breaking changes).
- [ ] Project Settings supports both Primary and Secondary levels correctly.
- [ ] New E2E tests pass reliably in the CI environment.
- [ ] No regressions in existing workbook compilation or preview flows.
