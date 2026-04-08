# Current Directive: AI Content Orchestration
The E2E Testing & Visual Stabilization effort (Phases 1-11) is complete. The new focus is implementing AI Content Orchestration (Lesson-from-Source).

## Focus
- Implement the "New Lesson from Source" workflow per the track spec in `conductor/tracks/ai_content_orchestration_20260408/spec.md`.
- Follow the TDD plan in `conductor/tracks/ai_content_orchestration_20260408/plan.md`.
- Start with Phase 1: Foundation — Library & Schema Prep.

## Constraints
- All generated lessons MUST pass `WorkbookLessonSchema.safeParse()` validation.
- >80% test coverage on new modules.
- Zero TypeScript errors (`npx tsc --noEmit`).
- Do not modify the existing `augmentLesson` flow.