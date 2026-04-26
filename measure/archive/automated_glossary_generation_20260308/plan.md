# Implementation Plan: Automated Glossary Generation

## Step 1: Backend Extraction Logic
- Modify `dashboard/app/api/projects/[projectId]/compile/route.ts` to iterate through lesson data and build a `glossary` array.
- Deduplicate by `word` (lowercased) and sort alphabetically.

## Step 2: Template Update
- Update `dashboard/templates/workbook_template.html` to include a Handlebars block for `{{#if glossary}}...{{/if}}`.
- Alternatively, modify `dashboard/lib/workbook-document-wrapper.ts` to include a Glossary chapter.

## Step 3: Testing
- Add tests in `dashboard/__tests__/` to verify glossary extraction and deduplication.

## Step 4: Verification
- Run `npm run test` and `npm run build` in `dashboard/`.
