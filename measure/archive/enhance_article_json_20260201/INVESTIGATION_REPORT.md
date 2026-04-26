# Investigation Report - Track: enhance_article_json_20260201
**Date**: 2026-02-01
**Investigator**: Claude (new developer)
**Context**: Previous developer's work unreliable, complete audit performed

## Executive Summary
Schema and tests are solid. UI exists but has critical runtime issues:
- Template caching prevents seeing changes
- React hooks cause modal/data loading failures
- Print functionality completely broken (no CSS, duplicate buttons)
- Two-column layout may not render due to caching

## What's Actually Working ✅

### Schema & Type System
- ✅ All new fields correctly defined as optional in Zod schema
- ✅ `short_answer_hint`: optional string
- ✅ `writing_plan_prompts`: optional string array
- ✅ `reflection_focus`: optional string
- ✅ Multi-image support: `article_images` with ArticleImageSchema
- ✅ Backward compatibility maintained
- ✅ TypeScript types exported correctly
- ✅ 18/18 schema tests passing

### Editor UI
- ✅ Form fields exist for all new metadata
- ✅ Multi-image management UI implemented
- ✅ Position selectors with correct enum values
- ✅ Image upload integration working
- ✅ JSON editing for arrays

### Test Suite
- ✅ All 73 tests pass across 6 test files
- ⚠️ BUT: Tests validate code structure, NOT rendered output (previous dev's mistake repeated)

## Critical Issues Found ❌

### Issue 1: Missing Print CSS (SEVERE)
**Files**: `workbook_template.html`

**Problems**:
1. `force-page-break` class used in HTML (line 1543) but NO CSS definition exists
2. ZERO `@media print` rules in entire template
3. NO page break styling for `.phase-3` sections (should start new page)
4. NO print-specific layout adjustments

**Impact**: Print pagination completely broken, all content runs together

**Evidence**:
```html
<!-- Line 1543 - Answer Key section -->
<section class="section force-page-break">
```

```grep
# Search for .force-page-break CSS:
$ grep "\.force-page-break" workbook_template.html
# Result: No matches found
```

### Issue 2: Multiple Print Buttons (CONFIRMED)
**Files**:
- `components/lesson-preview.tsx` (lines 44-49)
- `app/projects/[projectId]/lessons/[lessonId]/preview/page.tsx` (lines 103-106)

**Problems**:
1. Two separate print buttons in different components
2. Both call `iframe.contentWindow.print()` but in different contexts
3. No coordination between them
4. Confusing UX - users don't know which to use

**Impact**: Inconsistent print behavior, user confusion

### Issue 3: React Hook Dependencies (PERFORMANCE/DATA ISSUES)
**File**: `app/projects/[projectId]/lessons/[lessonId]/page.tsx`

**Problems**:

1. **Infinite re-render risk** (line 90):
   ```typescript
   const updatePreview = useCallback(async (currentLesson) => {
     if (renderingPreview) return;
     // ...
   }, [renderingPreview]); // ← BUG: recreates callback when state changes
   ```

2. **Excessive re-renders** (lines 92-96):
   ```typescript
   useEffect(() => {
     if (showPreview) {
       updatePreview(lesson);
     }
   }, [lesson, showPreview, updatePreview]); // ← Updates on EVERY keystroke
   ```

3. **Unstable defaults object** (lines 42-51):
   ```typescript
   const defaults = { /* ... */ }; // ← Recreated every render
   ```
   Used in dependencies, causing unnecessary re-fetches

**Impact**:
- Preview re-renders on every keystroke
- Race conditions when closing modal
- Data loading failures
- Poor performance

### Issue 4: Two-Column Layout Not Rendering (SUSPECTED CACHING)
**File**: `workbook_template.html`

**Status**: CSS is CORRECT but user reports single-column rendering

**CSS** (line 276):
```css
.practice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
}
```

**HTML** (line 1155):
```handlebars
<div class="practice-grid">
    {{#each comprehension_questions}}
    <div class="question-box">
        <!-- ... -->
    </div>
    {{/each}}
</div>
```

**Hypothesis**: Template caching issue (previous dev confirmed this problem existed)

### Issue 5: Template Caching/Hot Reload
**Confirmed by Previous Developer's Retrospective**

> "The development environment persisted stale versions of the Handlebars template. While unit tests passed (reading the file fresh), the running application served cached content."

**Impact**: Code changes don't appear in browser, creating false sense of completion

## Additional Findings

1. **No responsive print media queries**: Template needs `@media print` rules
2. **Phase 3 pagination missing**: Sections with `.phase-3` class should start new page
3. **Duplicate print logic**: Preview component and preview page have conflicting implementations
4. **Template renderer caching**: API route may cache compiled Handlebars template

## Recommendations

### Priority 1: Fix Template Caching/Hot-Reload
- Investigate template compilation/caching in `/api/render` route
- Ensure Handlebars template recompiles in development mode
- Add cache-busting for template changes
- Verify changes appear immediately after save

### Priority 2: Fix Modal/Data Loading
- Refactor `updatePreview` to remove `renderingPreview` from dependencies
- Debounce preview updates instead of updating on every keystroke
- Move `defaults` outside component or use `useMemo`
- Fix race condition when closing modal

### Priority 3: Fix Print Functionality
- Add comprehensive `@media print` CSS rules
- Define `.force-page-break` class with proper page-break styling
- Add page breaks before `.phase-3` sections
- Consolidate to single print button with correct context
- Ensure only workbook content prints (not dashboard UI)

## Files Requiring Changes

### High Priority
1. `/api/render` route (template caching investigation)
2. `app/projects/[projectId]/lessons/[lessonId]/page.tsx` (React hooks)
3. `workbook_template.html` (print CSS)
4. `components/lesson-preview.tsx` (print button consolidation)
5. `app/projects/[projectId]/lessons/[lessonId]/preview/page.tsx` (print button)

### Medium Priority
6. Template renderer cache invalidation
7. Print button UX consolidation

## Next Steps
1. Create new implementation plan with proper phases
2. Start with template caching fix (can't verify other fixes until this works)
3. Then fix React hooks (modal issues)
4. Finally implement print CSS (easiest to verify once caching fixed)
