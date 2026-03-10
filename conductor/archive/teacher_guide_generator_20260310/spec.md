# Teacher Guide Generation

## Problem Statement
Currently, workbooks contain a lot of student-facing material but lack a consolidated resource for teachers to use in the classroom. Teachers need a quick reference guide that provides an overview of each lesson, key vocabulary, and guidance on the writing task to effectively teach in a blended learning environment.

## Solution
Generate a "Teacher's Guide" section at the end of the compiled workbook (optional toggle in the UI). This section will contain a 1-page summary per lesson, including:
- Lesson Title, Number, Genre, and CEFR Level
- Key Vocabulary words and definitions
- Writing Prompt and a basic suggested marking rubric/guidance
- Comprehension Question Answers (or a summary of them)

## Implementation Details
1. **`dashboard/lib/workbook-document-wrapper.ts`**:
   - Define `TeacherGuideEntry` interface.
   - Add `teacherGuide` array and `includeTeacherGuide` boolean to `WorkbookDocumentOptions`.
   - Implement `generateTeacherGuideSection()` to render the HTML structure.
2. **`dashboard/app/api/projects/[projectId]/compile/route.ts`**:
   - Parse `includeTeacherGuide` from query params.
   - Map lessons to `TeacherGuideEntry` objects.
   - Pass them to `wrapWorkbookDocument`.
3. **`dashboard/app/projects/[projectId]/compile/page.tsx`**:
   - Add UI state and checkbox for `includeTeacherGuide`.
   - Append to API query params.
4. **CSS updates**: Add print styles for the Teacher Guide section to ensure it breaks pages appropriately and looks distinct from student content.
5. **Testing**: Add unit tests for the HTML generation in `__tests__/workbook-document-wrapper.test.ts`.

## Success Criteria
- [ ] Users can toggle "Include Teacher's Guide" on the compile page.
- [ ] The Teacher's Guide renders a separate section with 1 page per lesson.
- [ ] The generated HTML passes automated tests.
- [ ] Production build succeeds.
