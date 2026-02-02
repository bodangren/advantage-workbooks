# Implementation Plan - Track: Interactive AI Dashboard

## Phase 1: Schema & Environment Setup
- [ ] Task: Update `WorkbookLessonSchema` in `dashboard/lib/workbook-schema.ts`
    - [ ] Add `connection_question` (optional string)
    - [ ] Add `grammar_search_term` (optional string)
    - [ ] Add `discussion_question` (optional string)
    - [ ] Add `writing_sentence_frames` (optional array of strings)
- [ ] Task: Update `.env.local` and AI utilities
    - [ ] Add `GEMINI_TEXT_MODEL` and `GEMINI_IMAGE_MODEL` to `.env.local`
    - [ ] Refactor `augmentLesson` to use environment variables and new pedagogical fields

## Phase 2: UI Overhaul - Image Previews & New Fields
- [ ] Task: Update `ImageUpload` component to support real-time previews
- [ ] Task: Update Lesson Editor UI (`page.tsx`)
    - [ ] Add input fields for `connection_question`, `grammar_search_term`, `discussion_question`
    - [ ] Add array input for `writing_sentence_frames`
    - [ ] Add "Visual Break Image" slot with preview

## Phase 3: Metadata "Magic Wand" Implementation
- [ ] Task: Implement AI Prompt Logic for Pedagogical Connectors
    - [ ] Update AI prompt to include CEFR-aware grammar detection
    - [ ] Implement generation for Connection, Discussion, and Writing Frames
- [ ] Task: Add "✨ Auto-Fill Lesson Pedagogy" button to Editor
    - [ ] Connect button to the updated `augmentLesson` action
    - [ ] Implement state updates with feedback

## Phase 4: Visual Break Image Generator
- [ ] Task: Implement Context-Aware Prompt Generation
    - [ ] Input: Title + Full Article + Writing Prompt
    - [ ] Output: Editable text prompt
- [ ] Task: Integrate Pixel Generation
    - [ ] Create "Create Image" button calling `GEMINI_IMAGE_MODEL`
    - [ ] Implement auto-saving of generated images

## Phase 5: Template & Visual Refinement
- [ ] Task: Update `workbook_template.html` for Pedagogical Connectors
    - [ ] Render `connection_question` in Step 1
    - [ ] Render `grammar_search_term` in Step 6 header
    - [ ] Render `discussion_question` as a sidebar/margin call-out
    - [ ] Render `writing_sentence_frames` in Step 13 planning box

## Phase 6: Verification & Testing
- [ ] Task: Unit tests for schema and AI logic
- [ ] Task: Manual end-to-end verification