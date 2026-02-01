# Implementation Plan: Workbook Production Dashboard (Next.js)

## Phase 1: Environment Setup & Scaffolding [checkpoint: 20787db5]
- [x] Task: Initialize Next.js Application [1183578]
    - [x] Create Next.js app with TypeScript, Tailwind CSS, and App Router
    - [x] Configure `tsconfig.json` and `tailwind.config.ts` for project standards
    - [x] Set up basic folder structure (`components`, `lib`, `hooks`)
- [x] Task: Integrate Design System & Base Components [995471d]
    - [x] Install and configure UI component library (e.g., Shadcn UI / Radix)
    - [x] Create base layout with sidebar and main content area
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment Setup & Scaffolding' (Protocol in workflow.md) [20787db]

## Phase 2: Backend API & Local Filesystem Integration [checkpoint: b27e99f4]
- [x] Task: Define File System API [32e7f0f, 2f8ee9b]
    - [x] Implement API routes for listing directories (Workbook Projects)
    - [x] Implement API routes for reading/writing workbook JSON files
    - [x] Create utility for scaffolding new workbook directory structures
- [x] Task: Test-Driven Development (API) [801ca6c]
    - [x] Write tests for directory listing and project discovery logic
    - [x] Write tests for JSON read/write operations with safety checks
- [x] Task: Conductor - User Manual Verification 'Phase 2: Backend API & Local Filesystem Integration' (Protocol in workflow.md) [b27e99f4]

## Phase 3: Project Management & File Explorer [checkpoint: 6bbba42e]
- [x] Task: Workbook Explorer Interface [13e9370]
    - [x] Create dashboard view listing all folders in the root "Workbooks" directory
    - [x] Implement "New Project" modal that triggers directory scaffolding
- [x] Task: Lesson Browser [13e9370]
    - [x] Create view to list all `.json` files within a selected workbook project
    - [x] Implement "Add Lesson" functionality (UI button only, implementation in Phase 4)
- [x] Task: Conductor - User Manual Verification 'Phase 3: Project Management & File Explorer' (Protocol in workflow.md) [6bbba42e]

## Phase 4: Schema-Driven Form Editor
- [x] Task: Zod Schema Implementation [already done in Phase 2 - 32e7f0f]
    - [x] Migrate `workbook_schema.ts` to the Next.js project
    - [x] Implement client-side validation logic using Zod
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