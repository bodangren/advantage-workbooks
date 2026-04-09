# Implementation Plan: AI Content Orchestration (Lesson-from-Source)

## Phase 1: Foundation — Library & Schema Prep

- [x] Task: Read `dashboard/lib/workbook-schema.ts` in full and confirm the complete set of required vs. optional fields on `WorkbookLessonSchema`. Document any fields that Gemini must always populate vs. fields that may be omitted.
- [x] Task: Write failing Vitest unit tests in `dashboard/lib/__tests__/lesson-generator.test.ts`. Mock `@google/genai` to return a fixture JSON string. Assert that `generateLessonFromSource` returns a value that passes `WorkbookLessonSchema.safeParse()`. Confirm tests fail (Red).
- [x] Task: Create `dashboard/lib/lesson-generator.ts`. Implement `generateLessonFromSource(sourceText, cefrLevel)` with the Gemini structured-output prompt, JSON parse logic, and typed `LessonGenerationError`. Confirm unit tests now pass (Green).
- [x] Task: Write additional unit tests covering: (a) Gemini returns malformed JSON — expect `LessonGenerationError` thrown; (b) source text under 50 characters — expect `LessonGenerationError` with "source too short" message.
- [x] Task: Run `npm run test:run` in `dashboard/`. Verify >80% coverage on `lesson-generator.ts`. Fix any gaps.
- [ ] Task: Conductor — User Manual Verification 'Phase 1: Foundation — Library & Schema Prep' (Protocol in workflow.md)

## Phase 2: API Route — Server-Side Generation Endpoint

- [x] Task: Write failing Vitest unit tests in `dashboard/app/api/projects/[projectId]/lessons/generate/__tests__/route.test.ts`. Use `jsdom` and mock `lib/lesson-generator.ts` and `lib/filesystem.ts`. Cover: (a) success with `source_type: "text"`; (b) success with `source_type: "url"` (mock `fetch`); (c) URL with non-http scheme returns 400; (d) upstream fetch timeout returns 400; (e) Zod validation failure returns 422. Confirm tests fail (Red).
- [x] Task: Create `dashboard/app/api/projects/[projectId]/lessons/generate/route.ts`. Implement POST handler: parse request body, branch on `source_type`, fetch+strip HTML for URLs, call `generateLessonFromSource`, validate with Zod `.safeParse()`, write file via `filesystem.ts`, return 201 with lesson id. Confirm unit tests now pass (Green).
- [x] Task: Implement URL text extraction helper `extractTextFromHtml(html: string): string` in `dashboard/lib/url-extractor.ts`. Strip `<script>`, `<style>`, `<noscript>` tags and their content. Collapse whitespace. Write unit tests covering: tag stripping, whitespace collapsing, empty-body input.
- [x] Task: Run `npm run lint` and `npx tsc --noEmit` in `dashboard/`. Fix all errors.
- [ ] Task: Conductor — User Manual Verification 'Phase 2: API Route — Server-Side Generation Endpoint' (Protocol in workflow.md)

## Phase 3: Dashboard UI — Modal & Source Input

- [x] Task: Write failing Vitest unit/component tests (using `@testing-library/react`) for the new `LessonFromSourceModal` component. Assert: modal renders on open; CEFR selector shows all 5 levels; "Generate Lesson" button is disabled when both inputs are empty; loading spinner appears during submission. Confirm tests fail (Red).
- [x] Task: Create `dashboard/components/LessonFromSourceModal.tsx`. Use `@radix-ui/react-dialog` for the modal shell, matching the existing dialog pattern in the codebase. Include textarea (paste mode), URL input (url mode), tab-style toggle between modes, CEFR select, and "Generate Lesson" button. Wire to the POST `/api/projects/[projectId]/lessons/generate` endpoint with `fetch`. Show loading state and inline error on failure. Confirm component tests pass (Green).
- [x] Task: Add "New Lesson from Source" button to `dashboard/app/projects/[projectId]/page.tsx`. Import and render `LessonFromSourceModal`. On successful generation, navigate to the new lesson editor using `next/navigation`'s `useRouter().push()`.
- [x] Task: Add success banner (inline `div`, `role="status"`, green Tailwind classes) that auto-dismisses after 4 seconds using a `useEffect` cleanup. Write a unit test asserting the banner renders after mock success and disappears after 4 seconds (use Vitest fake timers).
- [x] Task: Run `npm run test:run`. Verify >80% coverage on new component and modal files. Fix gaps.
- [x] Task: Conductor — User Manual Verification 'Phase 3: Dashboard UI — Modal & Source Input' (Protocol in workflow.md)

## Phase 4: Integration & Final Quality Gate

- [ ] Task: Run the full development server (`npm run dev` in `dashboard/`). Manually open a project, click "New Lesson from Source," paste 200 words of English text at B1 level, click Generate, and confirm a new lesson JSON appears in the lesson list and the editor opens.
- [ ] Task: Manually test URL mode: enter a publicly accessible English news article URL, generate, confirm lesson is created.
- [ ] Task: Manually test error paths: enter a `file://` URL (expect inline error), enter an empty textarea and click Generate (expect button remains disabled or inline validation fires).
- [ ] Task: Run `npm run build` in `dashboard/`. Confirm zero build errors.
- [ ] Task: Update `conductor/tech-debt.md` and `conductor/lessons-learned.md` (prune to <=50 lines each). Note the Gemini structured-output JSON prompt pattern as a reusable approach.
- [ ] Task: Conductor — User Manual Verification 'Phase 4: Integration & Final Quality Gate' (Protocol in workflow.md)
