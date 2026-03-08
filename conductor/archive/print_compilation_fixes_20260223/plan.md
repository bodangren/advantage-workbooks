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

- [x] Task: Conductor - User Manual Verification 'Phase 2: Full Document Wrapper' (Protocol in workflow.md) 96f3775

## Phase 3: Print CSS and Paged.js Configuration [checkpoint: 96f3775]

- [x] Task: Implement comprehensive print stylesheet
    - [x] Write test verifying print CSS is included in compiled output
    - [x] Define `@page` rules (size, margins, page numbers)
    - [x] Define `@page :first` for title page (no page number)
    - [x] Define break rules (break-after, break-inside: avoid)
    - [x] Define screen preview styles (.pagedjs_pages, .pagedjs_page)

- [x] Task: Configure Paged.js for proper rendering
    - [x] Verify Paged.js loads correctly in iframe preview
    - [x] Verify page counter works for TOC page numbers
    - [x] Test with multiple lessons (5+) to verify pagination

- [x] Task: Add print instructions to UI
    - [x] Add tooltip or info text explaining "Enable Background Graphics" for printing
    - [x] Add print instructions modal or collapsible section

- [x] Task: Conductor - User Manual Verification 'Phase 3: Print CSS and Paged.js' (Protocol in workflow.md) 396bd36

## Phase 4: End-to-End Testing and Polish [checkpoint: 396bd36]

- [x] Task: E2E test for full compilation workflow
    - [x] Write E2E test creating project with multiple lessons
    - [x] Verify compile returns valid HTML with all sections
    - [x] Verify QR codes are present in output
    - [x] Verify TOC contains all lessons

- [x] Task: Manual print verification
    - [x] Test print preview in Chrome
    - [x] Test print preview in Edge
    - [x] Verify page breaks are sensible
    - [x] Verify page numbers are correct

- [x] Task: Update documentation
    - [x] Update AGENTS.md with printing instructions
    - [x] Document the new compilation structure

- [x] Task: Conductor - User Manual Verification 'Phase 4: End-to-End Testing' (Protocol in workflow.md) b2df76a
