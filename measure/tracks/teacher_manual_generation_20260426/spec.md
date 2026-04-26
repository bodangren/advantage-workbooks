# Specification: Per-Workbook Teacher Manual Generation

## Overview

Generate a project-level teacher manual for each primary workbook that provides blended learning (online + workbook) instruction. The manual is produced automatically from workbook lesson JSON data and includes accurately rendered step inserts, 4-period pacing plans, integrated bell-ringer activities, and pedagogical guidance.

## Goals

1. **One manual per workbook project** (e.g., `origins-2-a0`) — not generic, but specific to that project's 14 lessons
2. **Accurate step inserts** — each step rendered at reduced size so teachers see exactly what students see
3. **4-period lesson structure** — each of the 14 lessons spans 4 class periods (~40 min each)
4. **Integrated workbook sections** — flashcards, spelling, progress tracker woven into lessons
5. **Dashboard preview** — project-level "Teacher Manual Preview" button alongside existing "Workbook Preview"
6. **Print-ready output** — same Paged.js HTML compilation pipeline as student workbooks

## Non-Goals (Out of Scope)

- Summative assessments (separate track)
- Secondary workbook teacher manuals (primary only for now)
- Thai localization (future track)
- Interactive digital features (future track)

## Teacher Manual Structure

### Front Matter (Before Lesson 1)

1. **Title Page** — "Teacher's Manual: [Series] Level [N]"
2. **Preface** — Purpose, audience, how to use this manual
3. **General Lesson Plan Structure** — Explanation of the 4-period model:
   - Period 1: Steps 1-4 (Launch + initial vocabulary work)
   - Period 2: Steps 5-7 (Deep reading + comprehension)
   - Period 3: Steps 8-10 (Guided response + practice)
   - Period 4: Steps 11-13 (Writing + reflection + homework)
4. **Pedagogical Guidelines** — How to teach with this workbook:
   - Pair work protocols
   - Class discussion techniques
   - Using the app for audio/QR support
   - Managing the blended learning flow
5. **Flashcard Vocabulary Games** — Reference guide for card games:
   - Period 1: Cut out and organize vocabulary
   - Periods 2-4: Bell-ringer games (Memory, Go Fish, Snap, etc.)
   - Link: https://kidsclubenglish.com/small-group-card-games/
6. **Spelling Routine Guide** — Three-period cycle:
   - Period 2: Trace
   - Period 3: Write
   - Period 4: Cover-and-write
7. **My English Learning Goals** — How to introduce the goal-setting page at semester start

### Per-Lesson Plans (×14)

Each lesson plan contains:

1. **Lesson Overview** — Title, CEFR level, duration, objectives
2. **Four Period Plans**:

   **Period 1: Launch & Vocabulary (Steps 1-4)**
   - Step 1: Before You Read — insert + teaching notes
   - Step 2: Key Vocabulary — insert + teaching notes
   - Step 3: Read the Article — insert + teaching notes
   - Step 4: Collect Vocabulary — insert + teaching notes
   - **Bell-ringer**: Flashcard cut-out and organization (5 min)
   - **Online**: App article reading (homework or in-class)

   **Period 2: Deep Reading & Comprehension (Steps 5-7)**
   - Step 5: Deep Reading Notes — insert + teaching notes
   - Step 6: Collect Sentences — insert + teaching notes
   - Step 7: Comprehension Check — insert + teaching notes
   - **Bell-ringer**: Flashcard vocabulary game (5 min)
   - **Spelling**: Trace activity
   - **Online**: Extensive reading (app)

   **Period 3: Response & Practice (Steps 8-10)**
   - Step 8: Guided Response — insert + teaching notes
   - Step 9: Vocabulary Practice — insert + teaching notes
   - Step 10: Sentence Practice — insert + teaching notes
   - **Bell-ringer**: Flashcard vocabulary game (5 min)
   - **Spelling**: Write activity
   - **Online**: App vocabulary/sentence review

   **Period 4: Writing & Reflection (Steps 11-13)**
   - Step 11: Guided Writing — insert + teaching notes
   - Step 12: Language Questions — insert + teaching notes
   - Step 13: Lesson Reflection — insert + teaching notes
   - **Bell-ringer**: Flashcard vocabulary game (5 min)
   - **Spelling**: Cover-and-write activity
   - **Online**: AI writing feedback discussion (students received feedback at home, discuss in class)
   - **Progress Tracker**: Update reading journey

### End Matter (After Lesson 14)

1. **Self-Assessment Guide** — How to administer the learning reflection
2. **Certificate Ceremony** — How to present completion certificates
3. **Troubleshooting** — Common issues and solutions

## Step Insert Design

Each step insert must:
- Render the actual step content from the lesson JSON
- Display at ~60% scale (reduced but readable)
- Show section header, instructions, and activity area
- Be visually distinct from surrounding teaching notes (border, background, or shadow)
- Include step number and title caption

## Technical Requirements

### New Components

1. **Teacher Manual Template** (`dashboard/templates/teacher_manual_template.html`)
   - Paged.js compatible
   - Two-column layout: step insert (left/upper) + teaching notes (right/lower)
   - Or single column with inserts inline
   - Print-friendly styles

2. **Teacher Manual Document Wrapper** (`dashboard/lib/teacher-manual-wrapper.ts`)
   - Similar structure to `workbook-document-wrapper.ts`
   - Assembles front matter + 14 lesson plans + end matter
   - Accepts array of lesson JSON objects

3. **Step Insert Renderer** (`dashboard/lib/teacher-manual/step-insert.ts`)
   - Takes a step's JSON data
   - Renders it using the same template engine as student workbook
   - Applies scale transformation (CSS transform: scale(0.6))
   - Wraps in a container with border/label

4. **Teaching Notes Generator** (`dashboard/lib/teacher-manual/teaching-notes.ts`)
   - Generates pedagogical notes for each step
   - Includes teacher language, student actions, watch-fors
   - Uses the generic manual content as base, customized per lesson

5. **Period Plan Builder** (`dashboard/lib/teacher-manual/period-plan.ts`)
   - Maps steps to periods
   - Integrates bell-ringer activities
   - Adds online/app components

### Dashboard Integration

1. **Project View Update** (`dashboard/app/projects/[projectId]/page.tsx`)
   - Add "Teacher Manual Preview" button alongside "Workbook Preview"
   - Opens `/projects/[projectId]/teacher-manual/preview`

2. **New Preview Route** (`dashboard/app/projects/[projectId]/teacher-manual/preview/page.tsx`)
   - Renders teacher manual in iframe
   - Same UI pattern as workbook preview

3. **API Endpoint** (`dashboard/app/api/teacher-manual/route.ts`)
   - Accepts project ID
   - Loads all lesson JSONs
   - Compiles teacher manual HTML
   - Returns HTML string

### Data Flow

```
Project ID → Load 14 lesson JSONs → Parse each lesson
    → Generate front matter (static content)
    → For each lesson:
        → Generate 4 period plans
        → For each step in period:
            → Render step insert (scaled workbook step)
            → Generate teaching notes
        → Assemble period plan
    → Generate end matter (static content)
    → Wrap in teacher manual document wrapper
    → Return HTML
```

## Acceptance Criteria

- [ ] Teacher manual compiles successfully for `origins-2-a0`
- [ ] Each of 14 lessons has a 4-period plan
- [ ] Each step has an accurate insert showing actual lesson content
- [ ] Flashcard bell-ringers appear in Periods 1-4 with correct activities
- [ ] Spelling activities appear in Periods 2-4 (trace/write/cover)
- [ ] Online/app components are noted in each period
- [ ] Dashboard shows "Teacher Manual Preview" button on project page
- [ ] Preview renders correctly in browser print dialog
- [ ] Manual prints cleanly with "Background graphics" enabled
- [ ] All inserts are readable at reduced scale
- [ ] Front matter includes pedagogical guidelines and game instructions
- [ ] End matter includes self-assessment and certificate guidance

## Dependencies

- Existing workbook compilation pipeline (document-wrapper, templates)
- Existing dashboard project view
- Lesson JSON schema (already validated)
- Paged.js (already used)

## Risks

1. **Insert readability at small scale** — May need to adjust scale or use partial inserts
2. **Page count** — Full manual could be very long (14 lessons × 4 periods × multiple pages)
3. **Template complexity** — Two different layouts (insert + notes) in one document
4. **Performance** — Compiling 14 lessons with inserts may be slow

## Notes

- The generic teacher manual in `Teacher guide/Primary/` is a reference — this generated version supersedes it per-project
- Step inserts should reuse the primary template rendering logic to ensure accuracy
- Consider generating inserts as images (html-to-image) if CSS scaling proves problematic
- The manual is for the teacher, so it can be denser and smaller than the student workbook
