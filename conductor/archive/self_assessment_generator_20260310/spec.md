# Student Self-Assessment & Reflection Generator

## Overview
This feature automatically generates a "Self-Assessment & Reflection" page near the end of the compiled workbook (before the Certificate of Completion). This enables students to self-reflect on their language learning journey using CEFR-aligned "I can..." statements, which is a key pedagogical requirement for blended learning and modern ESL curricula.

## Scope
- Implement a `generateSelfAssessmentSection` function in `workbook-document-wrapper.ts`.
- The section will include a CEFR-aligned self-assessment grid where students rate their reading, writing, and vocabulary skills (e.g., using emojis or checkboxes for "Needs work", "Getting there", "Got it!").
- Include a few open-ended reflection questions about their favorite lesson and hardest vocabulary word.
- Expose a toggle `includeSelfAssessment` in the compiler options UI and API.
- Ensure the print layout via `pagedjs` styles it correctly as a dedicated page.

## Technical Details
- Add `includeSelfAssessment?: boolean` to `WorkbookDocumentOptions`.
- Update `dashboard/app/projects/[projectId]/compile/page.tsx` with a checkbox for the Self-Assessment page.
- Update `dashboard/app/api/projects/[projectId]/compile/route.ts` to parse the `includeSelfAssessment` parameter.
- Implement the HTML/CSS generation in `dashboard/lib/workbook-document-wrapper.ts`.
- Ensure tests pass with the new section.