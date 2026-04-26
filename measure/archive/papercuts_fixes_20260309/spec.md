# Specification: Papercuts Fixes

## Problem
1. The `/projects/[id]/compile` page has errors.
2. The progress tracker and badges overflow the page on print/layout.
3. The print button prints the Next.js page instead of the paginated workbook.

## Scope
- Fix compile page errors in the Next.js app.
- Adjust CSS/Layout for the progress tracker to prevent page overflow.
- Implement correct printing logic using `window.print()` properly hooked up to the Paged.js output or ensuring only the workbook content is printed.
- Apply all changes exclusively to the Next.js (`dashboard/`) version.

## Acceptance Criteria
- `/projects/[id]/compile` loads without errors.
- Progress tracker/badges fit within a single printed page or flow correctly without overflowing boundaries.
- Clicking the "Print" button correctly prints the paginated Paged.js workbook without Next.js UI elements.