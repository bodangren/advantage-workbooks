# Specification: E2E Testing & Visual Stabilization Phase 11

## Overview
This track continues the focus on stabilizing the UI and ensuring consistency through comprehensive E2E testing and minor UI refinements. We will expand the lesson editor tests to verify persistence and interaction with AI-powered features.

## Functional Requirements

### 1. Enhanced E2E Testing for Lesson Editor
- **Persistence Verification:** Ensure that changes made to the lesson editor (titles, pedagogical connectors, vocabulary) are correctly saved and persist after a page reload.
- **AI Augmentation Interaction:** Test the "Auto-Fill Pedagogy" (Magic Wand) button. Since real AI might not be available in CI, we will verify the loading state and interaction.
- **Image Generation Prompt:** Verify that clicking "Generate Prompt" correctly populates the image prompt textarea.
- **Lesson Preview Persistence:** Ensure that the "Show Preview" toggle works as expected.

### 2. UI Refinement and Stabilization
- **Linting Fixes:** Resolve the unused `Plus` import in `projects/[projectId]/page.tsx` and the unnecessary eslint-disable in `coverage/block-navigation.js`.
- **UI Papercuts:** Audit the Lesson Editor for any visual inconsistencies, especially in spacing and typography.
- **Tailwind Standardization:** Ensure all components use consistent Tailwind classes for layout and styling.

## Technical Tasks
- Create `dashboard/e2e/lesson-persistence.spec.ts`.
- Update `dashboard/app/projects/[projectId]/page.tsx` to remove unused imports.
- Run a full linting and type check.
- Verify all E2E tests pass.
