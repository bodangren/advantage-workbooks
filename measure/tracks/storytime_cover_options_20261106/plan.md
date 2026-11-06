# Plan: Storytime cover options in the RPG-theme style

Spec: [spec.md](./spec.md). Hand-off folder: `~/Desktop/handoff/storytime-cover-options-2026-11-06/`.

## Phase 1: The option round (evidence class: person-checked by Daniel)

- [ ] Task 1.1: Read the RPG covers and the present Storytime covers; write the reading into spec.md ("The RPG covers", "The present Storytime covers")
- [ ] Task 1.2: Price check of one paid call (image-01, 0.0035 USD per image) and the spend log in the hand-off folder (outside measure/)
- [ ] Task 1.3: The art: 12 new pictures (4 per option), text prompts only, at most 3 attempts per picture; prompts in `options/prompts.json`; files in the hand-off folder (outside measure/)
- [ ] Task 1.4: The mockups: `options/build.py` writes the HTML of the 15 mockups; Chrome (heavy-run) prints the PDFs; `pdftoppm` makes the 150 ppi PNGs (outputs in the hand-off folder, outside measure/)
- [ ] Task 1.5: The checks: page sizes, approved text, forbidden words, Thai bytes (`options/check.py`); a look at every mockup on the contact sheet
- [ ] Task 1.6: The hand-off: the contact sheet, the README with one plain-words line per option, `spend-log.md`, `MANIFEST.txt` (outside measure/)
- [ ] Task 1.7: Daniel's pick (person-checked). The task stays open until his answer

## Phase 2: The series cover template (later; not started)

Phase 2 changes code, so it runs through the Measure roles of the orchestrator (strategy, Red, Green, reviews, acceptance). It starts after Daniel's pick, with a spec update.

- [ ] Task 2.1: Spec update for the picked option (frame layers, art rules, text rules, bleed answer from the printer)
- [ ] Task 2.2: The cover template in `dashboard/lib/storytime/print/` for the student book, the teacher book, and the reader covers, with tests first
- [ ] Task 2.3: The Level 2 Unit 1 print files of the picked option, new version numbers, Daniel's approval
