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
 * So `"Where is Pip?" says Tom.` stays one sentence. A line break (a line with no end stop) also
 * ends a sentence.
 * @param paragraph One paragraph of text.
 * @returns The sentences, trimmed.
 */
export function splitSentences(paragraph: string): string[] {
    // A line break ends a sentence, so a subject line or a greeting does not join the next line.
    if (paragraph.includes('\n')) return paragraph.split('\n').flatMap(splitSentences);
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
 * Splits text into paragraphs at blank lines. A line that ends with `.`, `!` or `?` joins the next
 * line with a space. A line with no end stop keeps a line break, so it ends a sentence.
 * @param text Multi-line text.
 * @returns The non-empty paragraphs.
 */
export function splitParagraphs(text: string): string[] {
    return text
        .split(/\n\s*\n/)
        .map((p) =>
            p
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
                .reduce((acc, line) => (acc ? acc + (/[.!?]["”’]?$/.test(acc) ? ' ' : '\n') + line : line), ''),
        )
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
    // Past simple and past participle of the irregular verbs on the Starters, Movers, Flyers, and
    // A2 Key lists. "been" and "felt" have no graph node, so they reach "be" and "feel" here.
    became: 'become', been: 'be', began: 'begin', begun: 'begin', bought: 'buy', broke: 'break',
    broken: 'break', brought: 'bring', built: 'build', burnt: 'burn', chose: 'choose', chosen: 'choose',
    done: 'do', drawn: 'draw', dreamt: 'dream', driven: 'drive', drove: 'drive', drunk: 'drink',
    eaten: 'eat', fallen: 'fall', fed: 'feed', fell: 'fall', felt: 'feel', flown: 'fly',
    forgot: 'forget', forgotten: 'forget', given: 'give', gone: 'go', gotten: 'get', grew: 'grow',
    grown: 'grow', heard: 'hear', held: 'hold', hidden: 'hide', hid: 'hide', kept: 'keep',
    knew: 'know', known: 'know', lain: 'lie', lay: 'lie', learnt: 'learn', left: 'leave',
    lent: 'lend', lit: 'light', lost: 'lose', meant: 'mean', met: 'meet', mistaken: 'mistake',
    mistook: 'mistake', paid: 'pay', rang: 'ring', ridden: 'ride', rung: 'ring',
    sank: 'sink', seen: 'see', sent: 'send', slept: 'sleep', smelt: 'smell', sold: 'sell',
    spelt: 'spell', spent: 'spend', spoken: 'speak', spoke: 'speak', stolen: 'steal', stole: 'steal',
    stood: 'stand', sung: 'sing', sunk: 'sink', swum: 'swim', swung: 'swing', taken: 'take',
    taught: 'teach', thought: 'think', thrown: 'throw', understood: 'understand', woken: 'wake',
    woke: 'wake', won: 'win', wore: 'wear', worn: 'wear', written: 'write',
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
    // "carried" is "carry", "funnier" and "funniest" are "funny". "tied" still finds "tie" below.
    if (t.endsWith('ied')) c.push(t.slice(0, -3) + 'y');
    if (t.endsWith('ier')) c.push(t.slice(0, -3) + 'y');
    if (t.endsWith('iest')) c.push(t.slice(0, -4) + 'y');
    if (t.endsWith('ying')) c.push(t.slice(0, -4) + 'ie');
    // "-s" before "-es": "planes" is "plane" (not "plan"), "toes" is "toe" (not "to"); "boxes"
    // still finds "box", because "boxe" is not a word.
    if (t.endsWith('s')) c.push(t.slice(0, -1));
    if (t.endsWith('es')) c.push(t.slice(0, -2));
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
