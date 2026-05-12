# Implementation Plan: Teacher Manual Thai Localization

## Phase 1: i18n Infrastructure

### Task 1.1: Create i18n Module
- [x] Create `dashboard/lib/teacher-manual/i18n/index.ts`
  - Export `TranslationKeys` type with all string keys
  - Export `getTranslations(lang: string)` function
  - Fallback to English for unknown langs
- [x] Create `dashboard/lib/teacher-manual/i18n/en.ts`
  - Extract all hardcoded English strings from front-matter, teaching-notes, step-insert, period-plan, lesson-plan, end-matter
  - Organize by module namespace (e.g., `frontMatter.titlePage.badge`)
- [x] Create `dashboard/lib/teacher-manual/i18n/th.ts`
  - Thai translations for all keys
  - Use Sarabun-compatible Thai text (proper Thai orthography)

### Task 1.2: Update Types
- [x] Add `lang?: 'en' | 'th'` to `TeacherManualOptions` in `types.ts`
- [ ] Update `STEP_TITLES` to accept language parameter or use translated lookup
- [ ] Update `PERIOD_MAP` similarly

### Task 1.3: Verify TypeScript
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Build passes

---

## Phase 2: Front Matter Localization

### Task 2.1: Refactor front-matter.ts
- [x] Add `lang` parameter to `generateFrontMatter()` and all internal functions
- [x] Replace hardcoded English strings with `t('key')` lookups
- [x] Keys: title badge ("Teacher's Manual" → "คู่มือครู"), subtitle, preface, period overview, pedagogy headers/content, flashcard game names/instructions, spelling routine descriptions, goal-setting steps
- [ ] Test: English output identical to current

### Task 2.2: Verify English Regression
- [ ] Compile teacher manual with `lang=en` (or no lang)
- [ ] Diff output against baseline — must be identical

---

## Phase 3: Teaching Notes Localization

### Task 3.1: Refactor teaching-notes.ts
- [x] Add `lang` parameter to `getTeachingNotes()` and `renderTeachingNotes()`
- [x] Replace hardcoded strings in all 13 step note blocks with `t()` lookups
- [x] Keys per step: `teacherActions[]`, `teacherLanguage[]`, `studentActions[]`, `watchFor[]`
- [x] Render section headers ("Teacher Actions" → "พฤติกรรมครู", etc.)

### Task 3.2: Verify English Regression
- [ ] English output identical

---

## Phase 4: Step Insert Localization

### Task 4.1: Refactor step-insert.ts
- [x] Add `lang` parameter to `renderStepInsert()` and all 13 render functions
- [x] Translate UI labels: "Student View" → "มุมมองนักเรียน", "Step" → "ขั้นตอน"
- [x] Translate activity headers: "Match the Words" → "จับคู่คำศัพท์", "Fill in the Blanks" → "เติมคำในช่องว่าง", etc.
- [x] Translate instructions within each step insert
- [x] Preserve lesson content (vocab, article text, questions) from JSON as-is

### Task 4.2: Verify English Regression
- [ ] English output identical

---

## Phase 5: Period Plan Localization

### Task 5.1: Refactor period-plan.ts
- [x] Add `lang` parameter to `buildPeriodPlan()`, `renderPeriodPlan()`, and helper functions
- [x] Translate bell-ringer titles/instructions and game variation names
- [x] Translate spelling activity titles/instructions
- [x] Translate online component descriptions
- [x] Translate period titles ("Launch & Vocabulary" → "เปิดตัวและคำศัพท์", etc.)

### Task 5.2: Verify English Regression
- [ ] English output identical

---

## Phase 6: Lesson Plan & End Matter Localization

### Task 6.1: Refactor lesson-plan.ts
- [x] Add `lang` parameter to `buildLessonPlan()` and `renderLessonPlan()`
- [x] Translate objectives, genre/type labels, duration text

### Task 6.2: Refactor end-matter.ts
- [x] Add `lang` parameter to `generateEndMatter()` and all internal functions
- [x] Translate self-assessment guide, certificate guide, troubleshooting sections

### Task 6.3: Verify English Regression
- [ ] English output identical

---

## Phase 7: Compiler & API Integration

### Task 7.1: Update Compiler
- [x] Add `lang` parameter to `compileTeacherManual()` signature
- [x] Pass `lang` through to all sub-modules (front-matter, lesson-plan, end-matter)
- [x] Pass `lang` through buildPeriodPlan → buildLessonPlan chain

### Task 7.2: Update API Route
- [x] Read `?lang=th` query parameter in `route.ts`
- [x] Validate lang value (only 'en' and 'th' accepted)
- [x] Pass to `compileTeacherManual()`
- [x] Include `lang` in response metadata

### Task 7.3: Update Preview Page
- [x] Add language toggle dropdown to preview page header
- [x] Pass `?lang=` param when fetching from API
- [x] Reload preview when language changes

---

## Phase 8: Font & Print Styling

### Task 8.1: Add Sarabun Font
- [x] Import Sarabun from Google Fonts in `document-wrapper.ts` (HTML `<head>`)
- [x] Add CSS: `body, .tm-section { font-family: 'Sarabun', sans-serif; }` when `lang=th`
- [x] Apply `lang` attribute to `<html>` element: `<html lang="th">` for Thai

### Task 8.2: Thai Text CSS Adjustments
- [x] Add `word-break: break-word` for Thai text containers
- [ ] Test print layout with Thai content
- [ ] Adjust any overflow issues from longer/shorter Thai strings

### Task 8.3: Print Test
- [ ] Open Thai manual in browser print preview
- [ ] Verify Sarabun renders correctly
- [ ] Verify page breaks and layout are clean
- [ ] Save as PDF and review

---

## Phase 9: Testing & Validation

### Task 9.1: English Regression Test
- [x] Compile with `lang=en` (or no param)
- [ ] Verify identical output to pre-localization baseline
- [ ] No visual changes

### Task 9.2: Thai Compilation Test
- [ ] Compile with `?lang=th`
- [ ] Verify all 14 lessons render
- [ ] Verify front matter is fully Thai
- [ ] Verify end matter is fully Thai
- [ ] Verify teaching notes are Thai
- [ ] Verify step insert labels are Thai
- [ ] Verify period plan labels are Thai

### Task 9.3: Build Verification
- [x] `npx tsc --noEmit` — zero errors
- [x] `npm run build` — passes
- [x] No new lint errors

---

## Phase 10: Documentation & Cleanup

### Task 10.1: Update Documentation
- [ ] Document the `?lang=th` parameter in code comments
- [ ] Note the i18n module structure for future language additions

### Task 10.2: Final Review
- [ ] Clean up any debug code
- [ ] Verify no regressions in workbook compilation
- [x] Run full build

## Success Criteria

- Thai manual compiles in < 10 seconds for 14 lessons
- English output is byte-identical to pre-localization version
- Sarabun renders correctly in print
- Dashboard preview toggle works smoothly
- Adding a third language in the future requires only a new `xx.ts` file

## Estimated Timeline

- Phase 1: 2-3 hours (i18n extraction is the bulk of the work)
- Phase 2-6: 1 hour each (mechanical replacement with t() calls)
- Phase 7: 1-2 hours (compiler + API + UI wiring)
- Phase 8: 1-2 hours (font + print testing)
- Phase 9: 1-2 hours (validation)
- Phase 10: 0.5-1 hour

**Total: ~10-15 hours**
