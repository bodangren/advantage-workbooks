# Plan: origins2_test_package_20261008

## Phase 1: Move
- [x] Move the 8 source files, `print/`, `test-media/`, and the zip from `primary/origins-2-a0/`
      to `content/primary/origins-2/assessments/semester-1/` (2026-10-08)
- [x] `build-test-audio.sh`: the audio path is the new folder
- [x] Check: `git status --porcelain primary/` is empty; no dashboard code reads a book folder
      recursively (`readdirSync` readers take only top-level `.json` files)

## Phase 2: Git
- [x] Daniel's decision: commit all files, or leave out the zip and `test-media/audio/_work`
      (2026-10-09: leave out only the zip; `.gitignore` has the rule)
- [x] Commit the chosen files (`f68a3aa`)
