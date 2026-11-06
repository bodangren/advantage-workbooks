# Spec Review: storytime_cover_options_20261106

Author model: claude-code/claude-opus-5-5[1m]

## Round 1 (author self-review)

Date: 2026-11-06
Reviewer: the author (claude-code/claude-opus-5-5[1m]). The dispatch of 2026-11-06 forbids subagents, so no fresh reviewer ran. The orchestrator runs the independent spec review before Phase 2.
Verdict: pass for Phase 1 (the option round changes no code), with the notes below.

### What this track proposes
The track makes 3 cover options for Storytime Advantage in the style of the RPG covers of Primary Advantage and Reading Advantage. Each option has stylized art from text prompts only, a frame (crest, growth bar, title plaque), and the approved text word for word. The options cover the student book front and back, the teacher book front, and the A3 and leaf reader covers of Level 2 Unit 1. Daniel picks one option; the series template comes in Phase 2.

### Zoom-out check
The approved print files stay unchanged until the pick. The round writes only into the track folder and the hand-off folder. The paid limit is 1.00 USD, and 12 pictures with 3 attempts each cost at most 0.126 USD at 0.0035 USD per image.

### Zero-decision check
- The option count (3), the mockup list (5 per option), the sample reader ("Nan Can Nod"), and the cast of each cover are fixed in FR-1 to FR-3.
- Three open points (Q1 to Q3) have a default in the spec.

### Notes
- N1: The cast look rule of A-18 (a) and the owner order of 2026-11-06 differ. Q1 records the default; Daniel decides with his pick.
- N2: Phase 2 has no test plan yet. It needs a strategy role before Red.

## Amendment: Phase 2 option A (2026-11-07)

Author model: claude-code/claude-opus-5-5[1m]

Date: 2026-11-07. The author wrote the spec section "Phase 2: The option A covers" (Amendment 1) and the Phase 2 plan after Daniel's pick "A" (Google Tasks, 2026-11-07 05:06 ICT, PM relay). The Phase 1 spec review was a self-review. An independent reviewer of another model family reviews this amendment before the Phase 2 Red (plan Task 2.2). This section gives no verdict.

### What the amendment adds
- The owner word, the PM record, and the three PM defaults (the cast in the option A style, the frame around the approved reader pictures, no new Thai).
- Decisions D-A1 to D-A11: a new template module, data file, and build script; read-only use of the approved cover code; guard G-1; the reader cover hand-off to the print track; no bleed with a 5 mm safe zone; the `lanczos3` upscale to 300 ppi; the art file names; the version numbers (student v4, teacher v2, readers v1); the teacher back; the 11-16 folder default.
- FR-6 to FR-11 and AC-6 to AC-12.
- The open points Q1 and Q3 closed; Q2 open with a default; Q4 to Q7 new, each with a default.

### Points for the independent reviewer
- R-1: D-A1 and guard G-1 keep the approved cover code unchanged. Check that no FR needs a change in a file of guard G-1.
- R-2: D-A4 gives the wiring of the reader covers to the print track. Check that the release proof of 2026-11-20 has an owner for that step.
- R-3: D-A6 upscales 1448 x 2048 px art by a factor of 1.713. Check that the look task (Task 2.10) is a sufficient check of the upscale.
- R-4: D-A10 adds a teacher back that the PM list does not name. Check the default.
- R-5: the plan puts the Red windows behind the open windows of the print track and the week-package track (rule R1). Check the date risk against the due date of 2026-11-14.

### Independent review (2026-11-07)

Reviewer: `opencode-go/mimo-v2.6-flash` (another model family). Audited commit: ce5b90ba. Result file: `measure/runs/storytime_cover_options_20261106/spec-review-ce5b90ba.json` (log: `spec-review-ce5b90ba.log`). Gate PASS with the baseline cb2d1c0c, because the unit 2 commit cb2d1c0c of another session landed during the review.
Verdict: pass (0 Blockers; F1 to F4 Major; F5 and F6 Nit).

F1: FIX, guard G-1 (D-A3) and AC-7 now name `dashboard/lib/covers/back-text.ts`, every file under `dashboard/lib/covers/` and `dashboard/scripts/print/` (with `make-pdfx.ts`), the other imports, and an allowed-path list.
F2: FIX, D-A9 names the subfolders `student/`, `teacher/`, `readers-a3/`, `readers-leaf/`, `contact-sheets/` and the root files; Tasks 2.8, 2.9, 2.11 and their fast gates use these paths.
F3: FIX, the print plan Phase 9 has the receiving task "Task (Hand-off from storytime_cover_options)" before its release proof task; D-A4 and Task 2.13 name it.
F4: FIX, D-A12 renames the tests to `quest-cover-template.test.ts` and `quest-cover-build.test.ts`, outside the shared globs, so rule R1 does not bind and Red 1 can start at once; D-A13 adds the 2026-11-12 18:00 ICT fallback through the `options/` pipeline.
F5: FIX, FR-7.3 names the cast: Nan, Sam, and Pip on the student front; Teacher Kim, Nan, and Sam on the teacher front.
F6: FIX, the Task 2.10 gate counts labeled lines `page <n>: pass` (32) and `page <n>: fault` (0), not a table cell.

Status: pass (2026-11-07; answers in commit "measure(plan): answer the cover spec review F1 to F6 (storytime_cover_options)"; review file measure/runs/storytime_cover_options_20261106/spec-review-ce5b90ba.json)
