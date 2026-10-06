import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { NUMBER_WORDS } from '../lib/text-profile/vocabulary';
import { CONTENT_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import { BANK_COUNTS, LEVEL_BOOKS, WORKBOOK_LESSONS, buildBankRows, britishHeadword, normalizePools, restrictPool, targetCounts, type BankRow, type UsedCounts, type WordPools } from '../lib/lesson-package/bank-plan';

const USAGE = `Writes the article plan of a level bank (track level_banks_20261002). No alphabet, phonics, or
first-words articles: schools (K-2) and Storytime Advantage hold them (Daniel, 2026-10-02).

Usage: npx tsx scripts/plan-level-bank.ts <level 1-9> [--a2key-from <words file>]

Reads docs/content-plans/data/legacy-levels-1-4-2026-10-02.json (the old ids) and the YLE word
lists (docs/content-plans/data/yle-*-words.md). Writes docs/content-plans/level-plans/bank-<level>.json
and .md: one row per article with its text type, target objectives, required glossed words, and the
old article id that it replaces. The same input gives the same plan.

Levels 5-9 (track levels_5_9_20261006) have no production inventory: every article is new, and the old-id
files are not read. The text types are in lib/lesson-package/bank-plan.ts. Required glossed words come from
the Movers, Flyers, and A2 Key lists (docs/content-plans/data/*-words.md) minus the words that a package of
levels 1-4 already glossed. The script prints a check: article count, the target count of each in-scope
objective (2 or more), and how many list words the plan requires. It plans levels 5 up to <level> in
order, because the words that an earlier level takes are not taken again.

--a2key-from <file> (levels 8 and 9; word pacing, levels plan v0.5): the A2 Key words that <level> may
require, one per line (for example the words that the level's books gloss). The earlier levels of the
run keep the full lists.`;

interface Template {
    type: string;
    app: 'fiction' | 'nonfiction';
    count: number;
    objectives: string[];
    supporting?: string[];
    topics: string[];
    note: string;
    /** Each slot gets the next two letters of the alphabet; required words start with them. */
    letters?: boolean;
    /** Each slot must use these number words. */
    numbers?: string[];
}

/** Old ids that the workbook books take (spec decision 1). */
const WORKBOOK_TAKES: Record<number, { book: string; count: number; from: 'first' | 'last' }> = {
    1: { book: 'origins-1', count: 14, from: 'first' },
    3: { book: 'origins-3.2', count: 14, from: 'last' },
};

const CONTENT = ['animals', 'the-body-and-the-face', 'clothes', 'colours', 'family-and-friends', 'food-and-drink', 'health', 'the-home', 'materials', 'places-and-directions', 'school', 'sports-and-leisure', 'time', 'toys', 'transport', 'weather', 'work', 'the-world-around-us'];

const T: Record<number, Template[]> = {
    1: [
        { type: 'counting: numbers one to ten', app: 'fiction', count: 7, numbers: NUMBER_WORDS.slice(0, 10), objectives: ['R12.1', 'R13.2', 'L10.2'], topics: ['animals', 'toys', 'food-and-drink', 'the-world-around-us'], note: 'Count things from one to ten, as words. Ask "How many …?" at least once.' },
        { type: 'describing: colors and sizes', app: 'nonfiction', count: 7, objectives: ['L10.6', 'L12.1'], supporting: ['R10.2'], topics: ['colours', 'clothes', 'toys', 'animals'], note: 'Describe things by color and size. Use yes/no and good/bad ("Is it red? Yes, it is.").' },
        { type: 'dialogue: polite words', app: 'fiction', count: 5, objectives: ['L11.1', 'L13.2'], topics: ['food-and-drink', 'family-and-friends', 'places-and-directions'], note: 'Hello, goodbye, please, thank you, and sorry in a short scene (a shop, a meal, a visit).' },
        { type: 'classroom: short instructions', app: 'fiction', count: 4, objectives: ['L13.1', 'L13.2'], supporting: ['L10.4'], topics: ['school'], note: 'Teacher Kim and Lily\'s class. Short instructions ("Sit down. Open your book.") and a thumbs up.' },
        { type: 'books: a title on a cover', app: 'nonfiction', count: 2, objectives: ['R13.1', 'R10.2'], topics: ['school', 'animals', 'toys'], note: 'A child shows books and reads their titles ("The title is …"). One picture shows a book cover; put the title in the overlay.' },
        { type: 'game: yes or no questions', app: 'fiction', count: 6, objectives: ['R10.2', 'L12.1'], supporting: ['L10.6'], topics: ['animals', 'the-home', 'food-and-drink', 'the-body-and-the-face'], note: 'A guessing game: "Is it a cat? No, it isn\'t. Is it a dog? Yes, it is!" Three or more question marks.' },
        { type: 'describing: me and my family', app: 'nonfiction', count: 5, objectives: ['L10.6', 'R12.1'], topics: ['the-body-and-the-face', 'family-and-friends'], note: 'A child tells about the body or the family, with number words ("I have two hands.").' },
    ],
    2: [
        { type: 'story: read aloud', app: 'fiction', count: 4, objectives: ['L16.1', 'R17.2'], supporting: ['R14.1', 'R21.1'], topics: ['animals', 'toys', 'food-and-drink', 'the-home', 'clothes'], note: 'A short Pip-world story with dialogue and a question. Familiar words with pictures.' },
        { type: 'actions: action words', app: 'fiction', count: 4, objectives: ['L15.1'], supporting: ['R21.2', 'R14.1'], topics: ['sports-and-leisure', 'animals', 'the-body-and-the-face'], note: 'Action words (clap, stamp, jump, walk, run, swim) in a game or a story.' },
        { type: 'rules: don\'t …', app: 'fiction', count: 3, objectives: ['L16.2'], supporting: ['R14.1'], topics: ['places-and-directions', 'school', 'sports-and-leisure', 'the-home'], note: 'Negative instructions with a reason ("Don\'t run! The floor is wet.").' },
        { type: 'introducing someone: name and age', app: 'nonfiction', count: 4, objectives: ['R17.1'], supporting: ['R14.1'], topics: ['family-and-friends', 'school'], note: 'Introduce people: "This is May. She is seven." Names, ages, and one fact each.' },
        { type: 'describing: everyday things', app: 'nonfiction', count: 5, objectives: ['R17.2', 'L16.1'], supporting: ['R14.1'], topics: ['colours', 'school', 'toys', 'clothes', 'food-and-drink', 'animals'], note: 'Everyday nouns with colors, numbers, and sizes. One thing in each line.' },
        { type: 'class time: start and end', app: 'fiction', count: 2, objectives: ['L17.1'], supporting: ['R14.1'], topics: ['school', 'sports-and-leisure'], note: 'Words that start and end activities: "Let\'s start!", "Stop, please.", "It\'s time to go home."' },
        { type: 'words like Thai words', app: 'nonfiction', count: 2, objectives: ['R15.1'], supporting: ['R14.1'], topics: ['food-and-drink', 'sports-and-leisure'], note: 'English words that Thai also uses (football, ice cream, chocolate, computer, TV, burger, guitar). Glossed words from them.' },
    ],
    3: [
        { type: 'story: read aloud', app: 'fiction', count: 20, objectives: ['L18.1', 'L19.4', 'R21.1'], supporting: ['R10.2'], topics: CONTENT, note: 'A Pip-world story with dialogue and two or more questions. A small problem and a kind ending.' },
        { type: 'story: where and what color', app: 'fiction', count: 7, objectives: ['L19.2', 'L21.2', 'R21.4'], topics: ['the-home', 'toys', 'animals', 'clothes', 'places-and-directions'], note: 'Find and describe things: "Where is …? It is under the …", "What color is …?".' },
        { type: 'functional: signs and notices', app: 'nonfiction', count: 8, objectives: ['R19.2', 'R20.3', 'R20.4'], topics: ['places-and-directions', 'the-world-around-us', 'school', 'sports-and-leisure', 'animals', 'transport'], note: 'A short frame story with 4 to 6 signs ("Don\'t …", "This way to …", "No …"). Put each sign text in an image overlay, letter for letter.' },
        { type: 'counting: numbers to twenty and plurals', app: 'fiction', count: 6, numbers: NUMBER_WORDS.slice(10, 20), objectives: ['R18.2', 'R20.2'], topics: ['food-and-drink', 'animals', 'toys', 'the-world-around-us'], note: 'Count to twenty as words, with plural nouns (one bird, twelve birds). Use one or two of the given number words at least.' },
        { type: 'dialogue: greetings', app: 'fiction', count: 4, objectives: ['R18.3', 'L13.2'], supporting: ['L11.1'], topics: ['family-and-friends', 'school', 'places-and-directions'], note: 'Different greetings for the same purpose (hi, hello, good morning, bye, goodbye, see you).' },
        { type: 'time: days of the week', app: 'nonfiction', count: 4, objectives: ['R19.1'], supporting: ['L18.4'], topics: ['sports-and-leisure', 'school', 'food-and-drink', 'family-and-friends'], note: 'A plan for one week ("On Monday …"). Day names are Movers words: put them in allow, not in glossed.' },
        { type: 'time: the hours of the day', app: 'nonfiction', count: 4, objectives: ['L18.4'], supporting: ['R19.1'], topics: ['time', 'food-and-drink', 'school', 'the-home'], note: 'A day by the clock, full hours only ("At seven o\'clock …"). "o\'clock" goes in allow.' },
        { type: 'song or chant', app: 'fiction', count: 5, objectives: ['L18.2', 'L21.3'], topics: ['animals', 'the-body-and-the-face', 'weather', 'food-and-drink', 'sports-and-leisure'], note: 'A chant with repeated lines and actions (the children sing it in a scene). Lines can be short; keep the mean sentence length in range.' },
        { type: 'game: commands', app: 'fiction', count: 5, objectives: ['L18.3', 'L20.2'], topics: ['school', 'sports-and-leisure', 'the-body-and-the-face'], note: 'A game with spoken commands ("Teacher says: touch your nose!").' },
        { type: 'introductions: name, age, home', app: 'nonfiction', count: 5, objectives: ['L19.1', 'L20.1'], supporting: ['R17.1'], topics: ['family-and-friends', 'school', 'the-home', 'animals'], note: 'A child introduces herself or himself and asks the reader questions ("How old are you?").' },
        { type: 'family: naming and describing', app: 'fiction', count: 5, objectives: ['L21.1', 'R21.1'], topics: ['family-and-friends', 'the-home', 'food-and-drink', 'sports-and-leisure'], note: 'Family members with one fact each, in a family scene.' },
        { type: 'instructions: draw, color, make', app: 'nonfiction', count: 5, objectives: ['L19.3', 'L20.2'], topics: ['school', 'toys', 'colours', 'animals'], note: 'Numbered steps to draw, color, or make something ("First, draw a big circle.").' },
        { type: 'picture words', app: 'nonfiction', count: 4, objectives: ['R20.1', 'R21.4'], topics: ['the-home', 'school', 'clothes', 'food-and-drink', 'animals', 'transport'], note: 'A picture-dictionary page in sentences: "Look at the picture. This is a …". The pictures show the glossed words.' },
        { type: 'actions: action words', app: 'fiction', count: 2, objectives: ['R21.2', 'L15.1'], topics: ['sports-and-leisure', 'animals'], note: 'Many action words in a lively scene.' },
    ],
    4: [
        { type: 'dialogue: contractions', app: 'fiction', count: 4, objectives: ['R22.3', 'L23.6'], supporting: ['R24.4'], topics: ['family-and-friends', 'sports-and-leisure', 'the-home', 'school'], note: 'A dialogue story with contractions: I\'m, he\'s, she\'s, we\'re, it\'s, don\'t, can\'t.' },
        { type: 'family: me and my family', app: 'nonfiction', count: 3, objectives: ['R22.1', 'L23.4'], supporting: ['L24.3'], topics: ['family-and-friends', 'the-home'], note: 'Words about me and my family (girl, brother, aunt, uncle, grandson).' },
        { type: 'ordinal numbers', app: 'fiction', count: 3, objectives: ['R22.2'], supporting: ['L24.6'], topics: ['sports-and-leisure', 'time', 'school'], note: 'Ordinal numbers to twentieth (a race, a line, a birthday, floors).' },
        { type: 'questions: what is this?', app: 'fiction', count: 3, objectives: ['L22.1', 'R23.7'], supporting: ['R24.2'], topics: ['the-home', 'the-world-around-us', 'school', 'materials'], note: '"What\'s this?" "It\'s a …" about things in a room or a picture.' },
        { type: 'time: days and months', app: 'nonfiction', count: 3, objectives: ['L22.2'], supporting: ['R25.3'], topics: ['time', 'sports-and-leisure', 'weather'], note: 'Days and months in a calendar, a diary, or a plan.' },
        { type: 'abilities: can and can\'t', app: 'fiction', count: 3, objectives: ['L23.1'], supporting: ['R25.4'], topics: ['sports-and-leisure', 'animals', 'health'], note: 'What people and animals can and can\'t do.' },
        { type: 'time: the clock', app: 'nonfiction', count: 3, objectives: ['L23.2', 'L23.7'], supporting: ['L25.5'], topics: ['time', 'school', 'transport'], note: 'Times to the quarter hour and five minutes, as words ("at a quarter past seven", "at ten to eight").' },
        { type: 'likes and dislikes', app: 'fiction', count: 3, objectives: ['L23.3'], supporting: ['R25.4'], topics: ['food-and-drink', 'sports-and-leisure', 'animals'], note: '"I like …", "I don\'t like …", "Do you like …?"' },
        { type: 'school: teacher feedback and written instructions', app: 'fiction', count: 2, objectives: ['L23.5', 'R23.2'], supporting: ['R24.3'], topics: ['school'], note: 'Teacher Kim gives feedback ("Well done!", "Try again.") and written task instructions ("Read and match.").' },
        { type: 'numbers to one hundred', app: 'nonfiction', count: 2, objectives: ['R23.4'], supporting: ['R23.5'], topics: ['animals', 'the-world-around-us', 'sports-and-leisure'], note: 'Numbers to one hundred as words (twenty, thirty, … one hundred).' },
        { type: 'word sets', app: 'nonfiction', count: 2, objectives: ['R23.5'], supporting: ['R24.2'], topics: ['food-and-drink', 'clothes', 'school', 'animals'], note: 'Groups of words from one set (foods, clothes, classroom things), sorted in the text.' },
        { type: 'places: describing a place', app: 'nonfiction', count: 3, objectives: ['R23.6', 'R23.8'], supporting: ['L24.4'], topics: ['places-and-directions', 'the-world-around-us', 'transport'], note: 'A short description of a familiar place and where things are in it.' },
        { type: 'story: an illustrated story', app: 'fiction', count: 2, objectives: ['R23.3', 'R23.1'], supporting: ['L24.2', 'L24.5'], topics: ['weather', 'the-world-around-us', 'animals'], note: 'A Pip-world story with weather words and dialogue.' },
    ],
};

/** Reads `## topic (n)` blocks of comma lists. */
function readWordList(file: string): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    let topic = '';
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^## (\S+)/);
        if (m) topic = m[1];
        else if (topic && line.trim() && !line.startsWith('#')) {
            out[topic] = line.split(',').map((w) => w.trim()).filter((w) => w && !w.includes(' ') && /^[a-z']+$/.test(w));
        }
    }
    return out;
}

/** Words that a package of levels 1-4 already glossed (text.glossed, and glossedNodes through the graph). */
function readGlossed(): Set<string> {
    const out = new Set<string>();
    const graphFile = process.env.MASTERY_VOCAB_GRAPH ?? path.join(REPO_ROOT, '..', 'mastery-advantage', 'english', 'cefr-vocabulary', 'cefr-vocabulary-knowledge-space.json');
    const forms = new Map<string, string>();
    if (fs.existsSync(graphFile)) {
        const graph = JSON.parse(fs.readFileSync(graphFile, 'utf8')) as { nodes: { id: string; metadata?: { normalizedForm?: string } }[] };
        for (const node of graph.nodes) if (node.metadata?.normalizedForm) forms.set(node.id, node.metadata.normalizedForm);
    }
    for (const book of fs.readdirSync(CONTENT_ROOT)) {
        const dir = path.join(CONTENT_ROOT, book);
        if (!fs.statSync(dir).isDirectory() || book.startsWith('_')) continue;
        for (const file of loadPackageFolder(dir)) {
            // Only levels 1-4 count: the plan must not change when a level 5-9 package is written.
            if (!file.pkg || file.pkg.meta.raLevel > 4) continue;
            for (const g of file.pkg.text.glossed) out.add(g.toLowerCase());
            for (const id of file.pkg.tags.glossedNodes) {
                const form = forms.get(id);
                if (form) out.add(form);
            }
        }
    }
    return out;
}

/** In-scope objectives of a level: its own GSE range (`levels` in the plan file; the books share their band's objectives). */
function readLevelObjectives(level: number): string[] {
    const file = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'content-plans', 'level-plans', 'levels-5-9-objectives.json'), 'utf8')) as { outOfScope: Record<string, string>; levels: Record<string, string[]> };
    return file.levels[String(level)].filter((id) => !(id in file.outOfScope));
}

/** American required words of the rows that have a British headword in the raw lists (the graph node uses the headword). */
function spellingMap(rows: BankRow[], raw: WordPools): Record<string, string> {
    const heads = new Set(Object.values(raw).flatMap((pool) => Object.values(pool).flat()));
    const out: Record<string, string> = {};
    for (const w of new Set(rows.flatMap((r) => r.requiredGlossed))) {
        const head = britishHeadword(w);
        if (head && heads.has(head)) out[w] = head;
    }
    return Object.fromEntries(Object.entries(out).sort());
}

/** One markdown line about the spelling map, or an empty line. */
function spellingNote(rows: BankRow[], raw: WordPools): string {
    const map = Object.entries(spellingMap(rows, raw));
    return map.length ? `Spelling: the required words use American spelling. The graph headword is British: ${map.map(([us, uk]) => `${us} (${uk})`).join(', ')}.\n` : '';
}

/** Writes the plan of a level 5-9 bank: no old ids, no deletes. */
function writeNewBank(level: number, a2keyFrom?: string): number {
    const data = path.join(REPO_ROOT, 'docs', 'content-plans', 'data');
    const glossed = readGlossed();
    const lists: [keyof WordPools, string][] = [['movers', 'yle-movers-words.md'], ['flyers', 'yle-flyers-words.md'], ['a2key', 'a2-key-words.md']];
    let pools = {} as WordPools;
    const listSizes: Record<string, number> = {};
    const lower = new Set<string>();
    for (const [name, file] of lists) {
        const all = readWordList(path.join(data, file));
        // A word belongs to its lowest list: a word of a lower list is not in a higher pool.
        pools[name] = Object.fromEntries(Object.entries(all).map(([topic, ws]) => [topic, ws.filter((w) => !glossed.has(w) && !lower.has(w))]));
        for (const ws of Object.values(all)) for (const w of ws) lower.add(w);
        listSizes[name] = new Set(Object.values(pools[name]).flat()).size;
    }
    const raw = pools;
    pools = normalizePools(raw);
    const used: UsedCounts = new Map();
    let rows: BankRow[] = [];
    let uncovered: string[] = [];
    const allowed = a2keyFrom ? new Set(fs.readFileSync(a2keyFrom, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean)) : undefined;
    for (let l = 5; l <= level; l++) ({ rows, uncovered } = buildBankRows(l, allowed && l === level ? restrictPool(raw, 'a2key', allowed) : raw, used));
    const outDir = path.join(REPO_ROOT, 'docs', 'content-plans', 'level-plans');
    fs.mkdirSync(outDir, { recursive: true });
    const books = LEVEL_BOOKS[level];
    const total = WORKBOOK_LESSONS[level] + rows.length;
    const plan = {
        level,
        profile: `bank-${level}`,
        generatedBy: 'dashboard/scripts/plan-level-bank.ts',
        books,
        inventory: 'none: every article is new',
        deletes: [] as string[],
        totalAfter: total,
        // Required words are in American spelling. The graph node keeps the British headword: use this map to find it.
        spellingMap: spellingMap(rows, raw),
        articles: rows.map((r) => ({ ...r, replaces: null, oldTitle: null })),
    };
    fs.writeFileSync(path.join(outDir, `bank-${level}.json`), `${JSON.stringify(plan, null, 1)}\n`);
    const md = [
        `# Level ${level} bank: article plan`,
        '',
        `Generated by \`dashboard/scripts/plan-level-bank.ts ${level}\` (track levels_5_9_20261006). Profile \`bank-${level}\`. ${rows.length} articles, all new (no production inventory for this level). Level ${level} after the change: ${total} articles (${WORKBOOK_LESSONS[level]} workbook lessons of ${books.join(', ')}, ${rows.length} bank).`,
        '',
        'Targets: 1 to 3 for each article. Supporting objectives can come from an earlier level. Required glossed words: 6 for each article, from the list of the level, matched to the topics of the article (each list word once before any word twice). Word lists: `data/yle-movers-words.md`, `data/yle-flyers-words.md`, `data/a2-key-words.md`.',
        '',
        spellingNote(rows, raw),
        '| Lesson | Replaces | Old title | Type | App type | Targets | Supporting | Topics | Required glossed words | Notes |',
        '|---|---|---|---|---|---|---|---|---|---|',
        ...rows.map((r) => `| ${r.lesson} | new | — | ${r.type} | ${r.app} | ${r.objectives.join(', ')} | ${r.supporting.join(', ')} | ${r.topics.join(', ')} | ${r.requiredGlossed.join(', ')} | ${r.note} |`),
        '',
    ].join('\n');
    fs.writeFileSync(path.join(outDir, `bank-${level}.md`), md);
    // The check: counts per level, target count of each in-scope objective, required list words.
    const counts = targetCounts(rows);
    const objectives = readLevelObjectives(level);
    const low = objectives.filter((id) => (counts.get(id) ?? 0) < 2);
    const outside = [...counts.keys()].filter((id) => !objectives.includes(id) && !isLowerLevel(id, level));
    const required = new Set(rows.flatMap((r) => r.requiredGlossed));
    // Per list: words that this level requires, and words that levels 5 up to this level required, of all unglossed list words.
    const perList = lists.map(([name]) => {
        const all = new Set(Object.values(pools[name]).flat());
        const here = [...all].filter((w) => required.has(w)).length;
        const so = [...all].filter((w) => (used.get(w) ?? 0) > 0).length;
        return `${name} ${here} here, ${so}/${all.size} by this level`;
    });
    const sizes = rows.map((r) => r.requiredGlossed.length);
    const sets = new Set(rows.map((r) => [...r.requiredGlossed].sort().join(',')));
    console.log(`bank-${level}: ${rows.length} articles (expected ${BANK_COUNTS[level]}); targets ${Math.min(...rows.map((r) => r.objectives.length))}-${Math.max(...rows.map((r) => r.objectives.length))} each; ${objectives.length} in-scope objectives, ${objectives.length - low.length} at 2+ targets (min ${Math.min(...objectives.map((id) => counts.get(id) ?? 0))})${low.length ? `; LOW: ${low.join(', ')}` : ''}${outside.length ? `; targets outside the level range: ${outside.join(', ')}` : ''}`);
    console.log(`  required glossed words: ${required.size} different (6 per article: ${sizes.every((x) => x === 6)}; ${sets.size} different sets of ${rows.length}); unglossed list words required: ${perList.join('; ')}${uncovered.length ? `; no slot for: ${uncovered.join(', ')}` : ''}`);
    return low.length || sets.size !== rows.length || !sizes.every((x) => x === 6) ? 1 : 0;
}

/** True when the objective id belongs to a GSE value below the level range (an earlier level). */
function isLowerLevel(id: string, level: number): boolean {
    const gse = Number(id.slice(1).split('.')[0]);
    const first = { 5: 24, 6: 27, 7: 30, 8: 34, 9: 39 }[level] ?? 0;
    return gse < first;
}

function main(argv: string[]): number {
    const level = Number(argv[0]);
    const from = argv.indexOf('--a2key-from');
    if (BANK_COUNTS[level]) return writeNewBank(level, from >= 0 ? argv[from + 1] : undefined);
    if (!T[level]) {
        console.error(USAGE);
        return 2;
    }
    const data = path.join(REPO_ROOT, 'docs', 'content-plans', 'data');
    const legacy = JSON.parse(fs.readFileSync(path.join(data, 'legacy-levels-1-4-2026-10-02.json'), 'utf8')) as { articles: { id: string; raLevel: number; printed: boolean; createdAt: string; title: string }[] };
    // Only the best article of each group of similar old articles stays (scripts/plan-dedup.ts).
    const dedup = JSON.parse(fs.readFileSync(path.join(data, 'duplicates-levels-1-4.json'), 'utf8')) as { groups: { level: number; keep: string; articles: { id: string }[] }[] };
    const groups = dedup.groups.filter((g) => g.level === level);
    const kept = new Set(groups.map((g) => g.keep));
    const deletes = groups.flatMap((g) => g.articles.filter((a) => a.id !== g.keep).map((a) => a.id));
    const old = legacy.articles.filter((a) => a.raLevel === level && !a.printed && kept.has(a.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const take = WORKBOOK_TAKES[level];
    const workbookIds = take ? (take.from === 'first' ? old.slice(0, take.count) : old.slice(-take.count)) : [];
    const bankIds = old.filter((a) => !workbookIds.includes(a));
    const pools = readWordList(path.join(data, level === 4 ? 'yle-movers-words.md' : 'yle-starters-words.md'));
    const used = new Map<string, number>();
    const pick = (words: string[], n: number, exclude: Set<string>) => {
        const sorted = [...new Set(words)].filter((w) => !exclude.has(w)).sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0) || a.localeCompare(b));
        const out = sorted.slice(0, n);
        for (const w of out) {
            used.set(w, (used.get(w) ?? 0) + 1);
            exclude.add(w);
        }
        return out;
    };
    const allWords = Object.entries(pools).filter(([t]) => CONTENT.includes(t)).flatMap(([, ws]) => ws);
    const required = level === 4 ? 6 : 5;
    const rows: Record<string, unknown>[] = [];
    let n = 0;
    let letter = 0;
    for (const t of T[level]) {
        for (let i = 0; i < t.count; i++) {
            n++;
            const lesson = `b${String(n).padStart(3, '0')}`;
            const primary = t.topics[i % t.topics.length];
            const secondary = t.topics[(i + 1) % t.topics.length] === primary ? CONTENT[(n * 7) % CONTENT.length] : t.topics[(i + 1) % t.topics.length];
            const exclude = new Set<string>();
            let words: string[];
            let letters: string[] | undefined;
            if (t.letters) {
                letters = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ'[letter * 2], 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[letter * 2 + 1]];
                letter = (letter + 1) % 13;
                const starts = (l: string) => allWords.filter((w) => w.startsWith(l.toLowerCase()));
                words = [...pick(starts(letters[0]), 3, exclude), ...pick(starts(letters[1]), 3, exclude)];
            } else {
                words = [...pick(pools[primary] ?? [], required - 2, exclude), ...pick(pools[secondary] ?? [], 2, exclude)];
            }
            const old = bankIds[n - 1];
            rows.push({
                lesson,
                ...(old ? { replaces: old.id, oldTitle: old.title } : {}),
                type: t.type,
                app: t.app,
                objectives: t.objectives,
                supporting: t.supporting ?? [],
                topics: [primary, secondary],
                requiredGlossed: words,
                ...(letters ? { letters } : {}),
                ...(t.numbers ? { numbers: t.numbers } : {}),
                note: t.note,
            });
        }
    }
    if (bankIds.length > n) throw new Error(`level ${level}: ${bankIds.length} old ids but only ${n} slots`);
    const printedCount = legacy.articles.filter((a) => a.raLevel === level && a.printed).length;
    const total = printedCount + workbookIds.length + n + (level === 4 ? 14 : 0);
    const outDir = path.join(REPO_ROOT, 'docs', 'content-plans', 'level-plans');
    fs.mkdirSync(outDir, { recursive: true });
    const plan = {
        level,
        profile: `bank-${level}`,
        generatedBy: 'dashboard/scripts/plan-level-bank.ts',
        workbookTakes: take ? { book: take.book, ids: workbookIds.map((a) => a.id) } : undefined,
        deletes,
        totalAfter: total,
        articles: rows,
    };
    fs.writeFileSync(path.join(outDir, `bank-${level}.json`), `${JSON.stringify(plan, null, 1)}\n`);
    const md = [
        `# Level ${level} bank: article plan`,
        '',
        `Generated by \`dashboard/scripts/plan-level-bank.ts ${level}\` (track level_banks_20261002). Profile \`bank-${level}\`. ${rows.length} articles; ${rows.filter((r) => r.replaces).length} replace an old article, ${rows.filter((r) => !r.replaces).length} are new. Level ${level} after the change: ${total} articles (${printedCount} printed, ${workbookIds.length + (level === 4 ? 14 : 0)} new workbook lessons, ${rows.length} bank). ${deletes.length} similar old articles are deleted (\`duplicates.md\`).`,
        '',
        'The "Old title" column is only a hint: you can keep the old topic when it fits the text type, or write a new one.',
        take ? `\nOld ids that ${take.book} takes (one per lesson, in order): ${workbookIds.map((a) => a.id).join(', ')}.` : '',
        '',
        '| Lesson | Replaces | Old title | Type | App type | Targets | Supporting | Topics | Required glossed words | Notes |',
        '|---|---|---|---|---|---|---|---|---|---|',
        ...rows.map((r) => `| ${r.lesson} | ${r.replaces ?? 'new'} | ${r.oldTitle ?? '—'} | ${r.type} | ${r.app} | ${(r.objectives as string[]).join(', ')} | ${(r.supporting as string[]).join(', ')} | ${(r.topics as string[]).join(', ')} | ${(r.requiredGlossed as string[]).join(', ')} | ${r.letters ? `letters ${(r.letters as string[]).join(' and ')}. ` : ''}${r.numbers ? 'numbers as given. ' : ''}${r.note} |`),
        '',
    ].join('\n');
    fs.writeFileSync(path.join(outDir, `bank-${level}.md`), md);
    const covered = allWords.filter((w) => used.has(w)).length;
    console.log(`bank-${level}: ${rows.length} articles (${rows.filter((r) => r.replaces).length} replace old ids); required words cover ${covered} of ${new Set(allWords).size} topic words`);
    return 0;
}

process.exitCode = main(process.argv.slice(2));
