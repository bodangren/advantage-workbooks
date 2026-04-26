# Implementation Plan: Writing Task Digital Integration

## Phase 1: Data Model & Logic
- [ ] Modify `dashboard/lib/workbook-schema.ts` to add `writing_practice_url: z.string().optional()`.
- [ ] Modify `dashboard/lib/template-renderer.ts` to calculate the writing practice URL and generate its QR code.

## Phase 2: Template Modifications
- [ ] In `dashboard/templates/primary_template.html`, append the digital integration box (QR Code + AI Feedback Tracker) to the writing section.
- [ ] In `dashboard/templates/secondary_template.html`, mirror the layout from the primary template into the writing section.
- [ ] Add necessary CSS for `.writing-digital-integration` and `.ai-score-box`.

## Phase 3: Testing & Verification
- [ ] Add tests to verify the schema changes in `dashboard/__tests__/`.
- [ ] Verify unit tests pass with `npm run test` in `dashboard/`.
- [ ] Verify build succeeds with `npm run build` in `dashboard/`.

## Phase 4: Archiving
- [ ] Update `measure/tracks.md` with the new track.
- [ ] Archive the track directory to `measure/archive/`.
- [ ] Commit all changes with a descriptive message and push.