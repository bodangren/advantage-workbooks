# Specification: Automated Glossary Generation

## Objective
Automatically extract vocabulary from all lessons in a project and generate an alphabetical glossary section at the end of the compiled workbook.

## Requirements
1.  **Vocabulary Extraction:** When compiling a project, parse all valid lesson JSONs.
2.  **Aggregation:** Collect every item from the `vocabulary` array (word, phonetic, definition).
3.  **Deduplication & Sorting:** Remove duplicate words (case-insensitive) and sort the remaining list alphabetically.
4.  **Template Integration:** Add a "Glossary" section to the compiled workbook HTML.
5.  **UI Trigger:** The glossary should automatically append when clicking "Compile All Lessons" on the dashboard.

## Technical Approach
- Modify compilation logic to iterate through all lesson definitions and build a `glossary` array.
- Pass the aggregated `glossary` array to the compiled document wrapper/template.
- Update `dashboard/templates/workbook_template.html` (or `dashboard/lib/workbook-document-wrapper.ts`) to render the glossary if data is present.
- Write tests to ensure vocabulary extraction works properly.
