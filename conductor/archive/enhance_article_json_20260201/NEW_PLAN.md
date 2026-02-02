# NEW Implementation Plan - Track: enhance_article_json_20260201
**Created**: 2026-02-01
**Based on**: Complete investigation of current state
**Replaces**: Previous developer's unreliable plan.md

## Status of Previous Work

### ✅ Completed & Working (Phases 1-2)
- [x] Schema updates with new metadata fields
- [x] Multi-image support in schema
- [x] Schema tests (all passing)
- [x] Editor UI form fields
- [x] Multi-image management UI

### ❌ Claimed Complete But Broken (Phase 3 & 3.5)
- [~] Template rendering (fields exist but caching issues prevent verification)
- [x] Print functionality (BROKEN - no CSS, duplicate buttons)
- [x] Two-column layouts (CSS exists but may not render due to caching)
- [x] Visual refinements (claimed done but not verified in browser)

## New Implementation Phases

### Phase 0: Environment & Caching Fix (PREREQUISITE)
**Goal**: Ensure template changes appear immediately in dev environment

#### Task 0.1: Investigate template caching in render API
- [ ] Read `/api/render` route implementation
- [ ] Identify where Handlebars template is compiled/cached
- [ ] Determine if template is cached in memory between requests
- [ ] Check for any Next.js module caching of template file

#### Task 0.2: Implement cache-busting for development
- [ ] Disable template caching in development mode
- [ ] Force fresh file read of `workbook_template.html` on each render
- [ ] Add file timestamp check or use `fs.watch` for changes
- [ ] Test: Change template HTML, verify change appears without server restart

#### Task 0.3: Verify template hot-reload works
- [ ] Make test change to template (add visible HTML comment)
- [ ] Save file
- [ ] Refresh browser preview
- [ ] Confirm change appears immediately
- [ ] If not, investigate Next.js caching of API route module

**Acceptance Criteria**:
- Template changes appear in preview within 2 seconds of save
- No server restart required
- Change visible in both editor preview modal and preview page

**CRITICAL**: Cannot proceed to Phase 1 until this works. All other fixes are unverifiable if template caching persists.

---

### Phase 1: Fix Modal & Data Loading Issues
**Goal**: Eliminate race conditions, excessive re-renders, and data loading failures

#### Task 1.1: Refactor updatePreview callback
- [ ] Remove `renderingPreview` from useCallback dependency array
- [ ] Use ref for `renderingPreview` state instead of including in deps
- [ ] Add proper abort controller for fetch cancellation
- [ ] Test: Verify callback doesn't recreate unnecessarily

#### Task 1.2: Debounce preview updates
- [ ] Install or implement debounce utility
- [ ] Debounce `updatePreview` calls (500ms delay)
- [ ] Only update preview when user stops typing
- [ ] Test: Type quickly, verify preview only updates after pause

#### Task 1.3: Stabilize defaults object
- [ ] Move `defaults` object outside component (const at module level)
- [ ] Or use `useMemo` with empty dependency array
- [ ] Remove defaults from any dependency arrays
- [ ] Test: Verify no unnecessary re-renders

#### Task 1.4: Fix modal close behavior
- [ ] Add cleanup in useEffect return function
- [ ] Cancel pending preview updates when modal closes
- [ ] Clear preview HTML state when closing (optional)
- [ ] Test: Open modal, close immediately, verify no errors in console

#### Task 1.5: Test modal data loading
- [ ] Open editor
- [ ] Open preview modal
- [ ] Make edits
- [ ] Close modal
- [ ] Reopen modal
- [ ] Verify data still loads correctly, no console errors

**Acceptance Criteria**:
- No console errors when opening/closing modal rapidly
- Preview updates only after user stops typing (debounced)
- No infinite render loops
- Data loads correctly after modal close/reopen cycle

---

### Phase 2: Fix Print Functionality
**Goal**: Add proper print CSS and consolidate print buttons

#### Task 2.1: Add @media print rules to template
- [ ] Add `@media print` block to `workbook_template.html` styles
- [ ] Hide page backgrounds in print (set to white)
- [ ] Adjust margins for print (0.5in recommended)
- [ ] Ensure font sizes are print-appropriate
- [ ] Test: Print preview in browser, check formatting

#### Task 2.2: Implement page break CSS
- [ ] Define `.force-page-break` class:
   ```css
   .force-page-break {
     page-break-before: always;
     break-before: page;
   }
   ```
- [ ] Add page break before `.phase-3` sections:
   ```css
   .section.phase-3 {
     page-break-before: always;
     break-before: page;
   }
   ```
- [ ] Test: Print preview, verify Answer Key on new page
- [ ] Test: Print preview, verify Phase 3 sections on new pages

#### Task 2.3: Add print-specific layout adjustments
- [ ] Force single-column layout for print if needed
- [ ] Adjust image sizes for print
- [ ] Hide interactive elements (buttons, inputs) or show as static
- [ ] Test: Print preview, verify professional appearance

#### Task 2.4: Consolidate print buttons
- [ ] Remove "Print Preview" button from `components/lesson-preview.tsx`
- [ ] Keep single "Print" button in preview page header
- [ ] Ensure iframe context is correct for printing
- [ ] Test: Click print button, verify workbook content prints (not dashboard)

#### Task 2.5: Test print isolation
- [ ] Print from editor preview modal → should print workbook only
- [ ] Print from preview page → should print workbook only
- [ ] Verify dashboard UI elements don't appear in print
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)

**Acceptance Criteria**:
- Answer Key starts on new page
- Phase 3 sections start on new pages
- Only one print button visible to user
- Print output contains only workbook content
- Print formatting is professional and readable

---

### Phase 3: Verify Two-Column Layout Rendering
**Goal**: Confirm MCQ section renders in two columns

#### Task 3.1: Verify practice-grid CSS is applied
- [ ] Open browser DevTools
- [ ] Inspect `.practice-grid` element
- [ ] Verify `grid-template-columns: 1fr 1fr` is applied
- [ ] Check for any overriding styles in cascade
- [ ] Document any CSS conflicts found

#### Task 3.2: Fix layout if needed
- [ ] If CSS not applied, investigate why
- [ ] Check for typos in class names
- [ ] Check for CSS specificity issues
- [ ] Add `!important` if necessary (last resort)
- [ ] Test: Verify questions display in two columns

#### Task 3.3: Test responsive behavior
- [ ] Verify two-column layout on desktop
- [ ] Check single-column on mobile (may need media query)
- [ ] Test print layout (may want single-column for print)
- [ ] Adjust as needed

**Acceptance Criteria**:
- Comprehension questions render in two columns on desktop
- Layout is visually balanced
- Print layout is appropriate (single or two-column as designed)

---

### Phase 4: Visual Refinement & Polish
**Goal**: Achieve professional "typeset book" appearance

#### Task 4.1: Review typography
- [ ] Verify serif font (Merriweather) renders for body text
- [ ] Check line height is comfortable (currently 1.7-2.0)
- [ ] Ensure adequate spacing between sections
- [ ] Test: Visual review in browser

#### Task 4.2: Review section headers
- [ ] Confirm "web-style" borders/shadows removed (as previous dev claimed)
- [ ] Verify professional appearance
- [ ] Check consistency across all sections
- [ ] Test: Visual review

#### Task 4.3: Review writing lines and input areas
- [ ] Check that input areas look like workbook pages
- [ ] Verify line spacing is appropriate
- [ ] Ensure professional appearance

#### Task 4.4: Implement rectangular hero-image wrap across multiple paragraphs
- [ ] Move hero image into article text flow and float left
- [ ] Remove per-paragraph `clear: both` that blocks multi-paragraph wrapping
- [ ] Keep inline paragraph images constrained (clear only right floats)
- [ ] Test: Verify wrap spans multiple paragraphs without breaking inline images
- [ ] Test: Visual review

#### Task 4.4: Final visual audit
- [ ] Compare to professional workbook examples
- [ ] Check for any remaining "web UI" artifacts
- [ ] Verify consistent spacing throughout
- [ ] Get user approval on visual design

**Acceptance Criteria**:
- User confirms visual appearance is professional
- Layout resembles printed workbook, not web page
- Typography is clean and readable

---

### Phase 5: Testing & Validation
**Goal**: Comprehensive testing of all functionality

#### Task 5.1: Unit tests
- [ ] Verify all existing tests still pass
- [ ] Add tests for template caching fix (if applicable)
- [ ] Add tests for debounced preview updates
- [ ] Run full test suite: `npm test`

#### Task 5.2: Integration testing
- [ ] Create new lesson with all new fields
- [ ] Upload multiple images with different positions
- [ ] Save lesson
- [ ] Preview lesson
- [ ] Print lesson
- [ ] Verify all fields render correctly

#### Task 5.3: Backward compatibility testing
- [ ] Load old lesson without new fields
- [ ] Verify defaults appear in preview
- [ ] Verify no errors or warnings
- [ ] Confirm professional appearance

#### Task 5.4: Browser testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test print in all three browsers

#### Task 5.5: Performance testing
- [ ] Open editor with large lesson
- [ ] Type in various fields
- [ ] Verify no lag or stuttering
- [ ] Check browser console for errors
- [ ] Profile React renders if needed

**Acceptance Criteria**:
- All tests pass
- No console errors
- Works in all major browsers
- Performance is acceptable
- User approves all functionality

---

## Critical Success Factors

1. **Fix caching FIRST**: Phase 0 must be completed before anything else
2. **Manual verification**: Don't rely on tests - verify in browser
3. **User approval**: Get explicit confirmation at each phase
4. **No assumptions**: If unclear, ask user before proceeding
5. **Document failures**: If something doesn't work, document why clearly

## Files to Modify

### Phase 0
- `/api/render` route (find and read)
- Template renderer implementation

### Phase 1
- `app/projects/[projectId]/lessons/[lessonId]/page.tsx`

### Phase 2
- `workbook_template.html` (CSS additions)
- `components/lesson-preview.tsx` (remove print button)
- `app/projects/[projectId]/lessons/[lessonId]/preview/page.tsx` (keep print button)

### Phase 3
- `workbook_template.html` (potential CSS fixes)

### Phase 4
- `workbook_template.html` (visual refinements)

## Risk Mitigation

- **Template caching**: May require Next.js config changes or API route restructuring
- **React hooks**: May need useRef, useMemo, or architectural changes
- **Print CSS**: May need extensive testing across browsers
- **Two-column layout**: May have unknown CSS conflicts

## Estimated Effort

- Phase 0: 1-2 hours (investigation + fix)
- Phase 1: 1-2 hours (React refactoring)
- Phase 2: 2-3 hours (CSS + testing)
- Phase 3: 0.5-1 hour (verification + potential fix)
- Phase 4: 1-2 hours (visual polish)
- Phase 5: 2-3 hours (comprehensive testing)

**Total**: 7.5-13 hours

## Next Steps

1. Get user approval on this plan
2. Begin Phase 0 (template caching investigation)
3. Report findings before implementing fix
4. Proceed phase by phase with user check-ins
