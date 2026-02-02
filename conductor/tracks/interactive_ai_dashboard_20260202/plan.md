# Implementation Plan - Track: Interactive AI Dashboard

## Phase 1: Environment & API Setup
- [ ] Task: Update `.env.local` and `dashboard/lib/ai-augmentor.ts` to use configurable models
    - [ ] Add model variables to `.env.local`
    - [ ] Update `augmentLesson` to read from environment variables
    - [ ] Ensure Gemini 3 model compatibility
- [ ] Task: Create Server Action or API Route for Metadata Generation
    - [ ] Implement `/api/ai/augment` endpoint
    - [ ] Ensure it accepts full article context

## Phase 2: UI Overhaul - Image Previews
- [ ] Task: Update `ImageUpload` component to support previews
    - [ ] Add thumbnail display after upload
    - [ ] Support loading states
- [ ] Task: Add previews to Lesson Editor slots
    - [ ] Update Main Article Image slot
    - [ ] Add Visual Break Image slot with preview

## Phase 3: Metadata "Magic Wand" Implementation
- [ ] Task: Add Magic Wand button to Editor UI
    - [ ] Place button near metadata fields
    - [ ] Implement loading state and success feedback
    - [ ] Map API response to editor state

## Phase 4: Visual Break Image Generator
- [ ] Task: Implement Prompt Generation logic
    - [ ] Create `/api/ai/generate-prompt` endpoint
    - [ ] Input: Title + Full Article + Writing Prompt
- [ ] Task: Build Prompt Review UI
    - [ ] Add editable text area for generated prompts
- [ ] Task: Integrate Image Generation (NanoBanana)
    - [ ] Connect "Create Image" button to image model
    - [ ] Handle image saving and path updates

## Phase 5: Verification & Testing
- [ ] Task: Unit tests for new AI endpoints
- [ ] Task: Manual verification of the full AI workflow
