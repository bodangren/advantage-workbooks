# Implementation Plan - Track: Enhance Article JSON with AI & Visuals

## Phase 1: Schema & Type System Updates [checkpoint: d83e6c1]
- [x] Task: Update `/dashboard/lib/workbook-schema.ts` to support new metadata fields - 98b0c65
    - [x] Add `short_answer_hint` (optional string)
    - [x] Add `writing_plan_prompts` (optional array of strings)
    - [x] Add `reflection_focus` (optional string)
    - [x] Export updated TypeScript types
- [x] Task: Add multi-image support to schema - 15e61e9
    - [x] Create `ArticleImageSchema` for image objects (url, caption, position)
    - [x] Add `article_images` array field (optional)
    - [x] Keep `article_image_url` for backward compatibility
- [x] Task: Create Vitest tests for new schema fields - 15e61e9
    - [x] Test validation of new optional fields
    - [x] Test `article_images` array structure validation
    - [x] Test backward compatibility with lessons missing new fields

## Phase 2: Next.js Editor UI Updates
- [ ] Task: Update lesson editor form in `/dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`
    - [ ] Add input field for `short_answer_hint`
    - [ ] Add array input for `writing_plan_prompts` (3 prompts)
    - [ ] Add input field for `reflection_focus`
- [ ] Task: Add multi-image management UI
    - [ ] Create interface to manage `article_images` array
    - [ ] Add position selector (hero, inline-para-1, inline-para-2, etc.)
    - [ ] Integrate with existing ImageUpload component
    - [ ] Add caption input for each image

## Phase 3: Template & Visual Implementation
- [ ] Task: Update `/workbook_template.html` for new content fields
    - [ ] Render `short_answer_hint` in short answer section
    - [ ] Render `writing_plan_prompts` in writing planning section
    - [ ] Render `reflection_focus` in reflection section
    - [ ] Add fallback logic for backward compatibility
- [ ] Task: Update `/workbook_template.html` for multi-image support
    - [ ] Add Handlebars helper/logic to render `article_images` array
    - [ ] Implement position-based image injection (hero, inline-para-N)
    - [ ] Add CSS for magazine-style image layouts (floats, captions)
    - [ ] Ensure responsive design for images

## Phase 4: AI Content Generation Script (Optional/Future)
- [ ] Task: Create `/dashboard/scripts/augment_lesson.ts` (if needed)
    - [ ] Set up LLM integration for content generation
    - [ ] Generate `short_answer_hint` based on short_answer_question
    - [ ] Generate `writing_plan_prompts` based on writing_prompt
    - [ ] Generate `reflection_focus` based on article content
- [ ] Task: Add image prompt generation (if using nanobanana)
    - [ ] Generate image prompts from paragraphs
    - [ ] Integrate with nanobanana API
    - [ ] Save images to project folders
    - [ ] Update JSON with image paths

## Phase 5: Testing & Verification
- [ ] Task: Create tests for new schema fields
    - [ ] Unit tests for schema validation
    - [ ] Integration tests for editor UI
    - [ ] Template rendering tests
- [ ] Task: Manual verification
    - [ ] Test lesson editor with new fields
    - [ ] Test preview with multi-image layout
    - [ ] Test compilation with enhanced lessons
    - [ ] Verify backward compatibility with old lessons
