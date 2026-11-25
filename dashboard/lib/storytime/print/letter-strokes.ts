/** A point of the 100 × 120 letter model box (the y axis points down). */
export interface LetterPoint {
    x: number;
    y: number;
}

/** One numbered stroke of a letter model. */
export interface LetterStroke {
    /** The SVG path of the stroke centerline; the arrowhead sits on its end. */
    d: string;
    /** Where the stroke number prints, beside the start of the stroke. */
    number: LetterPoint;
}

/** The stroke data of one letter. */
export interface LetterStrokeData {
    /** The strokes in writing order; each follows one phrase of the formation words of its week. */
    strokes: LetterStroke[];
    /** The start dot on the model, on the first point of stroke 1. */
    modelDot: LetterPoint;
    /** The start dot of a trace cell, on the first point of stroke 1 of the grey letter. */
    traceDot: LetterPoint;
    /** The start dot of the dot-only cell: where the letter would start. */
    dotOnlyDot: LetterPoint;
}

/**
 * The geometry that every cell of the letter box shares (A-48). The grey letter prints as an SVG
 * text with `text-anchor: middle`, so that its outline is known: the middle of the advance sits at
 * `centerX`, and the baseline sits at `baseline`. All letters share one baseline, so that the row
 * teaches the line.
 */
export const LETTER_BOX = { width: 100, height: 120, fontSize: 110, centerX: 50, baseline: 84 } as const;

/** The printed size of every cell of the letter box, in millimeters: 0.24 mm for each box unit. */
export const LETTER_CELL_MM = { width: 24, height: 28.8 } as const;

/** The look of the guide in the box units: line width, start dot radius, and number size. */
export const LETTER_GUIDE = { strokeWidth: 2, modelDotRadius: 3.5, traceDotRadius: 4.4, numberSize: 12 } as const;

/**
 * The stroke guides of the letters of units 1 and 2. The paths were measured on the Andika regular
 * glyph: each stem is the center of the stem ink, and each curve is the skeleton (the middle line)
 * of the glyph ink, smoothed. Each path stays inside the glyph ink. The strokes follow the formation
 * words of the weeks: n down, then up over the hill and down; a round the bowl, then down the stem;
 * p down, then up and round the bowl; m down, then two hills; s one curve; t down with the foot,
 * then across; o one round; d round the bowl, then down the stem; e across, then round and back;
 * h down, then up over the hill and down; f round the hook, then down and across; g round the bowl,
 * then down and into the tail. The table stays in code, not in the week files.
 */
export const LETTER_STROKES: Readonly<Record<string, LetterStrokeData>> = {
    n: {
        strokes: [
            { d: 'M31.6 33.3 L31.6 82.0', number: { x: 22.6, y: 37.3 } },
            { d: 'M31.6 47.1 C32.8 46.2 36 43.5 38.4 41.7 C40.7 39.8 43 37.3 45.6 36 C48.3 34.6 51.5 33.5 54.4 33.3 C57.3 33.2 60.8 33.6 63.1 35.1 C65.4 36.6 67.1 39.7 68.1 42.4 C69.2 45.1 69.2 48.4 69.5 51.4 C69.7 54.4 69.6 57.4 69.6 60.4 C69.6 63.4 69.6 66.3 69.6 69.4 C69.6 72.5 69.6 77.3 69.6 78.9', number: { x: 40.6, y: 57.3 } },
        ],
        modelDot: { x: 31.6, y: 33.3 },
        traceDot: { x: 31.6, y: 33.3 },
        dotOnlyDot: { x: 31.6, y: 33.3 },
    },
    a: {
        strokes: [
            { d: 'M66.4 34.4 C64.9 34.1 60.6 32.8 57.6 32.6 C54.7 32.4 51.5 32.4 48.6 33.1 C45.7 33.7 42.5 34.9 40.1 36.6 C37.7 38.3 35.7 40.8 34.2 43.4 C32.7 45.9 31.8 49 31.1 51.9 C30.3 54.8 30 57.9 29.9 60.9 C29.9 63.9 29.9 67.1 30.8 69.9 C31.7 72.7 33.1 76.1 35.3 77.8 C37.5 79.5 41.1 80.3 43.9 79.9 C46.6 79.5 49.6 77.3 51.8 75.3 C54 73.4 55.5 70.6 57.2 68.1 C58.8 65.6 60.2 62.4 61.8 60.3 C62.6 58.2 64 56 64.4 52 C64.8 48 65.3 43 65.6 38.5', number: { x: 70, y: 27 } },
            { d: 'M68.6 37.5 C68.8 43 69.2 48 69.3 53 C69.4 58 69.4 62 69.5 66 C69.6 70.5 69.8 75.5 70 79.9', number: { x: 76, y: 52 } },
        ],
        modelDot: { x: 66.4, y: 34.4 },
        traceDot: { x: 66.4, y: 34.4 },
        dotOnlyDot: { x: 66.4, y: 34.4 },
    },
    p: {
        strokes: [
            { d: 'M32.0 33.3 L32.0 106.0', number: { x: 23, y: 37.3 } },
            { d: 'M32.4 45.1 C33.6 44.3 37.5 42.1 40 40.4 C42.5 38.7 44.7 36.2 47.4 34.9 C50.1 33.7 53.3 32.8 56.1 33.1 C58.9 33.4 62.1 34.7 64.3 36.6 C66.5 38.4 68.1 41.4 69.2 44.1 C70.3 46.9 70.8 50.1 71 53.1 C71.2 56.1 71.1 59.2 70.5 62.1 C70 65.1 69.1 68.3 67.6 70.9 C66.2 73.4 64 75.9 61.6 77.5 C59.2 79.1 56 80.2 53.1 80.4 C50.2 80.7 47.5 79.7 44.1 78.9 C40.8 78 34.8 75.7 32.9 75.1', number: { x: 43, y: 53.3 } },
        ],
        modelDot: { x: 32, y: 33.3 },
        traceDot: { x: 32, y: 33.3 },
        dotOnlyDot: { x: 32, y: 33.3 },
    },
    m: {
        strokes: [
            { d: 'M19.2 33.3 L19.2 82.0', number: { x: 10.2, y: 37.3 } },
            { d: 'M19.1 45.4 C20.2 44.4 23 41.3 25.4 39.5 C27.7 37.7 30.3 35.6 33.1 34.6 C35.9 33.6 39.5 32.7 42.1 33.5 C44.7 34.2 47.5 36.7 48.9 39.1 C50.2 41.6 50.1 45.1 50.4 48.1 C50.6 51.1 50.4 54.1 50.4 57.1 C50.4 60.1 50.4 62.5 50.4 66.1 C50.4 69.8 50.4 76.8 50.4 78.9', number: { x: 28.2, y: 59.3 } },
            { d: 'M50.4 45.4 C51.4 44.4 54.3 41.2 56.6 39.4 C59 37.6 61.6 35.6 64.4 34.6 C67.2 33.6 70.8 32.6 73.4 33.4 C76 34.1 78.7 36.5 80.1 38.9 C81.5 41.3 81.4 44.9 81.7 47.9 C82 50.9 81.9 53.9 81.9 56.9 C81.9 59.9 81.9 62.2 81.9 65.9 C81.9 69.5 81.9 76.7 81.9 78.9', number: { x: 59.6, y: 59.3 } },
        ],
        modelDot: { x: 19.2, y: 33.3 },
        traceDot: { x: 19.2, y: 33.3 },
        dotOnlyDot: { x: 19.2, y: 33.3 },
    },
    s: {
        strokes: [
            { d: 'M64.6 34.9 C63.2 34.5 58.8 33.1 55.9 32.8 C52.9 32.5 49.7 32.3 46.9 33 C44.1 33.8 40.8 35 39.1 37.1 C37.3 39.2 36.1 43 36.5 45.6 C36.9 48.2 39.3 51 41.6 52.7 C43.9 54.3 47.5 54.6 50.4 55.6 C53.3 56.6 56.6 57.1 59.1 58.6 C61.6 60.2 64.5 62.3 65.4 64.9 C66.4 67.4 66 71.4 64.7 73.9 C63.5 76.3 60.5 78.4 57.9 79.6 C55.2 80.7 51.9 80.9 48.9 80.8 C45.9 80.7 42.3 79.9 39.9 79 C37.5 78.1 35.3 76 34.4 75.4', number: { x: 70, y: 27 } },
        ],
        modelDot: { x: 64.6, y: 34.9 },
        traceDot: { x: 64.6, y: 34.9 },
        dotOnlyDot: { x: 64.6, y: 34.9 },
    },
    t: {
        strokes: [
            { d: 'M45 18 C45 20.3 45 27.3 45 32 C45 36.7 45 41 45 46 C44.9 51 44.8 57.7 44.9 61.9 C44.9 66 44.5 68 45.2 70.9 C46 73.7 47 77.3 49.1 78.9 C51.2 80.4 55 80.7 57.9 80.3 C60.7 79.9 65 77 66.4 76.4', number: { x: 36, y: 20 } },
            { d: 'M33.0 34.5 L65.0 34.5', number: { x: 25, y: 39 } },
        ],
        modelDot: { x: 45, y: 18 },
        traceDot: { x: 45, y: 18 },
        dotOnlyDot: { x: 45, y: 18 },
    },
    o: {
        strokes: [
            { d: 'M50 32.4 C48.5 32.8 44 33 41.2 34.6 C38.4 36.2 35.1 39.2 33.2 42.1 C31.3 44.9 30.4 48.5 29.8 51.7 C29.2 54.9 29.2 58.2 29.7 61.5 C30.2 64.7 30.9 68.4 32.7 71.3 C34.5 74.2 37.8 77.4 40.6 79 C43.4 80.6 46.5 81 49.5 81 C52.4 81.1 55.5 80.7 58.3 79.2 C61.2 77.7 64.6 74.8 66.6 72 C68.5 69.2 69.5 65.6 70.1 62.4 C70.8 59.1 70.8 55.9 70.3 52.6 C69.9 49.3 68.6 45.3 67.5 42.7 C66.4 40.2 64.2 38.3 63.5 37.5', number: { x: 58, y: 26.4 } },
        ],
        modelDot: { x: 50, y: 32.4 },
        traceDot: { x: 50, y: 32.4 },
        dotOnlyDot: { x: 50, y: 32.4 },
    },
    d: {
        strokes: [
            { d: 'M66.7 35.5 C65.6 35.5 63.1 35.8 59.9 35.3 C56.7 34.8 51.6 32.4 47.7 32.8 C43.8 33.2 39.1 36.0 36.7 37.5 C34.3 39.0 34.1 40.3 33.1 41.8 C32.1 43.3 31.3 44.1 30.6 46.6 C29.9 49.1 28.9 53.1 28.7 56.5 C28.5 59.9 29.0 64.2 29.5 66.9 C30.0 69.6 30.6 70.7 31.6 72.5 C32.6 74.3 32.8 76.1 35.5 77.5 C38.2 78.9 43.8 81.3 47.7 81.0 C51.6 80.7 55.4 76.4 58.7 75.6 C62.0 74.8 66.0 77.6 67.6 76.4 C69.2 75.2 68.3 71.7 68.4 68.4 C68.6 65.1 68.5 60.5 68.5 56.5 C68.5 52.5 68.6 47.6 68.4 44.5 C68.2 41.4 67.4 39.1 67.2 38.0', number: { x: 72, y: 30 } },
            { d: 'M68.2 1.0 C68.2 4.2 68.4 12.7 68.4 20.0 C68.5 27.3 68.5 38.0 68.5 45.0 C68.5 52.0 68.5 57.5 68.6 62.0 C68.6 66.5 68.7 68.7 68.8 72.0 C68.9 75.3 69.3 80.3 69.4 82.0', number: { x: 61, y: 4 } },
        ],
        modelDot: { x: 66.7, y: 35.5 },
        traceDot: { x: 66.7, y: 35.5 },
        dotOnlyDot: { x: 66.7, y: 35.5 },
    },
    e: {
        strokes: [
            { d: 'M31.5 56.0 C35.0 56.0 38.4 56.2 42.0 56.0 C46.6 55.8 51.1 55.3 56.0 55.0 C60.9 54.7 69.2 55.2 71.5 54.0 C73.8 52.8 70.9 50.2 70.0 48.0 C69.1 45.8 67.7 43.0 66.0 41.0 C64.3 39.0 62.0 37.7 60.0 36.0 C58.0 34.3 56.3 32.0 54.0 31.0 C51.7 30.0 48.5 29.3 46.0 30.0 C43.5 30.7 41.2 33.3 39.0 35.0 C36.8 36.7 34.5 37.8 33.0 40.0 C31.5 42.2 30.3 45.0 30.0 48.0 C29.7 51.0 30.8 54.7 31.0 58.0 C31.3 61.3 30.8 65.3 31.5 68.0 C32.2 70.7 33.3 72.3 35.0 74.0 C36.8 75.7 39.7 76.7 42.0 78.0 C44.3 79.3 46.3 81.3 49.0 82.0 C51.7 82.7 55.3 82.5 58.0 82.0 C60.7 81.5 63.0 79.8 65.0 79.0 C67.0 78.2 68.8 78.0 70.0 77.0 C71.2 76.0 71.7 73.7 72.0 73.0', number: { x: 23, y: 52 } },
        ],
        modelDot: { x: 31.5, y: 56.0 },
        traceDot: { x: 31.5, y: 56.0 },
        dotOnlyDot: { x: 31.5, y: 56.0 },
    },
    h: {
        strokes: [
            { d: 'M31.2 1.5 C31.2 6.3 31.2 20.3 31.2 30.0 C31.2 39.8 31.2 51.3 31.2 60.0 C31.2 68.7 31.2 78.3 31.2 82.0', number: { x: 22, y: 5 } },
            { d: 'M31.2 45.4 C32.3 44.5 35.7 41.8 38.0 40.0 C40.3 38.2 42.5 35.9 45.2 34.7 C47.9 33.5 51.0 32.7 54.0 32.8 C57.0 32.9 60.8 33.6 63.1 35.2 C65.5 36.8 67.1 39.8 68.1 42.5 C69.1 45.2 69.0 47.8 69.2 51.5 C69.4 55.3 69.2 60.6 69.2 65.0 C69.2 69.4 69.2 75.8 69.2 78.0', number: { x: 40, y: 57 } },
        ],
        modelDot: { x: 31.2, y: 1.5 },
        traceDot: { x: 31.2, y: 1.5 },
        dotOnlyDot: { x: 31.2, y: 1.5 },
    },
    f: {
        strokes: [
            { d: 'M62.0 1.0 C65.0 0.5 68.0 1.0 70.0 3.0 C71.5 4.5 71.0 5.8 69.0 6.0 C66.0 6.0 62.0 5.5 58.0 5.5 C53.0 5.5 49.5 8.0 48.4 14.0 C47.8 20.0 47.8 55.0 47.8 84.0', number: { x: 69, y: -3 } },
            { d: 'M33.0 34.5 C38.6 34.5 60.9 34.5 66.5 34.5', number: { x: 26, y: 39 } },
        ],
        modelDot: { x: 62.0, y: 1.0 },
        traceDot: { x: 62.0, y: 1.0 },
        dotOnlyDot: { x: 62.0, y: 1.0 },
    },
    g: {
        strokes: [
            { d: 'M66.0 35.5 C64.9 35.1 62.9 33.8 59.6 33.4 C56.3 33.0 50.2 32.4 46.4 33.4 C42.6 34.4 38.9 37.8 36.8 39.5 C34.7 41.2 34.8 42.4 34.0 43.8 C33.2 45.2 32.7 45.9 32.1 48.0 C31.5 50.1 30.7 53.3 30.5 56.2 C30.3 59.1 30.4 62.9 30.7 65.3 C31.0 67.7 31.4 68.8 32.2 70.5 C33.0 72.2 32.9 74.0 35.3 75.5 C37.7 77.0 42.8 79.8 46.4 79.7 C50.0 79.6 53.9 75.5 57.1 74.8 C60.3 74.1 64.1 76.8 65.8 75.7 C67.5 74.6 66.9 71.5 67.3 68.3 C67.7 65.0 68.0 60.3 68.1 56.2 C68.2 52.1 68.3 46.8 68.0 43.8 C67.7 40.8 66.8 39.0 66.5 38.0', number: { x: 72, y: 30 } },
            { d: 'M67.5 44.0 C67.6 46.7 67.9 54.8 68.0 60.0 C68.1 65.2 68.0 71.0 68.0 75.0 C68.0 79.0 68.0 80.5 68.0 84.0 C68.0 87.5 69.7 92.5 68.0 96.0 C66.3 99.5 61.7 103.2 58.0 104.7 C54.3 106.2 50.0 105.5 46.0 104.8 C42.0 104.1 36.6 100.8 34.0 100.4 C31.4 100.0 31.1 102.1 30.5 102.4', number: { x: 75, y: 62 } },
        ],
        modelDot: { x: 66.0, y: 35.5 },
        traceDot: { x: 66.0, y: 35.5 },
        dotOnlyDot: { x: 66.0, y: 35.5 },
    },
};

/**
 * The stroke data of a letter.
 * @param letter The letter of `print.letterBox.letter`.
 * @returns The strokes and the three start dots.
 * @throws Error When the table has no data for the letter, so that a new letter cannot print a wrong guide.
 */
export function letterStrokeData(letter: string): LetterStrokeData {
    const data = LETTER_STROKES[letter];
    if (!data) throw new Error(`no stroke data for the letter "${letter}"`);
    return data;
}
