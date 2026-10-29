# A-30 Book Editions Plan

Status: plan v1, 2026-10-29

## Summary

- Daniel's request requires graph-first work across the Primary book range and parallel editions for two legacy books.
- The repository has objective and vocabulary tags in all sixteen book folders, but only two books also have complete approved graph-first evidence.
- Repository evidence agrees with the PM default that Origins 3.2 and Quest 4 need no rewrite.
- Schedule: finish the A-29 samples first, then rewrite fourteen Primary books from 2027-01-25 to 2027-06-18.
- This plan adds no new print dates. It keeps Storytime and A-29 dates unchanged.

Daniel's words mean all books need graph-first rewrites, with legacy Origins 2 and Origins 3.1 still selectable until stock ends. They do not authorize a stock cut-over date.

## (a) Graph-first rewrite

**Repeatable test:** count a lesson as graph-first only when its package contains mapped target objective IDs and graph vocabulary tags, its lesson is approved, and its text check passed against the named graph release. A book passes only when every lesson passes.

Evidence scan: packages are under `content/primary/<folder>/`; each listed book has fourteen lessons. Every book has mapped objective and vocabulary tags on all 14 lessons. Origins 1, Origins 2, Origins 3.1, Origins 3.2, and Quest 4 also have 14/14 lesson approvals. The documented vocabulary graph check appears in the Origins 3.2 and Quest 4 plans. The other 11 books lack evidence of a graph check or lesson approval. Treat their status as unproven, not as proof that their content lacks graph alignment. Book-level `project.json` files are in `primary/<book>-<level>/`, not in `content/primary/`.

The cited release currently recorded in `tags.json` is GSE `7344a27` and vocabulary `1e10cf9`. Pin the accepted graph commit and hash in each release manifest before rewrite approval.

| Order | Book | Edition key today | Printed? | Graph-first evidence | Rewrite size | Start–end | Daniel review | Risk |
|---:|---|---|---|---|---:|---|---:|---|
| 1 | Origins 1 | `o1` | Yes | 14/14 tagged and approved; graph-check evidence absent | 14 | Jan 25–Feb 5 | 4 h | Confirm graph-check record before rewrite start. |
| 2 | Origins 2 | `o2` | Yes | 14/14 tagged and approved; legacy edition still needs graph-first rewrite | 14 | Feb 8–19 | 4 h | Keep the legacy edition untouched. |
| 3 | Origins 3.1 | `o3-1` | Yes | 14/14 tagged and approved; E12 insert is not a complete graph-first edition | 14 | Feb 22–Mar 5 | 4 h | Verify live lesson-12 insert mapping before manifest freeze. |
| 4 | Origins 3.2 | `o3-2` | Yes | 14/14 tagged and approved; plan records graph check | 0 | No rewrite | 0 h | Default agrees with repository evidence. |
| 5 | Quest 4 | `q4` | Yes | 14/14 tagged and approved; plan records vocabulary graph check | 0 | No rewrite | 0 h | Default agrees with repository evidence. |
| 6 | Quest 5 | `q5` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Mar 8–12 | 2 h | Printer file is ON HOLD; keep that hold. |
| 7 | Quest 6.1 | `q6-1` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Mar 15–19 | 2 h | Confirm legacy key mapping. |
| 8 | Quest 6.2 | `q6-2` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Mar 22–26 | 2 h | Confirm legacy key mapping. |
| 9 | Adventure 7.1 | `a7-1` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Mar 29–Apr 2 | 2 h | Confirm print label and edition key. |
| 10 | Adventure 7.2 | `a7-2` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Apr 5–9 | 2 h | Confirm print label and edition key. |
| 11 | Adventure 8.1 | `a8-1` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Apr 12–16 | 2 h | Confirm print label and edition key. |
| 12 | Adventure 8.2 | `a8-2` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Apr 19–23 | 2 h | Confirm print label and edition key. |
| 13 | Adventure 8.3 | `a8-3` | Yes | 14/14 tagged; no approval or graph-check record | 14 | Apr 26–30 | 2 h | Confirm print label and edition key. |
| 14 | Adventure 9.1 | `a9-1` | Yes | 14/14 tagged; no approval or graph-check record | 14 | May 3–7 | 2 h | Confirm print label and edition key. |
| 15 | Adventure 9.2 | `a9-2` | Yes | 14/14 tagged; no approval or graph-check record | 14 | May 10–14 | 2 h | Confirm print label and edition key. |
| 16 | Adventure 9.3 | `a9-3` | Yes | 14/14 tagged; no approval or graph-check record | 14 | May 17–21 | 2 h | Confirm print label and edition key. |

The A-29 demo work remains first: eleven books, Quest 5 through Adventure 9.3, build 2026-12-01 to 2026-12-11; Daniel reviews 5–6 h during 2026-12-14 week; demo freeze 2027-01-22. The rewrite reviews peak at 4 h/week, plus A-29's separate 5–6 h in December. This fits Daniel's 10–20 h weekly budget. The sample work does not count as a rewrite.

Scope note: `bank-1` through `bank-9` are level practice banks, not printed books. They do not enter the book rewrite sequence. Their graph coverage requires a separate decision.

## (b) Demo sample edition

Use the current printed edition for each sample book. The January sample pages represent the book already sold and do not switch an edition before stock runs out. The A-29 set covers Quest 5 through Adventure 9.3, not Origins 2 or Origins 3.1. Default: do not use either new graph-first edition in the demo set.

## (c) Edition scheme

Use one stable slug per edition. Keep legacy package keys and IDs unchanged. Create a second package tree for new-edition packages; never overwrite a legacy key. The file is the source manifest. Set all approval states to `draft` until Daniel approves each package.

| Book identity | Edition slug | Lessons | Package key / folder | Audio / clip folders | Approval | Graph release and tags | Print label |
|---|---|---|---|---|---|---|---|
| Primary Advantage Origins 2, legacy | `o2` | 1–14 | `o2/<n>` / `content/primary/origins-2/` | `content/primary/origins-2/media/<lesson>/`; tracked checksum `media/clips.sha256`; local `.clips/` ignored | Existing legacy; preserve package approvals | Freeze legacy tags from current package snapshot; no new graph release claim | Origins 2 (legacy print) |
| Primary Advantage Origins 2, graph-first | `o2-e2` | 1–14 | `o2-e2/<n>` / `content/primary/origins-2-e2/` | `content/primary/origins-2-e2/media/<lesson>/`; `media/clips.sha256`; local `.clips/` ignored | Draft until reviewed | New pinned graph release; lesson-specific objective and vocabulary tags required | Origins 2, Edition 2 |
| Primary Advantage Origins 3.1, legacy | `o3-1` | 1–14 | `o3-1/<n>` / `content/primary/origins-3.1/` | `content/primary/origins-3.1/media/<lesson>/`; `media/clips.sha256`; local `.clips/` ignored | Existing legacy; E12 insert approval remains distinct | Freeze legacy tags from current package snapshot; no new graph release claim | Origins 3.1 (legacy print) |
| Primary Advantage Origins 3.1, graph-first | `o3-1-e2` | 1–14 | `o3-1-e2/<n>` / `content/primary/origins-3.1-e2/` | `content/primary/origins-3.1-e2/media/<lesson>/`; `media/clips.sha256`; local `.clips/` ignored | Draft until reviewed | New pinned graph release; lesson-specific objective and vocabulary tags required | Origins 3.1, Edition 2 |
| Reading Advantage Origins 2, legacy | `ra-o2` | Unverified | No package key or folder until manifest names articles | No verified media folder | Unverified | No graph release or tags verified | Reading Advantage Origins 2 (legacy print) |
| Reading Advantage Origins 2, graph-first | `ra-o2-e2` | Unverified | No package key or folder until manifest names articles | No verified media folder | Unverified | No graph release or tags verified | Reading Advantage Origins 2, Edition 2 |

The reserved Reading Advantage slugs denote a separate printed book, not the Primary book. Do not create database rows until the Workbooks manifest identifies its articles. A legacy-to-new crosswalk maps lesson numbers for reference only. It must not transfer IDs, attempts, answers, scores, or mastery evidence.

**Injector:** `dashboard/scripts/inject-lessons.ts` selects existing write paths in `dashboard/lib/inject/legacy.ts` and `dashboard/lib/inject/new-db.ts`. Add explicit edition key and package identity to selection, logs, verification, backup names, and output folders. Route the new edition through new-row creation; do not call the legacy-ID fallback or set `meta.replaces` to a legacy article. Add idempotent edition-aware checks before writing. Keep all old legacy rows and `primary_legacy_id_map` rows unchanged. Never share article, question, or flashcard rows across editions.

**Tutor path:** keep edition packages out of Tutor's import `primary/` tree while they are drafts, because that importer reads every folder and requires `project.json`. After approval, publish a versioned edition manifest through the planned Tutor catalogue path, not through a draft folder import. Use distinct URLs such as `/lesson/o2-e2/1`; keep `/lesson/o2/1` bound to legacy. Confirm the Tutor importer supports this manifest before any publication. The Tutor example `cmgqx8v6602p3t79btatvfjuw` maps to Workbooks `o2/1`, which means Primary Advantage Origins 2. The Monorepo cutover spec likely names it incorrectly as Reading Advantage Origins 2.

**Reference-only crosswalk:** use the same lesson number as the initial pointer for Primary Origins 2 (`o2/1` → `o2-e2/1` through `o2/14` → `o2-e2/14`) and Origins 3.1 (`o3-1/1` → `o3-1-e2/1` through `o3-1/14` → `o3-1-e2/14`). Validate each row against the approved edition manifests. This pointer does not claim equal text, replace IDs, or move learner records. Reading Advantage Origins 2 has no crosswalk until its article manifest exists.

## Open questions for Daniel

- Do Origins 3.2 and Quest 4 require rewrites? Default: no; each has 14/14 tagged and approved lessons, and its plan records the graph check.
- Does “all books” include the separate Reading Advantage Origins 2? Default: yes, but do not create rows until its article manifest exists.
- Which edition supplies the January iPad sample? Default: each book's current printed edition.
- Are the proposed weekly rewrite blocks acceptable after the demo freeze? Default: yes; hold the schedule unless Daniel changes the review allocation.
- What is the live legacy lesson-12 insert mapping for Origins 3.1? Default: verify read-only before freezing its manifest; preserve all existing printed IDs.
- Which graph release should new editions pin? Default: use the current graph snapshots in `tags.json` only as a baseline, then pin a reviewed release commit and hash.
- Which print label should each new edition use? Default: `<Book>, Edition 2`, with an explicit legacy label only where the current edition remains on sale.
- How should the Reading Advantage Origins 2 package and audio live? Default: no folder or rows until its article manifest names the source.
- Does Tutor accept the proposed edition manifest without a folder import? Default: required before publication; drafts stay outside Tutor's import tree.

## Dates that this plan moves

None. The proposed rewrite sequence starts after the A-29 demo freeze. It does not change the Storytime release, proof, or delivery dates. It does not change the Quest 5 printer hold.

Facts changed: none
