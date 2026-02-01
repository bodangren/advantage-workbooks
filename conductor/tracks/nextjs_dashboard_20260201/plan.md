# Implementation Plan: Workbook Production Dashboard (Next.js)

## Phase 1: Environment Setup & Scaffolding
- [x] Task: Initialize Next.js Application [pending commit]
    - [x] Create Next.js app with TypeScript, Tailwind CSS, and App Router
    - [x] Configure `tsconfig.json` and `tailwind.config.ts` for project standards
    - [x] Set up basic folder structure (`components`, `lib`, `hooks`)
- [ ] Task: Integrate Design System & Base Components
    - [ ] Install and configure UI component library (e.g., Shadcn UI / Radix)
    - [ ] Create base layout with sidebar and main content area
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment Setup & Scaffolding' (Protocol in workflow.md)

## Phase 2: Backend API & Local Filesystem Integration
- [ ] Task: Define File System API
    - [ ] Implement API routes for listing directories (Workbook Projects)
    - [ ] Implement API routes for reading/writing workbook JSON files
    - [ ] Create utility for scaffolding new workbook directory structures
- [ ] Task: Test-Driven Development (API)
    - [ ] Write tests for directory listing and project discovery logic
    - [ ] Write tests for JSON read/write operations with safety checks
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend API & Local Filesystem Integration' (Protocol in workflow.md)

## Phase 3: Project Management & File Explorer
- [ ] Task: Workbook Explorer Interface
    - [ ] Create dashboard view listing all folders in the root "Workbooks" directory
    - [ ] Implement "New Project" modal that triggers directory scaffolding
- [ ] Task: Lesson Browser
    - [ ] Create view to list all `.json` files within a selected workbook project
    - [ ] Implement "Add Lesson" functionality
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Project Management & File Explorer' (Protocol in workflow.md)

## Phase 4: Schema-Driven Form Editor
- [ ] Task: Zod Schema Implementation
    - [ ] Migrate `workbook_schema.ts` to the Next.js project
    - [ ] Implement client-side validation logic using Zod
- [ ] Task: Build Dynamic Form Editor
    - [ ] Implement auto-generating form fields based on the workbook schema
    - [ ] Add "Visual Hints" to form fields (e.g., Article text area styled like a page)
    - [ ] Implement auto-save or "Save Changes" functionality with API integration
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Schema-Driven Form Editor' (Protocol in workflow.md)

## Phase 5: Preview Engine & Compilation
- [ ] Task: Integrate Paged.js & Handlebars
    - [ ] Port the existing Handlebars logic into a React component or utility
    - [ ] Create a Live Preview pane that renders the current JSON via Paged.js
- [ ] Task: Batch Compilation Logic
    - [ ] Implement logic to concatenate all lessons in a project for single-tab preview
    - [ ] Create "Export/Print" button that triggers the browser's print dialog
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Preview Engine & Compilation' (Protocol in workflow.md)

## Phase 6: Asset Management & Final Polish
- [ ] Task: Image Handling
    - [ ] Implement API for uploading images directly to the project folder
    - [ ] Update JSON paths automatically when images are moved/added
- [ ] Task: Final System Integration & QA
    - [ ] Verify full end-to-end flow from project creation to batch PDF export
    - [ ] Ensure mobile responsiveness for the dashboard interface
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Asset Management & Final Polish' (Protocol in workflow.md)