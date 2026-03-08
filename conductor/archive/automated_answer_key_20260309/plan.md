# Implementation Plan: Automated Answer Key Generation

## Step 1: Types & Abstractions
- In `dashboard/lib/workbook-document-wrapper.ts`, define an `AnswerKeyEntry` interface to hold extracted lesson answers.
- Update `WorkbookDocumentOptions` to accept an optional `answerKey?: AnswerKeyEntry[]` array.

## Step 2: Extractor Logic
- In `dashboard/app/api/projects/[projectId]/compile/route.ts`, iterate over the successful lessons to map their answer fields into the `AnswerKeyEntry` array.
- Pass this array into `wrapWorkbookDocument()`.

## Step 3: UI Layout & Theming
- In `dashboard/lib/workbook-document-wrapper.ts`, create a `generateAnswerKeySection(answerKey)` function.
- Add standard print CSS for `.section-answer-key`, `.answer-lesson-block`, etc., matching the existing typography.

## Step 4: Verification
- Ensure the types map accurately to `WorkbookLessonSchema`.
- Run tests (`npm run test`) and production build (`npm run build`).
