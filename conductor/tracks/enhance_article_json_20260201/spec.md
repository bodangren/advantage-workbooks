# Specification: Enhance Article JSON with AI & Visuals

## Overview
This track focuses on upgrading the existing JSON lesson structure to support a richer, more visually engaging workbook layout. We will integrate AI generation to populate new metadata fields and add support for multiple images per article, moving away from a single-image format to a more dynamic, magazine-style presentation.

## Functional Requirements

### 1. Enhanced JSON Schema
- **Update `workbook_schema.ts`** to include new fields for "individualized" lesson content:
    - `short_answer_hint`: Specific hint/guidance for the short answer question.
    - `writing_plan_prompts`: Array of specific prompts for the "Plan Your Writing" boxes (replacing generic labels).
    - `reflection_focus`: A specific question or thought to guide the "Lesson Reflection" section.
- **Update `article_images` field**:
    - Deprecate `article_image_url`.
    - Create `article_images` array containing objects with:
        - `url`: String (path to image).
        - `caption`: String (specific caption).
        - `position`: String (enum: 'hero', 'inline-para-1', 'inline-para-2', etc.) to allow flexible placement.

### 2. AI Content Generation
- **Script Update:** Modify or create a new TypeScript script to process existing JSON files.
- **AI Integration:** Use an LLM to generate the new fields (`short_answer_hint`, `writing_plan_prompts`, `reflection_focus`) based on the `article_paragraphs`.
- **Image Prompting:** Generate prompts for the additional inline images based on specific paragraphs.

### 3. Image Generation
- **Automated Sourcing:** Integrate `nanobanana` to generate the images based on the AI-generated prompts.
- **Storage:** Save images locally in the corresponding lesson directory.

### 4. Visual & Template Updates
- **Update `workbook_template.html`**:
    - Render the new specific hints and prompts in sections 8, 11, and 13.
    - Implement logic to inject inline images between paragraphs based on the `position` field.
    - Add CSS for "magazine-style" layouts (e.g., floated images, captions).

## Non-Functional Requirements
- **Backward Compatibility:** The compiler should still work (or gracefully degrade) if the new fields are missing from older JSON files.
- **Validation:** The `validate_content.py` script must be updated to validate the new schema rules.
