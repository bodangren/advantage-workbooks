# Implementation Plan: Per-Workbook Teacher Manual Generation

## Phase 1: Infrastructure & Template Setup

### Task 1.1: Create Teacher Manual Template
- [ ] Create `dashboard/templates/teacher_manual_template.html`
  - Paged.js compatible structure
  - Define `@page` rules for teacher manual (A4, appropriate margins)
  - Create CSS classes for step inserts (scaled container, border, label)
  - Create CSS classes for teaching notes (typography, spacing, callouts)
  - Create CSS classes for period headers and lesson dividers
- [ ] Test template renders without errors

### Task 1.2: Create Teacher Manual Document Wrapper
- [ ] Create `dashboard/lib/teacher-manual/document-wrapper.ts`
  - Function `wrapTeacherManualDocument(frontMatter, lessonPlans, endMatter, options)`
  - Assembles full HTML document with Paged.js script
  - Includes print styles
  - Similar pattern to existing `workbook-document-wrapper.ts`
- [ ] Write unit tests for wrapper assembly

### Task 1.3: Create API Endpoint
- [ ] Create `dashboard/app/api/teacher-manual/route.ts`
  - POST endpoint accepts `{ projectId }`
  - Loads all lesson JSONs for project
  - Calls compilation function
  - Returns `{ html }`
- [ ] Write API tests

### Task 1.4: Create Preview Page
- [ ] Create `dashboard/app/projects/[projectId]/teacher-manual/preview/page.tsx`
  - Fetches teacher manual HTML from API
  - Renders in iframe (same pattern as workbook preview)
  - Includes print button
- [ ] Add loading states and error handling

## Phase 2: Front Matter Generation

### Task 2.1: Create Front Matter Content
- [ ] Create `dashboard/lib/teacher-manual/front-matter.ts`
  - Title page generator (uses project metadata)
  - Preface content (static markdown/HTML)
  - General lesson plan structure explanation
  - Pedagogical guidelines (pair work, discussion techniques)
  - Flashcard games guide (with link to kidsclubenglish.com)
  - Spelling routine guide (trace/write/cover)
  - My English Learning Goals introduction
- [ ] All content parameterized by project metadata (series, level, CEFR)

### Task 2.2: Style Front Matter
- [ ] Add front matter CSS to template
- [ ] Ensure proper page breaks between sections
- [ ] Style pedagogical callouts and game instructions

## Phase 3: Step Insert Rendering

### Task 3.1: Create Step Insert Renderer
- [ ] Create `dashboard/lib/teacher-manual/step-insert.ts`
  - Function `renderStepInsert(stepData, lessonData, scale)`
  - Reuses existing step rendering logic from primary template
  - Applies CSS transform: scale(0.6) or similar
  - Wraps in bordered container with step label
  - Handles all 13 step types
- [ ] Write tests verifying inserts render actual lesson content

### Task 3.2: Handle Insert Sizing
- [ ] Test different scale factors (0.5, 0.6, 0.7)
- [ ] Ensure text remains readable
- [ ] Handle images in inserts (article images, etc.)
- [ ] Fallback: if scaling fails, render partial insert (header + activity area only)

### Task 3.3: Insert Styling
- [ ] Add shadow/border to insert containers
- [ ] Add "Student View" label
- [ ] Ensure inserts don't break across pages awkwardly

## Phase 4: Teaching Notes Generation

### Task 4.1: Create Teaching Notes Engine
- [ ] Create `dashboard/lib/teacher-manual/teaching-notes.ts`
  - Base teaching notes for each of 13 steps (from generic manual)
  - Customization hooks for lesson-specific data
  - Generates: teacher actions, teacher language, student actions, watch-fors
- [ ] Write tests for note generation

### Task 4.2: Per-Step Note Templates
- [ ] Step 1: Before You Read — notes
- [ ] Step 2: Key Vocabulary — notes
- [ ] Step 3: Read the Article — notes
- [ ] Step 4: Collect Vocabulary — notes
- [ ] Step 5: Deep Reading Notes — notes
- [ ] Step 6: Collect Sentences — notes
- [ ] Step 7: Comprehension Check — notes
- [ ] Step 8: Guided Response — notes
- [ ] Step 9: Vocabulary Practice — notes
- [ ] Step 10: Sentence Practice — notes
- [ ] Step 11: Guided Writing — notes
- [ ] Step 12: Language Questions — notes
- [ ] Step 13: Lesson Reflection — notes

### Task 4.3: Lesson-Specific Customization
- [ ] Inject lesson title, vocabulary list, article summary into notes
- [ ] Adjust notes based on lesson difficulty/content
- [ ] Include predicted student challenges per lesson

## Phase 5: Period Plan Assembly

### Task 5.1: Define Period Mapping
- [ ] Create `dashboard/lib/teacher-manual/period-plan.ts`
  - Period 1: Steps 1-4
  - Period 2: Steps 5-7
  - Period 3: Steps 8-10
  - Period 4: Steps 11-13
- [ ] Generate period overview (objectives, materials, time breakdown)

### Task 5.2: Integrate Bell-Ringers
- [ ] Period 1: Flashcard cut-out and organization (5 min)
- [ ] Periods 2-4: Flashcard vocabulary game (5 min each)
- [ ] Include game instructions and variations

### Task 5.3: Integrate Spelling Activities
- [ ] Period 2: Trace activity
- [ ] Period 3: Write activity
- [ ] Period 4: Cover-and-write activity
- [ ] Note: Spelling appears in lessons 2, 3, 4 of each week

### Task 5.4: Integrate Online Components
- [ ] Note app-based article reading (QR/audio)
- [ ] Note extensive reading assignments
- [ ] Note AI writing feedback discussion (Period 4)
- [ ] Note progress tracker updates

## Phase 6: Per-Lesson Compilation

### Task 6.1: Lesson Plan Builder
- [ ] Create `dashboard/lib/teacher-manual/lesson-plan.ts`
  - Function `buildLessonPlan(lessonData, lessonNumber)`
  - Assembles lesson overview + 4 period plans
  - Combines step inserts + teaching notes per period
- [ ] Write tests for lesson plan structure

### Task 6.2: Full Manual Compilation
- [ ] Create `dashboard/lib/teacher-manual/compiler.ts`
  - Function `compileTeacherManual(projectId)`
  - Loads all lessons
  - Generates front matter
  - Builds all 14 lesson plans
  - Generates end matter
  - Wraps in document wrapper
- [ ] Write integration tests

## Phase 7: End Matter Generation

### Task 7.1: Create End Matter Content
- [ ] Self-Assessment Guide — how to administer
- [ ] Certificate Ceremony — presentation tips
- [ ] Troubleshooting — common issues (student pacing, app issues, etc.)
- [ ] Add to `dashboard/lib/teacher-manual/end-matter.ts`

### Task 7.2: Style End Matter
- [ ] Consistent styling with front matter
- [ ] Proper page breaks

## Phase 8: Dashboard Integration

### Task 8.1: Add Preview Button
- [ ] Update `dashboard/app/projects/[projectId]/page.tsx`
  - Add "Teacher Manual Preview" button
  - Place alongside existing "Workbook Preview" button
  - Use book-open or graduation-cap icon

### Task 8.2: Test Dashboard Flow
- [ ] Navigate to project page
- [ ] Click Teacher Manual Preview
- [ ] Verify preview loads
- [ ] Test print dialog
- [ ] Test on mobile/tablet if relevant

## Phase 9: Testing & Validation

### Task 9.1: Compile Test
- [ ] Compile teacher manual for `origins-2-a0`
- [ ] Verify all 14 lessons included
- [ ] Verify front matter renders correctly
- [ ] Verify end matter renders correctly
- [ ] Check total page count

### Task 9.2: Insert Accuracy Check
- [ ] Compare step inserts against actual workbook pages
- [ ] Verify vocabulary matches lesson
- [ ] Verify article content matches
- [ ] Check all images render

### Task 9.3: Print Test
- [ ] Open in browser print dialog
- [ ] Enable "Background graphics"
- [ ] Check page breaks
- [ ] Verify readability
- [ ] Save as PDF and review

### Task 9.4: Fix Issues
- [ ] Address any scaling/readability issues
- [ ] Fix page break problems
- [ ] Adjust spacing as needed
- [ ] Optimize performance if slow

## Phase 10: Documentation & Cleanup

### Task 10.1: Update Documentation
- [ ] Add teacher manual generation to project README
- [ ] Document the 4-period structure
- [ ] Add screenshots of preview UI

### Task 10.2: Final Review
- [ ] Run full test suite
- [ ] Check linting
- [ ] Verify no console errors
- [ ] Clean up any debug code

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
