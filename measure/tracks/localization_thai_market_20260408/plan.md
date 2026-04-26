# Implementation Plan: Localization & Thai-Market Teacher Support

## Phase 1: Schema & Configuration Foundation

- [ ] Task: Add the optional `thai_instructional_script` field to `WorkbookLessonSchema` in `dashboard/lib/workbook-schema.ts` and the `ThaiInstructionalScript` type. Add the `localization` field to the `ProjectMetadata` interface in `dashboard/lib/filesystem.ts`. Run `npx tsc --noEmit` and confirm zero errors. Run `npm run test:run` and confirm existing tests pass.
- [ ] Task: Create `dashboard/lib/i18n/th.ts` with the full `TH_INSTRUCTIONS` constant covering all 9 section keys listed in the spec. Write a Vitest test in `dashboard/lib/i18n/__tests__/th.test.ts` asserting: (a) the export is an object; (b) all 9 expected keys are present; (c) every value is a non-empty string containing at least one Thai Unicode character (code point range U+0E00–U+0E7F). Confirm tests pass.
- [ ] Task: Add "Localization" settings controls to the project creation modal and/or project settings UI: a checkbox for "Bilingual activity instructions (Thai)" and a select for "Teacher script language" (`None` / `Thai`). Persist the `localization` object to the project's `metadata.json`. Write a unit test for the settings component asserting defaults are `bilingual_instructions: false` and `teacher_script_language: null`.
- [ ] Task: Run `npm run lint` and `npx tsc --noEmit`. Fix all errors.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Schema & Configuration Foundation' (Protocol in workflow.md)

## Phase 2: Bilingual Activity Instructions in Templates

- [ ] Task: Write failing Vitest tests for the updated compile pipeline (in `dashboard/lib/__tests__/template-renderer-localization.test.ts`). Mock a project with `localization.bilingual_instructions: true` and a lesson. Assert: the compiled HTML string contains a `<p class="th-instruction">` element with the Thai vocabulary instruction text. Mock a project with `bilingual_instructions: false` and assert: no `.th-instruction` element appears. Confirm tests fail (Red).
- [ ] Task: Update `dashboard/lib/template-renderer.ts` (or the section compilation utility it calls): when `bilingualInstructions` is `true` in the compile context, inject `{ bilingualInstructions: true, thInstruction: TH_INSTRUCTIONS[sectionKey] }` into each section's Handlebars template context.
- [ ] Task: Update each activity section Handlebars template to include the `{{#if bilingualInstructions}}<p class="th-instruction">{{thInstruction}}</p>{{/if}}` block below the English `<h3>` instruction heading. Templates to update: the vocabulary section, comprehension section, vocab-match, vocab-fill, sentence-order, writing-prompt, and the three new activity templates (`crossword.hbs`, `word-search.hbs`, `match-the-image.hbs`) if they exist — use conditional template editing for templates that may not yet exist.
- [ ] Task: Add the Thai font CSS rule (`.th-instruction` class + `@import` for Sarabun from Google Fonts) to the shared workbook CSS. Gate the `@import` on a `{{#if bilingualInstructions}}` block in the compiled HTML `<head>` template.
- [ ] Task: Confirm unit tests from the first task in this phase now pass (Green). Run `npm run test:run`. Verify >80% coverage on the updated template-renderer localization logic.
- [ ] Task: Measure — User Manual Verification 'Phase 2: Bilingual Activity Instructions in Templates' (Protocol in workflow.md)

## Phase 3: Thai Instructional Script Generator

- [ ] Task: Write failing Vitest tests for `dashboard/lib/thai-script-generator.ts` in `dashboard/lib/__tests__/thai-script-generator.test.ts`. Mock `@google/genai`'s `generateContent` to return a JSON fixture matching `ThaiInstructionalScript`. Assert: `generateThaiInstructionalScript` returns an object with `opening` (string), `activity_notes` (array with `section` and `script` strings), and `debrief` (string). Assert: when Gemini returns malformed JSON, the function throws a typed error. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/thai-script-generator.ts`. Build the prompt requesting classroom-register Thai, structured as `ThaiInstructionalScript`. Use `GoogleGenAI` with `responseMimeType: "application/json"`. Parse and validate the response. Throw `ThaiScriptGenerationError` on parse failure. Confirm tests pass (Green).
- [ ] Task: Write additional tests covering: `opening` field is non-empty; `activity_notes` length equals the number of sections listed in the lesson's `section_order` (or the default section count if absent); `debrief` is non-empty.
- [ ] Task: Create `dashboard/app/api/projects/[projectId]/lessons/[lessonId]/thai-script/route.ts` (POST). Load the lesson from `filesystem.ts`, call `generateThaiInstructionalScript`, validate the result matches `ThaiInstructionalScript` shape, merge into the lesson JSON, save via `filesystem.ts`, and return the script as JSON with status 201. Write Vitest tests for the route covering: success path, file-not-found 404, and Gemini failure 500.
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on `thai-script-generator.ts` and the API route. Fix gaps.
- [ ] Task: Measure — User Manual Verification 'Phase 3: Thai Instructional Script Generator' (Protocol in workflow.md)

## Phase 4: Teacher Guide Template & UI Integration

- [ ] Task: Locate `dashboard/templates/teacher-guide.hbs` (from the archived `teacher_guide_generator_20260310` track). Add a "Classroom Script (สคริปต์การสอน)" subsection gated on `{{#if thai_instructional_script}}`. Render the `opening`, each `activity_note` as a numbered list item, and the `debrief`. Apply `.th-instruction` class to all Thai text elements. Write a Vitest test asserting the Teacher Guide HTML contains the Thai script subsection when the field is present and omits it when absent.
- [ ] Task: Add a "Generate Thai Script" button to the lesson editor page (`dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`). Render the button only when `project.metadata.localization?.teacher_script_language === "th"`. On click, POST to the `thai-script` API route, show a loading spinner, and on success display the script in a styled read-only card below the pedagogical metadata fields. On error, show an inline error message.
- [ ] Task: Write a component test for the lesson editor asserting: the "Generate Thai Script" button is absent when `localization.teacher_script_language` is `null`; it is present when set to `"th"`; clicking it triggers a POST fetch (mock) and renders the returned script.
- [ ] Task: Manually run the development server. Create a project with bilingual instructions enabled. Compile it. Open the browser print preview and confirm Thai instruction lines appear under each English activity heading and render in the Sarabun font.
- [ ] Task: Manually test Thai script generation: enable Thai teacher script on a project, open a lesson, click "Generate Thai Script," confirm the script appears in the editor. Compile the workbook. Open the PDF preview and confirm the Teacher Guide section contains the Thai "Classroom Script" subsection.
- [ ] Task: Run `npm run build`. Confirm zero build errors. Run `npm run lint` and `npx tsc --noEmit`. Fix all errors.
- [ ] Task: Update `measure/tech-debt.md` and `measure/lessons-learned.md` (prune to <=50 lines). Document the static `TH_INSTRUCTIONS` approach (prefer static strings over AI for UI copy) and the Gemini classroom-register Thai prompt pattern.
- [ ] Task: Measure — User Manual Verification 'Phase 4: Teacher Guide Template & UI Integration' (Protocol in workflow.md)
