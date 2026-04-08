# Track: AI Content Orchestration (Lesson-from-Source)

## Overview

The current "Magic Wand" tool in the dashboard augments an existing lesson with pedagogical metadata (hints, reflection questions, writing frames). This track moves beyond augmentation to full **lesson generation from scratch**. A content team member will paste raw article text or provide a public URL, and the system will use the Gemini API (`@google/genai`) to produce a fully schema-valid `WorkbookLesson` JSON object — including extracted vocabulary with definitions, multiple-choice comprehension questions, vocab-match/fill activities, sentence-order exercises, writing prompts, and pedagogical metadata — all conforming to the Zod schema defined in `dashboard/lib/workbook-schema.ts`.

The feature will surface as a new "New Lesson from Source" workflow inside the existing Next.js dashboard project view (`dashboard/app/projects/[projectId]/`), keeping the UX consistent with the current lesson editor pattern.

## Functional Requirements

### 1. Source Input UI
- Add a "New Lesson from Source" button to the project page (`projects/[projectId]/page.tsx`), rendered alongside the existing lesson list.
- Clicking the button opens a modal (using the existing `@radix-ui/react-dialog` dependency) with two input modes:
  - **Paste Text:** A `<textarea>` accepting raw article text (plain text, max 10,000 characters).
  - **URL:** A text input accepting a publicly accessible URL. The API route will fetch and strip the HTML to extract body text server-side using the Node.js built-in `URL` and `fetch`.
- The modal includes a CEFR level selector (`A1 | A2 | B1 | B2 | C1`) matching the existing `cefrLevel` field used in `ProjectMetadata`.
- A "Generate Lesson" button triggers the generation pipeline.

### 2. Server-Side Generation API Route
- Create `dashboard/app/api/projects/[projectId]/lessons/generate/route.ts` (POST).
- Request body: `{ source_type: "text" | "url", source: string, cefr_level: string }`.
- If `source_type === "url"`: fetch the URL, extract text content (strip HTML tags, collapse whitespace) before passing to Gemini. Return `400` if fetch fails or content is empty.
- Call `lib/lesson-generator.ts` (new module) with the cleaned source text and CEFR level.
- Validate the returned object against `WorkbookLessonSchema` using Zod `.safeParse()`. Return `422` with error details if validation fails.
- On success, write the new lesson JSON file to the project directory using `lib/filesystem.ts` and return `201` with the new lesson's `id` and `name`.

### 3. Lesson Generation Library (`lib/lesson-generator.ts`)
- Export `generateLessonFromSource(sourceText: string, cefrLevel: string): Promise<WorkbookLesson>`.
- Build a structured prompt instructing Gemini to:
  - Extract 8–12 key vocabulary items with `word`, `phonetic` (IPA), `definition` (English), and `thai_definition`.
  - Write 5 multiple-choice comprehension questions with 4 options each.
  - Generate 6 vocabulary-match pairs and 5 vocabulary-fill sentences.
  - Produce 3 sentence-order questions (scrambled sentences from the article).
  - Write a 2–3 sentence writing prompt appropriate for the CEFR level.
  - Generate the full pedagogical metadata fields already handled by `augmentLesson` in `lib/ai-augmentor.ts` (`short_answer_hint`, `writing_plan_prompts`, `reflection_focus`, `connection_question`, `grammar_search_term`, `discussion_question`, `writing_sentence_frames`).
- Use `zodToJsonSchema` (already a dependency) to embed the full `WorkbookLessonSchema` JSON Schema in the prompt as a structured output contract.
- Call `GoogleGenAI.generateContent()` with `responseMimeType: "application/json"`.
- Parse and return the result; throw a typed `LessonGenerationError` on parse failure.

### 4. Dashboard UI — Post-Generation Flow
- After generation succeeds, close the modal and navigate to the new lesson's editor page (`/projects/[projectId]/lessons/[lessonId]`), consistent with the flow after manually creating a lesson.
- Display a `toast`-style banner (inline `div` with green background, accessible `role="status"`) confirming "Lesson generated successfully."
- If generation fails, display an inline error message inside the modal without closing it.

### 5. URL Fetch Safety
- URL fetching is performed exclusively server-side in the API route. Never expose the fetch logic to the client.
- Restrict fetching to `http` and `https` schemes; reject `file://`, `data:`, and other schemes with `400`.
- Set a 10-second timeout on the upstream fetch using `AbortController`.
- Strip `<script>`, `<style>`, and `<noscript>` tags and their content before extracting text.

## Non-Functional Requirements

- **Latency:** Gemini generation is expected to take 5–20 seconds. The UI must show a loading spinner and disable the "Generate" button during the request.
- **Schema Compliance:** Every generated lesson must pass `WorkbookLessonSchema.safeParse()` before being written to disk. Malformed output is never persisted.
- **Test Coverage:** >80% coverage on `lib/lesson-generator.ts` and the new API route handler using Vitest with mocked `GoogleGenAI` responses.
- **No New Dependencies:** Use only packages already present in `dashboard/package.json` (`@google/genai`, `zod`, `zod-to-json-schema`, `@radix-ui/react-dialog`, `lucide-react` for icons).
- **TypeScript Strict:** All new code must pass `npx tsc --noEmit` with zero errors.

## Acceptance Criteria

- [ ] A "New Lesson from Source" button is visible on the project page.
- [ ] The modal opens and accepts both text paste and URL inputs.
- [ ] Submitting a valid English article text generates a lesson JSON that passes `WorkbookLessonSchema.safeParse()`.
- [ ] Submitting a URL fetches page content server-side and generates a lesson.
- [ ] An invalid URL (non-http/https, unreachable, or empty body) returns a user-visible error without crashing.
- [ ] The generated lesson file appears in the project's lesson list after generation.
- [ ] The dashboard navigates to the new lesson's editor page after successful generation.
- [ ] Unit tests for `generateLessonFromSource` mock the Gemini API and assert schema validity of the output.
- [ ] Unit tests for the API route cover success, URL fetch failure, and schema validation failure paths.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with zero errors.
- [ ] `npm run test:run` achieves >80% coverage on new files.

## Out of Scope

- Authenticated URL access (login-walled content, OAuth-protected pages).
- PDF extraction (only plain HTML pages are supported in this track).
- Automatic image selection or generation from source content (handled by existing `image-generator.ts`).
- Batch generation of multiple lessons in a single request.
- Any changes to the existing `augmentLesson` flow — this track adds a parallel generation path, not a replacement.
