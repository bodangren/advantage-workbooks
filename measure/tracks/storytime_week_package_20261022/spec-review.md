# Spec Review: storytime_week_package_20261022

## Amendment: Phase 10 (2026-11-07)

Author model: claude-code/claude-opus-5-5[1m]

Scope: the section "Addendum 2026-11-07: family-word pictures for the app (Phase 10)" of [spec.md](./spec.md), the amendment line under E5, and the section "Phase 10: Family-word pictures for the app (2026-11-07 to 2026-11-12)" of [plan.md](./plan.md).

Status: pass (2026-11-07; answers in commit 7f587966)

F1: FIX, every Phase 10 gate that runs PROJECT_TESTS adds the loops R3 exclude `--exclude "**/storytime-loops-share-content.test.ts"` while that window is open; the verification task runs with no exclude after the loops switch commit, or names the exclude (spec H14, plan rule R3 paragraph and verification task).
F2: FIX, H12 now states the real w01 r2 form (line 68: an empty `old-sha256:` value for a new file) and uses that empty form for the new revisions, also an empty `new-sha256:` for a removed file.
F3: FIX, the package build gate loops over weeks 01 to 07 with each folder name and family count, and prints nothing when all counts match.
F4: FIX, H9 names the row label exactly: `The family-word pictures named in the package exist`.
F5: FIX, H8 says that the PM gives Forge the H3 file-name pattern and the H8 MANIFEST form (sent to the PM on 2026-11-07); the Forge delivery task records the PM's confirmation or the names that Forge used.
