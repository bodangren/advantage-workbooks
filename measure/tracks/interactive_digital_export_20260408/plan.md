# Implementation Plan: Interactive Digital Export (Blended Learning Expansion)

## Phase 1: Foundation — Templates & Shared Utilities

- [ ] Task: Add `archiver` and `@types/archiver` to `dashboard/package.json` dependencies. Run `npm install`. Run `npm run build` to confirm zero regressions.
- [ ] Task: Study the existing Handlebars templates in `dashboard/` to understand the template compilation pattern and helper registration used in `lib/template-renderer.ts`. Document the pattern in a comment block at the top of the new exporter files.
- [ ] Task: Create `dashboard/templates/digital/lesson-interactive.hbs`. Scaffold the full HTML structure: article section, vocabulary list, multiple-choice section (`{{#each questions}}`), vocab-match section (`{{#each vocab_match}}`), fill-in-blank section (`{{#each vocab_fill}}`), writing prompt, and "Submit and Check" button. Embed client-side vanilla JS answer-checking logic (no external libraries) and drag-and-drop vocab match. Include a `{{#if scorm}}` block for SCORM API calls. Include all CSS inline in a `<style>` block.
- [ ] Task: Create `dashboard/lib/exporters/shared-styles.ts` exporting `getDigitalExportCss(): string` — a stripped subset of workbook CSS adapted for interactive screen display (readable font sizes, max-width container, activity card styles). Write a unit test asserting the returned string is non-empty and contains expected class names.
- [ ] Task: Run `npm run lint` and `npx tsc --noEmit`. Fix all errors introduced in this phase.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Foundation — Templates & Shared Utilities' (Protocol in workflow.md)

## Phase 2: Standalone HTML Exporter

- [ ] Task: Write failing Vitest unit tests for `dashboard/lib/exporters/html-exporter.ts` in `dashboard/lib/exporters/__tests__/html-exporter.test.ts`. Use fixture `WorkbookLesson` objects. Assert: return type is a string; output contains `<!DOCTYPE html>`; output contains the lesson title; output contains the correct number of `<input type="radio">` elements matching the fixture's MC questions; output does not contain `SCORM.setvalue`. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/exporters/html-exporter.ts`. Use `handlebars` to compile `lesson-interactive.hbs` with `scorm: false`. Wrap all lessons in a single HTML document with inline sidebar navigation. Call `getDigitalExportCss()` for the `<style>` block. Confirm unit tests pass (Green).
- [ ] Task: Write additional unit tests for edge cases: single-lesson project (no sidebar nav needed); a lesson with no `vocab_match` items (section is omitted gracefully); a lesson with no `vocab_fill` items.
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on `html-exporter.ts`. Fix coverage gaps.
- [ ] Task: Measure — User Manual Verification 'Phase 2: Standalone HTML Exporter' (Protocol in workflow.md)

## Phase 3: SCORM Exporter

- [ ] Task: Write failing Vitest unit tests for `dashboard/lib/exporters/scorm-exporter.ts` in `dashboard/lib/exporters/__tests__/scorm-exporter.test.ts`. Assert: return type is `Buffer`; the Buffer is a valid zip (check magic bytes `PK\x03\x04`); unzipping the buffer (using `archiver` or Node.js `zlib`) reveals `imsmanifest.xml`; the manifest XML contains one `<item>` element per input lesson; each `lessons/{lesson_id}/index.html` exists in the zip; the lesson HTML contains `SCORM.setvalue`. Confirm tests fail (Red).
- [ ] Task: Create `dashboard/lib/exporters/scorm-api.js` — a static SCORM 1.2 API wrapper implementing `SCORM.init()`, `SCORM.setvalue()`, `SCORM.getvalue()`, `SCORM.commit()`, `SCORM.finish()` using the standard `window.API` lookup. This file is copied verbatim into the SCORM zip at `shared/scorm-api.js`.
- [ ] Task: Implement `dashboard/lib/exporters/scorm-exporter.ts`. Build the `imsmanifest.xml` string using template literals (no XML library needed at this scale). Use `archiver` in memory mode to build the zip buffer. Compile each lesson page using `handlebars` with `scorm: true`. Confirm unit tests pass (Green).
- [ ] Task: Write additional tests for the manifest: verify the manifest `identifier` attribute equals `{seriesName}-{levelNumber}` with spaces replaced by hyphens; verify `<organization>` contains the project `seriesName` as the title.
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on `scorm-exporter.ts`. Fix gaps.
- [ ] Task: Measure — User Manual Verification 'Phase 3: SCORM Exporter' (Protocol in workflow.md)

## Phase 4: API Route & Dashboard UI

- [ ] Task: Write failing Vitest unit tests for `dashboard/app/api/projects/[projectId]/export/route.ts`. Mock `lib/exporters/scorm-exporter.ts` and `lib/exporters/html-exporter.ts`. Assert: `format: "scorm"` calls `generateScormPackage` and returns a 200 response with `Content-Type: application/zip`; `format: "html"` calls `generateStandaloneHtml` and returns 200 with `Content-Type: text/html`; unknown `format` value returns 400. Confirm tests fail (Red).
- [ ] Task: Create `dashboard/app/api/projects/[projectId]/export/route.ts`. Parse request body, load lessons via `filesystem.ts` (or `lib/db/lessons.ts`), call the appropriate exporter, and return the binary/string response with correct headers (`Content-Disposition: attachment; filename="..."` with a descriptive filename). Confirm tests pass (Green).
- [ ] Task: Add the "Export Digital" button and format dropdown to the render/compile page (`dashboard/app/projects/[projectId]/render/page.tsx` or equivalent). On selection, POST to the export API route, receive the response as a Blob, create an object URL, and trigger download via a temporary `<a>` element. Show a loading spinner during the request.
- [ ] Task: Run `npm run lint`, `npx tsc --noEmit`, and `npm run test:run`. Fix all errors.
- [ ] Task: Manually open the development server. Compile a test project. Click "Export Digital" > "Standalone HTML". Verify the download fires and the file opens in a browser showing interactive activities.
- [ ] Task: Manually test SCORM export: download zip, unzip, and open `lessons/{id}/index.html` directly in a browser. Confirm activities render and the Submit button shows scores.
- [ ] Task: Run `npm run build`. Confirm zero build errors.
- [ ] Task: Update `measure/tech-debt.md` and `measure/lessons-learned.md` (prune to <=50 lines). Note the in-memory `archiver` pattern for SCORM zip generation and the single-file inlining approach.
- [ ] Task: Measure — User Manual Verification 'Phase 4: API Route & Dashboard UI' (Protocol in workflow.md)
