// @vitest-environment jsdom
/**
 * Red of the round F3 to F6 of the PM look of 2026-11-11 (track storytime_cover_options_20261106,
 * Phase 2, the Task (Red, F3 to F6) pair of 2026-11-11).
 *
 * Daniel's cover rules 5 and 6 (word for word): "the art keeps the main figures (the dog) fully
 * visible"; "no chrome element covers a face, a head, the dog, or another key object".
 *
 * The PM order of 2026-11-11 (word for word): "F3 (fault): the title plaque and the sub-pill cover
 * the dog's body on Nan Can Nod (A3 + leaf: chest and paws) and on The Top (A3 + leaf: legs).
 * Extend the head test to key boxes: every face and head, the dog's WHOLE body, and the title object
 * when the title names it (the top, the pan, the ball). Test: 0 overlaps between every chrome part
 * and every key box on all 28 reader covers and both fronts. Fix method is yours, inside the rules:
 * plaque stays horizontally centered, text fill 80 % or more, logo colors, art never stretched, no
 * new frame. People's bodies below the shoulders may stay covered. F4 (fault): the leaf footer
 * crosses the line art. Add a white strip behind the leaf footer, so no line crosses a letter. Test
 * it by pixels. F5: yes, the quest reader covers replace page 1 in the final reader build. No band
 * word ("SPROUT") on any printed page of a reader. F6: remove the repeated "Storytime Advantage"
 * header line from page 12; keep the word list, the logo tile and the footer."
 *
 * The pins of this file (the shipped style `top: 'hlogo'`, the bleed 0):
 *   D2 (F3): on the 2 fronts and the 28 reader covers, 0 overlaps between the painted box of every
 *       top-level chrome part (`[data-part]` other than the art) and every key box of
 *       `pictures-heads.json` (kinds head, dog-body, title-object), with a clearance of 1 mm. Each
 *       key box maps from art pixels to page millimetres through the real `object-fit: cover`
 *       transform of the art layer (the computed `object-position` included). Every dog-body and
 *       title-object box lies fully inside the trim, every head box too (one exception, Q1 below),
 *       and the art layer keeps the aspect of the art (cover) and covers the page.
 *   D3 (F3, the placement rule, pinned by outcome): (a) a cover whose default chrome is free keeps
 *       every chrome box (DEFAULT_BOXES, measured at the role base f2a2a1d9); (b) the plaque and its
 *       sub-part (the A3 role bar, the leaf footer and its strip) stay centred on each other within
 *       1 mm; (c) the plaque stays centred on the page within 1 mm outside the exception list; (d) a
 *       cover with a full-size centred free place keeps the full size and takes the lowest free place
 *       (1 mm steps up from the default); (e) the A3 title font stays at 20.48 mm or more (50 % of
 *       40.96 mm), the leaf title font at 8.575 mm or more (50 % of 17.15 mm), the front row font at
 *       5.00 mm or more (50 % of 10.00 mm), and the leaf footer keeps 9 pt. The week pill keeps its
 *       top right box when that box is free; else it takes the mirrored top left box or a lower
 *       place in one of the 2 columns. The cap height rule (75 % to 85 % of the band) stays pinned
 *       by S3 of `quest-cover-standing-rules.test.ts`.
 *   D4 (F3): EXCEPTIONS equals the covers with no centred free place at the 50 % plaque size,
 *       computed from the key boxes and the default boxes. On an exception cover the group stays
 *       at least 5 mm inside the trim.
 *   D5 (F4, pixels): each of the 14 hlogo leaf covers holds one `footer-strip` part: white
 *       (#FFFFFF), opaque, with no border. Chrome renders each leaf cover at 300 ppi with the real
 *       line art twice: as built, and with the footer text and icons made transparent. In the second
 *       render every pixel inside the strip box is white (each channel 250 or more). In the first
 *       render the ink box of the footer (the pixels that differ between the 2 renders) lies inside
 *       the strip box with 0.8 mm of padding or more.
 *   D6 (F5): page 1 of every reader is the quest reader cover of `questReaderCoverPage` for its row,
 *       its trim, and its art, with `top: 'hlogo'`: the leaf design at 198 x 148.5 mm with the line
 *       art on `workbook`, and the A3 design on the full 420 x 297 mm page with the colour art on
 *       `a3-color` (no 2.0 scale, no white bands). One element of page 1 holds `data-picture-id` and
 *       `data-picture-file` and wraps the quest page, so the picture lists keep the cover row.
 *       Proof mode prints the quest chrome, the text PICTURE MISSING, and no image outside a logo
 *       tile. In Chrome, page 1 fills its page and holds the chrome boxes of the cover build within
 *       0.1 mm, with League Spartan loaded. 0 band words (every band of QUEST_BANDS, any case,
 *       whole word) on any printed reader page: both outputs, proof and final mode, and the reader
 *       leaves of the student book.
 *   D7 (F6): page 12 holds no "Storytime Advantage" text and no `.reader-series` line. It keeps the
 *       heading "Words in this book", the word row, one logo tile with one image, and the footer.
 *   D8 (keep): the default (banner) renders keep their bytes (SHA-256 at the role base), and the 2
 *       hlogo fronts keep their bytes when their default place is free. G4 of
 *       `quest-cover-f1f2.test.ts` pins the 2 hlogo book backs.
 *
 * Q1 (the default of this file, the PM can overrule it): on w01 Nan Can Nod A3 no art position
 * shows the Nan head box (art rows 60 to 1680) and the dog-body box (rows 1530 to 2990) together,
 * because the A3 page shows 2828.6 of the 3000 art rows. The dog wins (rule 5 names the dog): on
 * that cover the dog box lies inside the trim, and the Nan head box may lie up to 12 mm above the
 * top edge (bottom-aligned art: 11.70 mm).
 *
 * The method notes:
 *   - The cover renders use a small data URL as the art, so Chrome loads no art file; the mapping
 *     takes the art element box and the computed object-position from Chrome and the pixel size
 *     from the key box file. D5 alone loads the real line art.
 *   - The painted box of a part is the union of its painted boxes (background, border, image, SVG
 *     shape, and text line), as in G7 of `quest-cover-heads.test.ts`.
 *   - The file prints ids, millimetres, counts, and hashes only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import {
    QUEST_BANDS,
    loadQuestCovers,
    questReaderCoverPage,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestCoverKind,
    type QuestPanelValue,
    type QuestReaderRow,
    type QuestRenderOptions,
    type QuestTrim,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';
import { compileStorytimeReaders, type StorytimeReaderOutput } from '../lib/storytime/print/readers';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import type { StorytimeWeek } from '../lib/storytime/schema';

/** The art string of the cover renders. Chrome loads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The 1 x 1 PNG that replaces each picture source of the reader documents in Chrome. */
const TINY_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** The render options of the shipped style. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The render options of the default style. */
const BANNER_OPTIONS: QuestRenderOptions = { bleedMm: 0 };

/** The key box file. */
const KEYS_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-heads.json');

/** The git-ignored picture folder of Level 2. */
const PICTURES_DIR = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');

/** The millimetres of one CSS pixel. */
const MM_PER_PX = 25.4 / 96;

/** The clearance between a chrome part and a key box (D2). */
const CLEARANCE_MM = 1;

/** The least distance of an exception group from the trim (D4). */
const TRIM_MARGIN_MM = 5;

/** The tolerance of an unchanged box (D3 a). */
const SAME_BOX_MM = 0.05;

/** The tolerance of the centring checks (D3 b, c). */
const CENTRE_TOLERANCE_MM = 1;

/** The tolerance of the page 1 boxes against the cover build (D6). */
const PAGE1_BOX_MM = 0.1;

/** The least font sizes of the titles at 50 % of their present size (D3 e). */
const MIN_TITLE_FONT_MM: Record<string, number> = {
    'student-front': 5.0,
    'teacher-front': 5.0,
    'reader-a3': 0.5 * 40.96,
    'reader-leaf': 0.5 * 17.15,
};

/** The leaf footer font size: 9 pt (D3 e). */
const LEAF_FOOTER_FONT_MM = (9 * 25.4) / 72;

/** The device scale of the 300 ppi render (D5). */
const PPI_300_SCALE = 300 / 96;

/** The least padding of the footer ink inside the strip, by pixels (D5). */
const STRIP_INK_PADDING_MM = 0.8;

/** The cover of Q1: the art aligns its bottom edge with the trim, and the Nan head may lie 12 mm above the top edge. */
const Q1_COVER = 'w01-2 reader-a3';

/** The most distance of the Nan head box above the top edge on the cover of Q1. */
const Q1_HEAD_OUT_MM = 12;

/** The default art position of each cover for the D3 and D4 computation. */
const DEFAULT_POSITION = (id: string): string => (id === Q1_COVER ? '50% 100%' : '50% 50%');

/**
 * The exception list of D4: the covers with no centred free place at the 50 % plaque size.
 * Proof (the D4 test prints it): the centre line of the page meets a key box at every height of
 * the group. Filled from the D4 run on the role base f2a2a1d9.
 */
// Proof of the D4 run at the role base f2a2a1d9 (centre band, group height at 50 %, key boxes in mm):
//   w01-2 reader-a3: the 50 % group needs 35.80 mm in the band 134.9 to 285.1 mm between 5 mm and
//   293.26 mm; Nan head y -11.7 to 158.4, Pip dog head y 143.7 to 219.3, Pip dog body y 142.7 to
//   295.9 mm: the band holds no free 35.80 mm.
//   w01-2 reader-leaf: the 50 % group needs 20.98 mm in the band 55.8 to 142.2 mm between 5 mm and
//   143.98 mm; Nan head y 3.0 to 82.2, Pip dog head y 76.2 to 110.9, Pip dog body y 75.7 to 147.0 mm:
//   the band holds no free 20.98 mm.
const EXCEPTIONS: string[] = ['w01-2 reader-a3', 'w01-2 reader-leaf'];

/**
 * The painted boxes of the top-level chrome parts of the 30 hlogo covers at the role base f2a2a1d9,
 * in millimetres: left, top, right, bottom. The D3 test prints them as DEFAULT_BOX lines.
 */
const DEFAULT_BOXES: Record<string, Record<string, [number, number, number, number]>> = {
    'student-front': { 'title-plaque': [22.98, 278.00, 187.02, 292.00] },
    'teacher-front': { 'title-plaque': [22.94, 278.00, 187.05, 292.00] },
    'w01-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [132.70, 236.00, 287.30, 278.92], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w01-1 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w01-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [61.72, 236.00, 358.28, 278.92], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w01-2 reader-leaf': { 'title-plaque': [27.24, 113.00, 170.76, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w02-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [78.91, 236.00, 341.09, 275.99], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w02-1 reader-leaf': { 'title-plaque': [34.44, 113.00, 163.56, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w02-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [126.14, 236.00, 293.85, 278.60], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w02-2 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
    'w03-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [129.85, 236.00, 290.15, 278.92], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w03-1 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w03-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [111.46, 236.00, 308.54, 278.92], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w03-2 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
    'w04-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [91.18, 236.00, 328.81, 275.99], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w04-1 reader-leaf': { 'title-plaque': [39.57, 113.00, 158.42, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w04-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [143.51, 236.00, 276.49, 278.28], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w04-2 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
    'w05-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [84.60, 236.00, 335.40, 278.28], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w05-1 reader-leaf': { 'title-plaque': [36.82, 113.00, 161.18, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w05-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [58.79, 236.00, 361.20, 278.92], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w05-2 reader-leaf': { 'title-plaque': [26.01, 113.00, 171.98, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
    'w06-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [98.76, 236.00, 321.24, 278.60], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w06-1 reader-leaf': { 'title-plaque': [42.74, 113.00, 155.26, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w06-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [98.23, 236.00, 321.76, 275.99], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w06-2 reader-leaf': { 'title-plaque': [42.52, 113.00, 155.47, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
    'w07-1 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [84.69, 236.00, 335.30, 278.92], 'role-bar': [146.47, 273.42, 273.52, 293.26] },
    'w07-1 reader-leaf': { 'title-plaque': [36.85, 113.00, 161.14, 132.99], 'footer': [57.78, 137.26, 140.22, 142.98] },
    'w07-2 reader-a3': { 'week-pill': [317.17, 31.01, 362.83, 47.15], 'title-plaque': [112.97, 236.00, 307.02, 275.99], 'role-bar': [156.92, 273.42, 263.07, 293.26] },
    'w07-2 reader-leaf': { 'title-plaque': [44.01, 113.00, 153.99, 132.99], 'footer': [60.21, 137.26, 137.79, 142.98] },
};

/** The SHA-256 of the default (banner) renders and the 2 hlogo fronts at the role base f2a2a1d9. */
const KEEP_SHA: Record<string, string> = {
    'hlogo student-front': 'f400d9bb70319b10c686399ad6b850bec950fb1f3551e4cc4b3223b7ea73e093',
    'hlogo teacher-front': 'c1740c1ac7990a5a77e23bf9bae0a68b568ff0070356b56fb4a762cfb7487d5c',
    'banner student-front': '5ae17617643524865a9dbbc63cc73754b0170fbe5063bc71d35399288d3265b6',
    'banner teacher-front': 'b526e81e4f6aa9e9c94d8354f334e4d044b9ca22f8e7f5b344b28fe515895daf',
    'banner student-back': '8bdd615af444553c3aecca920c809beb5d52bc7ec7cc819763b837b76d4df2b0',
    'banner teacher-back': '5e086f4fcc6b2ba6d799f9c9d16212338ff5cf4d0c055cd5319fbd5ad486be79',
    'banner w01-1 reader-a3': 'c9aa5de6afa1b18b4e0a0530a6e9792243513e0fd0395344f2ac7d4bffe27f52',
    'banner w01-1 reader-leaf': 'e0385f97b6567f6e6eace8c28d005547a33bbb8c561e753af7dc45d0f94cd90e',
    'banner w01-2 reader-a3': 'aa409176d61dd2d8e22f1d9b2efcdb23e07e5254b8c2c2e366fce443f4118be6',
    'banner w01-2 reader-leaf': '1ff960ed3a394b79ef0a710b2c29c3d06e40c94f5c06aa6944dc87de1828456a',
    'banner w02-1 reader-a3': 'a1cfa0349af43fceb6d90a6621367b2e73f961d68fdc675985838724fbe0e605',
    'banner w02-1 reader-leaf': '90a7900d5703b54f7c7840ed9cf068d89d587a029ae11a55fb36352906414b66',
    'banner w02-2 reader-a3': '2cd0e4bb7a9d83e2f0101e695508358ef931feab13869c96ee4046df20e3a93b',
    'banner w02-2 reader-leaf': 'adf5fb301742daf131c9de24700827ba52a2648bfde1b495b20cff2e2d38649c',
    'banner w03-1 reader-a3': '3786e785037e4c4af1e11dd26655c226a4bb97bcc03c894994f2ab4f08dec118',
    'banner w03-1 reader-leaf': '422ceb07591469ea3168f4e0fbecb45483c11ea738f82305acbcfa9ba758fd88',
    'banner w03-2 reader-a3': '340d03d7d423f69090005b0573ea1d14b037b4540591b07e1053643d981ca18b',
    'banner w03-2 reader-leaf': 'a264e5460fe91a3599b5183eaa4d48ed82f3cbfeb4473db8880bc4f1f7ba6aba',
    'banner w04-1 reader-a3': '352e248aa74e893243ae52b2f0f109d153f218cfdc7a20b581713ce3fe6c6e29',
    'banner w04-1 reader-leaf': 'f3e4e723801e6441ce9b5efb4928d9f704ab52c2abd781217bfc9a0773cea52b',
    'banner w04-2 reader-a3': 'f0480220f3e81af34e642768d97e006ecd73fa96be6bca967e167b63f75f6462',
    'banner w04-2 reader-leaf': 'cfcd3394dc0cbab1ecdc99a6659c5a3db0014a130d88ca62d987176c0fa1f944',
    'banner w05-1 reader-a3': 'b4432ae3f60b2cdfa56456439618471ad38f3f35aeca09e8aa883e00ee375f45',
    'banner w05-1 reader-leaf': 'e084c3b4b799663b02f95d9cdc637b905d48fd12aa41ec0de327b9adef51613b',
    'banner w05-2 reader-a3': 'b5de52066edbc492b29d6ad015925cd26b8928bc024e68b945d7dd7305832ba1',
    'banner w05-2 reader-leaf': 'd4132c6514500298d62e99127bcd937611393ed8bb16d431863f9c739683a1af',
    'banner w06-1 reader-a3': 'cca6cbbcc33e056c50fad81dd86869ac930a7e6d05c6ce5dfad1f5ed406ca645',
    'banner w06-1 reader-leaf': '3a43ddc49971f925b0944787c04d64818bcfcd672410479b44d9080237560f24',
    'banner w06-2 reader-a3': '7b9a09a21da649b2f0e0c21d168688d13ccfa01b97af489d43f91d029f51ede5',
    'banner w06-2 reader-leaf': '1084a5bbea57dc66ae87d1e770bd9704e0b9e3a76f331aa49f8a2f1b3b6e4632',
    'banner w07-1 reader-a3': '39a7db579aaa89dd8b4f85c29189d7ec9460ec2fae950391c354b15ff4e71fd1',
    'banner w07-1 reader-leaf': '47198cc13bd033cb258aab9a451bb7455180070c583b2566450ad9d69d27c37b',
    'banner w07-2 reader-a3': '9572ca9689f90b27c2488bfae3a7a1e2b3c48f0660cfc6d7ca6b4754c612adf1',
    'banner w07-2 reader-leaf': 'f62606373859bd28467c28f3c37bd5d9d3c47185e5568877b39f98f90391cb7a',
};

/** The row ids of the 14 reader rows, in the order of `questReaders()`. */
const ROW_IDS = [
    'w01-1',
    'w01-2',
    'w02-1',
    'w02-2',
    'w03-1',
    'w03-2',
    'w04-1',
    'w04-2',
    'w05-1',
    'w05-2',
    'w06-1',
    'w06-2',
    'w07-1',
    'w07-2',
] as const;

/** The 2 reader outputs. */
const OUTPUTS: StorytimeReaderOutput[] = ['workbook', 'a3-color'];

/** The trim of the quest page of each output. */
const OUTPUT_TRIM: Record<StorytimeReaderOutput, QuestTrim> = {
    workbook: { widthMm: 198, heightMm: 148.5 },
    'a3-color': { widthMm: 420, heightMm: 297 },
};

/** The kinds of the key boxes. */
const KEY_KINDS = ['head', 'dog-body', 'title-object'] as const;

/** One box in millimetres. */
interface MmBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** One key box of the JSON. */
interface KeyBox {
    /** The name of the key object. */
    label: string;
    /** The box in pixels of the file: x0, y0, x1, y1. */
    box: [number, number, number, number];
    /** The kind: head, dog-body, or title-object. */
    kind: string;
}

/** One entry of the JSON. */
interface KeyEntry {
    /** The width of the file in pixels. */
    widthPx: number;
    /** The height of the file in pixels. */
    heightPx: number;
    /** The key boxes. */
    boxes: KeyBox[];
}

/** One cover of D2 to D5. */
interface CoverSpec {
    /** The name of the cover in the failure lines. */
    id: string;
    /** The cover kind. */
    kind: QuestCoverKind;
    /** The art file of the cover. */
    artFile: string;
    /** The reader row of a reader cover. */
    row: QuestReaderRow | null;
    /** The rendered HTML. */
    html: string;
}

/** One measured part. */
interface PartMeasure {
    /** The `data-part` value. */
    name: string;
    /** The painted box. */
    box: MmBox | null;
}

/** The Chrome measure of one cover page. */
interface CoverMeasure {
    /** The page box. */
    pageBox: MmBox | null;
    /** The art element box. */
    artBox: MmBox | null;
    /** The computed object-fit of the art. */
    objectFit: string;
    /** The computed object-position of the art. */
    objectPosition: string;
    /** The top-level chrome parts. */
    parts: PartMeasure[];
    /** The computed font size of the title text in millimetres. */
    titleFontMm: number;
    /** The computed font size of the leaf footer in millimetres. */
    footerFontMm: number;
    /** The strip parts: the computed fill, opacity, and border widths. */
    strips: { fill: string; opacity: string; borders: number[] }[];
}

/** The Chrome measure of one reader page 1. */
interface Page1Measure {
    /** The reader title. */
    title: string;
    /** The page box: the reader page on `workbook`, the A3 page on `a3-color`. */
    pageBox: MmBox | null;
    /** The quest page box. */
    questBox: MmBox | null;
    /** The top-level chrome parts, relative to the quest page origin. */
    parts: PartMeasure[];
}

/** The Chrome measure of one reader document. */
interface ReaderDocMeasure {
    /** Whether a loaded League Spartan face exists. */
    league: boolean;
    /** The page 1 of each reader. */
    page1: Page1Measure[];
}

/** The D5 pixel result of one leaf cover. */
interface StripPixels {
    /** The count of the strip parts. */
    strips: number;
    /** The strip box in device pixels of the page screenshot. */
    stripPx: MmBox | null;
    /** The lowest channel value inside the strip in the render with the transparent footer. */
    minChannel: number;
    /** The count of the pixels inside the strip below 250 in a channel. */
    darkPixels: number;
    /** The ink box of the footer in device pixels, or null when no pixel differs. */
    inkPx: MmBox | null;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of this file. */
let browser: Browser | undefined;

/** The covers of D2 to D5. */
let covers: CoverSpec[] = [];

/** The Chrome measures of the covers. */
const coverMeasures = new Map<string, CoverMeasure>();

/** The D5 pixel results by cover id. */
const stripPixels = new Map<string, StripPixels>();

/** The final reader documents by week and output. */
const finalDocs = new Map<string, string>();

/** The Chrome measures of the final reader documents by week and output. */
const readerMeasures = new Map<string, ReaderDocMeasure>();

/**
 * Reads the key box file.
 * @returns The entries by file name.
 */
function readKeys(): Record<string, KeyEntry> {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) as Record<string, KeyEntry>;
}

/**
 * Reads the SHA-256 of a text.
 * @param data The text.
 * @returns The hash.
 */
function sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * Reads the panel values of the shipped Level 2 Unit 1 row.
 * @returns The values.
 */
function panelValues(): QuestPanelValue[] {
    const data = loadStorytimeCoverBooks();
    const book = data.books.find((row) => row.level === 2 && row.unit === 1);
    expect(book, 'books.json holds the Level 2 Unit 1 row.').toBeTruthy();
    const graph = readPhonicsGraph();
    if (!graph) return [{ field: 'story', value: book!.panel?.story?.text ?? '', items: [] }];
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
    return storytimeCoverPanelValues(book!, { weeks, graph });
}

/**
 * Reads the book row of quest.json.
 * @returns The row.
 */
function bookRow(): QuestBookRow {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    return data.books[0];
}

/**
 * Builds the 30 hlogo covers: the 2 fronts, the 14 A3 reader covers, and the 14 leaf covers.
 * @returns The covers.
 */
function buildCovers(): CoverSpec[] {
    const book = bookRow();
    const built: CoverSpec[] = [
        {
            id: 'student-front',
            kind: 'student-front',
            artFile: book.art.studentFront,
            row: null,
            html: renderQuestCover('student-front', book, { art: ART }, HLOGO_OPTIONS),
        },
        {
            id: 'teacher-front',
            kind: 'teacher-front',
            artFile: book.art.teacherFront,
            row: null,
            html: renderQuestCover('teacher-front', book, { art: ART }, HLOGO_OPTIONS),
        },
    ];
    const rows = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    for (const [index, row] of rows.entries()) {
        built.push({
            id: `${ROW_IDS[index]} reader-a3`,
            kind: 'reader-a3',
            artFile: row.picture.fileName,
            row,
            html: renderQuestCover('reader-a3', row, { art: ART }, HLOGO_OPTIONS),
        });
        built.push({
            id: `${ROW_IDS[index]} reader-leaf`,
            kind: 'reader-leaf',
            artFile: row.picture.lineArtFileName,
            row,
            html: renderQuestCover('reader-leaf', row, { art: ART }, HLOGO_OPTIONS),
        });
    }
    return built;
}

/**
 * Reads the Level 2 weeks that hold readers.
 * @returns The weeks.
 */
function readerWeeks(): StorytimeWeek[] {
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2)
        .flatMap((entry) => (entry.week ? [entry.week] : []))
        .filter((week) => week.books.length > 0);
    expect(weeks.map((week) => week.meta.week), 'the Level 2 weeks with readers are the weeks 1 to 7.').toEqual([1, 2, 3, 4, 5, 6, 7]);
    return weeks;
}

/**
 * Reads every Level 2 week.
 * @returns The weeks.
 */
function allWeeks(): StorytimeWeek[] {
    return readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
}

/**
 * Parses one HTML text.
 * @param html The HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Tells whether 2 boxes overlap with a positive area.
 * @param one The first box.
 * @param two The second box.
 * @returns The overlap width and height, or null.
 */
function overlap(one: MmBox, two: MmBox): { width: number; height: number } | null {
    const width = Math.min(one.right, two.right) - Math.max(one.left, two.left);
    const height = Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top);
    return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Grows a box on each side.
 * @param box The box.
 * @param by The growth in millimetres.
 * @returns The grown box.
 */
function grow(box: MmBox, by: number): MmBox {
    return { left: box.left - by, top: box.top - by, right: box.right + by, bottom: box.bottom + by };
}

/**
 * Shows a box in millimetres.
 * @param box The box.
 * @returns The text.
 */
function show(box: MmBox): string {
    return `${box.left.toFixed(2)} to ${box.right.toFixed(2)} mm by ${box.top.toFixed(2)} to ${box.bottom.toFixed(2)} mm`;
}

/**
 * Reads one token of a computed object-position.
 * @param token The token: a percentage or a length in px.
 * @param freeMm The free space of the axis in millimetres (the element size minus the image size).
 * @returns The offset in millimetres, or NaN for an unknown token.
 */
function positionOffset(token: string | undefined, freeMm: number): number {
    if (!token) return Number.NaN;
    if (token.endsWith('%')) return (freeMm * Number.parseFloat(token)) / 100;
    if (token.endsWith('px')) return Number.parseFloat(token) * MM_PER_PX;
    return Number.NaN;
}

/**
 * Maps one key box of the art file to page millimetres through `object-fit: cover` and the
 * object-position of the art element.
 * @param box The key box in pixels.
 * @param entry The entry of the art file.
 * @param art The art element box in millimetres.
 * @param position The computed object-position.
 * @returns The key box in page millimetres, and the image box.
 */
function keyBoxMm(box: KeyBox['box'], entry: KeyEntry, art: MmBox, position: string): { key: MmBox; image: MmBox } {
    const widthMm = art.right - art.left;
    const heightMm = art.bottom - art.top;
    const scale = Math.max(widthMm / entry.widthPx, heightMm / entry.heightPx);
    const tokens = position.trim().split(/\s+/);
    const offsetX = art.left + positionOffset(tokens[0], widthMm - entry.widthPx * scale);
    const offsetY = art.top + positionOffset(tokens[1] ?? tokens[0], heightMm - entry.heightPx * scale);
    return {
        key: {
            left: offsetX + box[0] * scale,
            top: offsetY + box[1] * scale,
            right: offsetX + box[2] * scale,
            bottom: offsetY + box[3] * scale,
        },
        image: { left: offsetX, top: offsetY, right: offsetX + entry.widthPx * scale, bottom: offsetY + entry.heightPx * scale },
    };
}

/**
 * The page size of one cover kind at the bleed 0.
 * @param kind The kind.
 * @returns The width and the height in millimetres.
 */
function pageOf(kind: QuestCoverKind): { widthMm: number; heightMm: number } {
    if (kind === 'reader-a3') return { widthMm: 420, heightMm: 297 };
    if (kind === 'reader-leaf') return { widthMm: 198, heightMm: 148.5 };
    return { widthMm: 210, heightMm: 297 };
}

/**
 * The key boxes of one cover in page millimetres, with the default art position of D3 and D4.
 * @param spec The cover.
 * @param keys The key box file.
 * @returns The key boxes.
 */
function defaultKeys(spec: CoverSpec, keys: Record<string, KeyEntry>): { label: string; box: MmBox }[] {
    const entry = keys[spec.artFile];
    if (!entry) return [];
    const page = pageOf(spec.kind);
    const art: MmBox = { left: 0, top: 0, right: page.widthMm, bottom: page.heightMm };
    return entry.boxes.map((key) => ({ label: `${key.label} (${key.kind})`, box: keyBoxMm(key.box, entry, art, DEFAULT_POSITION(spec.id)).key }));
}

/** The default group of one cover: the plaque box and the sub-part box. */
interface DefaultGroup {
    /** The plaque box. */
    plaque: MmBox;
    /** The sub-part box (the A3 role bar, or the leaf footer grown by 1 mm for its strip), or null on a front. */
    sub: MmBox | null;
}

/**
 * Reads the default group of one cover from DEFAULT_BOXES.
 * @param spec The cover.
 * @returns The group, or null when no default box is pinned.
 */
function defaultGroup(spec: CoverSpec): DefaultGroup | null {
    const boxes = DEFAULT_BOXES[spec.id];
    if (!boxes || !boxes['title-plaque']) return null;
    const toBox = (value: [number, number, number, number]): MmBox => ({ left: value[0], top: value[1], right: value[2], bottom: value[3] });
    const plaque = toBox(boxes['title-plaque']);
    if (spec.kind === 'reader-a3' && boxes['role-bar']) return { plaque, sub: toBox(boxes['role-bar']) };
    if (spec.kind === 'reader-leaf' && boxes.footer) return { plaque, sub: grow(toBox(boxes.footer), 1) };
    return { plaque, sub: null };
}

/**
 * Finds the lowest centred free place of a group at one plaque size: the group moves up from its
 * default bottom in 1 mm steps and stays 5 mm inside the trim.
 * @param spec The cover.
 * @param group The default group.
 * @param scale The plaque size share (1 = the present size).
 * @param keys The key boxes in page millimetres.
 * @returns The plaque box and the sub box of the place, or null when no place is free.
 */
function lowestFreePlace(
    spec: CoverSpec,
    group: DefaultGroup,
    scale: number,
    keys: { label: string; box: MmBox }[],
): { plaque: MmBox; sub: MmBox | null; step: number } | null {
    const page = pageOf(spec.kind);
    const centre = page.widthMm / 2;
    const plaqueWidth = (group.plaque.right - group.plaque.left) * scale;
    const plaqueHeight = (group.plaque.bottom - group.plaque.top) * scale;
    const sub = group.sub;
    const gap = sub ? sub.top - group.plaque.bottom : 0;
    const subWidth = sub ? sub.right - sub.left : 0;
    const subHeight = sub ? sub.bottom - sub.top : 0;
    const bottom0 = sub ? sub.bottom : group.plaque.bottom;
    for (let step = 0; step < 400; step++) {
        const bottom = bottom0 - step;
        const subBox = sub ? { left: centre - subWidth / 2, right: centre + subWidth / 2, top: bottom - subHeight, bottom } : null;
        const plaqueBottom = sub ? bottom - subHeight - gap : bottom;
        const plaque = { left: centre - plaqueWidth / 2, right: centre + plaqueWidth / 2, top: plaqueBottom - plaqueHeight, bottom: plaqueBottom };
        if (plaque.top < TRIM_MARGIN_MM) return null;
        const blocked = keys.some(
            (key) => overlap(grow(key.box, CLEARANCE_MM), plaque) !== null || (subBox !== null && overlap(grow(key.box, CLEARANCE_MM), subBox) !== null),
        );
        if (!blocked) return { plaque, sub: subBox, step };
    }
    return null;
}

/**
 * Opens one HTML text in Chrome from a scratch file.
 * @param page The browser page.
 * @param html The HTML.
 * @returns Nothing.
 */
async function openHtml(page: Page, html: string): Promise<void> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f3f6-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
}

/**
 * The browser code of the painted box of one element, as a function text for `page.evaluate`.
 * It sets `window.__paintedBox`.
 */
const PAINTED_BOX_SCRIPT = `
window.__paintedBox = (root) => {
    const mm = 25.4 / 96;
    const SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'text', 'use', 'image'];
    const rects = [];
    const add = (rect) => { if (rect.width > 0 && rect.height > 0) rects.push(rect); };
    for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
        const tag = element.tagName.toLowerCase();
        if (element instanceof SVGElement) {
            if (SHAPES.includes(tag)) add(element.getBoundingClientRect());
            continue;
        }
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const background = style.backgroundColor.replace(/\\s+/g, '');
        const hasBackground = (background !== 'transparent' && background !== 'rgba(0,0,0,0)') || style.backgroundImage !== 'none';
        const hasBorder = ['top', 'right', 'bottom', 'left'].some((side) =>
            Number.parseFloat(style.getPropertyValue('border-' + side + '-width')) > 0 && style.getPropertyValue('border-' + side + '-style') !== 'none');
        if (hasBackground || hasBorder || tag === 'img') add(element.getBoundingClientRect());
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!(node.nodeValue || '').trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) add(rect);
    }
    if (rects.length === 0) return null;
    return {
        left: Math.min(...rects.map((rect) => rect.left)) * mm,
        top: Math.min(...rects.map((rect) => rect.top)) * mm,
        right: Math.max(...rects.map((rect) => rect.right)) * mm,
        bottom: Math.max(...rects.map((rect) => rect.bottom)) * mm,
    };
};
`;

/**
 * Measures one cover page in Chrome.
 * @param page The browser page.
 * @param html The rendered HTML.
 * @returns The measure.
 */
async function measureCover(page: Page, html: string): Promise<CoverMeasure> {
    await openHtml(page, html);
    await page.evaluate(PAINTED_BOX_SCRIPT);
    return page.evaluate((): CoverMeasure => {
        const mm = 25.4 / 96;
        const painted = (window as unknown as { __paintedBox: (root: Element) => MmBox | null }).__paintedBox;
        const toMm = (rect: DOMRect): MmBox => ({ left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm });
        const art = document.querySelector('[data-part="art"]');
        const artStyle = art ? window.getComputedStyle(art) : null;
        const parts: PartMeasure[] = [];
        for (const element of Array.from(document.querySelectorAll('[data-part]'))) {
            const name = element.getAttribute('data-part') ?? '';
            if (name === 'art' || (element.parentElement && element.parentElement.closest('[data-part]'))) continue;
            parts.push({ name, box: painted(element) });
        }
        const title = document.querySelector('[data-part="title-plaque"] .quest-c');
        const footer = document.querySelector('[data-part="footer"]');
        const strips = Array.from(document.querySelectorAll('[data-part="footer-strip"]')).map((strip) => {
            const style = window.getComputedStyle(strip);
            return {
                fill: style.backgroundColor,
                opacity: style.opacity,
                borders: ['top', 'right', 'bottom', 'left'].map((side) => Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0),
            };
        });
        const page = document.querySelector('.quest-page');
        return {
            pageBox: page ? toMm(page.getBoundingClientRect()) : null,
            artBox: art ? toMm(art.getBoundingClientRect()) : null,
            objectFit: artStyle ? artStyle.objectFit : '',
            objectPosition: artStyle ? artStyle.objectPosition : '',
            parts,
            titleFontMm: title ? Number.parseFloat(window.getComputedStyle(title).fontSize) * mm : 0,
            footerFontMm: footer ? Number.parseFloat(window.getComputedStyle(footer).fontSize) * mm : 0,
            strips,
        };
    });
}

/**
 * Renders one leaf cover with the real line art at 300 ppi twice and reads the strip pixels (D5).
 * @param page The browser page with the device scale of 300 ppi.
 * @param analysis The browser page of the pixel analysis.
 * @param spec The leaf cover.
 * @returns The pixel result.
 */
async function measureStrip(page: Page, analysis: Page, spec: CoverSpec): Promise<StripPixels> {
    const lineArt = pathToFileURL(path.join(PICTURES_DIR, spec.artFile)).href;
    const html = renderQuestCover('reader-leaf', spec.row!, { art: lineArt }, HLOGO_OPTIONS);
    await openHtml(page, html);
    await page.evaluate(() => Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined))));
    const geometry = await page.evaluate(() => {
        const root = document.querySelector('.quest-page');
        const strips = Array.from(document.querySelectorAll('[data-part="footer-strip"]'));
        if (!root || strips.length === 0) return { strips: strips.length, box: null };
        const origin = root.getBoundingClientRect();
        const rect = strips[0].getBoundingClientRect();
        return { strips: strips.length, box: { left: rect.left - origin.left, top: rect.top - origin.top, right: rect.right - origin.left, bottom: rect.bottom - origin.top } };
    });
    const built = (await page.locator('.quest-page').screenshot({ type: 'png' })).toString('base64');
    await page.addStyleTag({
        content:
            '[data-part="footer"], [data-part="footer"] * { color: transparent !important; } ' +
            '[data-part="footer"] svg, [data-part="footer"] svg * { stroke: transparent !important; fill: transparent !important; }',
    });
    const hidden = (await page.locator('.quest-page').screenshot({ type: 'png' })).toString('base64');
    const box = geometry.box
        ? {
              left: geometry.box.left * PPI_300_SCALE,
              top: geometry.box.top * PPI_300_SCALE,
              right: geometry.box.right * PPI_300_SCALE,
              bottom: geometry.box.bottom * PPI_300_SCALE,
          }
        : null;
    const pixels = await analysis.evaluate(
        async ([first, second, strip]): Promise<{ minChannel: number; darkPixels: number; inkPx: MmBox | null }> => {
            const load = async (data: string): Promise<ImageData> => {
                const image = new Image();
                image.src = `data:image/png;base64,${data}`;
                await image.decode();
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('no canvas context');
                context.drawImage(image, 0, 0);
                return context.getImageData(0, 0, canvas.width, canvas.height);
            };
            const one = await load(first as string);
            const two = await load(second as string);
            let minChannel = 255;
            let darkPixels = 0;
            const region = strip as MmBox | null;
            if (region) {
                const x0 = Math.ceil(region.left) + 1;
                const y0 = Math.ceil(region.top) + 1;
                const x1 = Math.floor(region.right) - 1;
                const y1 = Math.floor(region.bottom) - 1;
                for (let y = y0; y < y1; y++) {
                    for (let x = x0; x < x1; x++) {
                        const at = (y * two.width + x) * 4;
                        const low = Math.min(two.data[at], two.data[at + 1], two.data[at + 2]);
                        if (low < minChannel) minChannel = low;
                        if (low < 250) darkPixels += 1;
                    }
                }
            }
            let ink: MmBox | null = null;
            for (let y = 0; y < one.height; y++) {
                for (let x = 0; x < one.width; x++) {
                    const at = (y * one.width + x) * 4;
                    const differs =
                        Math.abs(one.data[at] - two.data[at]) > 16 ||
                        Math.abs(one.data[at + 1] - two.data[at + 1]) > 16 ||
                        Math.abs(one.data[at + 2] - two.data[at + 2]) > 16;
                    if (!differs) continue;
                    if (!ink) ink = { left: x, top: y, right: x + 1, bottom: y + 1 };
                    else {
                        ink.left = Math.min(ink.left, x);
                        ink.top = Math.min(ink.top, y);
                        ink.right = Math.max(ink.right, x + 1);
                        ink.bottom = Math.max(ink.bottom, y + 1);
                    }
                }
            }
            return { minChannel, darkPixels, inkPx: ink };
        },
        [built, hidden, box] as const,
    );
    return { strips: geometry.strips, stripPx: box, ...pixels };
}

/**
 * Measures one final reader document in Chrome: the League Spartan face and the page 1 of each reader.
 * @param page The browser page.
 * @param html The reader document.
 * @returns The measure.
 */
async function measureReaders(page: Page, html: string): Promise<ReaderDocMeasure> {
    const tiny = html
        .replace(/src="file:[^"]*\.png"/g, `src="${TINY_PNG}"`)
        .replace('</head>', '<style>.reader-page[data-turn-deg="180"] { transform: none !important; }</style>\n</head>');
    await openHtml(page, tiny);
    await page.evaluate(PAINTED_BOX_SCRIPT);
    return page.evaluate((): ReaderDocMeasure => {
        const mm = 25.4 / 96;
        const painted = (window as unknown as { __paintedBox: (root: Element) => MmBox | null }).__paintedBox;
        const toMm = (rect: DOMRect): MmBox => ({ left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm });
        let league = false;
        document.fonts.forEach((face) => {
            if (face.family.replace(/["']/g, '') === 'League Spartan' && face.status === 'loaded') league = true;
        });
        const page1: Page1Measure[] = [];
        const holders = Array.from(document.querySelectorAll('.reader-page[data-page-number="1"], .a3-page[data-page-number="1"]')).filter(
            (element) => !(element.classList.contains('reader-page') && element.closest('.a3-page')),
        );
        for (const holder of holders) {
            const title = holder.closest('[data-reader-title]')?.getAttribute('data-reader-title') ?? '';
            const quest = holder.querySelector('.quest-reader-page');
            const parts: PartMeasure[] = [];
            if (quest) {
                const origin = quest.getBoundingClientRect();
                for (const element of Array.from(quest.querySelectorAll('[data-part]'))) {
                    const name = element.getAttribute('data-part') ?? '';
                    const parent = element.parentElement ? element.parentElement.closest('[data-part]') : null;
                    if (name === 'art' || (parent && quest.contains(parent))) continue;
                    const box = painted(element);
                    parts.push({
                        name,
                        box: box
                            ? {
                                  left: box.left - origin.left * mm,
                                  top: box.top - origin.top * mm,
                                  right: box.right - origin.left * mm,
                                  bottom: box.bottom - origin.top * mm,
                              }
                            : null,
                    });
                }
            }
            page1.push({ title, pageBox: toMm(holder.getBoundingClientRect()), questBox: quest ? toMm(quest.getBoundingClientRect()) : null, parts });
        }
        return { league, page1 };
    });
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    const active = browser;
    if (!active) throw new Error('the browser of the F3 to F6 check did not start');
    covers = buildCovers();
    expect(covers.length, 'the file holds 30 covers.').toBe(30);
    const context = await active.newContext({ viewport: { width: 1700, height: 1300 } });
    const page = await context.newPage();
    const fine = await active.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: PPI_300_SCALE });
    const finePage = await fine.newPage();
    const analysis = await context.newPage();
    try {
        for (const spec of covers) coverMeasures.set(spec.id, await measureCover(page, spec.html));
        for (const spec of covers.filter((entry) => entry.kind === 'reader-leaf')) {
            stripPixels.set(spec.id, await measureStrip(finePage, analysis, spec));
        }
        for (const week of readerWeeks()) {
            for (const output of OUTPUTS) {
                const html = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output }).html;
                finalDocs.set(`${week.meta.week} ${output}`, html);
                readerMeasures.set(`${week.meta.week} ${output}`, await measureReaders(page, html));
            }
        }
    } finally {
        await fine.close();
        await context.close();
    }
}, 1_500_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-f3f6: D2 to D8 (Red, F3 to F6 of the PM look of 2026-11-11)', () => {
    it('D1 guard: the key box file holds the 3 kinds, and the dog-body and title-object boxes of the PM order', () => {
        const keys = readKeys();
        const problems: string[] = [];
        const counts: Record<string, number> = {};
        for (const [name, entry] of Object.entries(keys)) {
            for (const key of entry.boxes) {
                counts[key.kind] = (counts[key.kind] ?? 0) + 1;
                if (!(KEY_KINDS as readonly string[]).includes(key.kind)) problems.push(`${name} "${key.label}": the kind "${key.kind}" is not a key kind.`);
            }
        }
        const kindsOf = (name: string, kind: string): number => (keys[name]?.boxes ?? []).filter((key) => key.kind === kind).length;
        const wanted: [string, string, number][] = [
            ['l2-w01-cover-nan-can-nod-v1.png', 'dog-body', 1],
            ['l2-w01-cover-nan-can-nod-line-v1.png', 'dog-body', 1],
            ['l2-w07-cover-the-top-v1.png', 'dog-body', 1],
            ['l2-w07-cover-the-top-line-v1.png', 'dog-body', 1],
            ['l2-u1-cover-quest-student-front-v1-300ppi.png', 'dog-body', 1],
            ['l2-w07-cover-the-top-v1.png', 'title-object', 1],
            ['l2-w07-cover-the-top-line-v1.png', 'title-object', 1],
            ['l2-w03-cover-the-pan-v1.png', 'title-object', 2],
            ['l2-w03-cover-the-pan-line-v1.png', 'title-object', 2],
            ['l2-w07-cover-is-it-a-ball-v1.png', 'title-object', 1],
            ['l2-w07-cover-is-it-a-ball-line-v1.png', 'title-object', 1],
        ];
        for (const [name, kind, count] of wanted) {
            if (kindsOf(name, kind) !== count) problems.push(`${name}: ${kindsOf(name, kind)} ${kind} boxes (the pin is ${count}).`);
        }
        console.log(`KEY_BOXES head=${counts.head ?? 0} dog-body=${counts['dog-body'] ?? 0} title-object=${counts['title-object'] ?? 0}`);
        expect(counts.head, 'the 100 head boxes stay.').toBe(100);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D2: no chrome part comes within 1 mm of a key box on the 2 fronts and the 28 reader covers', () => {
        const keys = readKeys();
        const problems: string[] = [];
        const overlaps: string[] = [];
        const byPart = new Map<string, number>();
        let checked = 0;
        for (const spec of covers) {
            const raw = coverMeasures.get(spec.id);
            const entry = keys[spec.artFile];
            if (!raw || !raw.artBox || !raw.pageBox) {
                problems.push(`${spec.id}: the browser holds no art box or no page box.`);
                continue;
            }
            if (!entry) {
                problems.push(`${spec.id}: the key box file holds no entry for ${spec.artFile}.`);
                continue;
            }
            for (const key of entry.boxes) {
                const keyMm = grow(keyBoxMm(key.box, entry, raw.artBox, raw.objectPosition).key, CLEARANCE_MM);
                for (const part of raw.parts) {
                    checked += 1;
                    if (!part.box) continue;
                    const hit = overlap(part.box, keyMm);
                    if (!hit) continue;
                    byPart.set(part.name, (byPart.get(part.name) ?? 0) + 1);
                    overlaps.push(
                        `KEY-OVERLAP ${spec.id} ${part.name} "${key.label}" (${key.kind}): ${hit.width.toFixed(2)} mm x ` +
                            `${hit.height.toFixed(2)} mm with the 1 mm clearance (key ${show(keyMm)}; part ${show(part.box)}).`,
                    );
                }
            }
        }
        for (const line of overlaps) console.log(line);
        const summary = [...byPart.entries()].map(([name, count]) => `${name} ${count}`).join(', ') || 'none';
        console.log(`KEY_PAIRS_CHECKED=${checked} KEY_OVERLAPS=${overlaps.length} BY_PART: ${summary}`);
        expect(checked, 'the check reads at least one key and part pair.').toBeGreaterThan(0);
        expect([...problems, ...overlaps], [...problems, ...overlaps].join('\n')).toEqual([]);
    });

    it('D2: every key box lies inside the trim (Q1 on w01-2 reader-a3), and the art keeps its aspect and covers the page', () => {
        const keys = readKeys();
        const problems: string[] = [];
        let checked = 0;
        for (const spec of covers) {
            const raw = coverMeasures.get(spec.id);
            const entry = keys[spec.artFile];
            if (!raw || !raw.artBox || !raw.pageBox || !entry) {
                problems.push(`${spec.id}: the browser holds no measure, or the key box file holds no entry.`);
                continue;
            }
            if (raw.objectFit !== 'cover') problems.push(`${spec.id}: the art is object-fit ${raw.objectFit} (the pin is cover: the aspect stays).`);
            for (const key of entry.boxes) {
                const mapped = keyBoxMm(key.box, entry, raw.artBox, raw.objectPosition);
                if (Number.isNaN(mapped.key.left) || Number.isNaN(mapped.key.top)) {
                    problems.push(`${spec.id}: the object-position "${raw.objectPosition}" cannot be read.`);
                    break;
                }
                checked += 1;
                const page = raw.pageBox;
                if (!(mapped.image.left <= page.left + 0.05 && mapped.image.top <= page.top + 0.05 && mapped.image.right >= page.right - 0.05 && mapped.image.bottom >= page.bottom - 0.05)) {
                    problems.push(`${spec.id}: the art image (${show(mapped.image)}) does not cover the page (${show(page)}).`);
                    break;
                }
                const out = {
                    left: page.left - mapped.key.left,
                    top: page.top - mapped.key.top,
                    right: mapped.key.right - page.right,
                    bottom: mapped.key.bottom - page.bottom,
                };
                const allowedTop = spec.id === Q1_COVER && key.kind === 'head' && key.label.startsWith('Nan head') ? Q1_HEAD_OUT_MM : 0.05;
                if (out.left > 0.05 || out.right > 0.05 || out.bottom > 0.05 || out.top > allowedTop) {
                    problems.push(
                        `${spec.id} "${key.label}" (${key.kind}): the key box (${show(mapped.key)}) leaves the trim by ` +
                            `${Math.max(out.left, out.top, out.right, out.bottom).toFixed(2)} mm (the pin is inside the trim` +
                            `${allowedTop > 1 ? `, or ${allowedTop} mm above the top edge for the Nan head of Q1` : ''}).`,
                    );
                }
            }
        }
        console.log(`TRIM_KEYS_CHECKED=${checked} TRIM_PROBLEMS=${problems.length}`);
        expect(checked).toBeGreaterThan(0);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D3: a cover whose default chrome is free keeps every chrome box, and the week pill keeps its free default box', () => {
        const keys = readKeys();
        const problems: string[] = [];
        let free = 0;
        for (const spec of covers) {
            const raw = coverMeasures.get(spec.id);
            if (!raw) {
                problems.push(`${spec.id}: the browser holds no measure.`);
                continue;
            }
            for (const part of raw.parts) {
                if (part.box) {
                    const b = part.box;
                    console.log(`DEFAULT_BOX ${spec.id} | ${part.name} | ${b.left.toFixed(2)} ${b.top.toFixed(2)} ${b.right.toFixed(2)} ${b.bottom.toFixed(2)}`);
                }
            }
            const pinned = DEFAULT_BOXES[spec.id];
            if (!pinned) {
                problems.push(`${spec.id}: DEFAULT_BOXES holds no default box of the cover.`);
                continue;
            }
            const keyBoxes = defaultKeys(spec, keys);
            const isFree = (name: string): boolean => {
                const value = pinned[name];
                const box = { left: value[0], top: value[1], right: value[2], bottom: value[3] };
                const tested = name === 'footer' ? grow(box, 1) : box;
                return keyBoxes.every((key) => overlap(grow(key.box, CLEARANCE_MM), tested) === null);
            };
            const allFree = Object.keys(pinned).every(isFree);
            const names = allFree ? Object.keys(pinned) : Object.keys(pinned).filter((name) => name === 'week-pill' && isFree(name));
            if (allFree) free += 1;
            for (const name of names) {
                const value = pinned[name];
                const found = raw.parts.filter((part) => part.name === name && part.box);
                if (found.length !== 1) {
                    problems.push(`${spec.id} ${name}: the cover holds ${found.length} parts of the name (the pin is 1).`);
                    continue;
                }
                const box = found[0].box!;
                const delta = Math.max(Math.abs(box.left - value[0]), Math.abs(box.top - value[1]), Math.abs(box.right - value[2]), Math.abs(box.bottom - value[3]));
                if (delta > SAME_BOX_MM) {
                    problems.push(`${spec.id} ${name}: the box moved by ${delta.toFixed(2)} mm from its free default (${show(box)}).`);
                }
            }
        }
        const moved = covers.filter((spec) => DEFAULT_BOXES[spec.id] && !Object.keys(DEFAULT_BOXES[spec.id]).every((name) => {
            const value = DEFAULT_BOXES[spec.id][name];
            const box = { left: value[0], top: value[1], right: value[2], bottom: value[3] };
            return defaultKeys(spec, keys).every((key) => overlap(grow(key.box, CLEARANCE_MM), name === 'footer' ? grow(box, 1) : box) === null);
        })).map((spec) => spec.id);
        console.log(`D3_FREE_COVERS=${free} D3_MOVED=${JSON.stringify(moved)} D3_PROBLEMS=${problems.length}`);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D3: the plaque and its sub-part stay centred on each other, the plaque stays centred on the page outside the exception list, and an exception group stays 5 mm inside the trim', () => {
        const problems: string[] = [];
        for (const spec of covers) {
            const raw = coverMeasures.get(spec.id);
            if (!raw || !raw.pageBox) {
                problems.push(`${spec.id}: the browser holds no measure.`);
                continue;
            }
            const box = (name: string): MmBox | null => raw.parts.find((part) => part.name === name)?.box ?? null;
            const plaque = box('title-plaque');
            if (!plaque) {
                problems.push(`${spec.id}: the cover holds no title plaque box.`);
                continue;
            }
            const centre = (value: MmBox): number => (value.left + value.right) / 2;
            const subs = spec.kind === 'reader-a3' ? ['role-bar'] : spec.kind === 'reader-leaf' ? ['footer', 'footer-strip'] : [];
            for (const name of subs) {
                const sub = box(name);
                if (!sub) {
                    problems.push(`${spec.id}: the cover holds no ${name} box.`);
                    continue;
                }
                const delta = Math.abs(centre(sub) - centre(plaque));
                if (delta > CENTRE_TOLERANCE_MM) problems.push(`${spec.id}: the ${name} centre is ${delta.toFixed(2)} mm from the plaque centre (the pin is 1 mm).`);
            }
            const page = raw.pageBox;
            if (EXCEPTIONS.includes(spec.id)) {
                for (const name of ['title-plaque', ...subs]) {
                    const part = box(name);
                    if (!part) continue;
                    const inside =
                        part.left >= page.left + TRIM_MARGIN_MM - 0.05 &&
                        part.top >= page.top + TRIM_MARGIN_MM - 0.05 &&
                        part.right <= page.right - TRIM_MARGIN_MM + 0.05 &&
                        part.bottom <= page.bottom - TRIM_MARGIN_MM + 0.05;
                    if (!inside) problems.push(`${spec.id}: the exception group part ${name} (${show(part)}) is not 5 mm inside the trim.`);
                }
                continue;
            }
            const delta = Math.abs(centre(plaque) - centre(page));
            if (delta > CENTRE_TOLERANCE_MM) problems.push(`${spec.id}: the plaque centre is ${delta.toFixed(2)} mm from the page centre (the pin is 1 mm).`);
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D3: a cover with a full-size centred free place keeps the full size at the lowest free place; the title fonts stay at 50 % or more; the leaf footer keeps 9 pt; the week pill stays in a top column', () => {
        const keys = readKeys();
        const problems: string[] = [];
        for (const spec of covers) {
            const raw = coverMeasures.get(spec.id);
            if (!raw || !raw.pageBox) {
                problems.push(`${spec.id}: the browser holds no measure.`);
                continue;
            }
            const least = MIN_TITLE_FONT_MM[spec.kind];
            if (!(raw.titleFontMm >= least - 0.01)) {
                problems.push(`${spec.id}: the title font is ${raw.titleFontMm.toFixed(2)} mm (the pin is ${least.toFixed(3)} mm or more).`);
            }
            if (spec.kind === 'reader-leaf' && Math.abs(raw.footerFontMm - LEAF_FOOTER_FONT_MM) > 0.01) {
                problems.push(`${spec.id}: the footer font is ${raw.footerFontMm.toFixed(3)} mm (the pin is 9 pt, ${LEAF_FOOTER_FONT_MM.toFixed(3)} mm).`);
            }
            const group = defaultGroup(spec);
            if (!group) {
                problems.push(`${spec.id}: DEFAULT_BOXES holds no default group of the cover.`);
                continue;
            }
            if (spec.kind === 'reader-a3') {
                const pin = DEFAULT_BOXES[spec.id]['week-pill'];
                const pill = raw.parts.find((part) => part.name === 'week-pill')?.box ?? null;
                if (pin && pill) {
                    const right = Math.abs(pill.left - pin[0]) <= 0.5;
                    const left = Math.abs(pill.left - (420 - pin[2])) <= 0.5;
                    if ((!right && !left) || pill.top < pin[1] - 0.05) {
                        problems.push(`${spec.id}: the week pill (${show(pill)}) is not in the top right or the top left column at or below its default top.`);
                    }
                }
            }
            const place = lowestFreePlace(spec, group, 1, defaultKeys(spec, keys));
            if (!place) continue;
            const plaque = raw.parts.find((part) => part.name === 'title-plaque')?.box ?? null;
            if (!plaque) continue;
            const height = plaque.bottom - plaque.top;
            const wanted = group.plaque.bottom - group.plaque.top;
            if (Math.abs(height - wanted) > 0.1) {
                problems.push(`${spec.id}: a full-size centred free place exists ${place.step} mm up, and the plaque is ${height.toFixed(2)} mm high (the pin is the full size, ${wanted.toFixed(2)} mm).`);
            }
            if (plaque.top < place.plaque.top - 2.05 || plaque.top > place.plaque.top + 0.15) {
                problems.push(
                    `${spec.id}: the plaque top is ${plaque.top.toFixed(2)} mm, and the lowest full-size centred free place has its top at ` +
                        `${place.plaque.top.toFixed(2)} mm (${place.step} mm up; the pin is that place, or up to 2 mm higher).`,
                );
            }
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D4: the exception list equals the covers with no centred free place at the 50 % plaque size', () => {
        const keys = readKeys();
        const computed: string[] = [];
        const problems: string[] = [];
        for (const spec of covers) {
            const group = defaultGroup(spec);
            if (!group) {
                problems.push(`${spec.id}: DEFAULT_BOXES holds no default group of the cover.`);
                continue;
            }
            const keyBoxes = defaultKeys(spec, keys);
            const half = lowestFreePlace(spec, group, 0.5, keyBoxes);
            const full = lowestFreePlace(spec, group, 1, keyBoxes);
            console.log(
                `D4 ${spec.id}: full size ${full ? `free ${full.step} mm up` : 'no free place'}; 50 % size ${half ? `free ${half.step} mm up` : 'no free place'}.`,
            );
            if (half) continue;
            computed.push(spec.id);
            const page = pageOf(spec.kind);
            const centre = page.widthMm / 2;
            const plaqueWidth = (group.plaque.right - group.plaque.left) * 0.5;
            const plaqueHeight = (group.plaque.bottom - group.plaque.top) * 0.5;
            const subHeight = group.sub ? group.sub.bottom - group.sub.top : 0;
            const gap = group.sub ? group.sub.top - group.plaque.bottom : 0;
            const band = Math.max(plaqueWidth, group.sub ? group.sub.right - group.sub.left : 0) / 2 + CLEARANCE_MM;
            const blocking = keyBoxes
                .filter((key) => key.box.left < centre + band && key.box.right > centre - band)
                .map((key) => `${key.label} x ${key.box.left.toFixed(1)} to ${key.box.right.toFixed(1)} mm, y ${key.box.top.toFixed(1)} to ${key.box.bottom.toFixed(1)} mm`);
            console.log(
                `D4 PROOF ${spec.id}: the 50 % group needs ${(plaqueHeight + gap + subHeight).toFixed(2)} mm of height in the centre band ` +
                    `${(centre - band).toFixed(1)} to ${(centre + band).toFixed(1)} mm between ${TRIM_MARGIN_MM} mm and ` +
                    `${(group.sub ? group.sub.bottom : group.plaque.bottom).toFixed(2)} mm; the key boxes in the band: ${blocking.join('; ')}.`,
            );
        }
        console.log(`D4_EXCEPTIONS=${JSON.stringify(computed)}`);
        expect(problems, problems.join('\n')).toEqual([]);
        expect(computed, 'the pinned exception list equals the computed list.').toEqual(EXCEPTIONS);
    });

    it('D5: each hlogo leaf cover holds one white footer strip, and by pixels no line art crosses the footer letters', () => {
        const problems: string[] = [];
        const leaves = covers.filter((spec) => spec.kind === 'reader-leaf');
        expect(leaves.length, 'the file holds 14 leaf covers.').toBe(14);
        for (const spec of leaves) {
            const raw = coverMeasures.get(spec.id);
            const pixels = stripPixels.get(spec.id);
            if (!raw || !pixels) {
                problems.push(`${spec.id}: the browser holds no measure.`);
                continue;
            }
            if (raw.strips.length !== 1 || pixels.strips !== 1) {
                problems.push(`${spec.id}: the leaf holds ${raw.strips.length} footer-strip parts (the pin is 1).`);
                continue;
            }
            const strip = raw.strips[0];
            if (strip.fill.replace(/\s+/g, '') !== 'rgb(255,255,255)' || strip.opacity !== '1' || strip.borders.some((width) => width > 0)) {
                problems.push(`${spec.id}: the strip is ${strip.fill}, opacity ${strip.opacity}, borders ${strip.borders.join(' ')} (the pin is #FFFFFF, opaque, no border).`);
            }
            if (pixels.darkPixels > 0) {
                problems.push(`${spec.id}: with the footer text hidden, ${pixels.darkPixels} pixels inside the strip are not white (lowest channel ${pixels.minChannel}).`);
            }
            if (!pixels.inkPx || !pixels.stripPx) {
                problems.push(`${spec.id}: the 2 renders hold no footer ink.`);
                continue;
            }
            const pad = (STRIP_INK_PADDING_MM / MM_PER_PX) * PPI_300_SCALE;
            const ink = pixels.inkPx;
            const box = pixels.stripPx;
            const padding = Math.min(ink.left - box.left, ink.top - box.top, box.right - ink.right, box.bottom - ink.bottom);
            if (padding < pad) {
                problems.push(
                    `${spec.id}: the footer ink lies ${((padding / PPI_300_SCALE) * MM_PER_PX).toFixed(2)} mm inside the strip edge ` +
                        `(the pin is ${STRIP_INK_PADDING_MM} mm or more).`,
                );
            }
        }
        console.log(`D5 leaf covers 14, problems ${problems.length}`);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D6: page 1 of every reader is the quest reader cover of its row, its trim, and its art (final mode, both outputs)', () => {
        const rows = questReaders();
        const problems: string[] = [];
        let checked = 0;
        for (const output of OUTPUTS) {
            for (const row of rows) {
                const html = finalDocs.get(`${row.week} ${output}`);
                const id = `week ${row.week} ${output} "${row.title}"`;
                if (!html) {
                    problems.push(`${id}: no final document.`);
                    continue;
                }
                const doc = parseHtml(html);
                const pages = Array.from(doc.querySelectorAll(output === 'workbook' ? '.reader-page[data-page-number="1"]' : 'section.a3-page[data-page-number="1"]')).filter(
                    (element) => element.closest('[data-reader-title]')?.getAttribute('data-reader-title') === row.title,
                );
                if (pages.length !== 1) {
                    problems.push(`${id}: the document holds ${pages.length} page 1 elements (the pin is 1).`);
                    continue;
                }
                checked += 1;
                const page = pages[0];
                if (output === 'a3-color' && page.querySelector('.a3-scale, [data-scale]')) problems.push(`${id}: page 1 holds a 2.0 scale (the pin is the full A3 page).`);
                const quests = Array.from(page.querySelectorAll('.quest-reader-page'));
                if (quests.length !== 1) {
                    problems.push(`${id}: page 1 holds ${quests.length} quest reader pages (the pin is 1).`);
                    continue;
                }
                const art = quests[0].querySelector('[data-part="art"]');
                const src = art?.getAttribute('src') ?? '';
                const wantedFile = output === 'workbook' ? row.picture.lineArtFileName : row.picture.fileName;
                if (!src.startsWith('file:') || decodeURIComponent(path.basename(src)) !== wantedFile) {
                    problems.push(`${id}: the art source ends with "${path.basename(src)}" (the pin is a file URL of ${wantedFile}).`);
                }
                // changed 2026-11-12 (Q5, orchestrator decision): the workbook page 1 body draws the leaf mark of its side (option leafMark); the a3-color body draws none.
                const marks = Array.from(quests[0].querySelectorAll('[data-part="leaf-mark"]'), (mark) => mark.textContent ?? '');
                const escapedTitle = row.title.replace(/[.*+?^$|()[\]{}\\]/g, '\\$&');
                const markPattern = new RegExp('^' + escapedTitle + ' · leaf [0-9]+ of [0-9]+$');
                if (output === 'workbook' && (marks.length !== 1 || !markPattern.test(marks[0]))) {
                    problems.push(`${id}: the page 1 body holds the leaf marks ${JSON.stringify(marks)} (the pin is 1 mark "${row.title} · leaf <n> of <m>").`);
                }
                if (output === 'a3-color' && marks.length !== 0) problems.push(`${id}: the a3-color page 1 body holds ${marks.length} leaf marks (the pin is 0).`);
                const options = output === 'workbook' && marks.length === 1 ? ({ ...HLOGO_OPTIONS, leafMark: marks[0] } as QuestRenderOptions) : HLOGO_OPTIONS;
                const expected = questReaderCoverPage(row, OUTPUT_TRIM[output], { art: src }, options);
                const template = doc.createElement('template');
                template.innerHTML = expected.body;
                const wanted = template.content.firstElementChild;
                if (!wanted || !wanted.isEqualNode(quests[0])) problems.push(`${id}: the page 1 body is not the questReaderCoverPage body of the row, the trim, and the art.`);
                const styles = Array.from(doc.querySelectorAll('style'), (style) => style.textContent ?? '').join('\n');
                if (!styles.includes(expected.css)) problems.push(`${id}: the document style holds no questReaderCoverPage CSS of the trim.`);
                const wrappers = Array.from(page.querySelectorAll('[data-picture-id]'));
                // changed 2026-11-12 (F5, Red retry): the quest page is the only child of the wrapper, as pictureSourceProblems of the picture folder fixture reads it.
                if (wrappers.length !== 1 || wrappers[0].children.length !== 1 || wrappers[0].children[0] !== quests[0] || wrappers[0].getAttribute('data-picture-file') !== wantedFile) {
                    problems.push(`${id}: page 1 holds ${wrappers.length} picture-id elements (the pin is 1 wrapper whose only child is the quest page, with data-picture-file ${wantedFile}).`);
                }
                const children = Array.from(page.children).filter((child) => child.tagName.toLowerCase() !== 'style');
                if (children.length !== 1 || !children[0].contains(quests[0])) problems.push(`${id}: page 1 holds more than the quest cover.`);
            }
        }
        console.log(`D6 page 1 checked ${checked}, problems ${problems.length}`);
        expect(checked, 'the check reads page 1 of the 14 readers in the 2 outputs.').toBe(28);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 120_000);

    it('D6: in Chrome, page 1 fills its page, holds the chrome boxes of the cover build within 0.1 mm, and loads League Spartan', () => {
        const rows = questReaders();
        const problems: string[] = [];
        for (const output of OUTPUTS) {
            for (const [index, row] of rows.entries()) {
                const measure = readerMeasures.get(`${row.week} ${output}`);
                const id = `week ${row.week} ${output} "${row.title}"`;
                if (!measure) {
                    problems.push(`${id}: no Chrome measure.`);
                    continue;
                }
                if (!measure.league) problems.push(`${id}: the document holds no loaded League Spartan face.`);
                const entry = measure.page1.find((page) => page.title === row.title);
                if (!entry || !entry.pageBox || !entry.questBox) {
                    problems.push(`${id}: page 1 holds no quest page box.`);
                    continue;
                }
                const trim = OUTPUT_TRIM[output];
                const width = entry.questBox.right - entry.questBox.left;
                const height = entry.questBox.bottom - entry.questBox.top;
                const shift = Math.max(Math.abs(entry.questBox.left - entry.pageBox.left), Math.abs(entry.questBox.top - entry.pageBox.top));
                if (Math.abs(width - trim.widthMm) > PAGE1_BOX_MM || Math.abs(height - trim.heightMm) > PAGE1_BOX_MM || shift > PAGE1_BOX_MM) {
                    problems.push(`${id}: the quest page is ${width.toFixed(2)} x ${height.toFixed(2)} mm, ${shift.toFixed(2)} mm from the page origin (the pin is ${trim.widthMm} x ${trim.heightMm} mm at the origin).`);
                }
                const cover = coverMeasures.get(`${ROW_IDS[index]} ${output === 'workbook' ? 'reader-leaf' : 'reader-a3'}`);
                if (!cover) continue;
                for (const part of cover.parts) {
                    const found = entry.parts.find((item) => item.name === part.name);
                    if (!found || !found.box || !part.box) {
                        problems.push(`${id}: page 1 holds no ${part.name} box.`);
                        continue;
                    }
                    const delta = Math.max(
                        Math.abs(found.box.left - part.box.left),
                        Math.abs(found.box.top - part.box.top),
                        Math.abs(found.box.right - part.box.right),
                        Math.abs(found.box.bottom - part.box.bottom),
                    );
                    // changed 2026-11-12 (Q5, orchestrator decision): on the workbook page 1 the footer strip may grow to hold the leaf mark, so it must hold the strip of the cover build.
                    if (output === 'workbook' && part.name === 'footer-strip') {
                        const holds = found.box.left <= part.box.left + PAGE1_BOX_MM && found.box.top <= part.box.top + PAGE1_BOX_MM
                            && found.box.right >= part.box.right - PAGE1_BOX_MM && found.box.bottom >= part.box.bottom - PAGE1_BOX_MM;
                        if (!holds) problems.push(`${id}: the footer-strip box does not hold the footer-strip box of the cover build.`);
                        continue;
                    }
                    if (delta > PAGE1_BOX_MM) problems.push(`${id}: the ${part.name} box differs from the cover build by ${delta.toFixed(2)} mm.`);
                }
            }
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });

    it('D6: proof mode page 1 holds the quest chrome on the PICTURE MISSING placeholder, the picture-id wrapper, and no image outside a logo tile', () => {
        const rows = questReaders();
        const problems: string[] = [];
        for (const week of readerWeeks()) {
            for (const output of OUTPUTS) {
                const doc = parseHtml(compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output }).html);
                for (const row of rows.filter((entry) => entry.week === week.meta.week)) {
                    const id = `week ${row.week} ${output} proof "${row.title}"`;
                    const page = Array.from(doc.querySelectorAll(output === 'workbook' ? '.reader-page[data-page-number="1"]' : 'section.a3-page[data-page-number="1"]')).find(
                        (element) => element.closest('[data-reader-title]')?.getAttribute('data-reader-title') === row.title,
                    );
                    if (!page) {
                        problems.push(`${id}: no page 1.`);
                        continue;
                    }
                    const quest = page.querySelector('.quest-reader-page');
                    const plaque = quest?.querySelector('[data-part="title-plaque"]');
                    if (!quest || !plaque || !(plaque.textContent ?? '').includes(row.title)) problems.push(`${id}: page 1 holds no quest page with the title plaque of the title.`);
                    const wrapper = page.querySelector('[data-picture-id]');
                    const listName = output === 'workbook' ? row.picture.lineArtFileName : row.picture.fileName;
                    if (!wrapper || (quest && !wrapper.contains(quest)) || wrapper.getAttribute('data-picture-file') !== listName) {
                        problems.push(`${id}: page 1 holds no picture-id wrapper of the quest page with data-picture-file ${listName}.`);
                    }
                    if (!(page.textContent ?? '').includes('PICTURE MISSING')) problems.push(`${id}: page 1 holds no PICTURE MISSING text.`);
                    const images = Array.from(page.querySelectorAll('img')).filter((image) => image.closest('[data-part="logo-tile"]') === null);
                    if (images.length !== 0) problems.push(`${id}: page 1 holds ${images.length} images outside a logo tile (the pin is 0 in proof mode).`);
                }
            }
        }
        expect(problems, problems.join('\n')).toEqual([]);
    }, 120_000);

    it('D6: no band word on any printed reader page: both outputs, proof and final mode, and the reader leaves of the student book', () => {
        const band = new RegExp(`\\b(${QUEST_BANDS.join('|')})\\b`, 'i');
        const problems: string[] = [];
        let pages = 0;
        const scan = (doc: Document, where: string): void => {
            const printed = Array.from(doc.querySelectorAll('[data-reader-page], section.a3-page')).filter(
                (element) => !(element.matches('[data-reader-page]') && element.closest('section.a3-page')),
            );
            for (const element of printed) {
                pages += 1;
                const match = band.exec(element.textContent ?? '');
                if (match) {
                    const title = element.closest('[data-reader-title]')?.getAttribute('data-reader-title') ?? '';
                    problems.push(`${where} "${title}" page ${element.getAttribute('data-page-number') ?? '?'}: the band word "${match[1]}".`);
                }
            }
        };
        for (const week of readerWeeks()) {
            for (const output of OUTPUTS) {
                scan(parseHtml(compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output }).html), `week ${week.meta.week} ${output} proof`);
                const final = finalDocs.get(`${week.meta.week} ${output}`);
                if (final) scan(parseHtml(final), `week ${week.meta.week} ${output} final`);
            }
        }
        const student = parseHtml(compileStorytimeStudentBook(allWeeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html);
        const before = pages;
        scan(student, 'student book proof');
        if (pages === before) problems.push('the student book holds no reader page.');
        console.log(`BAND_PAGES_CHECKED=${pages} BAND_WORD_PAGES=${problems.length}`);
        expect(pages).toBeGreaterThan(0);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 120_000);

    it('D7: page 12 holds no "Storytime Advantage" line, and keeps the heading, the word row, the logo tile, and the footer', () => {
        const problems: string[] = [];
        let checked = 0;
        for (const week of readerWeeks()) {
            for (const output of OUTPUTS) {
                const doc = parseHtml(compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output }).html);
                for (const page of Array.from(doc.querySelectorAll('.reader-page[data-page-number="12"]'))) {
                    checked += 1;
                    const title = page.closest('[data-reader-title]')?.getAttribute('data-reader-title') ?? '';
                    const id = `week ${week.meta.week} ${output} "${title}" page 12`;
                    const text = (page.textContent ?? '').replace(/\s+/g, ' ');
                    if (/storytime\s+advantage/i.test(text)) problems.push(`${id}: the page holds the text "Storytime Advantage" (the pin is 0).`);
                    if (page.querySelectorAll('.reader-series').length !== 0) problems.push(`${id}: the page holds a reader-series line (the pin is 0).`);
                    const headings = Array.from(page.querySelectorAll('.reader-heading'), (element) => (element.textContent ?? '').trim());
                    if (headings.length !== 1 || headings[0] !== 'Words in this book') problems.push(`${id}: the headings are ${JSON.stringify(headings)} (the pin is "Words in this book").`);
                    const row = page.querySelector('[data-part="reader-back-words"]');
                    if (!row || row.querySelectorAll('.reader-word').length === 0) problems.push(`${id}: the page holds no word row with words.`);
                    const tiles = page.querySelectorAll('[data-part="logo-tile"]');
                    if (tiles.length !== 1 || tiles[0].querySelectorAll('img').length !== 1) problems.push(`${id}: the page holds ${tiles.length} logo tiles (the pin is 1 with 1 image).`);
                    if (!page.querySelector('[data-part="reader-footer"]')) problems.push(`${id}: the page holds no footer.`);
                }
            }
        }
        console.log(`D7 page 12 checked ${checked}, problems ${problems.length}`);
        expect(checked, 'the check reads page 12 of the 14 readers in the 2 outputs.').toBe(28);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 120_000);

    it('D8: the default renders keep their bytes, and the 2 hlogo fronts keep their bytes when their default place is free', () => {
        const book = bookRow();
        const renders: [string, string][] = [];
        for (const kind of ['student-front', 'teacher-front', 'student-back', 'teacher-back'] as const) {
            const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
            renders.push([`banner ${kind}`, renderQuestCover(kind, book, assets, BANNER_OPTIONS)]);
        }
        for (const [index, row] of questReaders().entries()) {
            renders.push([`banner ${ROW_IDS[index]} reader-a3`, renderQuestCover('reader-a3', row, { art: ART }, BANNER_OPTIONS)]);
            renders.push([`banner ${ROW_IDS[index]} reader-leaf`, renderQuestCover('reader-leaf', row, { art: ART }, BANNER_OPTIONS)]);
        }
        const keys = readKeys();
        for (const spec of covers.filter((entry) => entry.kind === 'student-front' || entry.kind === 'teacher-front')) {
            const pinned = DEFAULT_BOXES[spec.id];
            const free =
                pinned !== undefined &&
                Object.values(pinned).every((value) =>
                    defaultKeys(spec, keys).every((key) => overlap(grow(key.box, CLEARANCE_MM), { left: value[0], top: value[1], right: value[2], bottom: value[3] }) === null),
                );
            console.log(`D8 ${spec.id}: the default place is ${free ? 'free' : 'not free'}.`);
            if (free) renders.push([`hlogo ${spec.id}`, spec.html]);
        }
        const problems: string[] = [];
        for (const [id, html] of renders) {
            const hash = sha256(html);
            console.log(`D8_SHA ${id} | ${hash}`);
            if (KEEP_SHA[id] !== hash) problems.push(`${id}: the SHA-256 is ${hash} (the pin is ${KEEP_SHA[id] ?? 'missing'}).`);
        }
        expect(renders.length, 'the 32 default renders and the free hlogo fronts.').toBeGreaterThanOrEqual(32);
        expect(problems, problems.join('\n')).toEqual([]);
    });
});
