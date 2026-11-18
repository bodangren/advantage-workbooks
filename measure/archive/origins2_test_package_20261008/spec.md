# Spec: origins2_test_package_20261008

Version 1.0 | Date 2026-10-08 | Status: Active | Owner: Daniel Bo

## Why

The Origins 2 semester 1 test package (2026-09-14) was in `primary/origins-2-a0/`, next to the
14 workbook lessons. Tutor Advantage imports every folder in `primary/` (AGENTS.md: "Keep drafts
and packages out of `primary/`"). The package was untracked in git, so it also had no backup.

## Requirements

### R1 Out of `primary/`
1. The package goes to `content/primary/origins-2/assessments/semester-1/`, beside the Origins 2
   lesson packages. The folder keeps its layout: sources at the top, `print/`, `test-media/`, and
   `Origins2-Semester1-Test-Package.zip`.
2. `primary/origins-2-a0/` keeps only `project.json` and the 14 `*_workbook.json` files.
3. The package tools read only the `.json` files at the top of a book folder
   (`loadPackageFolder`, `make-media.ts`), so they do not see the `assessments/` folder.

### R2 Paths
1. `test-media/build-test-audio.sh` writes to the new `test-media/audio` path.
2. The relative links (`../semester-test-teacher-script.md`) stay correct.

### R3 Git (Daniel's decision)
The package is 36 MB: 29 MB of test audio (with `.wav` work files in `test-media/audio/_work`),
1.1 MB of print files, and the 6 MB zip. Daniel decides what goes into git. The zip holds copies
of the other files.
