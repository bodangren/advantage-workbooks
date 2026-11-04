/**
 * Trace words (A-48): a trace sentence prints as SVG text with one start dot on the first stroke of
 * each word. Each word sits at an x that this module computes from the advance widths of Andika
 * regular, so the dot of a word is exact with no browser layout. Kerning is not read; a word never
 * moves by more than a fraction of a millimeter.
 */

/** The advance width of each printable ASCII character of Andika regular, in em (measured from the font file). */
export const ANDIKA_ADVANCE_EM: Readonly<Record<string, number>> = {
    ' ': 0.2686, '!': 0.373, '"': 0.5005, '#': 0.5859, '$': 0.5859, '%': 0.7451,
    '&': 0.5967, '\'': 0.2954, '(': 0.3882, ')': 0.3882, '*': 0.502, '+': 0.5859,
    ',': 0.3174, '-': 0.4199, '.': 0.3125, '/': 0.4883, '0': 0.5859, '1': 0.5859,
    '2': 0.5859, '3': 0.5859, '4': 0.5859, '5': 0.5859, '6': 0.5859, '7': 0.5859,
    '8': 0.5859, '9': 0.5859, ':': 0.3125, ';': 0.3174, '<': 0.5859, '=': 0.5859,
    '>': 0.5859, '?': 0.5127, '@': 0.8311, A: 0.6812, B: 0.6274, C: 0.6616,
    D: 0.7007, E: 0.5664, F: 0.5615, G: 0.6934, H: 0.7202, I: 0.4761,
    J: 0.4712, K: 0.6396, L: 0.5273, M: 0.8765, N: 0.7324, O: 0.7129,
    P: 0.5835, Q: 0.7202, R: 0.6372, S: 0.5737, T: 0.6177, U: 0.7031,
    V: 0.6665, W: 1.0156, X: 0.647, Y: 0.6445, Z: 0.6006, '[': 0.3857,
    '\\': 0.4883, ']': 0.3857, '^': 0.415, '_': 0.6221, '`': 0.2832, a: 0.5615,
    b: 0.564, c: 0.498, d: 0.5811, e: 0.5347, f: 0.3662, g: 0.5493,
    h: 0.5737, i: 0.2759, j: 0.2905, k: 0.5054, l: 0.2759, m: 0.8228,
    n: 0.5786, o: 0.5566, p: 0.5713, q: 0.5518, r: 0.4346, s: 0.4712,
    t: 0.4077, u: 0.5786, v: 0.5225, w: 0.7568, x: 0.5298, y: 0.5176,
    z: 0.5078, '{': 0.4883, '|': 0.3369, '}': 0.4883, '~': 0.5444,
};

/**
 * The start of the first stroke of a letter that begins a trace word, in em: x from the left end of
 * the advance, y up from the baseline. A stem letter starts on the top of its stem; a round letter
 * starts at the upper right (a, c, s, G, S) or at the top (o); e starts at the left end of its bar.
 * The points were measured on the Andika regular skeleton and sit inside the glyph ink.
 */
export const TRACE_START_EM: Readonly<Record<string, { x: number; y: number }>> = {
    G: { x: 0.574, y: 0.6318 },
    H: { x: 0.1315, y: 0.6764 },
    I: { x: 0.2326, y: 0.6764 },
    P: { x: 0.1327, y: 0.6782 },
    S: { x: 0.4696, y: 0.6718 },
    T: { x: 0.3029, y: 0.6764 },
    a: { x: 0.4217, y: 0.4409 },
    b: { x: 0.1165, y: 0.7445 },
    c: { x: 0.4272, y: 0.3873 },
    d: { x: 0.3905, y: 0.4318 },
    e: { x: 0.0992, y: 0.2545 },
    f: { x: 0.2922, y: 0.7545 },
    g: { x: 0.3837, y: 0.4318 },
    h: { x: 0.1164, y: 0.7445 },
    i: { x: 0.137, y: 0.4182 },
    k: { x: 0.1163, y: 0.7445 },
    m: { x: 0.1309, y: 0.4609 },
    n: { x: 0.1216, y: 0.4609 },
    o: { x: 0.2783, y: 0.4691 },
    p: { x: 0.1493, y: 0.4282 },
    r: { x: 0.1214, y: 0.4609 },
    s: { x: 0.3801, y: 0.4536 },
    t: { x: 0.167, y: 0.6073 },
    y: { x: 0.0679, y: 0.4609 },
};

/**
 * The geometry of a trace line in millimeters: the SVG user unit is 1 mm, the font size is 22 pt,
 * and the baseline sits at `baselineMm` from the top. `baselineMm` equals `heightMm`, so that the rule
 * line (the bottom border of the wrapper) lies on the baseline of every trace word (A-48 F1); a tail
 * of a letter hangs below the rule line. `padMm` keeps a start dot at the left end inside the SVG.
 */
export const TRACE_LINE = { fontSizeMm: 7.76, baselineMm: 8, heightMm: 8, padMm: 1.5, dotRadiusMm: 0.9 } as const;

/** One word of a trace line. */
export interface TraceWord {
    /** The word with its punctuation. */
    text: string;
    /** The x of the left end of the word, in the unit of the font size. */
    x: number;
    /** The start dot of the first stroke relative to the word origin: x right, y up from the baseline; absent when the word starts with no letter. */
    dot?: { x: number; y: number };
}

/** The advance of one character in em; a character outside printable ASCII gets the average of a lower case letter. */
const advanceEm = (ch: string): number => ANDIKA_ADVANCE_EM[ch] ?? 0.55;

/**
 * Lays out a trace text as words on one line.
 * @param text The text; words are separated by spaces.
 * @param fontSize The font size in any unit; the result uses the same unit.
 * @returns The words with their x and start dot, and the width of the line.
 * @throws Error When a word starts with a letter that has no start point in the table.
 */
export function traceLineLayout(text: string, fontSize: number): { words: TraceWord[]; width: number } {
    const words: TraceWord[] = [];
    let x = 0;
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const first = word[0];
        const start = TRACE_START_EM[first];
        if (!start && /\p{L}/u.test(first)) throw new Error(`no trace start point for the letter "${first}" in "${word}"`);
        words.push({ text: word, x, ...(start ? { dot: { x: start.x * fontSize, y: start.y * fontSize } } : {}) });
        x += Array.from(word).reduce((sum, ch) => sum + advanceEm(ch), 0) * fontSize + advanceEm(' ') * fontSize;
    }
    return { words, width: Math.max(0, x - advanceEm(' ') * fontSize) };
}
