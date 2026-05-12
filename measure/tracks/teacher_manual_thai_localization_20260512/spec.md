# Specification: Teacher Manual Thai Localization

## Overview

Add Thai language support to the per-workbook teacher manual compiler. When compiled with `?lang=th`, the entire manual — titles, teaching notes, step labels, guidelines, troubleshooting, and all structural text — renders in Thai using the Sarabun font. English remains the default. Lesson content (article text, vocabulary definitions, comprehension questions) is pulled from the JSON as-is, but all generated UI/instructional strings are translated.

## Goals

1. **Full Thai translation** — every generated string (titles, instructions, teaching notes, guidelines, game descriptions, troubleshooting) renders in Thai
2. **API-driven language selection** — `?lang=th` query parameter on the teacher manual API route; English default
3. **Sarabun font** — imported from Google Fonts for proper Thai glyph rendering in Paged.js print output
4. **Dedicated i18n module** — `lib/teacher-manual/i18n/` with `en.ts` (default) and `th.ts` translation files
5. **Zero regression** — existing English output is unchanged when `lang` is omitted

## Non-Goals (Out of Scope)

- Bilingual (EN+TH side-by-side) output
- Translating lesson content (articles, vocabulary words, comprehension question text) — those come from JSON
- Thai localization of the dashboard UI itself (only the compiled teacher manual output)
- Other languages beyond English and Thai

## Technical Approach

### i18n Module Structure

```
dashboard/lib/teacher-manual/i18n/
├── index.ts          # Language registry, getTranslations(lang) helper
├── en.ts             # English strings (extracted from all modules)
└── th.ts             # Thai translations
```

### Translation Keys Organized by Module

**Front Matter keys** — title page badge, subtitle, preface headings, pedagogy section headers, flashcard game names/instructions, spelling routine descriptions, goal-setting steps

**Teaching Notes keys** — teacher actions, teacher language, student actions, watch-fors for all 13 steps

**Step Insert keys** — "Student View" label, "Step" badge, activity sub-headers ("Match the Words", "Fill in the Blanks", etc.), instructions

**Period Plan keys** — bell-ringer titles/instructions, game variation names, spelling activity titles/instructions, online component descriptions

**Lesson Plan keys** — objectives, genre/type labels, duration text

**End Matter keys** — self-assessment guide, certificate guide, troubleshooting problem/solution pairs

### Changes to Existing Modules

Each module (`front-matter.ts`, `teaching-notes.ts`, `step-insert.ts`, `period-plan.ts`, `lesson-plan.ts`, `end-matter.ts`) currently has hardcoded English strings. Each will:
1. Accept a `lang` parameter (or `translations` object)
2. Replace hardcoded strings with `t('key')` lookups
3. Fall back to English if key missing

### Compiler Signature Change

```typescript
// Before
compileTeacherManual(lessons, seriesName, seriesLevel, cefrLevel, type)

// After
compileTeacherManual(lessons, seriesName, seriesLevel, cefrLevel, type, lang = 'en')
```

### API Route Change

```typescript
// GET /api/projects/[projectId]/teacher-manual?lang=th
const lang = request.nextUrl.searchParams.get('lang') || 'en';
```

### Preview Page Change

Add a language toggle dropdown to the teacher manual preview page header.

### Font Loading

Add Sarabun (Thai) via `@import` or `<link>` in the document wrapper's `<head>` alongside existing fonts.

## Acceptance Criteria

- [ ] `?lang=th` returns a fully Thai teacher manual
- [ ] `?lang=en` or no param returns identical English output to current
- [ ] All 13 step teaching notes are translated
- [ ] Front matter sections (preface, pedagogy, flashcard games, spelling guide, goal setting) are translated
- [ ] End matter sections (self-assessment, certificate, troubleshooting) are translated
- [ ] Step insert labels ("Student View", activity headers) are translated
- [ ] Period plan labels (bell-ringer, spelling, online) are translated
- [ ] Sarabun font renders correctly in browser print preview
- [ ] No TypeScript errors
- [ ] Build passes

## Dependencies

- Existing teacher manual library (all 9 modules)
- Existing API route and preview page
- Google Fonts CDN for Sarabun

## Risks

1. **Thai text length** — Thai strings may be longer/shorter than English; CSS may need adjustment
2. **Sarabun availability** — If Google Fonts CDN is unavailable, Thai may fall back to system fonts
3. **Paged.js + Thai** — Thai word wrapping (no spaces between words) may need CSS `word-break` or `overflow-wrap` rules
4. **Translation accuracy** — pedagogical terms need context-aware translation, not literal
