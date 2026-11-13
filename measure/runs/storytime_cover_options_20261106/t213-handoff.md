# Task 2.13 hand-off: option A covers, from storytime_cover_options to the print track

From: track `storytime_cover_options_20261106` (build session, 2026-11-13).
To: the print session, through the orchestrator.
Receiving task: "Task (Hand-off from storytime_cover_options)", Phase 9 of `measure/tracks/storytime_print_r1_20261025/plan.md` (line 1366).
Language: English only. This text holds no Thai.

## 1. Owner approval

Daniel approved the 14 A3 and 14 leaf reader covers on 2026-11-13 (Google Tasks LW5mMW9WbFJvNTR1OUNKVQ, 11:41, PM relay, verbatim): "They all look fine at 12:40. Teacher gave is not cut." These words cover the reader covers only. The PM cancelled the F9 fix round. The precondition of the receiving task is met for the reader covers (Task 2.14 of the cover track is `[x]`).

PM correction (2026-11-13, about 14:20): the student and teacher book covers (alt-hlogo r5) were not in the sheets that Daniel passed. His last word on the book covers is "R2" (2026-11-11). The PM sent him the r5 sheets (Tasks look item, due 2026-11-15). Task 2.14b of the cover track holds his answer. The r5 book covers are not approved.

Update (2026-11-13, about 14:50): r5 failed Daniel's look on 2026-11-13 (no title on the front). The r6 book covers follow (fix round F10, due 2026-11-14 10:00). The release keeps r2 until Daniel passes r6. The r5 files below are not release files.

## 2. The accepted folder

- Folder: `~/Desktop/print-ready/storytime/covers-quest-v1/`
- `MANIFEST.txt` SHA-256: `8f1901a39d9decc69a6b0a671b9c5c2ca8a4a1a3a88c0d0b6f9d07e4a2477a87` (133 lines).
- A line of the manifest is: SHA-256, size in bytes, relative path. The check of 2026-11-13 is `measure/runs/storytime_cover_options_20261106/t211-accepted-manifest.txt`: 133 of 133 OK, 0 FAILED, 0 size differences. A plain `sha256sum -c MANIFEST.txt` does not work, because the size column reads as a path. Drop the column first: `awk '{print $1"  "$3}' MANIFEST.txt | sha256sum -c -`.
- Do not change a file in this folder. A new build goes to a new folder.

## 3. The release print files

The values below are the SHA-256 and the size of the MANIFEST lines. No file was hashed again for this text.

The release files below are the 2 reader cover files (approved by Daniel on 2026-11-13) and the 2 r2 book cover files (Daniel's last word on the book covers, "R2", 2026-11-11):

| File | SHA-256 | Size (bytes) | Pages |
|---|---|---|---|
| `readers-a3/Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf` | `b944470339b19e42b77f8151815ab1907be5f354127c163109b2fa1ba0ddea58` | 44986000 | 14 |
| `readers-leaf/Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf` | `3f131660a61313c7910be03fa49388bc773fe76d0b47d6121367b4a8147949b7` | 3328600 | 14 |
| `student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf` | `bc00778ebcc91787b708a5dec353f75aa4559218404e598bcc596ec07daf6663` | 6300245 | 2 |
| `teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf` | `6a50cdb2767c3afe734d96d1d38657d11f48e11289b008753d89c9a955cdeefd` | 7029461 | 2 |

The cover v4 (student book) and the cover v2 (teacher book) are the last 2 rows. The release book cover files are these r2 files until Task 2.14b of the cover track closes. The folder also holds older variants of both books (no suffix, `alt-hlogo`, `r3`, `r4`) for the record (`print-gate.txt`, D-3).

The r5 book cover files failed Daniel's look on 2026-11-13; not release files:

- `student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r5_PDFX-1a.pdf`, `e0f09b7f1949ba2c28d15ff2ccd5f79fb22896ba24e27672d65c85a1424de2c7`, 6289779 bytes.
- `teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r5_PDFX-1a.pdf`, `850ed03f69164af9bf41179c33cb7bb15e4725a8b2b2257ee0dc5bae9a0625fd`, 7017934 bytes.

The r6 book cover files (fix round F10) are in `~/Desktop/print-ready/storytime/covers-quest-v1-books-r6/`. The SHA-256 of its `MANIFEST.txt` is `a7f9b91c1bed3dace547437d9c75fe822134e4859e392f2df3496bea8aba025f`. Status: pending Daniel's answer (Task 2.14b).

When Daniel says ok on r6, the orchestrator sends a one-line update to the print track.

The page PNG files at 300 ppi are in the same folders: `readers-a3/` (17 manifest lines, 14 PNG files), `readers-leaf/` (17 lines, 14 PNG files), `student/`, and `teacher/`. The contact sheets are in `contact-sheets/` (`all.png`, `readers-a3.png`, `readers-leaf.png`, `student-alt-hlogo-r5.png`, `teacher-alt-hlogo-r5.png`).

### The reader-back-r5 files (page 1 is the quest cover)

| File | SHA-256 | Size (bytes) |
|---|---|---|
| `reader-back-r5/Storytime-Advantage-L2-Readers-W01-v1_PDFX-1a.pdf` | `ffece06e0c94df8b587417aad55bf1c74f5a9ee6e3f73f11d22e7eb2dde128bd` | 3284968 |
| `reader-back-r5/Storytime-Advantage-L2-W01-hello-A3-v1.pdf` | `887328774ac6cc7ac56b4207521c682a37143d36b85fbf500336fb0534762ac8` | 83488849 |
| `reader-back-r5/Storytime-Advantage-L2-W01-nan-can-nod-A3-v1.pdf` | `f450e3ace40a80b08fe4192689b4a27cf5ed10a55be9536a46ae51d1f9406b2f` | 62525635 |
| `reader-back-r5/l2-w01-hello-a3-page1.png` | `7b3bea2a59f7e88e67cffa3c914d68c8434154d682e95c054025efa5b5fbfdc1` | 5294354 |
| `reader-back-r5/l2-w01-hello-a3-page12.png` | `15e56a3fec114c19fc4189c3222850a045aab29c38637ee49fd6a412cacce667` | 153414 |
| `reader-back-r5/l2-w01-nan-can-nod-a3-page1.png` | `5d545cbfa0c89f66e8594948fca0c8766a09b78c063927baabdf1cad50cf7ce1` | 6596872 |
| `reader-back-r5/l2-w01-nan-can-nod-leaf-page12.png` | `303012dcdcd96be157576b83ba90423b4aa2ec84e667ab3a2793dceb44f68be4` | 656495 |

The folder `reader-back-r4/` is the older set, for the record.

## 4. The reader cover function

File: `dashboard/lib/storytime/print/cover-quest.ts` (last code change: commit `22d42ad8`; the A3 page 1 fix: `12f7aa75`; spec FR-9.3, D-A4).

Exported signature, quoted from the file:

```ts
export function questReaderCoverPage(
    reader: QuestReaderRow,
    trim: QuestTrim,
    assets: QuestRenderAssets,
    opts: QuestRenderOptions,
): { body: string; css: string }
```

Contract:

- It returns the body and the CSS of one reader cover page. The body holds no document tag, and it is one `div` with the class `quest-reader-page`. The CSS holds no `@page` rule. The print track owns the page rule.
- The trim selects the kind: a `widthMm` of 300 or more gives the A3 cover (420 x 297 mm), and a smaller width gives the leaf cover (198 x 148.5 mm).
- `reader` is one row of `questReaders()` (the 14 readers of Level 2, weeks 1 to 7, two for each week). `assets.art` is the URL of the art (`file://` or `data:`).
- `opts.bleedMm` is 0 or 3. Any other value throws an `Error`. `opts.top` is `banner` (the default) or `hlogo`. The shipped style is `hlogo`. `opts.leafMark` is the text `<reader title> · leaf <n> of <m>` for page 1 of a leaf, and the footer strip holds it. A leaf with no `leafMark` is unchanged.
- The helper `questReaderPageCss(trim)` gives the CSS alone. Every selector starts with `.quest-`.
- The call in `dashboard/lib/storytime/print/readers.ts` (line 281) is: `questReaderCoverPage(row, trim, { art }, { bleedMm: 0, top: 'hlogo', leafMark })`. The fast gate of the receiving task, `grep -c "from './cover-quest'" dashboard/lib/storytime/print/readers.ts`, prints `1` on this checkout. The print track confirms this wiring and does the rest in its own files.

## 5. The receiving task and its fast gate

The line (plan.md of the print track, Phase 9, line 1366): "Task (Hand-off from storytime_cover_options): put the option A reader cover pages (cover-quest, Task 2.13 of storytime_cover_options_20261106) into the reader files of the release proof."

- Done when: the 14 A3 reader files and the student book of the release proof hold the option A cover page as page 1 of each reader, the reader cover copy check passes, and `PRINT_GATE` exits 0 on the student book print file.
- Fast gate: `grep -c "from './cover-quest'" dashboard/lib/storytime/print/readers.ts` prints `1`.
- Evidence: automated plus peer-report. The cover track confirms the files.
- The task comes before the release proof task of the same phase.

## 6. The dates

- Release proof: 2026-11-20 (the receiving task is due before it).
- Daniel's approval of the release proof: 2026-11-24.
- Print order: 2026-11-25.

## 7. Done when (Task 2.13)

The print session confirms receipt (evidence: peer-report).
