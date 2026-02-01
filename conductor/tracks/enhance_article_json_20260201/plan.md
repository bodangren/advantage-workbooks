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

## Phase 2: Next.js Editor UI Updates [checkpoint: 093e7e4]
- [x] Task: Update lesson editor form in `/dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx` - 59a6dc0
    - [x] Add input field for `short_answer_hint`
    - [x] Add array input for `writing_plan_prompts` (3 prompts)
    - [x] Add input field for `reflection_focus`
- [x] Task: Add multi-image management UI - 0b382e9
    - [x] Create interface to manage `article_images` array
    - [x] Add position selector (hero, inline-para-1, inline-para-2, etc.)
    - [x] Integrate with existing ImageUpload component
    - [x] Add caption input for each image
    - [x] Add 'Writing Prompt' and 'Vocabulary Section' to position options - de0fff9

## Phase 3: Template & Visual Implementation [checkpoint: a9b5357]
- [x] Task: Update `/workbook_template.html` for new content fields - d48051f
    - [x] Render `short_answer_hint` in short answer section
    - [x] Render `writing_plan_prompts` in writing planning section
    - [x] Render `reflection_focus` in reflection section
    - [x] Add fallback logic for backward compatibility
- [x] Task: Update `/workbook_template.html` for multi-image support - 9cb756f
    - [x] Add Handlebars helper/logic to render `article_images` array
    - [x] Implement position-based image injection (hero, inline-para-N)
    - [x] Add CSS for magazine-style image layouts (floats, captions)
    - [x] Ensure responsive design for images

## Phase 3.5: Template Visual Refinement [INCOMPLETE - FAILED]
- [x] Task: Implement two-column layout for practice sections to improve density - a13df41
- [x] Task: Refine section headers and remove "web-style" borders/shadows - a13df41
- [~] Task: Improve typography and spacing for a "typeset" book look
- [~] Task: Polish writing lines and input areas to look like professional workbook pages
- [ ] Task: Fix MCQ section to use two-column layout (FAILED: Persistently renders in single column despite template changes)
- [ ] Task: Fix Print functionality to print ONLY the workbook content (FAILED: Context isolation issues)

## Major Failings & Retrospective
1. **Template Caching & Hot Reloading:** The development environment persisted stale versions of the Handlebars template (`workbook_template.html`). While unit tests passed (reading the file fresh), the running application served cached content, leading to a disconnect between "verified" changes and what the user actually saw (e.g., MCQs remaining in single columns, fonts not updating).
2. **Print Context Isolation:** Implementation of printing failed to account for the browser's window context. Initial attempts printed the entire dashboard UI. Subsequent fixes to target the iframe window were not robust enough across different route implementations (Editor vs. Preview page), causing runtime errors and broken output.
3. **Visual Verification Gap:** Over-reliance on code changes and passing unit tests without sufficient manual verification of the *rendered* output in the browser led to claiming "complete" status while the user saw no visual improvement.
4. **Component Inconsistency:** The "Editor" preview and "Full Page" preview used disparate logic, causing fixes applied to one to fail in the other (e.g., missing imports, different styling injection).

## Phase 4 (NEW): Template Architecture & Caching Fix
- [x] Task: Move template into Next.js structure - TBD
    - [x] Create dashboard/templates/ directory
    - [x] Move workbook_template.html from root into dashboard/templates/
    - [x] Update template-renderer.ts path reference
- [x] Task: Fix template caching for hot-reload - TBD
    - [x] Disable template caching in development mode
    - [x] Read template fresh on every request in dev
    - [x] Keep caching enabled in production
    - [x] Verify hot-reload works (template changes appear immediately)

## Phase 5 (NEW): Modal & Data Loading Fix
- [x] Task: Refactor React hooks to fix re-render issues - TBD
    - [x] Move DEFAULTS and PLACEHOLDERS outside component
    - [x] Use useRef for renderingPreview instead of state dependency
    - [x] Remove dependencies from updatePreview callback
    - [x] Add AbortController for request cancellation
- [x] Task: Implement debounced preview updates - TBD
    - [x] Create useDebounce custom hook
    - [x] Apply 500ms debounce to preview updates
    - [x] Only update after user stops typing
- [x] Task: Add cleanup for modal close - TBD
    - [x] Add useEffect cleanup function
    - [x] Cancel pending requests on unmount
    - [x] Prevent race conditions

## Phase 6 (NEW): Print Functionality Fix
- [x] Task: Add @media print CSS to template - 777beff
    - [x] Define @media print block in template styles
    - [x] Set print-specific margins and backgrounds
    - [x] Adjust font sizes for print
    - [x] Hide non-printable elements
- [x] Task: Implement page break CSS classes - 777beff
    - [x] Define .force-page-break class with page-break-before
    - [x] Add page breaks before .phase-3 sections
    - [x] Test page breaks in print preview
- [x] Task: Consolidate print buttons - d83fc71
    - [x] Remove print button from LessonPreview component
    - [x] Keep single print button in preview page
    - [x] Ensure correct iframe context for printing
- [ ] Task: Test print functionality
    - [ ] Verify only workbook content prints (not dashboard)
    - [ ] Verify Answer Key starts on new page
    - [ ] Verify Phase 3 sections start on new pages
    - [ ] Test in Chrome, Firefox, Safari

## Phase 7: AI Content Generation Script (Optional/Future)
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

## Phase 8: Testing & Verification
- [ ] Task: Create tests for new schema fields
    - [ ] Unit tests for schema validation
    - [ ] Integration tests for editor UI
    - [ ] Template rendering tests
- [ ] Task: Manual verification
    - [ ] Test lesson editor with new fields
    - [ ] Test preview with multi-image layout
    - [ ] Test compilation with enhanced lessons
    - [ ] Verify backward compatibility with old lessons
