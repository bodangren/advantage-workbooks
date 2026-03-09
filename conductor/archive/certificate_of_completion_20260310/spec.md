# Certificate of Completion Generation

## Objective
To add a high-value "Certificate of Completion" to the end of compiled workbooks. This feature adds gamification and serves as a reward that students can have signed by their teacher, fitting perfectly with our primary school support and blended learning program goals.

## Scope
- Add a new `includeCertificate` boolean to `WorkbookDocumentOptions` in `dashboard/lib/workbook-document-wrapper.ts`.
- Implement `generateCertificateSection` to render a styled certificate page.
- Add an option to the compilation UI (`dashboard/app/projects/[projectId]/compile/page.tsx`) to toggle the certificate.
- Parse the toggle via query parameters in the API (`dashboard/app/api/projects/[projectId]/compile/route.ts`).
- Update related tests and styles.

## Constraints
- Must look professional and "high-value".
- Should only print on the right side of the page (if double-sided, it may need `break-before: right`).
- The styles should be injected dynamically like other sections.