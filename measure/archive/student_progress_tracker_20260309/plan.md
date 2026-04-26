# Implementation Plan: Student Progress Tracker

## Phase 1: Core Compiler Logic
1. Open `dashboard/lib/workbook-document-wrapper.ts`.
2. Add `includeProgressTracker?: boolean;` to `WorkbookDocumentOptions` interface.
3. Create `generateProgressTracker(tocEntries: TocEntry[], theme: ThemeColors): string` function.
   - HTML structure with a title "My Reading Journey" or similar.
   - Loop over `tocEntries` and render a `progress-badge` item for each lesson. The badge should contain the lesson number or a star icon.
4. Inject the result of `generateProgressTracker` between `tocSection` and `lessonsHtml` in the `wrapWorkbookDocument` function (if `includeProgressTracker` is true).
5. Add CSS inside `getPrintStyles` for the `.section-progress-tracker`, `.pt-grid`, and `.progress-badge` classes. Ensure it breaks after page correctly.

## Phase 2: Dashboard UI Integration
1. Open `dashboard/app/projects/[id]/page.tsx`.
2. Locate the compilation settings/dialog.
3. Add a new checkbox state `includeProgressTracker` (defaulting to true).
4. Pass `includeProgressTracker` to the API or `wrapWorkbookDocument` call.
5. In `dashboard/app/api/compile/route.ts` (if applicable), read `includeProgressTracker` from the request and pass it to `wrapWorkbookDocument`.

## Phase 3: Testing & Verification
1. Run `npm run lint` and `npm run test` or build to verify TypeScript compiles correctly.
2. Ensure the generated preview includes the Progress Tracker page when selected.
3. Run the complete Next.js build.