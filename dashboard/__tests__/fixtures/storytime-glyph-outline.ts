import fs from 'node:fs';

/**
 * A small TrueType reader for the print tests (A-48). It reads the outline of a character from a
 * `.ttf` file, so that a test can compare a stroke guide with the real Andika glyph in vector form,
 * with no browser. It supports the `glyf` table with simple and composite glyphs and the format 4
 * `cmap`. Kerning, hinting, and variation tables are not read.
 */

/** A point of an outline. */
export interface OutlinePoint {
    x: number;
    y: number;
}

/** The outline of one glyph in font units, with y pointing up. */
export interface GlyphOutline {
    /** The closed contours, flattened to polylines. */
    contours: OutlinePoint[][];
    /** The advance width in font units. */
    advance: number;
}

/** A parsed font. */
export interface ParsedFont {
    unitsPerEm: number;
    /** The outline of a character; throws when the font has no glyph for it. */
    glyph: (char: string) => GlyphOutline;
}

/** The steps that flatten one quadratic curve. */
const CURVE_STEPS = 12;

/**
 * Parses a TrueType file.
 * @param file The path of the `.ttf` file.
 * @returns The font reader.
 */
export function parseFont(file: string): ParsedFont {
    const buffer = fs.readFileSync(file);
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const tables = new Map<string, { offset: number; length: number }>();
    const tableCount = view.getUint16(4);
    for (let i = 0; i < tableCount; i++) {
        const at = 12 + i * 16;
        const tag = String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
        tables.set(tag, { offset: view.getUint32(at + 8), length: view.getUint32(at + 12) });
    }
    const table = (tag: string): number => {
        const found = tables.get(tag);
        if (!found) throw new Error(`The font has no ${tag} table.`);
        return found.offset;
    };
    const head = table('head');
    const unitsPerEm = view.getUint16(head + 18);
    const longLoca = view.getInt16(head + 50) === 1;
    const numberOfHMetrics = view.getUint16(table('hhea') + 34);
    const hmtx = table('hmtx');
    const loca = table('loca');
    const glyf = table('glyf');

    const cmap = table('cmap');
    let format4 = -1;
    const subtables = view.getUint16(cmap + 2);
    for (let i = 0; i < subtables; i++) {
        const platform = view.getUint16(cmap + 4 + i * 8);
        const encoding = view.getUint16(cmap + 4 + i * 8 + 2);
        const offset = cmap + view.getUint32(cmap + 4 + i * 8 + 4);
        if (view.getUint16(offset) === 4 && ((platform === 3 && encoding === 1) || platform === 0)) { format4 = offset; break; }
    }
    if (format4 < 0) throw new Error('The font has no format 4 cmap.');

    const glyphIndex = (code: number): number => {
        const segCount = view.getUint16(format4 + 6) / 2;
        const endCodes = format4 + 14;
        const startCodes = endCodes + segCount * 2 + 2;
        const deltas = startCodes + segCount * 2;
        const rangeOffsets = deltas + segCount * 2;
        for (let s = 0; s < segCount; s++) {
            if (code > view.getUint16(endCodes + s * 2)) continue;
            const start = view.getUint16(startCodes + s * 2);
            if (code < start) return 0;
            const rangeOffset = view.getUint16(rangeOffsets + s * 2);
            const delta = view.getInt16(deltas + s * 2);
            if (rangeOffset === 0) return (code + delta) & 0xffff;
            const at = rangeOffsets + s * 2 + rangeOffset + (code - start) * 2;
            const index = view.getUint16(at);
            return index === 0 ? 0 : (index + delta) & 0xffff;
        }
        return 0;
    };

    const glyphRange = (index: number): { start: number; end: number } => {
        if (longLoca) return { start: view.getUint32(loca + index * 4), end: view.getUint32(loca + index * 4 + 4) };
        return { start: view.getUint16(loca + index * 2) * 2, end: view.getUint16(loca + index * 2 + 2) * 2 };
    };

    /** Flattens one contour of on-curve and off-curve points into a polyline. */
    const flatten = (points: { x: number; y: number; on: boolean }[]): OutlinePoint[] => {
        if (points.length < 2) return [];
        // Start at an on-curve point; make one from two off-curve neighbours when none exists.
        let startIndex = points.findIndex((p) => p.on);
        let list = points;
        if (startIndex < 0) {
            const a = points[0], b = points[points.length - 1];
            list = [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, on: true }, ...points];
            startIndex = 0;
        }
        const ordered = [...list.slice(startIndex), ...list.slice(0, startIndex)];
        const out: OutlinePoint[] = [{ x: ordered[0].x, y: ordered[0].y }];
        let current = ordered[0];
        let i = 1;
        const closed = [...ordered, ordered[0]];
        while (i < closed.length) {
            const p = closed[i];
            if (p.on) { out.push({ x: p.x, y: p.y }); current = p; i += 1; continue; }
            const next = closed[i + 1] ?? ordered[0];
            const end = next.on ? next : { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2, on: true };
            for (let s = 1; s <= CURVE_STEPS; s++) {
                const t = s / CURVE_STEPS, u = 1 - t;
                out.push({ x: u * u * current.x + 2 * u * t * p.x + t * t * end.x, y: u * u * current.y + 2 * u * t * p.y + t * t * end.y });
            }
            current = end;
            i += next.on ? 2 : 1;
        }
        out.pop();
        return out;
    };

    const readGlyph = (index: number, depth = 0): OutlinePoint[][] => {
        if (depth > 4) throw new Error('The composite glyph is nested too deep.');
        const { start, end } = glyphRange(index);
        if (end <= start) return [];
        let at = glyf + start;
        const contourCount = view.getInt16(at);
        at += 10;
        if (contourCount >= 0) {
            const endPts: number[] = [];
            for (let c = 0; c < contourCount; c++) { endPts.push(view.getUint16(at)); at += 2; }
            const instructionLength = view.getUint16(at);
            at += 2 + instructionLength;
            const pointCount = contourCount ? endPts[contourCount - 1] + 1 : 0;
            const flags: number[] = [];
            while (flags.length < pointCount) {
                const flag = view.getUint8(at++);
                flags.push(flag);
                if (flag & 8) { let repeat = view.getUint8(at++); while (repeat-- > 0) flags.push(flag); }
            }
            const xs: number[] = [], ys: number[] = [];
            let value = 0;
            for (const flag of flags) {
                if (flag & 2) { const d = view.getUint8(at++); value += flag & 16 ? d : -d; }
                else if (!(flag & 16)) { value += view.getInt16(at); at += 2; }
                xs.push(value);
            }
            value = 0;
            for (const flag of flags) {
                if (flag & 4) { const d = view.getUint8(at++); value += flag & 32 ? d : -d; }
                else if (!(flag & 32)) { value += view.getInt16(at); at += 2; }
                ys.push(value);
            }
            const contours: OutlinePoint[][] = [];
            let first = 0;
            for (const last of endPts) {
                const points = [];
                for (let p = first; p <= last; p++) points.push({ x: xs[p], y: ys[p], on: (flags[p] & 1) === 1 });
                contours.push(flatten(points));
                first = last + 1;
            }
            return contours;
        }
        const contours: OutlinePoint[][] = [];
        let more = true;
        while (more) {
            const flag = view.getUint16(at);
            const component = view.getUint16(at + 2);
            at += 4;
            let dx: number, dy: number;
            if (flag & 1) { dx = view.getInt16(at); dy = view.getInt16(at + 2); at += 4; }
            else { dx = view.getInt8(at); dy = view.getInt8(at + 1); at += 2; }
            if (!(flag & 2)) throw new Error('A composite glyph with point matching is not supported.');
            let a = 1, b = 0, c = 0, d = 1;
            const f2 = (offset: number): number => view.getInt16(offset) / 16384;
            if (flag & 8) { a = d = f2(at); at += 2; }
            else if (flag & 0x40) { a = f2(at); d = f2(at + 2); at += 4; }
            else if (flag & 0x80) { a = f2(at); b = f2(at + 2); c = f2(at + 4); d = f2(at + 6); at += 8; }
            for (const contour of readGlyph(component, depth + 1)) {
                contours.push(contour.map((p) => ({ x: a * p.x + c * p.y + dx, y: b * p.x + d * p.y + dy })));
            }
            more = (flag & 0x20) !== 0;
        }
        return contours;
    };

    return {
        unitsPerEm,
        glyph(char: string): GlyphOutline {
            const index = glyphIndex(char.codePointAt(0)!);
            if (index === 0) throw new Error(`The font has no glyph for "${char}".`);
            const metric = index < numberOfHMetrics ? index : numberOfHMetrics - 1;
            return { contours: readGlyph(index), advance: view.getUint16(hmtx + metric * 4) };
        },
    };
}

/** The outline of a glyph placed in an SVG box: the text origin is the middle of the advance, on the baseline. */
export interface PlacedGlyph {
    contours: OutlinePoint[][];
    /** The x of the left end of the advance, in box units. */
    left: number;
    /** The advance width in box units. */
    advance: number;
}

/**
 * Places a glyph as an SVG `<text text-anchor="middle">` does: the middle of the advance sits at x,
 * and the baseline sits at y. The y axis points down in the result.
 * @param font The parsed font.
 * @param char The character.
 * @param placement The font size in box units, the x of the text anchor, and the y of the baseline.
 * @returns The contours in box units.
 */
export function placeGlyph(font: ParsedFont, char: string, placement: { fontSize: number; x: number; baseline: number }): PlacedGlyph {
    const outline = font.glyph(char);
    const scale = placement.fontSize / font.unitsPerEm;
    const left = placement.x - (outline.advance * scale) / 2;
    return {
        contours: outline.contours.map((contour) => contour.map((p) => ({ x: left + p.x * scale, y: placement.baseline - p.y * scale }))),
        left,
        advance: outline.advance * scale,
    };
}

/**
 * Tells whether a point lies on the ink of an outline (non-zero winding, so a counter is not ink).
 * @param contours The contours of the glyph.
 * @param point The point.
 * @returns True when the point is inside the ink.
 */
export function insideInk(contours: OutlinePoint[][], point: OutlinePoint): boolean {
    let winding = 0;
    for (const contour of contours) {
        for (let i = 0; i < contour.length; i++) {
            const a = contour[i], b = contour[(i + 1) % contour.length];
            if (a.y <= point.y) {
                if (b.y > point.y && (b.x - a.x) * (point.y - a.y) - (point.x - a.x) * (b.y - a.y) > 0) winding++;
            } else if (b.y <= point.y && (b.x - a.x) * (point.y - a.y) - (point.x - a.x) * (b.y - a.y) < 0) winding--;
        }
    }
    return winding !== 0;
}

/**
 * The distance from a point to the nearest edge of an outline.
 * @param contours The contours of the glyph.
 * @param point The point.
 * @returns The distance in the units of the contours.
 */
export function distanceToOutline(contours: OutlinePoint[][], point: OutlinePoint): number {
    let best = Infinity;
    for (const contour of contours) {
        for (let i = 0; i < contour.length; i++) {
            const a = contour[i], b = contour[(i + 1) % contour.length];
            const dx = b.x - a.x, dy = b.y - a.y;
            const len2 = dx * dx + dy * dy;
            const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2));
            best = Math.min(best, Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t)));
        }
    }
    return best;
}

/**
 * How far a point lies outside the ink: 0 on the ink, else the distance to the nearest edge.
 * @param contours The contours of the glyph.
 * @param point The point.
 * @returns The outside distance in the units of the contours.
 */
export function outsideDistance(contours: OutlinePoint[][], point: OutlinePoint): number {
    return insideInk(contours, point) ? 0 : distanceToOutline(contours, point);
}

/**
 * Samples an SVG path of the commands M, L, C, and Q (absolute) at about equal steps.
 * @param d The path data.
 * @param step The step length in path units.
 * @returns The sample points, from the start to the end of the path.
 */
export function samplePath(d: string, step = 0.25): OutlinePoint[] {
    const tokens = d.match(/[MLCQ]|-?\d*\.?\d+/g) ?? [];
    const points: OutlinePoint[] = [];
    let i = 0, x = 0, y = 0;
    while (i < tokens.length) {
        const command = tokens[i++];
        if (command === 'M') { x = Number(tokens[i++]); y = Number(tokens[i++]); points.push({ x, y }); }
        else if (command === 'L') {
            const ex = Number(tokens[i++]), ey = Number(tokens[i++]);
            const count = Math.max(1, Math.ceil(Math.hypot(ex - x, ey - y) / step));
            for (let j = 1; j <= count; j++) points.push({ x: x + ((ex - x) * j) / count, y: y + ((ey - y) * j) / count });
            x = ex; y = ey;
        } else if (command === 'C') {
            const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]), x2 = Number(tokens[i++]), y2 = Number(tokens[i++]);
            const ex = Number(tokens[i++]), ey = Number(tokens[i++]);
            const count = Math.max(1, Math.ceil((Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(ex - x2, ey - y2)) / step));
            for (let j = 1; j <= count; j++) {
                const t = j / count, u = 1 - t;
                points.push({ x: u ** 3 * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * ex, y: u ** 3 * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * ey });
            }
            x = ex; y = ey;
        } else if (command === 'Q') {
            const x1 = Number(tokens[i++]), y1 = Number(tokens[i++]), ex = Number(tokens[i++]), ey = Number(tokens[i++]);
            const count = Math.max(1, Math.ceil((Math.hypot(x1 - x, y1 - y) + Math.hypot(ex - x1, ey - y1)) / step));
            for (let j = 1; j <= count; j++) {
                const t = j / count, u = 1 - t;
                points.push({ x: u * u * x + 2 * u * t * x1 + t * t * ex, y: u * u * y + 2 * u * t * y1 + t * t * ey });
            }
            x = ex; y = ey;
        } else throw new Error(`Unsupported path command: ${command}`);
    }
    return points;
}
