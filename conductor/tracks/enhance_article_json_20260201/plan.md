# Implementation Plan - Track: Enhance Article JSON with AI & Visuals

## Phase 1: Schema & Validation Update
- [ ] Task: Update `workbook_schema.ts` to support new metadata fields (`short_answer_hint`, `writing_plan_prompts`, `reflection_focus`)
    - [ ] Update Zod schema definition
    - [ ] Export new types
- [ ] Task: Refactor image handling in Schema
    - [ ] Deprecate `article_image_url`
    - [ ] Add `article_images` array (url, caption, position)
- [ ] Task: Update `validate_content.py` to check for new fields
    - [ ] Ensure backward compatibility (fields should be optional or have defaults)

## Phase 2: AI Content & Image Generation Script (TypeScript)
- [ ] Task: Create `augment_lesson.ts` script
    - [ ] Implement text generation logic (hints, specific prompts) using LLM
    - [ ] Implement image prompt generation based on paragraph content
- [ ] Task: Integrate Image Generation
    - [ ] Add logic to call `nanobanana` to create the inline images
    - [ ] Save generated images to the specific lesson folder
    - [ ] Update the JSON file with the new local image paths

## Phase 3: Template & Visual Implementation
- [ ] Task: Update `workbook_template.html` for Content
    - [ ] Render `short_answer_hint` in Section 8
    - [ ] Render `writing_plan_prompts` in Section 11
    - [ ] Render `reflection_focus` in Section 13
- [ ] Task: Update `workbook_template.html` for Images
    - [ ] Implement Handlebars logic to inject images into the article flow
    - [ ] Add CSS for floating images, captions, and responsive layout

## Phase 4: Verification
- [ ] Task: Run `ts-node augment_lesson.ts` on a sample lesson
- [ ] Task: Compile and verify the visual output in `workbook_compiler_paged.html`
- [ ] Task: Conductor - User Manual Verification 'Enhancements' (Protocol in workflow.md)
