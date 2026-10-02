/**
 * Text helpers for the text-profile lint: tokens, sentences, paragraphs, and lemma candidates.
 * The rules match the 2026-09-30 Origins 2 / Origins 3.1 analysis, so the numbers compare.
 */

const WORD_RE = /[A-Za-z']+/g;

/**
 * Splits text into word tokens (letters and apostrophes). A hyphen splits a word. Accents are
 * removed first, so "café" is one token, "cafe".
 * @param text Any text.
 * @returns The tokens in order, with leading and trailing apostrophes removed.
 */
export function tokenize(text: string): string[] {
    const plain = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (plain.match(WORD_RE) ?? []).map((t) => t.replace(/^'+|'+$/g, '')).filter(Boolean);
}

/**
 * Splits a paragraph into sentences. A sentence ends at `.`, `!` or `?` (and an optional closing
 * quotation mark) when the next word starts with a capital letter or an opening quotation mark.
 * So `"Where is Pip?" says Tom.` stays one sentence.
 * @param paragraph One paragraph of text.
 * @returns The sentences, trimmed.
 */
export function splitSentences(paragraph: string): string[] {
    const text = paragraph.replace(/\s+/g, ' ').trim();
    if (!text) return [];
    const out: string[] = [];
    const boundary = /[.!?]+["”’]?(?=\s+(?:["“]|[A-Z]))/g;
    let start = 0;
    let m: RegExpExecArray | null;
    while ((m = boundary.exec(text)) !== null) {
        const end = m.index + m[0].length;
        out.push(text.slice(start, end).trim());
        start = end;
    }
    const rest = text.slice(start).trim();
    if (rest) out.push(rest);
    return out;
}

/**
 * Splits text into paragraphs at blank lines and joins the lines of each paragraph with a space.
 * @param text Multi-line text.
 * @returns The non-empty paragraphs.
 */
export function splitParagraphs(text: string): string[] {
    return text
        .split(/\n\s*\n/)
        .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join(' '))
        .filter(Boolean);
}

const IRREGULAR: Record<string, string> = {
    am: 'be', is: 'be', are: 'be', was: 'be', were: 'be',
    has: 'have', had: 'have', does: 'do', did: 'do', goes: 'go', went: 'go',
    says: 'say', said: 'say', ran: 'run', sat: 'sit', ate: 'eat', saw: 'see', made: 'make',
    got: 'get', came: 'come', gave: 'give', took: 'take', flew: 'fly', swam: 'swim', drew: 'draw',
    drank: 'drink', sang: 'sing', rode: 'ride', wrote: 'write', caught: 'catch', threw: 'throw',
    found: 'find', told: 'tell', children: 'child', mice: 'mouse', feet: 'foot', teeth: 'tooth',
    men: 'man', women: 'woman', people: 'person', an: 'a',
    // American spelling of a word the graph holds only in its British form.
    mom: 'mum', moms: 'mum', mommy: 'mum',
};

const CONTRACTIONS: Record<string, string> = {
    "can't": 'can', "won't": 'will', "i'm": 'i',
};

function suffixCandidates(t: string): string[] {
    const c: string[] = [];
    const doubled = (stem: string) => (stem.length > 2 && stem.at(-1) === stem.at(-2) ? [stem.slice(0, -1)] : []);
    if (t.endsWith('ies')) c.push(t.slice(0, -3) + 'y');
    if (t.endsWith('es')) c.push(t.slice(0, -2));
    if (t.endsWith('s')) c.push(t.slice(0, -1));
    if (t.endsWith('ing')) {
        const stem = t.slice(0, -3);
        c.push(stem, stem + 'e', ...doubled(stem));
    }
    if (t.endsWith('ed')) {
        const stem = t.slice(0, -2);
        c.push(stem, t.slice(0, -1), ...doubled(stem));
    }
    if (t.endsWith('er')) {
        const stem = t.slice(0, -2);
        c.push(stem, ...doubled(stem));
    }
    if (t.endsWith('est')) {
        const stem = t.slice(0, -3);
        c.push(stem, ...doubled(stem));
    }
    return c;
}

/**
 * Lists possible dictionary forms of a token, most likely first. Irregular forms come first
 * ("saw" → "see"), then the token itself, then contraction and possessive bases, then suffix rules.
 * @param token One word token.
 * @returns Lower-case candidate forms without duplicates.
 */
export function lemmaCandidates(token: string): string[] {
    const t = token.toLowerCase();
    const out: string[] = [];
    if (IRREGULAR[t]) out.push(IRREGULAR[t]);
    out.push(t);
    const contracted = CONTRACTIONS[t] ?? t.match(/^(.+?)(n't|'s|'re|'m|'ve|'ll|'d)$/)?.[1];
    if (contracted) out.push(...lemmaCandidates(contracted));
    out.push(...suffixCandidates(t));
    return [...new Set(out.filter(Boolean))];
}
