# Specification: Interactive AI Dashboard & Image Generation

## Overview
Implement an interactive AI-powered workflow within the Next.js Lesson Editor. This includes automated metadata generation (Magic Wand), a "Visual Break" image generator, and real-time image previews. The system will be configurable via `.env.local` to support modern Gemini 3 models.

## Functional Requirements

### 1. Configuration (`.env.local`)
- Support the following environment variables:
    - `GEMINI_TEXT_MODEL`: Default `gemini-3-flash-preview`
    - `GEMINI_IMAGE_MODEL`: Default `gemini-3-pro`
- The system must pull these values at runtime for all AI operations.

### 2. Metadata "Magic Wand"
- Add a button: `✨ Auto-Fill Metadata`.
- **Logic:** Calls a Server Action/API route.
- **Context:** Sends `lesson_title`, `article_paragraphs`, `short_answer_question`, and `writing_prompt`.
- **Output:** Populates `short_answer_hint`, `writing_plan_prompts`, and `reflection_focus` in the UI.

### 3. Visual Break Image Generator
- Dedicated slot in the editor labeled **"Visual Break Image"**.
- Default position: `writing-prompt`.
- **Workflow:**
    1. **Generate Prompt Button:** Sends **Lesson Title + FULL Article Text + Writing Prompt** to `GEMINI_TEXT_MODEL`.
    2. **User Review:** Displays the generated prompt in an editable text area.
    3. **Create Image Button:** Sends the (edited) prompt to `GEMINI_IMAGE_MODEL` via the `nanobanana` integration.
    4. **Auto-Save:** Saves the generated image to the project folder and updates the lesson JSON.

### 4. Image Previews
- Implement real-time thumbnails for:
    - Main Article Image.
    - Visual Break Image.
- Previews must update immediately after upload or generation.

## Technical Constraints
- **Model Versions:** NEVER use Gemini 2.0. Strictly use Gemini 3.x as configured in `.env.local`.
- **Context Isolation:** Use the specific context mapping defined for each AI task to ensure high-quality output.
- **Backward Compatibility:** All new fields must be optional.
