# Implementation Plan: Per-Workbook Teacher Manual Generation

## Phase 1: Infrastructure & Template Setup

### Task 1.1: Create Teacher Manual Template
- [x] Created teacher-manual library with all core modules
  - `dashboard/lib/teacher-manual/types.ts` — Type definitions
  - `dashboard/lib/teacher-manual/teaching-notes.ts` — Teaching notes for all 13 steps
  - `dashboard/lib/teacher-manual/step-insert.ts` — Step insert renderers for all 13 steps
  - `dashboard/lib/teacher-manual/period-plan.ts` — Period plan builder with bell-ringers, spelling, online
  - `dashboard/lib/teacher-manual/lesson-plan.ts` — Lesson plan assembler
  - `dashboard/lib/teacher-manual/front-matter.ts` — Front matter (title, preface, pedagogy, guides)
  - `dashboard/lib/teacher-manual/end-matter.ts` — End matter (self-assessment, certificate, troubleshooting)
  - `dashboard/lib/teacher-manual/document-wrapper.ts` — Full document wrapper with Paged.js styles
  - `dashboard/lib/teacher-manual/compiler.ts` — Main compiler function
- [x] CSS classes for step inserts, teaching notes, period headers — embedded in document-wrapper
- [x] TypeScript compiles with zero errors
- [x] Build passes successfully

### Task 1.2: Create Teacher Manual Document Wrapper
- [x] Created `dashboard/lib/teacher-manual/document-wrapper.ts`
  - Function `wrapTeacherManualDocument(frontMatter, lessonPlans, endMatter, options)`
  - Full Paged.js print styles (~400 lines of CSS)
  - Follows same pattern as `workbook-document-wrapper.ts`
- [x] Unit testing deferred (all output is HTML string — manual verification via preview)

### Task 1.3: Create API Endpoint
- [x] Created `dashboard/app/api/projects/[projectId]/teacher-manual/route.ts`
  - GET endpoint loads all lessons for project
  - Calls `compileTeacherManual()` with project metadata
  - Returns `{ html, lessonCount, totalLessons }`
  - Error handling for missing/failed lessons

### Task 1.4: Create Preview Page
- [x] Created `dashboard/app/projects/[projectId]/teacher-manual/preview/page.tsx`
  - Fetches teacher manual HTML from API
  - Renders in iframe (same pattern as workbook compile preview)
  - Includes print button, fullscreen toggle, print instructions
  - Loading states and error handling

## Phase 2: Front Matter Generation

### Task 2.1: Create Front Matter Content
- [x] Created `dashboard/lib/teacher-manual/front-matter.ts`
  - Title page generator (uses project metadata)
  - Preface content explaining the 4-period model and blended learning
  - General lesson plan structure explanation (all 4 periods with steps)
  - Pedagogical guidelines (pair work, discussion techniques, app usage, blended learning management)
  - Flashcard games guide (Memory, Go Fish, Snap, Quiz Show with link to kidsclubenglish.com)
  - Spelling routine guide (trace/write/cover-and-write three-period cycle)
  - My English Learning Goals introduction
- [x] All content parameterized by project metadata (series, level, CEFR)

### Task 2.2: Style Front Matter
- [x] Front matter CSS included in document-wrapper styles
- [x] Proper page breaks between sections (break-after: page)
- [x] Pedagogical callouts and game instructions styled

## Phase 3: Step Insert Rendering

### Task 3.1: Create Step Insert Renderer
- [x] Created `dashboard/lib/teacher-manual/step-insert.ts`
  - Function `renderStepInsert(stepNumber, lesson)` renders any step
  - Individual renderer functions for all 13 steps
  - Each renders a realistic "Student View" of the workbook step
  - Wraps in bordered container with step label badge

### Task 3.2: Handle Insert Sizing
- [x] Renders actual lesson content (vocabulary, article, questions, etc.)
- [x] Truncates long content gracefully (article paragraphs, vocabulary lists)
- [x] Handles images in inserts (hero images for Step 1/3)

### Task 3.3: Insert Styling
- [x] Shadow/border on insert containers
- [x] "Student View" label in header
- [x] break-inside: avoid on step blocks

## Phase 4: Teaching Notes Generation

### Task 4.1: Create Teaching Notes Engine
- [x] Created `dashboard/lib/teacher-manual/teaching-notes.ts`
  - Function `getTeachingNotes(stepNumber)` returns structured notes
  - Function `renderTeachingNotes(note, theme)` renders HTML
  - Generates: teacher actions, teacher language, student actions, watch-fors

### Task 4.2: Per-Step Note Templates
- [x] Step 1: Before You Read — notes
- [x] Step 2: Key Vocabulary — notes
- [x] Step 3: Read the Article — notes
- [x] Step 4: Collect Vocabulary — notes
- [x] Step 5: Deep Reading Notes — notes
- [x] Step 6: Collect Sentences — notes
- [x] Step 7: Comprehension Check — notes
- [x] Step 8: Guided Response — notes
- [x] Step 9: Vocabulary Practice — notes
- [x] Step 10: Sentence Practice — notes
- [x] Step 11: Guided Writing — notes
- [x] Step 12: Language Questions — notes
- [x] Step 13: Lesson Reflection — notes

### Task 4.3: Lesson-Specific Customization
- [x] Notes reference actual lesson vocabulary/article content via step inserts
- [x] Teaching language quotes sourced from Primary teacher guide

## Phase 5: Period Plan Assembly

### Task 5.1: Define Period Mapping
- [x] Created `dashboard/lib/teacher-manual/period-plan.ts`
  - Period 1: Steps 1-4 (Launch & Vocabulary)
  - Period 2: Steps 5-7 (Deep Reading & Comprehension)
  - Period 3: Steps 8-10 (Response & Practice)
  - Period 4: Steps 11-13 (Writing & Reflection)
- [x] Period overview generated with objectives

### Task 5.2: Integrate Bell-Ringers
- [x] Period 1: Flashcard cut-out and organization (5 min)
- [x] Periods 2-4: Flashcard vocabulary game (5 min each)
- [x] Game variations included (Memory, Go Fish, Snap, Quiz Show)

### Task 5.3: Integrate Spelling Activities
- [x] Period 2: Trace activity
- [x] Period 3: Write activity
- [x] Period 4: Cover-and-write activity

### Task 5.4: Integrate Online Components
- [x] Period 1: App article reading (QR/audio)
- [x] Period 2: Extensive reading assignments
- [x] Period 3: App vocabulary/sentence review
- [x] Period 4: AI writing feedback discussion + Progress tracker update

## Phase 6: Per-Lesson Compilation

### Task 6.1: Lesson Plan Builder
- [x] Created `dashboard/lib/teacher-manual/lesson-plan.ts`
  - Function `buildLessonPlan(lesson, index, cefrLevel)` builds complete plan
  - Function `renderLessonPlan(plan, theme)` renders HTML
  - Assembles lesson overview + 4 period plans

### Task 6.2: Full Manual Compilation
- [x] Created `dashboard/lib/teacher-manual/compiler.ts`
  - Function `compileTeacherManual(lessons, seriesName, ...)` orchestrates everything
  - Generates front matter
  - Builds all lesson plans
  - Generates end matter
  - Wraps in document wrapper
  - Returns `{ html, lessonCount }`

## Phase 7: End Matter Generation

### Task 7.1: Create End Matter Content
- [x] Self-Assessment Guide — how to administer
- [x] Certificate Ceremony — presentation tips with sample scripts
- [x] Troubleshooting — 5 common issues (pacing, app issues, writing difficulty, engagement, AI feedback)
- [x] Created `dashboard/lib/teacher-manual/end-matter.ts`

### Task 7.2: Style End Matter
- [x] Consistent styling with front matter
- [x] Proper page breaks (break-before: page)

## Phase 8: Dashboard Integration

### Task 8.1: Add Preview Button
- [x] Updated `dashboard/app/projects/[projectId]/page.tsx`
  - Added "Teacher Manual" button with BookOpenCheck icon
  - Placed alongside existing "Workbook Preview" button
  - Links to `/projects/[projectId]/teacher-manual/preview`

### Task 8.2: Test Dashboard Flow
- [x] TypeScript compiles with zero errors
- [x] Build passes (new routes registered)
- [x] API route: `ƒ /api/projects/[projectId]/teacher-manual`
- [x] Preview route: `ƒ /projects/[projectId]/teacher-manual/preview`
- [x] Manual browser testing pending → done 2026-08-03 via kimi-webbridge: preview page renders 167 Paged.js pages in iframe `708bed9`

## Phase 9: Testing & Validation

### Task 9.1: Compile Test
- [x] Compile teacher manual for `origins-2-a0` — 14/14 lessons, <2s warm, 167 pages
- [x] Verify all 14 lessons included
- [x] Verify front matter renders correctly
- [x] Verify end matter renders correctly
- [x] Check total page count — 167 (print PDF: 168)

### Task 9.2: Insert Accuracy Check
- [x] Compare step inserts against actual workbook pages (spot-check 4 lessons)
- [x] Verify vocabulary matches lesson — 5/5 per lesson
- [x] Verify article content matches
- [x] Check all images render — no <img> in this project; n/a

### Task 9.3: Print Test
- [x] Open in browser print dialog
- [x] Enable "Background graphics"
- [x] Check page breaks
- [x] Verify readability
- [x] Save as PDF and review — 168-page A4 PDF via CDP printToPDF w/ printBackground

### Task 9.4: Fix Issues
- [x] Address any scaling/readability issues
- [x] Fix page break problems — Paged.js rAF-chain freeze root-caused & fixed (2b644eb shim, 3a55973 title-page overflow, 708bed9 dual-arm frame-independent driver)
- [x] Adjust spacing as needed — .tm-step-block break-inside relaxed, manual packs to 167 pages
- [x] Optimize performance if slow — full render ~20-40s, stable across runs

## Phase 10: Documentation & Cleanup

### Task 10.1: Update Documentation
- [x] Add teacher manual generation to project README `fc1751c`
- [x] Document the 4-period structure — docs/teacher-manual.md `fc1751c`
- [x] Add screenshots of preview UI — docs/screenshots/teacher-manual-preview.jpg `fc1751c`

### Task 10.2: Final Review
- [x] Run full test suite — 284 pass / 3 pre-existing failures (unrelated content/constants)
- [x] TypeScript compiles with zero errors
- [x] Linting passes (0 errors, warnings only for pre-existing code)
- [x] Build passes successfully
- [x] Clean up any debug code — sweep clean; repro fixtures removed `c16f3e9`

## Success Criteria

- Teacher manual generates in < 10 seconds for 14 lessons
- All step inserts accurately reflect lesson content
- Print output is clean and professional
- Dashboard UI is intuitive
- No regressions in existing workbook compilation

## Estimated Timeline

- Phase 1: 2-3 hours
- Phase 2: 2 hours
- Phase 3: 3-4 hours
- Phase 4: 3-4 hours
- Phase 5: 2-3 hours
- Phase 6: 2-3 hours
- Phase 7: 1-2 hours
- Phase 8: 1-2 hours
- Phase 9: 2-3 hours
- Phase 10: 1-2 hours

**Total: ~20-30 hours**
