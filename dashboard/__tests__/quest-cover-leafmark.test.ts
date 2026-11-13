/**
 * Red of remediation R1 of Phase 9, Task (Hand-off from storytime_cover_options) (track
 * storytime_print_r1_20261025, orchestrator decision D-P9-R1 of 2026-11-14).
 *
 * The defect (measure/runs/storytime_print_r1_20261025/p9-handoff-strip-cause.txt): when
 * `leafMark` is set, `leafFooterStrip` grows the footer box to hold the ring of the mark and paints
 * the whole box white. The student book passes the mark (`readers.ts`: the
 * `output === 'workbook'` form). In weeks 1 to 6 the mark lies inside or next to the strip, and the
 * box is 12.24 mm or 13.24 mm high. In week 7 the mark place lies far above the strip, so one white
 * box of 128.22 x 99.24 mm ("Is It a Ball?") and 125.79 x 114.24 mm ("The Top") covers the art. The
 * accepted leaf covers have no leaf mark, so no cover test caught it.
 *
 * D-P9-R1 (word for word): when `leafMark` is set, if the ring of the mark overlaps the footer box,
 * the joined box stays exactly as now (weeks 1 to 6 keep their bytes). If the ring does not overlap
 * the footer box, the footer box stays at its own size (no growth), and the mark gets its own white
 * box: a separate `div` with `data-part="leaf-mark-box"`, the ring as its box, background #FFFFFF,
 * holding the `leaf-mark` span. The mark text and the mark place do not change. Leaf covers with no
 * `leafMark` keep their bytes.
 *
 * The pins of this file:
 *   L1: on each of the 14 leaf covers with the mark, every white box (`footer-strip`,
 *       `leaf-mark-box`) is 14.0 mm high or less.
 *   L2: on each of the 14 leaf covers with the mark, the `leaf-mark` span exists once, holds the
 *       mark text, and lies inside a white box that holds the whole mark place.
 *   L3: on the 2 week 7 leaves, the `footer-strip` box has the size of the same leaf with no mark
 *       (the strip does not grow), and a `leaf-mark-box` exists.
 *   L4: the 12 week 1 to 6 bodies with the mark keep their SHA-256 bytes at the role base
 *       3908adc4774e5c26cec20dcb0e4159059bb2206d.
 *   L5: the 14 no-mark bodies keep their SHA-256 bytes at the role base.
 *   L6: positive control for L1 and L3: the frozen week 7 bodies of the role base fail the L1 rule
 *       and the frozen week 1 bodies pass it, so the measure reads real boxes.
 *
 * The method: the box sizes come from the inline style values (left, top, width, height in mm) of
 * each `data-part` element. The file renders no Chrome session. The file prints ids, millimetres,
 * and hashes only.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
    questReaderCoverPage,
    questReaders,
    type QuestReaderRow,
    type QuestRenderOptions,
    type QuestTrim,
} from '../lib/storytime/print/cover-quest';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/** The art string of the cover renders. Chrome loads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The leaf trim of the workbook output: the readerPage of the print profile (readers.ts). */
const TRIM: QuestTrim = {
    widthMm: STORYTIME_PRINT_PROFILE.readerPage.widthMm,
    heightMm: STORYTIME_PRINT_PROFILE.readerPage.heightMm,
};

/** The sheet count of the mark text (LEAF_PAGES.length in readers.ts). */
const SHEET_COUNT = 3;

/** The mark text form of readers.ts for the workbook output. */
const markTextOf = (row: QuestReaderRow): string => `${row.title} \u00b7 sheet 1 of ${SHEET_COUNT}`;

/** The body of one leaf cover render. */
const bodyOf = (row: QuestReaderRow, leafMark: string): string =>
    questReaderCoverPage(row, TRIM, { art: ART }, { bleedMm: 0, top: 'hlogo', leafMark } satisfies QuestRenderOptions).body;

/** The 1 mm ring of the mark is 4 mm wider and taller than the mark place at most, so the joined
 * boxes of the healthy weeks stay far below this limit (the defect boxes are 99.24 and 114.24 mm). */
const MAX_WHITE_BOX_HEIGHT_MM = 14.0;

/** One parsed `data-part` element: the box from its inline style, plus its source range. */
interface PartBox {
    part: string;
    left: number;
    top: number;
    width: number;
    height: number;
    style: string;
    start: number;
    end: number;
}

/** Reads one `<key>:<number>mm` length out of an inline style. */
function num(style: string, key: string): number {
    const found = new RegExp(`${key}:(-?[0-9.]+)mm`).exec(style);
    if (!found) throw new Error(`no ${key} length in style "${style}"`);
    return Number(found[1]);
}

/** Parses the boxes of the wanted `data-part` parts out of a rendered body. */
function boxesOf(body: string, wanted: Array<string>): Array<PartBox> {
    const out: Array<PartBox> = [];
    for (const found of Array.from(body.matchAll(/<(div|span)\b[^>]*?data-part="([^"]+)"([^>]*)>/g))) {
        if (!wanted.includes(found[2])) continue;
        const style = /style="([^"]*)"/.exec(found[3])?.[1] ?? '';
        const start = found.index ?? 0;
        const close = body.indexOf('</div>', start);
        out.push({
            part: found[2],
            left: num(style, 'left'),
            top: num(style, 'top'),
            width: num(style, 'width'),
            height: num(style, 'height'),
            style,
            start,
            end: close === -1 ? body.length : close,
        });
    }
    return out;
}

/** The white box parts of D-P9-R1. */
const whiteBoxes = (body: string): Array<PartBox> => boxesOf(body, ['footer-strip', 'leaf-mark-box']);

/** The L1 rule: the id of every white box higher than the limit. */
function whiteBoxViolations(body: string): Array<string> {
    return whiteBoxes(body)
        .filter((box) => box.height > MAX_WHITE_BOX_HEIGHT_MM)
        .map((box) => `${box.part} height ${box.height.toFixed(2)}mm`);
}

/** The L2 rule: the errors of the leaf-mark span of one body. */
function markErrors(body: string, mark: string, key: string): Array<string> {
    const errs: Array<string> = [];
    const spans = Array.from(body.matchAll(/<span data-part="leaf-mark" style="([^"]*)">([^<]*)<\/span>/g));
    if (spans.length !== 1) return [`${key}: leaf-mark span count ${spans.length}`];
    const span = spans[0];
    if (span[2] !== mark) errs.push(`${key}: mark text is ${JSON.stringify(span[2])} not ${JSON.stringify(mark)}`);
    const spanStart = span.index ?? 0;
    const spanEnd = spanStart + span[0].length;
    let holder: PartBox | null = null;
    for (const box of whiteBoxes(body)) {
        if (box.start < spanStart && box.end >= spanEnd && (holder === null || box.start > holder.start)) holder = box;
    }
    if (!holder) {
        errs.push(`${key}: no white box (footer-strip or leaf-mark-box) holds the leaf-mark span`);
        return errs;
    }
    const left = num(span[1], 'left');
    const top = num(span[1], 'top');
    const width = num(span[1], 'width');
    const height = num(span[1], 'height');
    if (left < -0.01 || top < -0.01 || left + width > holder.width + 0.01 || top + height > holder.height + 0.01) {
        errs.push(
            `${key}: the mark place (${left.toFixed(2)}, ${top.toFixed(2)}, ${width.toFixed(2)}, ` +
                `${height.toFixed(2)} mm in the box) leaves the white box ${holder.part} ` +
                `(${holder.width.toFixed(2)} x ${holder.height.toFixed(2)} mm)`,
        );
    }
    return errs;
}

/** The SHA-256 of one body. */
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

/** The SHA-256 of the 12 week 1 to 6 bodies with the mark, pinned at the role base. */
const PIN_MARK_SHA: Record<string, string> = {
    '1:hello': '3aa2d70170b0c244aabf1c7e2fcb5aab8009e7e835ab43fc0ee22870fc941f2c',
    '1:nan-can-nod': 'da425fc68d741f08a3bb51f740c338a38d12f10009daea382f5891e9a03ae993',
    '2:can-i': 'b843b46fae6de686d7fc0a4c489193dcf9a1b0df4956d05bb45ba087f317a01e',
    '2:how-many': 'e2a0412b5269144109682c9988d00131ae3b326bd99d726f476de35d80056699',
    '3:paint': '606c8d278ddbe1d9f1224e71eb85a88b4213753f36695f2d0b9cc6db1c79b828',
    '3:the-pan': '0ed2e26a8c7b652c870c70f5a5c92bf21110991a0c74c4f8170b630b9294be5c',
    '4:my-family': 'd662a38f0466920349e99b21828ee81ba23852347e66741edbea011a0ae7d244',
    '4:pam': 'ef13f12b4b92f9c6d5de9bacfbd83430bd26b0a87cd2b6e12d96cc59e05883e2',
    '5:i-have-two': 'f17fbe2d685794aa158328174177bc62e293b1904afaa56b5d94e311eb5e27bf',
    '5:sam-and-pam': '7a8756ff9e27834c68200ad60817096a06d146a408581b64170c8031f8c05813',
    '6:i-can-see': 'ab8ebbae6f2a948e79fdcdb5b4d3bfda3d35e82c12f3b848c79ac184fae5df38',
    '6:tap-tap': 'f957e11d3fe0cd43b65fc9972a93fc49c767632a4e1b2f9ea225fe11faf37ea8',
};

/** The SHA-256 of the 14 no-mark bodies, pinned at the role base. */
const PIN_PLAIN_SHA: Record<string, string> = {
    '1:hello': 'ce8a4ce4a13022351b7d937af12440b836af322b09d7a9e50c1bfc7bcade7d92',
    '1:nan-can-nod': '4010df6f90ee5d0244952209d964f8f5c67b4269908c68da9247be6625174a91',
    '2:can-i': '8c09e37b124a48915c71ec6587b37b83e99ce3590d2659e9350113ded95762be',
    '2:how-many': 'be685dd1b7940e16088346111dee85fde0c960aa6cd94b4f6cede303a7f3b13b',
    '3:paint': 'f6c27699809a99fad1946aad838fa85bb08aa90a20c84f7a313ef0d401943146',
    '3:the-pan': '35f3b7b808ed00c3e2376ab38e63d6e301cee84dbae4ccf38e9a420578529061',
    '4:my-family': 'f232747a666279411fd6b61d7641410c0c69f7f0ff795ecf26d395c228d8963e',
    '4:pam': 'abcebe8d95daf67cd6b391e3e76cd4aa18fdd3bbdcd70756a7a4e1a453df5288',
    '5:i-have-two': 'de939d3cb55b5ab2d1a45c44d5c79e395e428fc5f629ba099f0ea4f7e404b52f',
    '5:sam-and-pam': '2b2df266f275b3a6e7de3f8a1a733d43086716930c561d38e5954bc18a47c56f',
    '6:i-can-see': '999ea8652b801f5e8f8def42834d2944b48999c4e37f38d81b07df28e44ce716',
    '6:tap-tap': '84d53f76da1101c790e846f221d02958cc61c21d3ecc3c47532efeca576719e7',
    '7:is-it-a-ball': '86693070f0a6a066f54b2b905773a19132aae0c6ab3d524bfbe67e15d1129461',
    '7:the-top': '61566cb66825065eec0bb80d0b39293154a0e68780478194ae30d49e48957880',
};

/** The SHA-256 of the frozen bodies of L6, pinned at the role base. */
const FROZEN_SHA: Record<string, string> = {
    '1:hello': '3aa2d70170b0c244aabf1c7e2fcb5aab8009e7e835ab43fc0ee22870fc941f2c',
    '1:nan-can-nod': 'da425fc68d741f08a3bb51f740c338a38d12f10009daea382f5891e9a03ae993',
    '7:is-it-a-ball': '90ce7a412229b64894834468543ae982c9c64eb244cb39a30caaf0ab16a6bfff',
    '7:the-top': '711d5288f64f02d62712186081a6bce897cdc0addf55e7448cbe05482ff8625b',
};

/** The frozen bodies of the role base that L6 runs the L1 rule on. */
const FROZEN_BODIES: Record<string, string> = {
    '1:hello': "<div class=\"quest-reader-page\">\n<img data-part=\"art\" class=\"quest-art\" src=\"data:image/png;base64,iVBORw0KGgo=\" alt=\"\" style=\"position:absolute;left:0mm;top:0mm;width:198mm;height:148.5mm;object-fit:cover\">\n<div data-part=\"footer-strip\" style=\"position:absolute;left:56.78mm;top:136.26mm;width:128.22mm;height:12.24mm;background-color:#FFFFFF;font-size:9pt;line-height:6mm;color:#000000\"><span data-part=\"leaf-mark\" style=\"position:absolute;left:92.22mm;top:7.74mm;width:34mm;height:2.5mm;font-size:5pt;line-height:2.5mm;white-space:nowrap;color:#000000;text-align:left\">Hello! \u00b7 sheet 1 of 3</span></div>\n<div data-part=\"title-plaque\" data-plaque-colour=\"#D2D2D2\" style=\"position:absolute;left:44mm;top:113mm;width:110mm;height:20mm\"><svg viewBox=\"0 0 110 20\" style=\"position:absolute;left:0;top:0;width:110mm;height:20mm\"><path d=\"M0 3 L3 0 L107 0 L110 3 L110 17 L107 20 L3 20 L0 17Z\" fill=\"#4E4E4E\" stroke=\"#4E4E4E\" stroke-width=\"0.6\"/><path d=\"M1.8 4.8 L4.8 1.8 L105.2 1.8 L108.2 4.8 L108.2 15.2 L105.2 18.2 L4.8 18.2 L1.8 15.2Z\" fill=\"#F2F2F2\"/><path d=\"M2.8 5.8 L5.8 2.8 L104.2 2.8 L107.2 5.8 L107.2 14.2 L104.2 17.2 L5.8 17.2 L2.8 14.2Z\" fill=\"#D2D2D2\"/><path d=\"M6 3.6 L104 3.6\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"0.6\"/><g transform=\"translate(7.6 10) scale(-1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g><g transform=\"translate(102.4 10) scale(1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g></svg><div class=\"quest-c\" style=\"position:absolute;left:0;top:3.2061mm;width:110mm;height:17.1454mm;color:#000000;font-family:'League Spartan';font-weight:700;font-size:17.1454mm;line-height:17.1454mm;font-kerning:none\">Hello!</div></div>\n<div data-part=\"footer\" class=\"quest-c\" style=\"position:absolute;left:0mm;top:137mm;width:198mm;height:6mm;font-size:9pt;line-height:6mm;color:#000000;\"><span data-part=\"series\">Storytime Advantage</span> \u00b7 <span data-part=\"week\">Week 1</span> \u00b7 <span data-part=\"role-mark\"><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 19.5 C7 18.5 6 15.5 6 12 C6 7.5 8.5 4.5 12 4.5 C15.5 4.5 18 7 18 10.5 C18 13.5 15.5 14.5 14.5 16.5 C13.6 18.3 12.5 20 10.8 20 C10.3 20 9.9 19.8 9.5 19.5 Z\"/><path d=\"M9.5 11 C9.5 9.2 10.6 8 12 8 C13.4 8 14.5 9.1 14.5 10.5 C14.5 12 13 12.4 12.4 13.6\"/></g></svg></span><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z\"/><circle fill=\"#000000\" cx=\"12\" cy=\"8\" r=\"2.2\"/><path d=\"M4 18.5 H20\"/><path d=\"M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5\"/></g></svg></span><span style=\"vertical-align:middle;\">Listen and read.</span></span></div>\n</div>",
    '1:nan-can-nod': "<div class=\"quest-reader-page\">\n<img data-part=\"art\" class=\"quest-art\" src=\"data:image/png;base64,iVBORw0KGgo=\" alt=\"\" style=\"position:absolute;left:0mm;top:0mm;width:198mm;height:148.5mm;object-fit:cover\">\n<div data-part=\"footer-strip\" style=\"position:absolute;left:13.78mm;top:135.26mm;width:87.22mm;height:13.24mm;background-color:#FFFFFF;font-size:9pt;line-height:6mm;color:#000000\"><span data-part=\"leaf-mark\" style=\"position:absolute;left:51.22mm;top:8.74mm;width:34mm;height:2.5mm;font-size:5pt;line-height:2.5mm;white-space:nowrap;color:#000000;text-align:left\">Nan Can Nod \u00b7 sheet 1 of 3</span></div>\n<div data-part=\"title-plaque\" data-plaque-colour=\"#D2D2D2\" style=\"position:absolute;left:20.1141mm;top:122mm;width:71.7718mm;height:10mm\"><svg viewBox=\"0 0 143.54 20\" style=\"position:absolute;left:0;top:0;width:71.7718mm;height:10mm\"><path d=\"M0 3 L3 0 L140.54 0 L143.54 3 L143.54 17 L140.54 20 L3 20 L0 17Z\" fill=\"#4E4E4E\" stroke=\"#4E4E4E\" stroke-width=\"0.6\"/><path d=\"M1.8 4.8 L4.8 1.8 L138.74 1.8 L141.74 4.8 L141.74 15.2 L138.74 18.2 L4.8 18.2 L1.8 15.2Z\" fill=\"#F2F2F2\"/><path d=\"M2.8 5.8 L5.8 2.8 L137.74 2.8 L140.74 5.8 L140.74 14.2 L137.74 17.2 L5.8 17.2 L2.8 14.2Z\" fill=\"#D2D2D2\"/><path d=\"M6 3.6 L137.54 3.6\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"0.6\"/><g transform=\"translate(7.6 10) scale(-1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g><g transform=\"translate(135.94 10) scale(1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g></svg><div class=\"quest-c\" style=\"position:absolute;left:0;top:1.6031mm;width:71.7718mm;height:8.5727mm;color:#000000;font-family:'League Spartan';font-weight:700;font-size:8.5727mm;line-height:8.5727mm;font-kerning:none\">Nan Can Nod</div></div>\n<div data-part=\"footer\" class=\"quest-c\" style=\"position:absolute;left:0mm;top:136mm;width:198mm;height:6mm;font-size:9pt;line-height:6mm;color:#000000;transform:translateX(-43mm);\"><span data-part=\"series\">Storytime Advantage</span> \u00b7 <span data-part=\"week\">Week 1</span> \u00b7 <span data-part=\"role-mark\"><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 19.5 C7 18.5 6 15.5 6 12 C6 7.5 8.5 4.5 12 4.5 C15.5 4.5 18 7 18 10.5 C18 13.5 15.5 14.5 14.5 16.5 C13.6 18.3 12.5 20 10.8 20 C10.3 20 9.9 19.8 9.5 19.5 Z\"/><path d=\"M9.5 11 C9.5 9.2 10.6 8 12 8 C13.4 8 14.5 9.1 14.5 10.5 C14.5 12 13 12.4 12.4 13.6\"/></g></svg></span><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z\"/><circle fill=\"#000000\" cx=\"12\" cy=\"8\" r=\"2.2\"/><path d=\"M4 18.5 H20\"/><path d=\"M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5\"/></g></svg></span><span style=\"vertical-align:middle;\">Listen and read.</span></span></div>\n</div>",
    '7:is-it-a-ball': "<div class=\"quest-reader-page\">\n<img data-part=\"art\" class=\"quest-art\" src=\"data:image/png;base64,iVBORw0KGgo=\" alt=\"\" style=\"position:absolute;left:0mm;top:0mm;width:198mm;height:148.5mm;object-fit:cover\">\n<div data-part=\"footer-strip\" style=\"position:absolute;left:56.78mm;top:49.26mm;width:128.22mm;height:99.24mm;background-color:#FFFFFF;font-size:9pt;line-height:6mm;color:#000000\"><span data-part=\"leaf-mark\" style=\"position:absolute;left:92.22mm;top:94.74mm;width:34mm;height:2.5mm;font-size:5pt;line-height:2.5mm;white-space:nowrap;color:#000000;text-align:left\">Is It a Ball? \u00b7 sheet 1 of 3</span></div>\n<div data-part=\"title-plaque\" data-plaque-colour=\"#D2D2D2\" style=\"position:absolute;left:36.8467mm;top:26mm;width:124.3065mm;height:20mm\"><svg viewBox=\"0 0 124.31 20\" style=\"position:absolute;left:0;top:0;width:124.3065mm;height:20mm\"><path d=\"M0 3 L3 0 L121.31 0 L124.31 3 L124.31 17 L121.31 20 L3 20 L0 17Z\" fill=\"#4E4E4E\" stroke=\"#4E4E4E\" stroke-width=\"0.6\"/><path d=\"M1.8 4.8 L4.8 1.8 L119.51 1.8 L122.51 4.8 L122.51 15.2 L119.51 18.2 L4.8 18.2 L1.8 15.2Z\" fill=\"#F2F2F2\"/><path d=\"M2.8 5.8 L5.8 2.8 L118.51 2.8 L121.51 5.8 L121.51 14.2 L118.51 17.2 L5.8 17.2 L2.8 14.2Z\" fill=\"#D2D2D2\"/><path d=\"M6 3.6 L118.31 3.6\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"0.6\"/><g transform=\"translate(7.6 10) scale(-1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g><g transform=\"translate(116.71 10) scale(1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g></svg><div class=\"quest-c\" style=\"position:absolute;left:0;top:3.2061mm;width:124.3065mm;height:17.1454mm;color:#000000;font-family:'League Spartan';font-weight:700;font-size:17.1454mm;line-height:17.1454mm;font-kerning:none\">Is It a Ball?</div></div>\n<div data-part=\"footer\" class=\"quest-c\" style=\"position:absolute;left:0mm;top:50mm;width:198mm;height:6mm;font-size:9pt;line-height:6mm;color:#000000;\"><span data-part=\"series\">Storytime Advantage</span> \u00b7 <span data-part=\"week\">Week 7</span> \u00b7 <span data-part=\"role-mark\"><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.5 19.5 C7 18.5 6 15.5 6 12 C6 7.5 8.5 4.5 12 4.5 C15.5 4.5 18 7 18 10.5 C18 13.5 15.5 14.5 14.5 16.5 C13.6 18.3 12.5 20 10.8 20 C10.3 20 9.9 19.8 9.5 19.5 Z\"/><path d=\"M9.5 11 C9.5 9.2 10.6 8 12 8 C13.4 8 14.5 9.1 14.5 10.5 C14.5 12 13 12.4 12.4 13.6\"/></g></svg></span><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z\"/><circle fill=\"#000000\" cx=\"12\" cy=\"8\" r=\"2.2\"/><path d=\"M4 18.5 H20\"/><path d=\"M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5\"/></g></svg></span><span style=\"vertical-align:middle;\">Listen and read.</span></span></div>\n</div>",
    '7:the-top': "<div class=\"quest-reader-page\">\n<img data-part=\"art\" class=\"quest-art\" src=\"data:image/png;base64,iVBORw0KGgo=\" alt=\"\" style=\"position:absolute;left:0mm;top:0mm;width:198mm;height:148.5mm;object-fit:cover\">\n<div data-part=\"footer-strip\" style=\"position:absolute;left:59.21mm;top:34.26mm;width:125.79mm;height:114.24mm;background-color:#FFFFFF;font-size:9pt;line-height:6mm;color:#000000\"><span data-part=\"leaf-mark\" style=\"position:absolute;left:89.79mm;top:109.74mm;width:34mm;height:2.5mm;font-size:5pt;line-height:2.5mm;white-space:nowrap;color:#000000;text-align:left\">The Top \u00b7 sheet 1 of 3</span></div>\n<div data-part=\"title-plaque\" data-plaque-colour=\"#D2D2D2\" style=\"position:absolute;left:44mm;top:11mm;width:110mm;height:20mm\"><svg viewBox=\"0 0 110 20\" style=\"position:absolute;left:0;top:0;width:110mm;height:20mm\"><path d=\"M0 3 L3 0 L107 0 L110 3 L110 17 L107 20 L3 20 L0 17Z\" fill=\"#4E4E4E\" stroke=\"#4E4E4E\" stroke-width=\"0.6\"/><path d=\"M1.8 4.8 L4.8 1.8 L105.2 1.8 L108.2 4.8 L108.2 15.2 L105.2 18.2 L4.8 18.2 L1.8 15.2Z\" fill=\"#F2F2F2\"/><path d=\"M2.8 5.8 L5.8 2.8 L104.2 2.8 L107.2 5.8 L107.2 14.2 L104.2 17.2 L5.8 17.2 L2.8 14.2Z\" fill=\"#D2D2D2\"/><path d=\"M6 3.6 L104 3.6\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"0.6\"/><g transform=\"translate(7.6 10) scale(-1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g><g transform=\"translate(102.4 10) scale(1 1)\"><path d=\"M1.6 -1.8 L6.4 -1 L4 0 L6.4 1 L1.6 1.8\" fill=\"#F2F2F2\" stroke=\"#4E4E4E\" stroke-width=\"0.4\"/><path d=\"M-4 0 L0 -4 L4 0 L0 4Z\" fill=\"#FFFFFF\" stroke=\"#4E4E4E\" stroke-width=\"0.5\"/><path d=\"M-4 0 L0 -4 L0 4Z\" fill=\"#d2d2d2\"/><path d=\"M0 -4 L4 0 L0 0Z\" fill=\"#FFFFFF\"/></g></svg><div class=\"quest-c\" style=\"position:absolute;left:0;top:1.4642mm;width:110mm;height:17.1454mm;color:#000000;font-family:'League Spartan';font-weight:700;font-size:17.1454mm;line-height:17.1454mm;font-kerning:none\">The Top</div></div>\n<div data-part=\"footer\" class=\"quest-c\" style=\"position:absolute;left:0mm;top:35mm;width:198mm;height:6mm;font-size:9pt;line-height:6mm;color:#000000;\"><span data-part=\"series\">Storytime Advantage</span> \u00b7 <span data-part=\"week\">Week 7</span> \u00b7 <span data-part=\"role-mark\"><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z\"/><circle fill=\"#000000\" cx=\"12\" cy=\"8\" r=\"2.2\"/><path d=\"M4 18.5 H20\"/><path d=\"M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5\"/></g></svg></span><span style=\"display:inline-block;width:4.6mm;height:4.6mm;vertical-align:middle;margin-right:1mm\"><svg viewBox=\"0 0 24 24\" style=\"width:100%;height:100%\"><g fill=\"none\" stroke=\"#000000\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 12 C6 8 9 8.2 12 9.8 C15 8.2 18 8 20.5 12 C18 16.8 15 17.8 12 17.8 C9 17.8 6 16.8 3.5 12 Z\"/><path d=\"M3.5 12 C8 13.4 16 13.4 20.5 12\"/></g></svg></span><span style=\"vertical-align:middle;\">Sound it out.</span></span></div>\n</div>",
};

describe('quest-cover-leafmark (Phase 9 R1, D-P9-R1)', () => {
    const rows = questReaders();
    const markedBodies = rows.map((row) => ({ row, body: bodyOf(row, markTextOf(row)) }));
    const plainBodies = rows.map((row) => ({ row, body: bodyOf(row, '') }));

    it('L1: every white box of the 14 marked leaf covers is 14.0 mm high or less', () => {
        const bad: Array<string> = [];
        for (const { row, body } of markedBodies) {
            for (const violation of whiteBoxViolations(body)) bad.push(`${row.week}:${row.slug} (${row.title}) ${violation}`);
        }
        expect(bad, bad.join('; ')).toEqual([]);
    });

    it('L2: the leaf-mark span exists once, holds the mark text, and lies inside a white box', () => {
        const errs: Array<string> = [];
        for (const { row, body } of markedBodies) errs.push(...markErrors(body, markTextOf(row), `${row.week}:${row.slug}`));
        expect(errs, errs.join('; ')).toEqual([]);
    });

    it('L3: on the week 7 leaves the strip keeps the no-mark size and the mark box exists', () => {
        const errs: Array<string> = [];
        for (const { row, body } of markedBodies.filter((entry) => entry.row.week === 7)) {
            const key = `${row.week}:${row.slug}`;
            const plain = plainBodies.find((entry) => entry.row.slug === row.slug);
            if (!plain) {
                errs.push(`${key}: no no-mark render`);
                continue;
            }
            const stripMarked = boxesOf(body, ['footer-strip'])[0];
            const stripPlain = boxesOf(plain.body, ['footer-strip'])[0];
            if (!stripMarked || !stripPlain) {
                errs.push(`${key}: footer-strip missing`);
                continue;
            }
            for (const side of ['left', 'top', 'width', 'height'] as const) {
                if (stripMarked[side] !== stripPlain[side]) {
                    errs.push(`${key}: footer-strip ${side} ${stripMarked[side]}mm != no-mark ${stripPlain[side]}mm`);
                }
            }
            if (boxesOf(body, ['leaf-mark-box']).length !== 1) errs.push(`${key}: no leaf-mark-box`);
        }
        expect(errs, errs.join('; ')).toEqual([]);
    });

    it('L4: the 12 week 1 to 6 marked bodies keep their role base bytes', () => {
        expect(Object.keys(PIN_MARK_SHA).length, 'the pin table holds the 12 week 1 to 6 leaves').toBe(12);
        const errs: Array<string> = [];
        for (const { row, body } of markedBodies) {
            const key = `${row.week}:${row.slug}`;
            const want = PIN_MARK_SHA[key];
            if (!want) continue;
            const got = sha256(body);
            if (got !== want) errs.push(`${key}: sha ${got} != pin ${want}`);
        }
        expect(errs, errs.join('; ')).toEqual([]);
    });

    it('L5: the 14 no-mark bodies keep their role base bytes', () => {
        expect(Object.keys(PIN_PLAIN_SHA).length, 'the pin table holds the 14 leaves').toBe(14);
        const errs: Array<string> = [];
        for (const { row, body } of plainBodies) {
            const key = `${row.week}:${row.slug}`;
            const want = PIN_PLAIN_SHA[key];
            if (!want) {
                errs.push(`${key}: no pin`);
                continue;
            }
            const got = sha256(body);
            if (got !== want) errs.push(`${key}: sha ${got} != pin ${want}`);
        }
        expect(errs, errs.join('; ')).toEqual([]);
    });

    it('L6: control, the frozen week 7 bodies fail the L1 rule and the week 1 bodies pass it', () => {
        const errs: Array<string> = [];
        for (const key of Object.keys(FROZEN_BODIES)) {
            const got = sha256(FROZEN_BODIES[key]);
            if (got !== FROZEN_SHA[key]) errs.push(`${key}: frozen sha ${got} != pin ${FROZEN_SHA[key]}`);
        }
        for (const key of ['7:is-it-a-ball', '7:the-top']) {
            const violations = whiteBoxViolations(FROZEN_BODIES[key]);
            if (violations.length === 0) errs.push(`${key}: control failed, the frozen week 7 body shows no L1 violation`);
        }
        for (const key of ['1:hello', '1:nan-can-nod']) {
            const violations = whiteBoxViolations(FROZEN_BODIES[key]);
            if (violations.length !== 0) errs.push(`${key}: control failed, ${violations.join('; ')}`);
        }
        expect(errs, errs.join('; ')).toEqual([]);
    });
});
