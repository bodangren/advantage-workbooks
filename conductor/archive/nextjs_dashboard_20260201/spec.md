# Specification: Workbook Production Dashboard (Next.js Migration)

## 1. Overview
This track aims to transform the existing workbook generation tools into a professional, web-based dashboard using Next.js. The goal is to empower non-technical employees to manage, edit, and compile complex English learning workbooks through a user-friendly interface that handles folder structures, live previews, and batch processing automatically.

## 2. Functional Requirements

### 2.1 Project & Folder Management
- **Folder-as-Project:** Each workbook is represented by a directory containing its JSON content, configurations, and assets.
- **Project Scaffolding:** Users can create new workbook projects from a "New Project" button, which automatically generates the required sub-folder structure and default configuration files.
- **File Explorer:** A specialized view to navigate through existing workbook projects on the local filesystem.

### 2.2 Content Editing
- **Form-Based Editor:** A structured interface for editing lesson JSON data (titles, articles, vocabulary, questions) without touching raw code.
- **Visual Feedback:** The form editor will include styling/layout hints that mimic the look and feel of the final printed output.
- **Schema Validation:** Real-time validation (via Zod/JSON Schema) to ensure data integrity before saving.

### 2.3 Preview & Compilation
- **Live Preview:** A split-screen or toggleable view showing how the current lesson will look in print using Paged.js.
- **Batch Compilation:** A one-click feature to process all JSON files within a project folder into a single, paginated HTML/PDF preview.
- **Asset Management:** Automated handling of images; the system should ensure images are correctly referenced and stored within the project directory.

## 3. Technical Requirements
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS (incorporating Material Design principles).
- **Templating:** Re-use and adapt the existing Handlebars-based `workbook_template.html`.
- **Backend:** Node.js (via Next.js API routes) for direct filesystem access (local development mode).
- **Printing:** Paged.js for rendering the print-ready layout in the browser.

## 4. Acceptance Criteria
- [ ] A new Next.js application is scaffolded and replaces the static HTML compiler.
- [ ] Users can create a new workbook folder via the UI.
- [ ] Users can edit lesson data via a form and save it back to the local `.json` file.
- [ ] A "Compile All" function successfully generates a multi-page preview of all lessons in a project folder.
- [ ] The system prevents saving if the JSON content does not meet the schema requirements.

## 5. Out of Scope
- Multi-user authentication/accounts (initially designed as a local-first tool).
- Cloud-based storage (PostgreSQL/S3); the system will interact with the local filesystem.
- Advanced WYSIWYG inline text editing (focus remains on form-based data entry).