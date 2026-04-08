# Track: Interactive Digital Export (Blended Learning Expansion)

## Overview

The workbook pipeline currently produces print-ready PDF workbooks via Paged.js. Students use physical workbooks in class and a companion learning app outside of class. However, the workbook content itself (article text, comprehension questions, vocabulary activities, writing prompts) is not accessible in a digital interactive format that students can self-pace through on a device.

This track adds a digital export capability to the dashboard. From any compiled project, a content team member can click "Export Digital" to generate either:

1. **SCORM 1.2 Package** — a `.zip` file containing an `imsmanifest.xml`, lesson HTML pages, and SCORM API JavaScript for tracking completion and score. Compatible with any standard LMS (Moodle, Canvas, Blackboard).
2. **Standalone Interactive HTML** — a single self-contained `.html` file (all CSS and JS inlined) that students can open in any browser without a server. Renders the article, vocabulary activities (multiple choice, vocab match, fill-in-blank), and writing prompt as interactive forms with client-side answer checking and a final score summary.

The export does not replace the print PDF; it is an additional output from the same JSON content source. No new content-authoring steps are required.

## Functional Requirements

### 1. Export UI — Dashboard Project Page
- Add an "Export Digital" button to the compiled project view (on the compile page: `dashboard/app/projects/[projectId]/render/page.tsx` or the compile result area), rendered alongside the existing "Print" button.
- Clicking opens a small dropdown (using a Radix UI `Select` or a simple `details`/`summary` element) with two options: "SCORM 1.2 Package" and "Standalone HTML."
- Selecting either option fires a request to the export API route and triggers a browser file download via a Blob URL (`URL.createObjectURL`).

### 2. Export API Route
- Create `dashboard/app/api/projects/[projectId]/export/route.ts` (POST).
- Request body: `{ format: "scorm" | "html", lesson_ids?: string[] }`. If `lesson_ids` is omitted, all lessons in the project are exported.
- Loads lesson JSON for each requested lesson via `lib/filesystem.ts` (or `lib/db/lessons.ts` after the Cloud Migration track).
- Calls `lib/exporters/scorm-exporter.ts` or `lib/exporters/html-exporter.ts` depending on `format`.
- Streams the resulting zip (for SCORM) or HTML string (for standalone) back to the client with appropriate `Content-Type` and `Content-Disposition` headers.

### 3. SCORM Exporter (`lib/exporters/scorm-exporter.ts`)
- Export `generateScormPackage(lessons: WorkbookLesson[], projectMeta: ProjectMetadata): Promise<Buffer>`.
- Uses the built-in Node.js `zlib` and `stream` modules plus the `archiver` npm package (add as a dependency) to build a `.zip` in memory.
- Package structure:
  ```
  imsmanifest.xml
  shared/
    scorm-api.js       (SCORM 1.2 API wrapper, ~150 lines, bundled inline)
    styles.css         (print-stripped subset of the workbook CSS)
  lessons/
    {lesson_id}/
      index.html       (interactive lesson page for this lesson)
  ```
- `imsmanifest.xml` conforms to SCORM 1.2 ADL spec: one `<item>` per lesson, each pointing to `lessons/{lesson_id}/index.html`. The manifest `identifier` is derived from the project `seriesName` + `levelNumber`.
- Each lesson `index.html` renders: article text (paragraphs), vocabulary list, multiple-choice questions (radio buttons), vocab-match activity (drag-and-drop using vanilla JS), fill-in-blank sentences (text inputs), and a "Submit and Check" button that reveals per-question feedback and a total score. On completion, calls `SCORM.setvalue('cmi.core.lesson_status', 'completed')` and `SCORM.setvalue('cmi.core.score.raw', score)`.
- The vanilla JS interaction layer is generated from a Handlebars template (already a dependency: `handlebars`) so that logic is consistent and testable.

### 4. Standalone HTML Exporter (`lib/exporters/html-exporter.ts`)
- Export `generateStandaloneHtml(lessons: WorkbookLesson[], projectMeta: ProjectMetadata): string`.
- Produces a single HTML file with all CSS and JS inlined (no external dependencies, works offline).
- Renders all lessons in sequence with a sidebar navigation list.
- Same interactive activity rendering as the SCORM lesson pages, minus the SCORM API calls.
- Uses the same Handlebars template as the SCORM exporter's lesson page, with a `scorm: boolean` flag controlling whether SCORM API calls are emitted.

### 5. Handlebars Template for Interactive Lesson Page
- Create `dashboard/templates/digital/lesson-interactive.hbs`.
- Template receives: `{ lesson: WorkbookLesson, scorm: boolean, lessonIndex: number, totalLessons: number }`.
- Renders all activity sections using `{{#each}}` blocks consistent with the existing workbook Handlebars templates in `dashboard/` (examine current template patterns before writing).
- The client-side answer-checking JavaScript is embedded in a `<script>` block within the template.

### 6. Drag-and-Drop Vocab Match
- Implement as a vanilla JS `dragstart`/`dragover`/`drop` event pattern (no external DnD library).
- A student drags a definition card and drops it onto the matching word card. Matched pairs are highlighted green; wrong drops are highlighted red for 1.5 seconds then reset.
- On "Submit and Check," un-matched pairs are highlighted red.

## Non-Functional Requirements

- **No Binary Dependencies Beyond `archiver`:** Only `archiver` is added as a new npm dependency. All other logic uses existing packages.
- **Offline Capable:** The standalone HTML export must function with no internet connection (no CDN links).
- **SCORM Compliance:** The generated `imsmanifest.xml` must pass validation against the SCORM 1.2 XSD schema. Verify during implementation using the ADL SCORM Test Track tool or equivalent.
- **Test Coverage:** >80% on `lib/exporters/scorm-exporter.ts` and `lib/exporters/html-exporter.ts`. Tests use mock `WorkbookLesson` fixtures and assert: output is a valid zip (SCORM) or valid HTML string (standalone); manifest contains the correct number of `<item>` elements; HTML contains the expected number of question elements.
- **TypeScript Strict:** Zero `tsc` errors on all new files.

## Acceptance Criteria

- [ ] "Export Digital" button appears on the compile/render page for a compiled project.
- [ ] Clicking "SCORM 1.2 Package" downloads a `.zip` file within 5 seconds for a 5-lesson project.
- [ ] The downloaded SCORM zip contains `imsmanifest.xml` and one `lessons/{id}/index.html` per lesson.
- [ ] Opening a lesson `index.html` from the zip in a browser (without a server) displays the article text, MC questions, vocab-match, and fill-in-blank.
- [ ] Answering all MC questions and clicking "Submit and Check" reveals correct/incorrect feedback and a score.
- [ ] The SCORM manifest's `<item>` count matches the number of lessons exported.
- [ ] Clicking "Standalone HTML" downloads a single `.html` file that opens offline in Chrome/Firefox and functions identically to the SCORM lesson pages.
- [ ] Unit tests for both exporters pass with `npm run test:run`.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with zero errors.
- [ ] `npm run build` succeeds.

## Out of Scope

- LTI integration (requires an LMS consumer key exchange; deferred beyond SCORM scope).
- SCORM 2004 or xAPI/Tin Can — SCORM 1.2 only in this track.
- Audio narration or video content in the digital export.
- Mobile-native app export (React Native, PWA packaging).
- Real-time answer submission to a server or gradebook sync.
