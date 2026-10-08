# Plan: editorial_prereview_20261003

## Phase 1: Sign text on the sign (R1)
- [x] Tests: author parse of `text @ x,y,w,h` and the errors (bad place, caption with " ; "); line
      wrap and font fit; stacked rows for overlays with no place; panel style; the `image-text`
      WARN; the exact-spelling rule for a quoted prompt (8 new tests; 3 files, 59 pass)
- [x] `lib/lesson-package/author.ts`, `lib/media/images.ts`, `lib/lesson-package/checks.ts`;
      AUTHORING.md 1.3. Muse test (3 pictures, $0.03): every sign word right; it drops a final
      full stop on a sign [9c1a288]

## Phase 2: Quest 4 (R2)
- [x] Read L01–L14 and the pictures; fix the sources; convert; checks PASS
- [x] Sign places; new pictures where a prompt changed; audio again where the text changed

## Phase 3: Origins 3.2 (R2)
- [x] Read P01–P14 and the pictures; fix the sources; convert; checks PASS
- [x] Sign places; new pictures; audio

## Phase 4: Origins 1 (R2)
- [x] Read L01–L14 and the pictures; fix the sources; convert; checks PASS
- [x] New pictures; audio

## Phase 5: Review log
- [x] `docs/content-plans/reviews/2026-10-03-prereview.md`: each change and its reason; open
      questions; what Daniel must still check
- [x] Fixes of all three books committed in de4a36e (2026-10-06): 42 packages, 0 FAIL in
      check-lesson-package. Marks checked 2026-10-08 against the commit and the review log.
