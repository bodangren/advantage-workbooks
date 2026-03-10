# Refactor Workbook Document Wrapper

## Objective
Extract the generated printable sections from `dashboard/lib/workbook-document-wrapper.ts` into separate files. This addresses the tech debt item of `workbook-document-wrapper.ts` growing beyond a manageable size.

## Current State
`workbook-document-wrapper.ts` contains all interfaces, utility functions (e.g. `escapeHtml`, `getThemeColors`), and section generators (`generateTitlePage`, `generatePrefaceSection`, etc.) in a single file (~1200 lines).

## Desired State
- The core wrapper logic and types are organized into a logical structure.
- Interfaces and common utility functions (`escapeHtml`, `getThemeColors`, `getPrintStyles`) are placed in their own modules.
- Each section generator is placed in a separate file under `dashboard/lib/document/` or `dashboard/lib/sections/`.
- `workbook-document-wrapper.ts` imports these modular components to assemble the final HTML.

## Requirements
- No functional changes to the generated HTML.
- All tests must pass.
- Project must build successfully.