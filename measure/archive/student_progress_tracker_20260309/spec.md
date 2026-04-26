# Student Progress Tracker & Badges Specification

## 1. Goal
Add a new feature to the workbook compiler that generates a "My Reading Journey" page at the beginning of the workbook (after the Table of Contents and before the first lesson). This page will feature a visual tracker where students can mark off or color in a badge/star for each lesson they complete, gamifying the learning experience.

## 2. Rationale
As per the product guidelines, the target audience is Grade 7-12 and eventually Primary Grades 3-6. Gamification elements like progress tracking directly increase student engagement, motivation, and the perceived value of the physical workbook.

## 3. Features
- **Visual Progress Grid:** Automatically generate a grid of "badges" (e.g., star icons or stylized lesson numbers) corresponding to the number of lessons in the compiled workbook.
- **Dynamic Sizing:** The grid should dynamically size or wrap based on the number of lessons.
- **Thematic Integration:** The design of the progress tracker should use the same theme colors defined for the series (e.g., 'primary', 'secondary').
- **Dashboard Toggle:** Add an option in the dashboard compilation UI to include or exclude the progress tracker.

## 4. Technical Approach
- Extend `WorkbookDocumentOptions` in `dashboard/lib/workbook-document-wrapper.ts` to include `includeProgressTracker?: boolean;`.
- Add a new function `generateProgressTracker(tocEntries: TocEntry[], theme: ThemeColors): string` that builds the HTML.
- Inject the HTML between the TOC and the first lesson.
- Add CSS styles to `getPrintStyles` for the progress tracker page.
- Update the compilation UI in the dashboard (`dashboard/app/projects/[id]/page.tsx` or `dashboard/components/...`) to include a checkbox for "Include Progress Tracker".
- Pass the flag down through the compilation stack.