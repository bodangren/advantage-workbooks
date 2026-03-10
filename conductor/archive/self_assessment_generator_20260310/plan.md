# Implementation Plan: Student Self-Assessment & Reflection Generator

## Step 1: Update API Route to handle toggle
- Modify `dashboard/app/api/projects/[projectId]/compile/route.ts` to read `includeSelfAssessment` from URL search parameters (default `true`).
- Pass the flag to `wrapWorkbookDocument` in the compiler options.

## Step 2: Update the UI Compiler Options
- In `dashboard/app/projects/[projectId]/compile/page.tsx`, add a state variable `includeSelfAssessment` (default `true`).
- Add a corresponding checkbox in the settings panel alongside Progress Tracker and others.
- Pass it in the query params to the API fetch.

## Step 3: Implement Generator Function
- In `dashboard/lib/workbook-document-wrapper.ts`:
  - Add `includeSelfAssessment?: boolean` to `WorkbookDocumentOptions` interface.
  - Implement `generateSelfAssessmentSection(options: WorkbookDocumentOptions, theme: ThemeColors): string`
  - Write CSS styles in `getPrintStyles()` to beautifully format the self-assessment matrix and reflection questions.
  - Call the generator in `wrapWorkbookDocument` and append the HTML string right before `certificateSection` or `flashcardsSection`.

## Step 4: Add Automated Tests
- Write a unit test or integration test ensuring the `includeSelfAssessment` toggle adds the HTML to the rendered output. (e.g. check for the `section-self-assessment` class).

## Step 5: Verification & Commit
- Run `npm run test` in dashboard.
- Verify production build.
- Commit all changes and move track to archive.