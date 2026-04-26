# Specification: E2E Testing & Visual Stabilization Phase 3

## Overview
As per the current directive, we must fix existing E2E test failures and stabilize the Paged.js print layout. Playwright tests currently face flakiness when toggling workbook sections. Furthermore, previous lessons learned indicate that explicit `@page` definitions in individual templates conflict with the global document wrapper, causing Paged.js print layout issues.

## Scope
- Address `compile-sections.spec.ts` failure where Playwright times out waiting for the iframe body after toggling compilation sections.
- Identify and remove explicit `@page` definitions in `@media print` within `primary_template.html` and `secondary_template.html`.
- Run full Vitest suite to ensure no regressions.
- Ensure the production build via `npm run build` succeeds.

## Out of Scope
- Creating new features.
- Major refactoring beyond targeted fixes.