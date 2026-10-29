# A-30 Book Editions Plan

Status: plan v2, 2026-10-29

## Summary

- The package check covered 224 lessons. It passed every check; it reported 150 warnings.
- The check measures package quality, not whether authors selected graph nodes before writing.
- Keep separate editions for printed books and books with live learner records.
- Begin the rewrite after the Storytime work reaches its 2026-11-18 milestone; finish by 2027-02-26.
- Use current packages for A-29 samples. Rewriting 11 sample books first adds about 22 review hours.

Daniel's instruction requires graph-first work for every Primary book. Keep the printed Origins 2 and Origins 3.1 editions available until stock ends. Do not set a cut-over date.

## (a) Graph-first rewrite

**Repeatable check:** run `check-lesson-package.ts` with the pinned vocabulary graph for each package. A lesson passes when the report has no failed checks. This check does not prove that the writer chose graph nodes before drafting.

I ran the check on 224 packages using vocabulary graph `../mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json`. Output: `/tmp/a30-graph-check.txt`. The tool reported 0 failed checks and 150 warnings. The main warning was `bank-level`; Origins 3.1 also had four `print-set` warnings and one `activities` warning. These warnings do not count as failed checks. Every book had 14/14 package passes and 0/14 failures.

The rewrite size below follows the graph-first mandate, not the package check failures. For books that need a new edition, author all 14 lessons as graph-first content; preserve the legacy package tree. For books without print or learner records, rewrite the existing package tree before first print. Origins 3.2 and Quest 4 need no rewrite under the PM default, which repository plans support. Their editions are already on order with the Origins 3.1 lesson-12 graph-first insert.

| Order | Book | `primary_books` key today | Proposed key | Print state | Check pass / fail | Rewrite lessons | Dates | Daniel review | Main warnings / risk |
|---:|---|---|---|---|---:|---:|---|---:|---|
| 1 | Origins 1 | `o1` | `o1-e2` | Not printed | 14 / 0 | 14 | Nov 23–27 | 2 h | No warnings; live rows require a new article identity. |
| 2 | Origins 2 | `o2` | `o2-e2` | Printed; on sale | 14 / 0 | 14 | Nov 30–Dec 4 | 2 h | `bank-level` warnings; preserve printed packages and rows. |
| 3 | Origins 3.1 | `o3-1` | `o3-1-e2` | Printed; on sale; insert on order | 14 / 0 | 14 | Dec 7–11 | 2 h | `bank-level`, `print-set`, `activities`; verify lesson-12 mapping. |
| 4 | Origins 3.2 | `o3-2` | `o3-2-e2` | On order; schools use from May 2027 | 14 / 0 | 0 | None | 0 h | `bank-level`; no rewrite under PM default. Live rows require new IDs for future changes. |
| 5 | Quest 4 | `q4` | `q4-e2` | On order; schools use from May 2027 | 14 / 0 | 0 | None | 0 h | `bank-level`; no rewrite under PM default. Live rows require new IDs for future changes. |
| 6 | Quest 5 | none | `q5` | Not printed | 14 / 0 | 14 | Dec 14–18 | 2 h | `bank-level`; old printer date 11-06 remains on hold. |
| 7 | Quest 6.1 | none | `q6-1` | Not printed | 14 / 0 | 14 | Dec 21–25 | 2 h | `bank-level`. |
| 8 | Quest 6.2 | none | `q6-2` | Not printed | 14 / 0 | 14 | Dec 28–Jan 1 | 2 h | `bank-level`. |
| 9 | Adventure 7.1 | none | `a7-1` | Not printed | 14 / 0 | 14 | Jan 4–8 | 2 h | `bank-level`. |
| 10 | Adventure 7.2 | none | `a7-2` | Not printed | 14 / 0 | 14 | Jan 11–15 | 2 h | `bank-level`. |
| 11 | Adventure 8.1 | none | `a8-1` | Not printed | 14 / 0 | 14 | Jan 18–22 | 2 h | `bank-level`. |
| 12 | Adventure 8.2 | none | `a8-2` | Not printed | 14 / 0 | 14 | Jan 25–29 | 2 h | `bank-level`. |
| 13 | Adventure 8.3 | none | `a8-3` | Not printed | 14 / 0 | 14 | Feb 1–5 | 2 h | `bank-level`. |
| 14 | Adventure 9.1 | none | `a9-1` | Not printed | 14 / 0 | 14 | Feb 8–12 | 2 h | `bank-level`. |
| 15 | Adventure 9.2 | none | `a9-2` | Not printed | 14 / 0 | 14 | Feb 15–19 | 2 h | `bank-level`. |
| 16 | Adventure 9.3 | none | `a9-3` | Not printed | 14 / 0 | 14 | Feb 22–26 | 2 h | `bank-level`. |

Origins 1 has live rows and needs a new edition for its rewritten lessons. Origins 3.2 and Quest 4 pass the package check and need no rewrite under the PM default, so keep their current rows and learner records. If either book later needs changed lesson content, create its proposed `-e2` edition with new article, question, and flashcard rows. Never share rows or overwrite the current lesson rows.

The schedule assigns two review hours per active week, below Daniel's 10–20 hour weekly budget. It starts after Storytime's weeks 2–8 milestone on Nov 18. Starting sooner would overlap the Storytime proof work due Nov 5–9 and delivery due Nov 18. This plan reserves four weeks between the Quest 5 rewrite and its earliest printer file date, Dec 18. If schools need Quest 5 before that date, the printer hold puts the May 2027 delivery at risk.

Schools need Origins 3.2 and Quest 4 from May 2027. Both are on order, and neither needs a rewrite under the PM default, so the existing print order can meet that date. Schools may also need Quest 5. This plan can provide its graph-first printer file on Dec 18, but the printer's production lead time is unverified. Confirm lead time before promising a May delivery.

The A-29 samples cover Quest 5 through Adventure 9.3: build Dec 1–11, Daniel review 5–6 hours during the week of Dec 14, freeze Jan 22. The planned rewrite reaches those books after sample build. The `bank-1` through `bank-9` folders are level practice banks, not printed books; they are outside this plan.

## (b) Demo sample edition

The eleven A-29 books are not printed. Default: use their current packages for sample pages. This avoids delaying the Dec 1–11 build and avoids an estimated 22 additional review hours before that build (11 books × 2 review hours). The samples will show text that the later graph-first rewrite may change. If Daniel wants the samples to show rewritten text, move those eleven books ahead of the sample build and budget about 22 additional review hours.

## (c) Edition scheme

**Second-edition rule:** create a separate edition when a printed book remains on sale or when live learner records must retain their article identity. A book with neither print nor live rows uses its existing package tree for the graph-first rewrite before its first print; it gets no `-e2` edition. A live-row book gets a separate graph-first edition, even if it is not printed. Never share article rows between editions.

| Book identity | Edition slug | Lessons | Package key / Workbooks folder | Tutor `primary/` folder | Audio / clips | Approval | Graph release and tags | Print label |
|---|---|---|---|---|---|---|---|---|
| Primary Advantage Origins 2, current print | `o2` | 1–14 | `o2/<n>` / `content/primary/origins-2/` | `origins-2-a0/` | `content/primary/origins-2/media/<lesson>/`; tracked `media/clips.sha256`; local `.clips/` ignored | Preserve current state | Existing tags; no new release claim | Origins 2 |
| Primary Advantage Origins 2, graph-first | `o2-e2` | 1–14 | `o2-e2/<n>` / `content/primary/origins-2-e2/` | `origins-2-e2-a0/` after approval and import readiness | Matching edition media folder, checksum file, ignored `.clips/` | Draft until Daniel approves | Pin a reviewed graph commit; tag each lesson | Origins 2, Edition 2 |
| Primary Advantage Origins 3.1, current print | `o3-1` | 1–14 | `o3-1/<n>` / `content/primary/origins-3.1/` | `origins-3.1-a0/` | `content/primary/origins-3.1/media/<lesson>/`; tracked `media/clips.sha256`; local `.clips/` ignored | Preserve current state; insert approval remains distinct | Existing tags; insert is a new graph-first article | Origins 3.1 |
| Primary Advantage Origins 3.1, graph-first | `o3-1-e2` | 1–14 | `o3-1-e2/<n>` / `content/primary/origins-3.1-e2/` | `origins-3.1-e2-a0/` after approval and import readiness | Matching edition media folder, checksum file, ignored `.clips/` | Draft until Daniel approves | Pin a reviewed graph commit; tag each lesson | Origins 3.1, Edition 2 |
| Reading Advantage Origins 2, current print | `ra-o2` | Unverified | No package key or folder before article manifest | None until article manifest exists | Unverified | Unverified | Unverified | Origins 2 |
| Reading Advantage Origins 2, graph-first | `ra-o2-e2` | Unverified | No package key or folder before article manifest | None until article manifest exists | Unverified | Pin only after article manifest and graph check | Draft after source manifest | Origins 2, Edition 2 |

The existing Tutor import projects include `origins-2-a0/`, `origins-3.1-a0/`, `origins-3.2-a0/`, and `quest-4-a1/`. The folder `adventures-1.0-a1/` contains older Tutor workbook files. Its `project.json` says Origins, level 2, A0, while a lesson says Adventures, A1; treat its name and metadata as inconsistent, not as a valid Adventure project. Keep draft editions outside `primary/`; Tutor imports every folder there and requires `project.json`. Add the edition folder to `primary/` only after approval, package validation, and the Tutor edition-manifest importer are ready. Keep lesson URLs distinct, such as `/lesson/o2/1` and `/lesson/o2-e2/1`.

The Workbooks injector is `dashboard/scripts/inject-lessons.ts`. Make it select by edition key and package key. Include edition identity in logs, verification, backups, media paths, and idempotency checks. The graph-first edition must create new rows. Do not invoke legacy-ID fallback or set `meta.replaces` to a legacy article. Keep `primary_legacy_id_map` unchanged.

Use a same-number crosswalk as a reference only: `o2/1` → `o2-e2/1` through lesson 14, and `o3-1/1` → `o3-1-e2/1` through lesson 14. Confirm each mapping against approved manifests. Do not copy learner records or imply equal text. No Reading Origins 2 crosswalk exists before its source manifest.

## Open questions for Daniel

- Should A-29 samples show current packages or rewritten text? Default: current packages; this avoids 22 additional review hours before the build.
- Does the Tutor importer accept the edition manifest? Default: add edition folders only after the manifest importer is ready.
- What is the printer lead time for Quest 5? Default: require confirmation before promising May 2027 delivery.
- Where are the Reading Advantage Origins 2 articles and media? Default: create no package or database rows before the article manifest names them.
- Who confirms stock is gone and authorizes cut-over? Default: Daniel confirms stock; no automatic date.

## Dates that this plan moves

None of the existing Storytime, demo, or book-order dates move. Earliest planned Quest 5 printer file: 2026-12-18. Risk: May delivery is unconfirmed until the printer lead time is known. The 2026-11-06 printer file remains on hold.

Facts changed: none
