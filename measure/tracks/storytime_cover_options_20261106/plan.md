# Plan: Storytime cover options in the RPG-theme style

Spec: [spec.md](./spec.md). Hand-off folder: `~/Desktop/handoff/storytime-cover-options-2026-11-06/`.

## Phase 1: The option round (evidence class: person-checked by Daniel)

- [x] Task 1.1: Read the RPG covers and the present Storytime covers; write the reading into spec.md ("The RPG covers", "The present Storytime covers") 3f638d98
- [x] Task 1.2: Price check of one paid call (image-01, 0.0035 USD per image) and the spend log in the hand-off folder (outside measure/). Price: MiniMax pay-as-you-go page, read 2026-11-06; `mmx --dry-run` showed `image-01`, `n` 1. Evidence class: automated
- [x] Task 1.3: The art: 12 new pictures (4 per option), text prompts only, at most 3 attempts per picture; prompts in `options/prompts.json`; files in the hand-off folder (outside measure/). 19 paid calls, 0.0665 USD (A-front 3, A-reader 3, B-front 2, B-reader 2, C-front 2, the other 7 one each). Faults per attempt in `options/selection.json`. `options/clean_art.py` removed made-up text from 2 pictures whose 3 attempts were used (a local step; the source files stay). Evidence class: automated (log) and agent look
- [x] Task 1.4: The mockups: `options/build.py` writes the HTML of the 15 mockups; Chrome (heavy-run) prints the PDFs; `pdftoppm` makes the 150 ppi PNGs (outputs in the hand-off folder, outside measure/). Process note: the first hand-off writes of Tasks 1.4 and 1.6 came before their `[~]` mark (marked late, 2026-11-06)
- [x] Task 1.5: The checks: page sizes, approved text, forbidden words, Thai bytes (`options/check.py`); a look at every mockup on the contact sheet. 15 of 15 PDFs pass; the QR check gives 0 of 841 modules different (`options/qr_check.mjs`); mutants caught: a Thai character, a story word, one QR module; 15 of 15 forbidden sample words caught. Output: `checks.txt` in the hand-off folder. Evidence class: automated
- [x] Task 1.6: The hand-off: the contact sheet, the README with one plain-words line per option, `spend-log.md`, `MANIFEST.txt` (outside measure/). 75 files, `manifest.py --check` passes
- [ ] Task 1.7: Daniel's pick (person-checked). The task stays open until his answer

## Phase 2: The series cover template (later; not started)

Phase 2 changes code, so it runs through the Measure roles of the orchestrator (strategy, Red, Green, reviews, acceptance). It starts after Daniel's pick, with a spec update.

- [ ] Task 2.1: Spec update for the picked option (frame layers, art rules, text rules, bleed answer from the printer)
- [ ] Task 2.2: The cover template in `dashboard/lib/storytime/print/` for the student book, the teacher book, and the reader covers, with tests first
- [ ] Task 2.3: The Level 2 Unit 1 print files of the picked option, new version numbers, Daniel's approval
