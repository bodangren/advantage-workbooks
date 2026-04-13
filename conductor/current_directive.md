# Current Directive: Lesson Editor Refactoring
The AI Content Orchestration track is complete. The new focus is refactoring the lesson editor page.tsx.

## Focus
- Refactor `dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx` (~900 lines) by extracting section-specific sub-editors.
- Follow the track spec in `conductor/tracks/lesson_editor_refactor_20260413/spec.md`.

## Constraints
- Maintain all existing functionality and test coverage.
- >80% test coverage on refactored modules.
- Zero TypeScript errors (`npx tsc --noEmit`).
- Do not change the lesson editor's external API or UX behavior.