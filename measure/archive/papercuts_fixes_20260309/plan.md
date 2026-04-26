# Implementation Plan: Papercuts Fixes

## Phase 1: Investigate and Fix Compile Errors
- Identify the source of errors on `/projects/[id]/compile`.
- Review Next.js logs/console errors and fix type or logic issues.

## Phase 2: Fix Progress Tracker Overflow
- Locate the Progress Tracker component in `dashboard/templates`.
- Adjust CSS sizing, grid, flex wrap, or scale so it fits perfectly on a Paged.js printed page.

## Phase 3: Fix Print Button
- Identify where the "Print" button is implemented on the compile page.
- Apply CSS `@media print` rules to hide Next.js UI elements (`header`, `nav`, controls).
- Alternatively, modify the print handler to invoke print on the iframe containing the compiled output or ensure `Paged.js` styles correctly hide non-essential elements during print.

## Phase 4: Validation
- Run tests (`npm run test`).
- Run production build (`npm run build`).