# Specification: Interactive AI Dashboard & Pedagogical Connectors

## Overview
Implement an interactive AI-powered workflow within the Next.js Lesson Editor. This track introduces "Pedagogical Connectors" that bridge the teacher-led app activities with the student's workbook, using context-aware AI generation (Gemini 3).

## Functional Requirements

### 1. Configuration (`.env.local`)
- Support configurable model names:
    - `GEMINI_TEXT_MODEL`: Default `gemini-3-flash-preview`
    - `GEMINI_IMAGE_MODEL`: Default `gemini-3-pro`
- All AI operations must pull these values at runtime.

### 2. Pedagogical "Magic Wand" (Metadata)
- Add a button: `✨ Auto-Fill Lesson Pedagogy`.
- **Logic:** Calls a Server Action with full context (Title, Text, Questions, CEFR Level).
- **Generated Fields:**
    - `connection_question`: (Step 1) A question to activate background knowledge before reading.
    - `grammar_search_term`: (Step 6) A CEFR-appropriate grammar challenge (e.g., "Find a sentence with 'can'").
    - `discussion_question`: (Step 7) A "Turn & Talk" prompt for partner discussion.
    - `short_answer_hint`: (Step 8) A hint guiding students to the correct part of the text.
    - `writing_sentence_frames`: (Step 13) 2-3 sentence starters to scaffold the writing prompt.
    - `reflection_focus`: (Step 15) A thought-provoking question for the closing reflection.
    - **Content QA:** The AI must also review and suggest corrections for existing practice sections (`vocab_match`, `vocab_fill`, `sentence_order_questions`) to fix errors like dropped punctuation or incomplete sentence components.

### 3. Visual Break Image Generator
- Dedicated slot in the editor labeled **"Visual Break Image"**.
- Position: `writing-prompt` (before the writing section).
- **Workflow:**
    1. **Generate Prompt Button:** Sends **Lesson Title + FULL Article Text + Writing Prompt** to `GEMINI_TEXT_MODEL`.
    2. **User Review:** Displays the generated prompt in an editable text area.
    3. **Create Image Button:** Sends the (edited) prompt to `GEMINI_IMAGE_MODEL` via the `nanobanana` integration.

### 4. UI & Template Enhancements
- **Image Previews:** Implement real-time thumbnails for the Main Article Image and the Visual Break Image.
- **Template Rendering:** Update `workbook_template.html` to render the new pedagogical fields in "Teacher-Led" tip boxes or specific section headers (e.g., Grammar Detective in the sentence collection header).

## Technical Constraints
- **Model Versions:** STRICTLY use Gemini 3.x as configured. NEVER use Gemini 2.0.
- **CEFR Alignment:** The AI prompt for `grammar_search_term` must explicitly use the lesson's `cefr_level` to ensure the challenge is appropriate.
- **Backward Compatibility:** All new fields must be optional in the Zod schema.