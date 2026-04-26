# Implementation Plan: Workbook Production Dashboard (Next.js)

## Phase 1: Environment Setup & Scaffolding [checkpoint: 20787db5]
- [x] Task: Initialize Next.js Application [1183578]
    - [x] Create Next.js app with TypeScript, Tailwind CSS, and App Router
    - [x] Configure `tsconfig.json` and `tailwind.config.ts` for project standards
    - [x] Set up basic folder structure (`components`, `lib`, `hooks`)
- [x] Task: Integrate Design System & Base Components [995471d]
    - [x] Install and configure UI component library (e.g., Shadcn UI / Radix)
    - [x] Create base layout with sidebar and main content area
- [x] Task: Measure - User Manual Verification 'Phase 1: Environment Setup & Scaffolding' (Protocol in workflow.md) [20787db]

## Phase 2: Backend API & Local Filesystem Integration [checkpoint: b27e99f4]
- [x] Task: Define File System API [32e7f0f, 2f8ee9b]
    - [x] Implement API routes for listing directories (Workbook Projects)
    - [x] Implement API routes for reading/writing workbook JSON files
    - [x] Create utility for scaffolding new workbook directory structures
- [x] Task: Test-Driven Development (API) [801ca6c]
    - [x] Write tests for directory listing and project discovery logic
    - [x] Write tests for JSON read/write operations with safety checks
- [x] Task: Measure - User Manual Verification 'Phase 2: Backend API & Local Filesystem Integration' (Protocol in workflow.md) [b27e99f4]

## Phase 3: Project Management & File Explorer [checkpoint: 6bbba42e]
- [x] Task: Workbook Explorer Interface [13e9370]
    - [x] Create dashboard view listing all folders in the root "Workbooks" directory
    - [x] Implement "New Project" modal that triggers directory scaffolding
- [x] Task: Lesson Browser [13e9370]
    - [x] Create view to list all `.json` files within a selected workbook project
    - [x] Implement "Add Lesson" functionality (UI button only, implementation in Phase 4)
- [x] Task: Measure - User Manual Verification 'Phase 3: Project Management & File Explorer' (Protocol in workflow.md) [6bbba42e]

## Phase 4: Schema-Driven Form Editor [checkpoint: 9fac0842]
- [x] Task: Zod Schema Implementation [already done in Phase 2 - 32e7f0f]
    - [x] Migrate `workbook_schema.ts` to the Next.js project
    - [x] Implement client-side validation logic using Zod
- [x] Task: Build Dynamic Form Editor [1bd9dcc]
    - [x] Implement auto-generating form fields based on the workbook schema
    - [x] Add "Visual Hints" to form fields (e.g., Article text area styled like a page)
    - [x] Implement auto-save or "Save Changes" functionality with API integration
- [ ] Task: Measure - User Manual Verification 'Phase 4: Schema-Driven Form Editor' (Protocol in workflow.md)
- [ ] **FUTURE ENHANCEMENT:** Replace JSON textarea fields with dynamic list components
    - [ ] Article paragraphs: Add/remove individual paragraph items (number + text) without JSON editing
    - [ ] Vocabulary: Add/remove individual vocabulary items (word + definition + phonetic) without JSON editing
    - [ ] Comprehension questions: Add/remove individual question items (number + question + options) without JSON editing
    - [ ] Sentence starters, matching, fill, word bank: Similar dynamic list components
- [x] Task: Zod Schema Implementation [already done in Phase 2 - 32e7f0f]
    - [x] Migrate `workbook_schema.ts` to the Next.js project
    - [x] Implement client-side validation logic using Zod
- [x] Task: Build Dynamic Form Editor [1bd9dcc]
    - [x] Implement auto-generating form fields based on the workbook schema
    - [x] Add "Visual Hints" to form fields (e.g., Article text area styled like a page)
    - [x] Implement auto-save or "Save Changes" functionality with API integration
- [x] Task: Measure - User Manual Verification 'Phase 4: Schema-Driven Form Editor' (Protocol in workflow.md) [9fac0842]

## Phase 5: Preview Engine & Compilation [checkpoint: 195faf64]
- [x] Task: Integrate Paged.js & Handlebars [3761486]
    - [x] Port the existing Handlebars logic into a React component or utility
    - [x] Create a Live Preview pane that renders the current JSON via Paged.js
- [x] Task: Batch Compilation Logic [1fa6622]
    - [x] Implement logic to concatenate all lessons in a project for single-tab preview
    - [x] Create "Export/Print" button that triggers the browser's print dialog
- [x] Task: Measure - User Manual Verification 'Phase 5: Preview Engine & Compilation' (Protocol in workflow.md)

## Phase 6: Asset Management & Final Polish [checkpoint: 3d083de]
- [x] Task: Image Handling [8b366a4]
    - [x] Implement API for uploading images directly to the project folder
    - [x] Update JSON paths automatically when images are moved/added
- [x] Task: Final System Integration & QA [cf6c89a]
    - [x] Verify full end-to-end flow from project creation to batch PDF export
    - [x] Ensure mobile responsiveness for the dashboard interface
- [ ] Task: Measure - User Manual Verification 'Phase 6: Asset Management & Final Polish' (Protocol in workflow.md)