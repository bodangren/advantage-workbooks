# Specification: Writing Task Digital Integration

## 1. Objective
Implement the blended learning writing workflow described in the product plan. Specifically, add a QR code linked to the platform's writing practice and a tracker for students to record their AI feedback score.

## 2. Requirements
1. **Schema Update**: Introduce an optional `writing_practice_url` in the `WorkbookLessonSchema` (`dashboard/lib/workbook-schema.ts`).
2. **Renderer Update**: Enhance `dashboard/lib/template-renderer.ts` to generate `writing_qr_code_url`. If `writing_practice_url` is not provided, fall back to appending `/writing` to the `article_url`.
3. **Template UI Changes**:
   - In both `primary_template.html` and `secondary_template.html`, modify the `.writing-section`.
   - Add a designated area after the "Plan Your Writing" section that includes:
     - The Writing Task QR Code ("Scan to type and get AI feedback").
     - An AI Feedback score box ("My AI Score: _____ / 100").
     - A checkbox: "[ ] I typed my draft in the app".
4. **Validation**: Write tests confirming that the new schema field is accepted, and that the renderer accurately resolves the writing QR code.

## 3. Design
- Follow the existing `.qr-box` design pattern from the "Scan to read in the app" section.
- Ensure the layout degrades gracefully if no URLs are provided, but since the product is app-integrated, assume URL availability.
- Print media queries should ensure the QR boxes don't get cut off at page boundaries.