# Reading Advantage Workbook Generator

A professional web-based dashboard for creating and managing printable, CEFR-aligned English learning workbooks. This system provides a user-friendly interface for creating lessons, uploading images, and compiling beautifully formatted PDF workbooks.

## 🚀 New: Next.js Dashboard (Recommended)

The workbook generator now includes a modern web dashboard for easier content management!

### Quality & Testing
- ✅ Strict ESLint and TypeScript validation enforced.
- ✅ Full Vitest suite with robust component and API tests passing.
- ✅ Regular security audits and automated dependency updates.
- ✅ Modular document generation architecture for maintainability.

### Features

- **Web-Based Interface:** Professional dashboard for managing workbook projects
- **Form-Based Editor:** Edit lesson content without touching JSON files
- **Image Upload:** Direct image upload with automatic path management
- **Live Preview:** Real-time preview of lessons using Paged.js
- **Batch Compilation:** One-click compilation of all lessons in a project
- **Goal Setting Worksheet:** Automatically generates a 'My English Learning Goals' section at the beginning of the workbook for students to set learning targets and action plans before starting.
- **Student Progress Tracker:** Automatically generates a 'My Reading Journey' progress tracking page with badge coloring for each lesson to gamify the workbook.
- **Student Self-Assessment:** Automatically generates a CEFR-aligned 'My Learning Reflection' page at the end of the workbook for students to evaluate their own reading, writing, and vocabulary skills.
- **Writing Task Digital Integration:** Implements the blended learning workflow by adding a Writing Practice QR code and AI Feedback Tracker to the writing section in the templates.
- **Automated Glossary Generation:** Automatically extracts and deduplicates vocabulary from all lessons to generate an alphabetical glossary at the end of the workbook
- **Automated Answer Key Generation:** Automatically extracts answers from each lesson and generates a formatted Answer Key section at the end of the workbook
- **Automated Teacher's Guide:** Generates a complete 1-page summary per lesson at the end of the workbook including vocabulary, comprehension questions, and writing rubrics for classroom instruction.
- **Printable Vocabulary Flashcards:** Automatically generates a printable vocabulary flashcards section at the end of the workbook for students to cut out, fold, and practice.
- **Spelling Practice Generator:** Automatically generates a 'Spelling Practice' section at the end of the workbook for students to practice 'Look, Trace, Write, Check' for lesson vocabulary.
- **Certificate of Completion:** Automatically generates a professional certificate at the end of the workbook for students to get signed by their teacher.
- **Improved PDF Printing:** Optimized printing workflow directly from the Next.js compilation page with correctly rendered Paged.js paginated outputs and print dialog handling.
- **Teacher Manual Generation:** Automatically generates a complete per-workbook Teacher Manual — front matter, per-lesson 4-period teaching plans (student-view step inserts, teaching notes, bell-ringers, spelling, and online components), and end matter — in English or Thai.
- **Mobile Responsive:** Works on desktop and mobile devices
- **Schema Validation:** Automatic validation ensures data integrity
- **Project Management:** Organize workbooks by project folders
- **Thematic Cover Pages:** Automatically generated CSS-based full-bleed cover pages matching the Origins, Quest, Adventure, Hero, and Legend series themes.

### Getting Started with the Dashboard

1. **Install Dependencies:**
   ```bash
   cd dashboard
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open Your Browser:**
   Navigate to `http://localhost:3000`

4. **Create a New Project:**
   - Click "New Project" on the homepage
   - Enter your project name
   - Start adding lessons!

5. **Edit Lessons:**
   - Fill in the form fields (title, vocabulary, article, questions)
   - Upload images directly through the interface
   - Save changes with real-time validation

6. **Preview & Export:**
   - Use "Show Preview" to see how your lesson will look
   - Navigate to the project page and click "Compile All Lessons"
   - Use your browser's print function (Ctrl+P) to save as PDF

### Teacher Manual Generation

Every workbook project can generate a separate, printable **Teacher Manual** — a companion document that turns the workbook's 13 lesson steps into a 4-period classroom plan.

**What it produces:**

- **Front matter** — title page, an introduction to the 4-period model and blended learning, the per-period lesson structure, pedagogical guidelines (pair work, discussion techniques, app usage), a flashcard games guide, a spelling routine guide, and a goal-setting introduction.
- **Per-lesson 4-period plans** — one plan per workbook lesson, each split into four teaching periods:
  - **Period 1 (Steps 1–4) — Launch & Vocabulary:** Before You Read, Key Vocabulary, Read the Article, Collect Vocabulary
  - **Period 2 (Steps 5–7) — Deep Reading & Comprehension:** Deep Reading Notes, Collect Sentences, Comprehension Check
  - **Period 3 (Steps 8–10) — Response & Practice:** Guided Response, Vocabulary Practice, Sentence Practice
  - **Period 4 (Steps 11–13) — Writing & Reflection:** Guided Writing, Language Questions, Lesson Reflection
  - Every step includes a realistic **"Student View" insert** of the corresponding workbook page plus **teaching notes** (teacher actions, teacher language, student actions, watch-fors). Each period also adds a **bell-ringer** (flashcard activity), a **spelling** component (periods 2–4: trace → write → cover-and-write), and **online components** (app article reading, extensive reading, app vocabulary review, AI writing feedback).
- **End matter** — a self-assessment administration guide, certificate ceremony tips, and troubleshooting for common classroom issues.

**How to use it:**

1. Open a project in the dashboard and click **"Teacher Manual"** (next to "Compile All").
2. The preview page compiles all lessons into one paginated document; choose **English** or **ไทย** with the language selector.
3. Click **Print** (or Ctrl+P / Cmd+P) and save as PDF — **"Background graphics" MUST be enabled** in More Settings, with margins set to **Default** or **None**.

You can also fetch the raw HTML directly:

```bash
curl "http://localhost:3000/api/projects/<projectId>/teacher-manual?lang=en"  # or lang=th
```

See [docs/teacher-manual.md](./docs/teacher-manual.md) for the full 4-period structure, and [this preview screenshot](./docs/screenshots/teacher-manual-preview.jpg) for a look at the rendered output.

For detailed documentation, see [dashboard/README.md](./dashboard/README.md)

---

## Legacy: HTML-Based Compiler

The original HTML-based compiler is still available for advanced users who prefer working directly with JSON files.

### Features

- **Dynamic Content:** Create lessons using simple JSON files
- **Automated Layout:** Generates a professional print layout (Paged.js)
- **Multiple Levels:** Supports CEFR A1, A2, and B1 lesson structures
- **Template-Based:** Uses a flexible Handlebars HTML template

## How to Use (Legacy Method)

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

## Convert

gs -dSAFER -dBATCH -dNOPAUSE -dNOCACHE -sDEVICE=pdfwrite      -sColorConversionStrategy=CMYK -dProcessColorModel=/DeviceCMYK      -sOutputFile=Quest_5_cmyk.pdf Reading\ Advantage\ Workbook\ -\ A2.pdf
