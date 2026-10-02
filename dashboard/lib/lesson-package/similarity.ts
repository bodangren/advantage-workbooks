/**
 * Text similarity for articles (track level_banks_20261002): a weighted bag of content words and
 * the cosine of two bags. The old-article grouping and the new-package check use it.
 */

const STOP = new Set(
    'a an and are at be big but can do for from go good has have he her him his i in is it its like look looks me my no not of on one our she so the them then they this to too two very was we what where who with yes you your happy fun day nice new small all says said see sees'.split(' '),
);
const CAST = new Set('pip tom lily mia ben leo sam may pat kim squeaky mom dad grandma grandpa'.split(' '));

/** Content words, lower case, a plural "s" removed; no stop words or cast names. */
export function contentTokens(text: string): string[] {
    return (text.toLowerCase().match(/[a-z]+/g) ?? [])
        .map((t) => t.replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1'))
        .filter((t) => t.length > 2 && !STOP.has(t) && !CAST.has(t));
}

/** A bag of words: the title counts three times, the summary twice, the text once. */
export function articleBag(a: { title: string; summary: string; passage: string }): Map<string, number> {
    const m = new Map<string, number>();
    const add = (text: string, w: number) => contentTokens(text).forEach((t) => m.set(t, (m.get(t) ?? 0) + w));
    add(a.title, 3);
    add(a.summary, 2);
    add(a.passage, 1);
    return m;
}

/** The cosine of two bags (0–1). */
export function cosine(x: Map<string, number>, y: Map<string, number>): number {
    let dot = 0;
    let nx = 0;
    let ny = 0;
    for (const [k, v] of x) {
        nx += v * v;
        const w = y.get(k);
        if (w) dot += v * w;
    }
    for (const v of y.values()) ny += v * v;
    return nx && ny ? dot / Math.sqrt(nx * ny) : 0;
}
