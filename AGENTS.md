# Reading Advantage Workbook Generator

## Project Overview
This project is a tool for generating professional, printable English learning workbooks from JSON content files. It is designed to support the "Reading Advantage" series, aligning with CEFR levels and a "Hero's Journey" thematic progression.

The system separates content (JSON) from presentation (HTML/CSS), using a browser-based compiler to merge them into a paginated PDF-ready format.

## Core Technologies
*   **Content:** JSON files defining lessons (articles, vocab, questions).
*   **Validation:** Python script (`validate_content.py`) using `jsonschema`.
*   **Schema Definition:** TypeScript (`workbook_schema.ts`) using Zod, and JSON Schema (`schema.json`).
*   **Rendering:** HTML5 + Handlebars.js (templating) + Paged.js (print layout).

## Key Files & Directories

### Root Directory
*   `workbook_compiler_paged.html`: **Main Application.** Open this in a browser to generate workbooks. It accepts the template and content files as input.
*   `workbook_template.html`: The Handlebars HTML template defining the visual layout of a single lesson.
*   `validate_content.py`: Script to validate all `content_*.json` files against `schema.json`.
*   `workbook_schema.ts`: The "source of truth" for the data structure, defined using Zod.
*   `schema.json`: The JSON schema export used by the Python validator.
*   `preface_data.json`: Contains introductory text for different workbook levels.
*   `reading_advantage_workbook_series_plan.md`: High-level product roadmap and design document for the workbook series.

### Content Files
*   `content_*.json`: Lesson content files. Naming convention: `content_[level]_[id].json`.
    *   Examples: `content_a1_level2.json`, `content_b1_level8_nessie.json`.
*   `template_data_structure.json`: A reference file showing a complete, empty structure for a new lesson.

## Usage Workflow

### 1. Content Creation
Create or edit a `.json` file. Refer to `workbook_schema.ts` or `template_data_structure.json` for the required fields. Key fields include:
*   `lesson_title`, `cefr_level`
*   `article_paragraphs`
*   `vocabulary` (word, definition)
*   `comprehension_questions`
*   `writing_prompt`

### 2. Validation
Before compiling, ensure the JSON is valid to prevent rendering errors.
```bash
# Install dependency if needed
pip install jsonschema

# Run validator
python3 validate_content.py
```

### 3. Compilation (Browser)
1.  Open `workbook_compiler_paged.html` in a modern browser (Chrome/Edge recommended for Paged.js).
2.  **Select Files:**
    *   **Template:** `workbook_template.html`
    *   **Preface:** `preface_data.json`
    *   **Content:** Select one or more `content_*.json` files.
3.  Click **"Compile Workbook"**.
4.  Preview the output in the new tab.

### 4. PDF Generation
1.  In the preview tab, press `Ctrl+P` (Print).
2.  Destination: "Save as PDF".
3.  **Important:** Enable "Background graphics".
4.  Save the file.

## Development Constraints & Style
*   **JSON Strictness:** The compiler is sensitive to missing fields. Always validate.
*   **Paged.js:** Layout is handled by Paged.js. CSS changes for print layout should be tested in the browser's print preview.
*   **File Naming:** The compiler sorts lessons alphabetically by filename. Number files (e.g., `01_lesson.json`, `02_lesson.json`) to control order.

## Series Context
*   **Levels:**
    *   A1: Origins
    *   A2: Quest
    *   B1: Adventure
    *   B2: Hero
    *   C1: Legend
*   **Structure:** Each workbook contains ~25 readings (24 articles + 1 story chapter).
