# Implementation Plan: Print Compilation Fixes

## Phase 1: QR Code Generation

- [x] Task: Add qrcode-generator dependency
    - [x] Install `qrcode-generator` package via npm
    - [x] Verify package installation with a simple test

- [x] Task: Implement server-side QR code generation utility
    - [x] Write unit tests for `generateQRCode(url)` function
    - [x] Create `lib/qr-generator.ts` with SVG data URL generation
    - [x] Handle edge cases (null URL, empty URL, generation failure)

- [x] Task: Integrate QR generation into template renderer
    - [x] Write unit test verifying QR code is added when `article_url` exists
    - [x] Write unit test verifying manual `qr_code_url` is preserved over auto-generation
    - [x] Update `prepareLessonData()` in `lib/template-renderer.ts` to call QR generator

- [x] Task: Conductor - User Manual Verification 'Phase 1: QR Code Generation' (Protocol in workflow.md) a65cd5f

## Phase 2: Full Document Wrapper for Compilation [checkpoint: a65cd5f]

- [x] Task: Create workbook document wrapper module
    - [x] Write unit tests for `wrapWorkbookDocument()` function
    - [x] Create `lib/workbook-document-wrapper.ts` with:
        - [x] Paged.js script injection
        - [x] Title page HTML generation
        - [x] Preface section HTML generation
        - [x] TOC HTML generation with `target-counter` support
        - [x] Print CSS with `@page` rules
        - [x] Screen CSS for preview display

- [x] Task: Create/extend preface data loading
    - [x] Write unit test for loading preface data by level
    - [x] Create or extend API to load `preface_data.json` content
    - [x] Map level keys to appropriate preface text

- [x] Task: Integrate wrapper into compile API
    - [x] Write integration test for full document compilation
    - [x] Update `/api/projects/[projectId]/compile/route.ts` to use wrapper
    - [x] Verify title page, preface, TOC, and lessons all render

- [~] Task: Conductor - User Manual Verification 'Phase 2: Full Document Wrapper' (Protocol in workflow.md)

## Phase 3: Print CSS and Paged.js Configuration

- [ ] Task: Implement comprehensive print stylesheet
    - [ ] Write test verifying print CSS is included in compiled output
    - [ ] Define `@page` rules (size, margins, page numbers)
    - [ ] Define `@page :first` for title page (no page number)
    - [ ] Define break rules (break-after, break-inside: avoid)
    - [ ] Define screen preview styles (.pagedjs_pages, .pagedjs_page)

- [ ] Task: Configure Paged.js for proper rendering
    - [ ] Verify Paged.js loads correctly in iframe preview
    - [ ] Verify page counter works for TOC page numbers
    - [ ] Test with multiple lessons (5+) to verify pagination

- [ ] Task: Add print instructions to UI
    - [ ] Add tooltip or info text explaining "Enable Background Graphics" for printing
    - [ ] Add print instructions modal or collapsible section

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Print CSS and Paged.js' (Protocol in workflow.md)

## Phase 4: End-to-End Testing and Polish

- [ ] Task: E2E test for full compilation workflow
    - [ ] Write E2E test creating project with multiple lessons
    - [ ] Verify compile returns valid HTML with all sections
    - [ ] Verify QR codes are present in output
    - [ ] Verify TOC contains all lessons

- [ ] Task: Manual print verification
    - [ ] Test print preview in Chrome
    - [ ] Test print preview in Edge
    - [ ] Verify page breaks are sensible
    - [ ] Verify page numbers are correct

- [ ] Task: Update documentation
    - [ ] Update AGENTS.md with printing instructions
    - [ ] Document the new compilation structure

- [ ] Task: Conductor - User Manual Verification 'Phase 4: End-to-End Testing' (Protocol in workflow.md)
