# Implementation Plan

1. **Update Wrapper Options:** Modify `dashboard/lib/workbook-document-wrapper.ts` to include `includeCertificate?: boolean` in `WorkbookDocumentOptions`.
2. **Add CSS & HTML:** Add styles and the `generateCertificateSection` function.
3. **Update UI:** Modify `dashboard/app/projects/[projectId]/compile/page.tsx` to include a checkbox for the certificate.
4. **Update API:** Update `dashboard/app/api/projects/[projectId]/compile/route.ts` to pass the `includeCertificate` flag to the wrapper options.
5. **Testing:** Update or write new tests in `dashboard/__tests__/workbook-document-wrapper.test.ts` to verify the certificate is included when requested.
6. **Documentation:** Update README and lessons learned.