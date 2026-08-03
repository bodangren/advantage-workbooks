# Track: Lesson Editor Refactoring

## Overview

The `dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx` file is approximately 900 lines and contains the entire lesson editor UI. This track extracts discrete section editors into separate components to improve maintainability and reduce the cognitive load of working in this file.

## Problem Statement

The lesson editor page.tsx handles 7 distinct UI sections:
1. Basic Information
2. Article (paragraphs)
3. Vocabulary
4. Pedagogical Connectors
5. Comprehension Questions
6. Writing Prompt
7. Lesson Reflection

All state management, form handling, and rendering logic is in a single ~900 line file, making it difficult to:
- Understand and modify individual sections in isolation
- Test individual section behaviors
- Onboard new developers to the codebase
- Make parallel changes to different sections

## Solution

Extract each section into its own sub-editor component in `dashboard/components/lesson-editor/`:

```
dashboard/components/lesson-editor/
├── BasicInfoEditor.tsx
├── ArticleEditor.tsx
├── VocabularyEditor.tsx
├── PedagogicalConnectorsEditor.tsx
├── ComprehensionQuestionsEditor.tsx
├── WritingPromptEditor.tsx
└── LessonReflectionEditor.tsx
```

The main `page.tsx` will import and compose these components, passing necessary state and callbacks via props. Shared types and interfaces will be moved to `dashboard/components/lesson-editor/types.ts`.

## Refactoring Principles

1. **No behavior changes**: All existing functionality must be preserved exactly
2. **Minimal prop surface**: Extract props that each section actually needs, not the entire lesson object
3. **Shared utilities**: Common helper functions (debounce, formatters) moved to shared utils
4. **Testability**: Each sub-editor should be independently testable
5. **Backward compatibility**: The page.tsx exports the same API (same URL routes, same data flow)

## Component Specifications

### BasicInfoEditor
- Props: `title`, `description`, `cefrLevel`, `onChange` callbacks
- Handles: lesson title, description, CEFR level selection

### ArticleEditor
- Props: `paragraphs`, `onChange`
- Handles: article paragraph list with add/remove/reorder, image association

### VocabularyEditor
- Props: `vocabulary`, `onChange`
- Handles: vocabulary list with word, phonetic, definition, thai_definition

### PedagogicalConnectorsEditor
- Props: `connectors` (short_answer_hint, reflection_focus, etc.), `onChange`
- Handles: hint text, reflection prompts, grammar search, discussion questions

### ComprehensionQuestionsEditor
- Props: `questions`, `onChange`
- Handles: multiple-choice questions with add/remove/edit

### WritingPromptEditor
- Props: `writingPrompt`, `writingPlanPrompts`, `onChange`
- Handles: writing prompt text and plan prompts

### LessonReflectionEditor
- Props: `reflection`, `onChange`
- Handles: reflection focus text

## Constraints

- Do not change any API routes or data flow
- Do not modify the lesson schema
- Maintain all existing validation logic
- >80% test coverage on new component files
- Zero TypeScript errors
- All existing E2E tests must pass