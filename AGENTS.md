# Reading Advantage Workbooks

## Measure Workflow

All development runs through the **Measure** spec-driven development framework exclusively. At the start of every session:

1. Load the `measure` skill
2. Read `measure/index.md` to understand the project context
3. Follow the workflow defined in `measure/workflow.md`

Key reference files:
- `measure/tracks.md` — Active work registry
- `measure/tracks/<track_id>/plan.md` — Task checklist
- `measure/product.md` — Product vision
- `measure/tech-stack.md` — Technology choices
- `measure/lessons-learned.md` — Project memory
- `measure/tech-debt.md` — Known shortcuts

Never start significant work without an active track. Always update `measure/tracks.md` and the current track's `plan.md` before and after work.


**Goal:** Generate printable English learning workbooks (CEFR A1-C1) from JSON content.
**Stack:** JSON + HTML/Handlebars + Paged.js (Layout) + Next.js (Dashboard).


## Critical Agent Knowledge
* **Schema Truth:** `workbook_schema.ts` (Zod) is the definitive data structure.
* **Strict Validation:** The compiler fails on missing fields. Always validate JSON modifications.
* **PDF Generation Gotcha:** To generate PDFs via the Dashboard print dialog, **"Background graphics" MUST be enabled**. Margins should be "Default" or "None".
* **Layout Engine:** Paged.js handles print layout. CSS print changes require testing in the browser print preview.
* **Memory Protocol:** You must read and update `measure/tech-debt.md` and `measure/lessons-learned.md` as part of your standard track workflow.
