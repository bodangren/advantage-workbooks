# Specification: Enhance Article JSON with AI & Visuals

## Overview
This track focuses on upgrading the existing JSON lesson structure in the Next.js dashboard to support a richer, more visually engaging workbook layout. We will integrate AI generation to populate new metadata fields and add support for multiple images per article, moving away from a single-image format to a more dynamic, magazine-style presentation.

## Architecture Context
This project uses a Next.js-based dashboard for content management:
- **Schema & Validation**: `/dashboard/lib/workbook-schema.ts` (Zod schemas with TypeScript types)
- **Editor UI**: `/dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`
- **Template**: `/workbook_template.html` (Handlebars, renders via `/dashboard/lib/template-renderer.ts`)
- **Testing**: `/dashboard/__tests__/*.test.ts` (Vitest test suites)

## Functional Requirements

### 1. Enhanced JSON Schema (Next.js)
- **Update `/dashboard/lib/workbook-schema.ts`** to include new fields for "individualized" lesson content:
    - `short_answer_hint`: String - Specific hint/guidance for the short answer question.
    - `writing_plan_prompts`: Array of strings - Specific prompts for the "Plan Your Writing" boxes (replacing generic labels).
    - `reflection_focus`: String - A specific question or thought to guide the "Lesson Reflection" section.
- **Update `article_images` field**:
    - Deprecate `article_image_url` (keep for backward compatibility).
    - Create `article_images` array (optional) containing objects with:
        - `url`: String (path to image).
        - `caption`: String (specific caption).
        - `position`: String (enum: 'hero', 'inline-para-1', 'inline-para-2', etc.) to allow flexible placement.

### 2. Editor UI Updates (Next.js)
- **Update `/dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`**:
    - Add form fields for the new metadata fields (`short_answer_hint`, `writing_plan_prompts`, `reflection_focus`).
    - Add UI for managing multiple images with captions and positions.
    - Ensure backward compatibility with existing lessons.

### 3. AI Content Generation Script
- **Create `/dashboard/scripts/augment_lesson.ts`**:
    - Script to process existing JSON files.
    - Use an LLM to generate the new fields (`short_answer_hint`, `writing_plan_prompts`, `reflection_focus`) based on `article_paragraphs`.
    - Generate prompts for additional inline images based on specific paragraphs.
    - Optionally integrate `nanobanana` to generate images from prompts.
    - Update JSON files with the new fields and image paths.

### 4. Visual & Template Updates
- **Update `/workbook_template.html`**:
    - Render `short_answer_hint` in the short answer section.
    - Render `writing_plan_prompts` in the writing planning section.
    - Render `reflection_focus` in the reflection section.
    - Implement Handlebars logic to inject multiple images from `article_images` array based on `position`.
    - Add CSS for "magazine-style" layouts (floated images, captions, responsive design).
    - Ensure hero images can wrap text with a **rectangular float** across multiple paragraphs (no forced clear after each paragraph).
    - Keep inline paragraph images constrained to a single paragraph (clear only conflicting floats as needed).

## Non-Functional Requirements
- **Backward Compatibility:** All new schema fields must be optional. The system must gracefully handle lessons without the new fields.
- **Validation:** Zod schema validation ensures type safety and data integrity at runtime.
- **Type Safety:** Ensure full TypeScript type coverage for new fields.
- **Testing:** Vitest unit tests must validate new schema fields and backward compatibility.
 - **Layout Simplicity:** Avoid introducing complex DTP features (e.g., hyphenation, footnotes) not needed for a write-in workbook.
