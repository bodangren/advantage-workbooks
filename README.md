# Reading Advantage Workbook Generator

A tool to generate printable, CEFR-aligned English learning workbooks from JSON data. This system allows you to compile multiple lessons into a single, beautifully formatted PDF workbook complete with a cover page, table of contents, and automatic pagination.

## Features

- **Dynamic Content:** Create lessons using simple JSON files.
- **Automated Layout:** Generates a professional print layout (Paged.js) with page numbers and headers.
- **Multiple Levels:** Supports CEFR A1, A2, and B1 lesson structures.
- **Compilation:** Merge multiple lesson files into one complete workbook.
- **Template-Based:** Uses a flexible Handlebars HTML template for easy styling updates.

## How to Use

### 1. Generate a Workbook (No Installation Required)

1.  Clone or download this repository.
2.  Open **`workbook_compiler_paged.html`** in your web browser (Chrome, Edge, or Firefox recommended).
3.  **Select Files:**
    *   **Template:** Choose `workbook_template.html`.
    *   **Preface:** Choose `preface_data.json` (defines the intro text for different levels).
    *   **Lesson Content:** Select one or more `content_*.json` files. You can select multiple files at once (hold `Ctrl` or `Cmd`).
4.  Click **"Compile Workbook"**.
5.  A new tab will open with the preview.
6.  **Print to PDF:** Press `Ctrl+P` (or `Cmd+P`), select "Save as PDF", and ensure "Background graphics" is enabled in the print settings.
7.  **Lesson Ordering:** The compiler sorts files alphabetically. To control the lesson order, name your files with numbers, e.g., `1_intro.json`, `2_history.json`. The compiler will automatically renumber them as "Lesson 1", "Lesson 2", etc.

### 2. Creating New Lessons

To create a new lesson, create a `.json` file that follows the schema below.

#### JSON Schema Requirements

Your JSON file must contain the following fields. See `template_data_structure.json` for a full example.

| Field | Type | Description |
| :--- | :--- | :--- |
| `lesson_number` | String | E.g., "Lesson 1" |
| `lesson_title` | String | Title of the article |
| `level_name` | String | E.g., "Level 3" |
| `cefr_level` | String | E.g., "CEFR A1" |
| `article_type` | String | E.g., "Informational", "Narrative" |
| `genre` | String | E.g., "Nature", "History" |
| `vocabulary` | Array | List of objects with `word`, `phonetic`, `definition` |
| `article_image_url` | String | URL to the main image |
| `article_caption` | String | Caption for the image |
| `article_paragraphs` | Array | List of objects with `number`, `text` |
| `comprehension_questions` | Array | List of objects with `number`, `question`, `options` (array) |
| `short_answer_question` | String | The main thinking question |
| `sentence_starters` | Array | List of strings to help students start writing |
| `vocab_match` | Array | Matching exercise: `number`, `word`, `letter`, `definition` |
| `vocab_fill` | Array | Fill-in-blanks: `number`, `sentence` (use `<span class="blank"></span>`) |
| `vocab_word_bank` | Array | List of words for the word bank |
| `sentence_order_questions` | Array | List of objects with `words` (array of scrambled words) |
| `sentence_completion_prompts` | Array | List of objects with `number`, `prompt` |
| `writing_prompt` | String | The final long-answer writing prompt |
| `mc_answers` | Array | Answer key for multiple choice: `number`, `letter`, `text` |
| `vocab_match_answer_string` | String | Answer key string (e.g., "1-c, 2-d...") |
| `vocab_fill_answer_string` | String | Answer key string |
| `sentence_order_answers` | Array | Answer key: `number`, `sentence` |
| `translation_paragraphs` | Array | List of objects with `label` (e.g., "Paragraph 1"), `text` |

### 3. Validating Your Content

We have provided a JSON schema and a validator script to ensure your content files are correctly formatted.

1.  **Install Requirement:**
    ```bash
    pip install jsonschema
    ```
2.  **Run Validator:**
    ```bash
    python3 validate_content.py
    ```
    This script checks all `content_*.json` files in the directory against `schema.json` and reports any errors.

## File Structure

*   `workbook_compiler_paged.html` - The main tool for building the workbook.
*   `workbook_template.html` - The HTML/Handlebars template for a single lesson.
*   `preface_data.json` - Text for the workbook introduction.
*   `content_*.json` - Example lesson content files.
