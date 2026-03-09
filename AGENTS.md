# Reading Advantage Workbooks

**Goal:** Generate printable English learning workbooks (CEFR A1-C1) from JSON content.
**Stack:** JSON + HTML/Handlebars + Paged.js (Layout) + Next.js (Dashboard).

## Critical Agent Knowledge
* **Schema Truth:** `workbook_schema.ts` (Zod) is the definitive data structure.
* **Strict Validation:** The compiler fails on missing fields. Always validate JSON modifications.
* **PDF Generation Gotcha:** To generate PDFs via the Dashboard print dialog, **"Background graphics" MUST be enabled**. Margins should be "Default" or "None".
* **Layout Engine:** Paged.js handles print layout. CSS print changes require testing in the browser print preview.
* **Memory Protocol:** You must read and update `conductor/tech-debt.md` and `conductor/lessons-learned.md` as part of your standard track workflow.
