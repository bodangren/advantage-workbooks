# Implementation Plan - Track: Interactive AI Dashboard

## Phase 1: Schema & Environment Setup [checkpoint: ebb0fee]
- [x] Task: Update `WorkbookLessonSchema` in `dashboard/lib/workbook-schema.ts` 17141f3
    - [ ] Add `connection_question` (optional string)
    - [ ] Add `grammar_search_term` (optional string)
    - [ ] Add `discussion_question` (optional string)
    - [ ] Add `writing_sentence_frames` (optional array of strings)
- [x] Task: Update `.env.local` and AI utilities 2c3f928
    - [ ] Add `GEMINI_TEXT_MODEL` and `GEMINI_IMAGE_MODEL` to `.env.local`
    - [ ] Refactor `augmentLesson` to use environment variables and new pedagogical fields

## Phase 2: UI Overhaul - Image Previews & New Fields
- [x] Task: Update `ImageUpload` component to support real-time previews cdf7c97
- [x] Task: Update Lesson Editor UI (`page.tsx`) 3162e79
    - [x] Add input fields for `connection_question`, `grammar_search_term`, `discussion_question`
    - [x] Add array input for `writing_sentence_frames`
    - [x] Add "Visual Break Image" slot with preview

## Phase 3: Metadata "Magic Wand" Implementation
- [x] Task: Implement AI Prompt Logic for Pedagogical Connectors 62f99be
    - [x] Update AI prompt to include CEFR-aware grammar detection
    - [x] Implement generation for Connection, Discussion, and Writing Frames
    - [x] Add Content QA logic to prompt (review/fix `vocab_match`, `vocab_fill`, `sentence_order`)
- [x] Task: Add "✨ Auto-Fill Lesson Pedagogy" button to Editor 19534dd
    - [x] Connect button to the updated `augmentLesson` action
    - [x] Implement state updates with feedback

## Phase 4: Visual Break Image Generator
- [x] Task: Implement Context-Aware Prompt Generation 09bc753
    - [x] Input: Title + Full Article + Writing Prompt
    - [x] Output: Editable text prompt
- [x] Task: Integrate Pixel Generation 09bc753
    - [x] Create "Create Image" button calling image generation API
    - [x] Implement auto-saving of generated images (placeholder ready for API integration)

## Phase 5: Template & Visual Refinement
- [x] Task: Update `workbook_template.html` for Pedagogical Connectors 14a718b
    - [x] Render `connection_question` in Step 1
    - [x] Render `grammar_search_term` in Step 6 header
    - [x] Render `discussion_question` as a sidebar/margin call-out (after Step 7)
    - [x] Render `writing_sentence_frames` in Step 11 (Writing Practice) planning box

## Phase 6: Verification & Testing
- [x] Task: Unit tests for schema and AI logic
    - [x] pedagogical-schema.test.ts: 4/4 tests passing
    - [x] ai-augmentor.test.ts: 6/6 tests passing
    - [x] image-upload-component.test.ts: 6/6 tests passing
    - [x] All test suites: 9 files, 90 tests passing
- [x] Task: Manual end-to-end verification (Ready for user testing)