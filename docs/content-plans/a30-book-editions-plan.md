# A-30 Book Editions Plan

Status: plan v3, 2026-10-29

## Summary

- The package check covered 224 lessons: 0 failed checks and 150 warnings.
- The level-coverage report found no lead-objective gaps for levels 5–9.
- Start rewriting after the A-29 sample build; finish on 2027-02-19.
- Use current packages for A-29 samples; rewriting those books first adds about 22 review hours.

Daniel's instruction requires graph-first work for every Primary book. Keep Primary Advantage Origins 2 and Primary Advantage Origins 3.1 available until stock ends. Do not set a cut-over date.

## (a) Graph-first rewrite

**Method:** pin the graph release; choose each lesson's target objective nodes and target vocabulary nodes first; record the node IDs in the package; then write the text, questions, and activities to those nodes.

**Done when, for each lesson:** the package records the pinned release and its objective and vocabulary node IDs; `check-lesson-package.ts --graph` reports 0 failures; Daniel approves the lesson.

The package check passed all 224 lessons. It reported 150 warnings, mainly `bank-level`; Primary Advantage Origins 3.1 also had four `print-set` warnings and one `activities` warning. Output: `/tmp/a30-graph-check.txt`.

I ran `level-coverage.ts` to `/tmp/a30-level-coverage-1-4.md` and `/tmp/a30-level-coverage-5-9.md`. Levels 5–9 have no lead-objective gaps: each book covers all objectives assigned to it. The tool reports levels 1–4 as combined levels and includes bank packages, so it cannot measure a per-book gap for Primary Advantage Origins 1, Primary Advantage Origins 2, Primary Advantage Origins 3.1, Primary Advantage Origins 3.2, or Primary Advantage Quest 4.

| Order | Book | Key today | Proposed key | Print state | Check pass / fail | Measured objective gap | Rewrite lessons | Dates | Daniel review estimate | Main warning / risk |
|---:|---|---|---|---|---:|---|---:|---|---:|---|
| 1 | Primary Advantage Origins 1 | `o1` | `o1-e2` | Not printed | 14 / 0 | Not measurable per book¹ | 14 | Dec 14–18 | 2 h | No warnings; protect live learner records. |
| 2 | Primary Advantage Origins 2 | `o2` | `o2-e2` | Printed; on sale | 14 / 0 | Not measurable per book¹ | 14 | Dec 21–25 | 2 h | `bank-level`; preserve current packages and rows. |
| 3 | Primary Advantage Origins 3.1 | `o3-1` | `o3-1-e2` | Printed; on sale; insert on order | 14 / 0 | Not measurable per book¹ | 14 | Dec 28–Jan 1 | 2 h | `bank-level`, `print-set`, `activities`; verify lesson 12. |
| 4 | Primary Advantage Origins 3.2 | `o3-2` | `o3-2-e2` if later changed | On order; schools use from May 2027 | 14 / 0 | Not measurable per book¹ | 0 | None | 0 h | No rewrite under PM default; retain live rows. |
| 5 | Primary Advantage Quest 4 | `q4` | `q4-e2` if later changed | On order; schools use from May 2027 | 14 / 0 | Not measurable per book¹ | 0 | None | 0 h | No rewrite under PM default; retain live rows. |
| 6 | Primary Advantage Quest 5 | none | `q5` | Not printed | 14 / 0 | None (16/16) | 14 | Jan 4–8 | 2 h | `bank-level`; printer date 2026-11-06 stays on hold. |
| 7 | Primary Advantage Quest 6.1 | none | `q6-1` | Not printed | 14 / 0 | None (15/15) | 14 | Jan 4–8 | 2 h | `bank-level`. |
| 8 | Primary Advantage Quest 6.2 | none | `q6-2` | Not printed | 14 / 0 | None (16/16) | 14 | Jan 11–15 | 2 h | `bank-level`. |
| 9 | Primary Advantage Adventure 7.1 | none | `a7-1` | Not printed | 14 / 0 | None (20/20) | 14 | Jan 11–15 | 2 h | `bank-level`. |
| 10 | Primary Advantage Adventure 7.2 | none | `a7-2` | Not printed | 14 / 0 | None (19/19) | 14 | Jan 18–22 | 2 h | `bank-level`. |
| 11 | Primary Advantage Adventure 8.1 | none | `a8-1` | Not printed | 14 / 0 | None (19/19) | 14 | Jan 18–22 | 2 h | `bank-level`. |
| 12 | Primary Advantage Adventure 8.2 | none | `a8-2` | Not printed | 14 / 0 | None (20/20) | 14 | Jan 25–29 | 2 h | `bank-level`. |
| 13 | Primary Advantage Adventure 8.3 | none | `a8-3` | Not printed | 14 / 0 | None (20/20) | 14 | Jan 25–29 | 2 h | `bank-level`. |
| 14 | Primary Advantage Adventure 9.1 | none | `a9-1` | Not printed | 14 / 0 | None (19/19) | 14 | Feb 1–5 | 2 h | `bank-level`. |
| 15 | Primary Advantage Adventure 9.2 | none | `a9-2` | Not printed | 14 / 0 | None (19/19) | 14 | Feb 8–12 | 2 h | `bank-level`. |
| 16 | Primary Advantage Adventure 9.3 | none | `a9-3` | Not printed | 14 / 0 | None (20/20) | 14 | Feb 15–19 | 2 h | `bank-level`. |

¹ Levels 1–4 coverage is grouped, not book-specific. The `level-coverage.ts` report gives 11/11, 8/8, 24/24, and 20/20 level objectives at goal coverage for levels 1, 2, 3, and 4. It does not provide a valid gap value for each book.

Primary Advantage Origins 1 has live rows, so its rewritten content gets new article, question, and flashcard rows under `o1-e2`. Primary Advantage Origins 3.2 and Primary Advantage Quest 4 need no rewrite under the PM default; retain their current rows. If either needs changed content later, use its proposed `-e2` key and new rows. Never overwrite or share rows across editions.

**Primary Advantage Quest 5 printer file:** rewrite and Daniel's review finish Jan 8. The earliest printer-file date is Jan 11, 2027, the next business day. Printer lead time is unverified, so May delivery is not confirmed.

Schools need Primary Advantage Origins 3.2 and Primary Advantage Quest 4 from May 2027. Both books are on order and need no rewrite under the PM default. Primary Advantage Quest 5 can have a graph-first file by Jan 11; its May delivery depends on printer lead time.

## Review hours and capacity

Two hours per rewritten book is an estimate, not a recorded historical review time. Storytime release 1 proof and weeks 2–8 work end by Nov 18; no later Storytime review is known. The rewrite starts Dec 14, after the A-29 build ends Dec 11. This avoids overlapping the first three rewrites with Storytime's Dec 1 release and A-29's Dec 1–11 build. Workbooks can run both tracks in sequence, with the rewrite first week sharing Daniel's review time with A-29.

| Week | Rewrite | A-29 review | Storytime review | Total |
|---|---:|---:|---:|---:|
| Nov 23–27 | 0 | 0 | 0 | 0 |
| Nov 30–Dec 4 | 0 | 0 | 0 | 0 |
| Dec 7–11 | 0 | 0 | 0 | 0 |
| Dec 14–18 | 2 | 5–6 | 0 | 7–8 |
| Dec 21–25 | 2 | 0 | 0 | 2 |
| Dec 28–Jan 1 | 2 | 0 | 0 | 2 |
| Jan 4–8 | 4 | 0 | 0 | 4 |
| Jan 11–15 | 4 | 0 | 0 | 4 |
| Jan 18–22 | 4 | 0 | 0 | 4 |
| Jan 25–29 | 4 | 0 | 0 | 4 |
| Feb 1–5 | 2 | 0 | 0 | 2 |
| Feb 8–12 | 2 | 0 | 0 | 2 |
| Feb 15–19 | 2 | 0 | 0 | 2 |
| Feb 22–26 | 0 | 0 | 0 | 0 |

Peak: 7–8 h in the week of Dec 14. This is below the 10–20 h weekly budget. Workbooks capacity remains a risk if the A-29 build needs unplanned work; A-29 keeps priority, and any rewrite slip risks the Jan 11 Primary Advantage Quest 5 printer file. Do not move Storytime or A-29 dates.

## (b) Demo sample edition

The eleven A-29 books, Primary Advantage Quest 5 through Primary Advantage Adventure 9.3, are not printed. Default: sample current packages, not rewritten text. This protects the Dec 1–11 build and avoids about 22 additional Daniel review hours before it (11 books × 2-hour estimate). Samples may show text that the rewrite later changes.

## (c) Edition scheme

**Second-edition rule:** use a separate edition to keep a printed book on sale or to keep live learner records valid when content changes. A book with neither print nor live rows uses its existing package tree before first print and gets no `-e2`. A live-row book gets new article, question, and flashcard rows in its new edition. Never share rows between editions.

| Book identity | Edition slug | Lessons | Package key / Workbooks folder | Tutor `primary/` folder | Audio / clips | Approval | Graph release and tags | Print label |
|---|---|---|---|---|---|---|---|---|
| Primary Advantage Origins 2, current print | `o2` | 1–14 | `o2/<n>` / `content/primary/origins-2/` | `origins-2-a0/` | `content/primary/origins-2/media/<lesson>/`; tracked `media/clips.sha256`; ignored local `.clips/` | Preserve current state | Existing tags; no new release claim | Primary Advantage Origins 2 |
| Primary Advantage Origins 2, graph-first | `o2-e2` | 1–14 | `o2-e2/<n>` / `content/primary/origins-2-e2/` | `origins-2-e2-a0/` after approval and importer readiness | Matching edition media folder, checksum file, ignored `.clips/` | Draft until Daniel approves | Pin reviewed release; tag every lesson | Primary Advantage Origins 2, Edition 2 |
| Primary Advantage Origins 3.1, current print | `o3-1` | 1–14 | `o3-1/<n>` / `content/primary/origins-3.1/` | `origins-3.1-a0/` | `content/primary/origins-3.1/media/<lesson>/`; tracked `media/clips.sha256`; ignored local `.clips/` | Preserve current state; insert approval is separate | Existing tags; insert is a new graph-first article | Primary Advantage Origins 3.1 |
| Primary Advantage Origins 3.1, graph-first | `o3-1-e2` | 1–14 | `o3-1-e2/<n>` / `content/primary/origins-3.1-e2/` | `origins-3.1-e2-a0/` after approval and importer readiness | Matching edition media folder, checksum file, ignored `.clips/` | Draft until Daniel approves | Pin reviewed release; tag every lesson | Primary Advantage Origins 3.1, Edition 2 |
| Reading Advantage Origins 2, current print | `ra-o2` | Unverified | No key or folder before article manifest | None before article manifest | Unverified | Unverified | Unverified | Reading Advantage Origins 2 |
| Reading Advantage Origins 2, graph-first | `ra-o2-e2` | Unverified | No key or folder before article manifest | None before article manifest | Unverified | Pin after article manifest and graph check | Draft after source manifest | Reading Advantage Origins 2, Edition 2 |

Primary Advantage Origins 1's graph-first edition uses `o1-e2` and `content/primary/origins-1-e2/`; add `origins-1-e2-a0/` to Tutor only after approval and importer readiness. Primary Advantage Origins 3.2 and Primary Advantage Quest 4 retain `o3-2` and `q4` unless changed content requires the proposed `o3-2-e2` or `q4-e2`.

The Tutor tree has `origins-2-a0/`, `origins-3.1-a0/`, `origins-3.2-a0/`, and `quest-4-a1/`. `adventures-1.0-a1/` contains older Tutor workbook files; its project file says Origins, level 2, A0, while a lesson says Adventures, A1. Its name and metadata conflict, so do not treat it as a valid Adventure project. Keep drafts outside `primary/`; add an edition folder only after approval, package validation, and the Tutor edition-manifest importer are ready. Use distinct lesson URLs, such as `/lesson/o2/1` and `/lesson/o2-e2/1`.

The Workbooks injector is `dashboard/scripts/inject-lessons.ts`. Make it select by edition and package key. Include edition identity in logs, verification, backups, media paths, and idempotency checks. Create new rows for new editions. Do not use legacy-ID fallback or `meta.replaces` for new-edition articles. Keep `primary_legacy_id_map` unchanged.

Use same-number lesson crosswalks as reference only: `o2/1` → `o2-e2/1` through lesson 14; `o3-1/1` → `o3-1-e2/1` through lesson 14. Confirm every row against approved manifests. Do not transfer learner records or imply equal text. Reading Advantage Origins 2 has no crosswalk before its article manifest.

## Open questions for Daniel

- Should A-29 samples show current packages or rewritten text? Default: current packages; it avoids about 22 review hours before the build.
- Does Tutor accept the edition manifest? Default: add edition folders only after the importer is ready.
- What is the printer lead time for Primary Advantage Quest 5? Default: confirm it before promising May delivery.
- Where are the Reading Advantage Origins 2 articles and media? Default: create no rows or package folder until the article manifest names them.
- Who confirms stock is gone? Default: Daniel confirms stock; no automatic cut-over date.

## Dates that this plan moves

None of the Storytime, A-29, or existing book-order dates move. Primary Advantage Quest 5's earliest planned printer file is 2027-01-11. May delivery remains unconfirmed until the printer lead time is known. The 2026-11-06 printer file stays on hold.

Facts changed: none
