// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 8 of the print track, the card kit (spec FR-7, plan line 934).
 * The test reads the 8 shipped week files of Level 2 and pins the card list of unit 1.
 * Every expected list below is written by hand from the `materials` of the week files.
 * The module `lib/storytime/print/card-kit.ts` does not exist yet, so each test fails inside its body.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const cardKitModule = path.join(dashboardRoot, 'lib/storytime/print/card-kit.ts');

type CardKind = 'sound' | 'symbol' | 'picture' | 'sound-picture' | 'family-picture'
    | 'tricky-word' | 'word' | 'frame' | 'letter';
type CardSize = 'A5' | 'A6';
type KitItemKind = 'workmat' | 'sorting-mat' | 'word-wall' | 'sticker';

interface Card {
    kind: CardKind;
    label: string;
    size: CardSize;
}

interface KitItem {
    kind: KitItemKind;
    label: string;
    week: number;
}

interface Kit {
    cards: Card[];
    items: KitItem[];
    letterStrip: string[];
}

interface PagePlan {
    size: CardSize;
    perSheet: number;
    cards: number;
    sheets: number;
    sheet: { widthMm: number; heightMm: number };
}

interface CardKitModule {
    storytimeCardKit(weeks: StorytimeWeek[]): Kit;
    storytimeCardSize(kind: CardKind): CardSize;
    storytimeCardPagePlan(cards: Card[], size: CardSize): PagePlan;
    STORYTIME_CARD_KIT_SPEC: {
        gsm: number;
        stickerDiameterMm: number;
        sheetMm: { widthMm: number; heightMm: number };
    };
}

/** The sound cards of unit 1, in the unit teaching order (plan line 935). */
const SOUND_CARDS = ['n', 'a', 'p', 'm', 's', 't', 'o'];

/** The letter cards of the class set, in the unit teaching order. */
const LETTER_CARDS = ['n', 'a', 'p', 'm', 's', 't', 'o'];

/** The frame cards: the sentence frame of each teaching week. */
const FRAME_CARDS = [
    'Hello, I am ___.',
    'How many? One, two...',
    'It is ___.',
    'This is my ___.',
    'I have two ___.',
    'I can see a ___.',
    'Is it a ___? Yes/No.',
];

/** The picture cards, in the order the weeks name them. */
const PICTURE_CARDS = [
    'nose', 'cat', 'sun', 'dog', 'bus', 'hat', 'fan', 'fish', 'cup', 'map', 'sheep',
    'cap', 'arm', 'jam', 'ham', 'pen', 'dress', 'horse', 'sad', 'bag', 'boat', 'ten',
    'pot', 'mop', 'sock',
];

/** The sound picture cards, in the order the weeks name them. */
const SOUND_PICTURE_CARDS = [
    'nest', 'net', 'nut', 'apple', 'ant', 'axe', 'astronaut', 'pen', 'pencil', 'pear',
    'pineapple', 'monkey', 'mouse', 'mango', 'milk', 'sun', 'sock', 'sofa', 'sandwich',
    'bus', 'dress', 'tiger', 'ten', 'table', 'tomato', 'octopus', 'ox', 'ostrich', 'otter',
];

/** The family picture cards, in the order the weeks name them. */
const FAMILY_PICTURE_CARDS = [
    'hello', 'goodbye', 'boy', 'girl', 'friend', 'teacher', 'one', 'two', 'three',
    'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'red', 'blue', 'yellow',
    'green', 'orange', 'pink', 'purple', 'brown', 'mom', 'dad', 'brother', 'sister',
    'grandma', 'grandpa', 'family', 'eyes', 'ears', 'nose', 'hands', 'arms', 'legs',
    'feet', 'cat', 'dog', 'bird', 'fish', 'frog', 'duck', 'horse', 'ball', 'doll',
    'car', 'kite', 'drum', 'train', 'teddy',
];

/** The tricky-word cards, in the order the weeks name them. */
const TRICKY_WORD_CARDS = [
    'a', 'and', 'can', 'I', 'in', 'on', 'the', 'get', 'is', 'this', 'saw', 'off',
    'with', 'he', 'put', 'see', 'from', 'run', 'up',
];

/** The word cards, in the order the weeks name them. */
const WORD_CARDS = [
    'an', 'Nan', 'pan', 'nap', 'am', 'man', 'map', 'Pam', 'Sam', 'sat', 'mat',
    'tap', 'Pat', 'on', 'top', 'pot', 'Tom', 'Mom',
];

/** The sorting mats, one for each teaching week. */
const SORTING_MATS = [
    'nnn / no nnn', '/a/ / not /a/', '/p/ / not /p/', 'mmm / not mmm',
    'sss / no sss', '/t/ / no /t/', '/o/ / no /o/',
];

/** The stickers: the 7 decodable covers of the unit and unit 1. */
const STICKERS = [
    'Nan Can Nod', 'Can I?', 'The Pan', 'Pam', 'Sam and Pam', 'Tap, Tap!',
    'The Top', 'unit 1',
];

/** The 26 letters of the Benchmark 1 letter strip, in the order of w08.json. */
const LETTER_STRIP = [
    'm', 's', 'a', 't', 'd', 'n', 'o', 'b', 'p', 'g', 'c', 'e', 'i', 'r', 'h',
    'f', 'l', 'u', 'k', 'w', 'y', 'j', 'v', 'x', 'q', 'z',
];

/** The number of A5 cards of unit 1: the sound, letter, and frame cards. */
const A5_CARD_COUNT = 21;

/** The number of A6 cards of unit 1: the picture, tricky-word, and word cards. */
const A6_CARD_COUNT = 143;

/** The module of the card kit. It does not exist before the Green task. */
async function cardKit(): Promise<CardKitModule> {
    return await import(cardKitModule) as CardKitModule;
}

/** The parsed weeks of one folder. */
function weeksFrom(root: string): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(root, 2, index + 1), 'utf8')),
    ));
}

/** The parsed weeks of the shipped Level 2 folder. */
function weeks(): StorytimeWeek[] {
    return weeksFrom(STORYTIME_ROOT);
}

describe('Storytime card kit, unit 1 (spec FR-7)', () => {
    it('R-P8-1 the sound cards, the letter cards, and the frame cards of unit 1', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const labels = (kind: CardKind): string[] =>
            kit.cards.filter((card) => card.kind === kind).map((card) => card.label);
        expect(labels('sound'), 'the sound cards').toEqual(SOUND_CARDS);
        expect(labels('letter'), 'the letter cards of the class set').toEqual(LETTER_CARDS);
        expect(labels('frame'), 'the frame cards').toEqual(FRAME_CARDS);
    });

    it('R-P8-2 the picture cards, the sound picture cards, and the family picture cards of unit 1', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const labels = (kind: CardKind): string[] =>
            kit.cards.filter((card) => card.kind === kind).map((card) => card.label);
        expect(labels('picture'), 'the picture cards').toEqual(PICTURE_CARDS);
        expect(labels('sound-picture'), 'the sound picture cards').toEqual(SOUND_PICTURE_CARDS);
        expect(labels('family-picture'), 'the family picture cards').toEqual(FAMILY_PICTURE_CARDS);
    });

    it('R-P8-3 the tricky-word cards and the word cards of unit 1', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const labels = (kind: CardKind): string[] =>
            kit.cards.filter((card) => card.kind === kind).map((card) => card.label);
        expect(labels('tricky-word'), 'the tricky-word cards').toEqual(TRICKY_WORD_CARDS);
        expect(labels('word'), 'the word cards').toEqual(WORD_CARDS);
    });

    it('R-P8-4 no step of the 8 weeks names a symbol card', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const symbols = kit.cards.filter((card) => card.kind === 'symbol');
        expect(symbols.map((card) => card.label)).toEqual([]);
    });

    it('R-P8-5 the letter strip holds the 26 letters of w08.json in order', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        expect(kit.letterStrip).toEqual(LETTER_STRIP);
        expect(kit.letterStrip).toHaveLength(26);
    });

    it('R-P8-6 the sound and symbol cards are A5; the picture and tricky-word cards are A6', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        expect(mod.storytimeCardSize('sound'), 'the sound card').toBe('A5');
        expect(mod.storytimeCardSize('symbol'), 'the symbol card').toBe('A5');
        expect(mod.storytimeCardSize('picture'), 'the picture card').toBe('A6');
        expect(mod.storytimeCardSize('tricky-word'), 'the tricky-word card').toBe('A6');
        expect(mod.storytimeCardSize('letter'), 'the letter card').toBe('A5');
        expect(mod.storytimeCardSize('frame'), 'the frame card').toBe('A5');
        expect(mod.storytimeCardSize('sound-picture'), 'the sound picture card').toBe('A6');
        expect(mod.storytimeCardSize('family-picture'), 'the family picture card').toBe('A6');
        expect(mod.storytimeCardSize('word'), 'the word card').toBe('A6');
        for (const card of kit.cards) {
            expect(card.size, `the size of the ${card.kind} card "${card.label}"`)
                .toBe(mod.storytimeCardSize(card.kind));
        }
    });

    it('R-P8-7 the kit has two card sizes; the A5 cards are 2 on a sheet and the A6 cards are 4', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const sizes = [...new Set(kit.cards.map((card) => card.size))].sort();
        expect(sizes, 'the card sizes of the kit').toEqual(['A5', 'A6']);
        const a5 = mod.storytimeCardPagePlan(kit.cards, 'A5');
        expect(a5.perSheet, 'the A5 cards on one sheet').toBe(2);
        expect(a5.cards, 'the number of A5 cards').toBe(A5_CARD_COUNT);
        expect(a5.sheets, 'the number of A5 sheets').toBe(11);
        expect(a5.sheet, 'the A5 sheet').toEqual({ widthMm: 297, heightMm: 210 });
        const a6 = mod.storytimeCardPagePlan(kit.cards, 'A6');
        expect(a6.perSheet, 'the A6 cards on one sheet').toBe(4);
        expect(a6.cards, 'the number of A6 cards').toBe(A6_CARD_COUNT);
        expect(a6.sheets, 'the number of A6 sheets').toBe(36);
        expect(a6.sheet, 'the A6 sheet').toEqual({ widthMm: 210, heightMm: 297 });
    });

    it('R-P8-8 the cards are 300 gsm; the stickers are round 40 mm on an A4 sheet', async () => {
        const mod = await cardKit();
        expect(mod.STORYTIME_CARD_KIT_SPEC.gsm, 'the paper of the cards').toBe(300);
        expect(mod.STORYTIME_CARD_KIT_SPEC.stickerDiameterMm, 'the sticker diameter').toBe(40);
        expect(mod.STORYTIME_CARD_KIT_SPEC.sheetMm, 'the sticker sheet').toEqual({ widthMm: 210, heightMm: 297 });
    });

    it('R-P8-9 the workmats, the sorting mats, and the word wall cards of unit 1', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const items = (kind: KitItemKind): KitItem[] => kit.items.filter((item) => item.kind === kind);
        expect(items('workmat'), 'the workmats of the class set').toHaveLength(7);
        expect(items('workmat').map((item) => item.week), 'the weeks of the workmats')
            .toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(items('word-wall'), 'the word wall cards').toHaveLength(7);
        expect(items('word-wall').map((item) => item.week), 'the weeks of the word wall cards')
            .toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(items('sorting-mat').map((item) => item.label), 'the sorting mats').toEqual(SORTING_MATS);
        expect(items('sorting-mat').map((item) => item.week), 'the weeks of the sorting mats')
            .toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('R-P8-10 the sticker sheet holds 8 stickers: the 7 decodable covers and unit 1', async () => {
        const mod = await cardKit();
        const kit = mod.storytimeCardKit(weeks());
        const stickers = kit.items.filter((item) => item.kind === 'sticker');
        expect(stickers.map((item) => item.label)).toEqual(STICKERS);
        expect(stickers).toHaveLength(8);
    });

    it('R-P8-11 mutant: one removed materials item changes the card list and fails the check', async () => {
        const mod = await cardKit();
        const root = fs.mkdtempSync('/tmp/opencode/storytime-p8-');
        try {
            const folder = path.join(root, 'l2');
            fs.mkdirSync(folder, { recursive: true });
            for (let week = 1; week <= 8; week++) {
                fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), path.join(folder, `w0${week}.json`));
            }
            const copy = path.join(folder, 'w01.json');
            const raw = JSON.parse(fs.readFileSync(copy, 'utf8')) as {
                scripts: { steps: { id: string; materials: string[] }[] }[];
            };
            for (const script of raw.scripts) {
                for (const step of script.steps) {
                    if (step.id !== 'A1') continue;
                    step.materials = step.materials.map((line) =>
                        line === 'sound picture cards: nest, net, nut' ? 'sound picture cards: net, nut' : line);
                }
            }
            fs.writeFileSync(copy, JSON.stringify(raw, null, 2));
            const mutated = mod.storytimeCardKit(weeksFrom(root));
            const labels = mutated.cards
                .filter((card) => card.kind === 'sound-picture').map((card) => card.label);
            expect(labels, 'the sound picture cards of the copy').not.toContain('nest');
            expect(labels, 'the sound picture cards of the copy')
                .toEqual(SOUND_PICTURE_CARDS.filter((label) => label !== 'nest'));
            expect(labels, 'the hand-written list must not match the copy').not.toEqual(SOUND_PICTURE_CARDS);
            expect(labels.length, 'the copy has one sound picture card less').toBe(SOUND_PICTURE_CARDS.length - 1);
            const source = fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8');
            expect(source, 'the shipped week file stays unchanged').toContain('sound picture cards: nest, net, nut');
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
