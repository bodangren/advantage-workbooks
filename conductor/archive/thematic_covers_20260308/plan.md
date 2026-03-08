# Implementation Plan: Thematic Cover Pages

1. Update `dashboard/lib/workbook-document-wrapper.ts`:
   - Enhance the `getPrintStyles` function to support `.cover-page` full-page styles.
   - Inject dynamic CSS variables for themes based on `options.seriesName`.
   - Update `generateTitlePage` to return a `div.cover-page` with the required HTML structure.
2. Write unit tests or update existing ones in `dashboard/__tests__/workbook-document-wrapper.test.ts` to ensure cover page generation output contains the specific themes and correct class names.
3. Run `npm run test` in the `dashboard` directory to verify.
4. Run `npm run build` in the `dashboard` directory to verify the build passes.
5. Commit changes.