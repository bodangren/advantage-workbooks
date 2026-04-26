# Spelling Practice Generator Plan

## 1. Type Definitions & Boilerplate
- [ ] Add `SpellingPracticeEntry` to `dashboard/lib/document-wrapper/types.ts`.
- [ ] Add `includeSpellingPractice?: boolean` to `WorkbookDocumentOptions` in the same file.

## 2. HTML Generation Section
- [ ] Create `dashboard/lib/document-wrapper/sections/spelling-practice.ts`.
- [ ] Implement `generateSpellingPracticeSection` function.
- [ ] Update `dashboard/lib/workbook-document-wrapper.ts` to integrate the new section.
- [ ] Update `dashboard/lib/document-wrapper/styles.ts` with CSS for `.section-spelling-practice` and `.sp-table`.

## 3. Route API Integration
- [ ] Update `dashboard/app/api/projects/[projectId]/compile/route.ts` to extract spelling practice entries.
- [ ] Read `includeSpellingPractice` query parameter and pass the extracted data to `wrapWorkbookDocument`.

## 4. UI Toggle
- [ ] Update `dashboard/app/projects/[projectId]/compile/page.tsx` to include an "Include Spelling Practice" checkbox state.
- [ ] Pass the toggle state in the compilation URL.

## 5. Testing & Validation
- [ ] Write unit tests for `spelling-practice.ts` in `dashboard/__tests__/`.
- [ ] Update `dashboard/__tests__/workbook-document-wrapper.test.ts`.
- [ ] Run `npm test` and `npm run build` to verify.