import type { StorytimeWeekInput } from '../../lib/storytime/schema';

/** A step with one line under each heading. `moved` steps go to the next day's opening (30-minute rule). */
function step(id: string, title: string, minutes: number, moved = false) {
    return {
        id,
        title: { en: title, th: '' },
        minutes,
        en: {
            teacherActions: [`Run ${id}.`],
            teacherLanguage: [`"${title}. Your turn."`],
            studentActions: [`The class does ${id}.`],
            watchFor: [`Children who do not join ${id}.`],
        },
        easier: { en: `Easier ${id}.`, th: '' },
        harder: { en: `Harder ${id}.`, th: '' },
        group: { en: `Pairs ${id}.`, th: '' },
        ...(moved ? { moved: 'next-opening' as const } : {}),
    };
}

const page = (text: string) => ({ text, image: { prompt: `A picture for "${text}"`, characters: [], caption: '' } });

/**
 * Level 2 (Anuban 3) week 1 in the 30-minute shape: opening 6, then 24 minutes of steps a day.
 * The text is test data, not the week 1 content.
 */
export function fixtureWeek(): StorytimeWeekInput {
    const names = ['Nat', 'Nan', 'Nick', 'Nina', 'Ned', 'Noor', 'Neil', 'Nell'];
    const chorus = { text: 'Hello, I am Nat!', part: 'chorus' as const, gesture: 'wave' };
    return {
        version: 1,
        meta: {
            program: 'storytime',
            shape: 'storytime-week',
            level: 2,
            week: 1,
            unit: 1,
            key: 'st2/1',
            periodMinutes: 30,
            openingMinutes: 6,
            title: 'Hello, I am Nat',
        },
        focus: {
            element: { id: 'english.phonics.gpc.n', graphemes: ['n'], sound: '/n/', action: { en: 'Hands on head, hum n-n-n.' } },
            paSkill: { en: 'initial-sound' },
            trickyWords: ['a', 'and', 'can'],
            frame: 'Hello, I am ___.',
            family: { name: { en: 'Names and greetings' }, words: ['hello', 'goodbye', 'boy', 'girl', 'friend', 'teacher'].map((word) => ({ word })) },
            wordWall: ['Nan'],
        },
        books: [
            { kind: 'readalong', title: 'Hello!', pages: names.map((n) => page(`Hello, I am ${n}.`)) },
            { kind: 'decodable', title: 'Nan', pages: ['Nan.', 'Nan, Nan.', 'Nan!', 'Nan.', 'Nan and Nan.', 'Nan can.', 'Nan.', 'Nan!'].map(page) },
        ],
        song: {
            title: 'Hello, I Am ___',
            lines: [
                { text: 'Hello, hello, hello to you!', part: 'verse', gesture: 'wave', image: { prompt: 'Sprouts wave hello', characters: [], caption: '' } },
                { ...chorus, image: { prompt: 'Nat waves', characters: [], caption: '' } },
                { text: 'Hello, I am Nan!', part: 'chorus', gesture: 'point to self', image: { prompt: 'Nan points to herself', characters: [], caption: '' } },
                ...[0, 1, 2].flatMap(() => [{ ...chorus, imageOf: 1 }, { text: 'Hello, I am Nan!', part: 'chorus' as const, gesture: 'point to self', imageOf: 2 }]),
            ],
        },
        scripts: [
            { id: 'A', day: 1, title: { en: 'Sound Lesson', th: '' }, steps: [step('A1', 'Hear it', 5), step('A2', 'See it', 5), step('A3', 'Form it', 5), step('A4', 'Blend it', 5), step('A5', 'Word wall', 4), step('A7', 'Read it', 1, true), step('A8', 'Home card', 1, true)] },
            { id: 'B', day: 2, title: { en: 'Story Lesson', th: '' }, steps: [step('B1', 'Family words', 5), step('B2', 'Picture walk', 5), step('B3', 'Listen', 4), step('B4', 'Read with me', 5), step('B5', 'Frame practice', 5), step('B6', 'Act it', 1, true), step('B7', 'Sing it', 1, true)] },
            { id: 'C', day: 3, title: { en: 'Spell and Read', th: '' }, steps: [step('C1', 'Sound review', 3), step('C2', 'Letter cards', 6), step('C3', 'Dictation', 4), step('C4', 'Decodable: read together', 5), step('C5', 'Comprehension', 3), step('C7', 'Sticker', 3), step('C6', 'Favourite sentence', 1, true)] },
            { id: 'D', day: 4, title: { en: 'Read and Write', th: '' }, steps: [step('D1', 'Re-read', 6), step('D2', 'Tricky words', 4), step('D3', 'Leveled reader', 6), step('D4', 'Write it', 8), step('D5', 'Share', 1, true), step('D6', 'Sing it', 1, true)] },
            { id: 'E', day: 5, title: { en: 'Play and Check', th: '' }, steps: [step('E1', 'Centers set-up', 2), step('E2', 'Centers, rotation 1', 8), step('E3', 'Centers, rotation 2', 8), step('E4', 'Game', 6), step('E5', 'Check', 1, true), step('E6', 'Song show', 1, true)] },
        ],
        review: [1, 2, 3, 4, 5].map((day) => ({ day, cards: day === 1 ? [] : [{ kind: 'sound' as const, text: 'n', week: 1 }] })),
        check: {
            items: [
                { kind: 'circle-picture', sound: '/n/', pictures: ['nest', 'cat', 'sun'], answer: 'nest' },
                { kind: 'write-word', word: 'Nan' },
            ],
        },
        home: {
            words: ['hello', 'Nan', 'can'],
            line: { en: 'This week we learn the sound n.', th: '' },
            activity: { en: 'Say hello and your name in English.', th: '' },
        },
        tags: { graphVersion: '', taught: ['n'], reviewed: [] },
    };
}

/** A step of a review week: one line under each heading. */
const reviewStep = (id: string, title: string, minutes: number) => step(id, title, minutes);

/**
 * The block of a review week: Level 2 weeks 1 (n, the fixture) and 2 (a, its own song and decodable).
 * @returns The two teaching weeks, as input.
 */
export function fixtureBlockWeeks(): StorytimeWeekInput[] {
    const w1 = fixtureWeek();
    const w2 = fixtureWeek();
    w2.meta = { ...w2.meta, week: 2, key: 'st2/2', title: 'How Many?' };
    w2.focus.element = { id: 'english.phonics.gpc.a.short-a', graphemes: ['a'], sound: '/a/', action: { en: 'Bite an apple: /a/.' } };
    w2.song!.title = 'How Many? One, Two!';
    w2.books![1] = { kind: 'decodable', title: 'Can I?', pages: ['Nan can nap.', 'Can I nap?'].map(page) };
    return [w1, w2];
}

/** A review page: one circle-word row and one picture sort over the two sounds of the block. */
const PAGE = [
    { kind: 'circle-word' as const, words: ['an', 'Nan', 'nap'], answer: 'Nan' },
    { kind: 'picture-sort' as const, groups: [{ sound: '/n/', pictures: ['nest', 'nose'] }, { sound: '/a/', pictures: ['apple', 'ant'] }] },
];

/**
 * Level 2 week 3 as the review week of weeks 1 and 2 (design §3.5 in small): five days of 6 + 24
 * minutes, the block day plan with the medley, and Benchmark 1 with both block decodables.
 */
export function fixtureReviewWeek(): StorytimeWeekInput {
    const days = ['A', 'B', 'C', 'D', 'E'].map((id, i) => ({
        id: id as 'A' | 'B' | 'C' | 'D' | 'E',
        day: i + 1,
        title: { en: i === 0 ? 'Benchmark and Centers' : 'Review Centers', th: '' },
        steps: i === 0
            ? [reviewStep('A1', 'Benchmark: paper part', 10), reviewStep('A2', 'Centers', 10), reviewStep('A3', 'Close', 4)]
            : [reviewStep(`${id}1`, 'Centers, rotation 1', 10), reviewStep(`${id}2`, 'Centers, rotation 2', 10), reviewStep(`${id}3`, i === 4 ? 'Song show' : 'Close', 4)],
    }));
    return {
        version: 1,
        meta: { program: 'storytime', shape: 'storytime-week', level: 2, week: 3, unit: 1, key: 'st2/3', kind: 'review', periodMinutes: 30, openingMinutes: 6, title: 'Review: Unit 1' },
        focus: {
            paSkill: { en: 'The mixed sound game: first sounds and blends' },
            frame: 'Hello, I am ___. / How many? ___.',
            family: { name: { en: 'The block words' }, words: ['an', 'Nan', 'nap'].map((word) => ({ word })) },
            wordWall: ['an', 'Nan', 'nap'],
        },
        scripts: days,
        review: [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ kind: 'sound' as const, text: day % 2 ? 'n' : 'a', week: day % 2 ? 1 : 2 }] })),
        block: {
            weeks: [1, 2],
            days: [
                { day: 1, weeks: [1], medley: ['Hello, I Am ___', 'How Many? One, Two!'], paper: PAGE },
                { day: 2, weeks: [2], medley: ['How Many? One, Two!', 'Hello, I Am ___'], paper: PAGE },
                { day: 3, weeks: [1, 2], medley: ['Hello, I Am ___', 'How Many? One, Two!'], paper: PAGE },
                { day: 4, weeks: [2], note: { en: 'and the weakest week from the Friday checks' }, medley: ['How Many? One, Two!', 'Hello, I Am ___'], paper: PAGE },
                { day: 5, weeks: [], note: { en: "the child's choice" }, medley: ['Hello, I Am ___', 'How Many? One, Two!'], paper: PAGE },
            ],
        },
        benchmark: {
            title: { en: 'Benchmark 1' },
            paper: {
                minutes: 10,
                items: [
                    { kind: 'circle-picture', sound: '/n/', pictures: ['nest', 'cat'], answer: 'nest' },
                    { kind: 'circle-picture', sound: '/n/', position: 'last', pictures: ['sun', 'cup'], answer: 'sun' },
                    { kind: 'write-letter', letter: 'n', sound: 'nnn' },
                    { kind: 'write-letter', letter: 'a', sound: '/a/' },
                ],
                pass: { en: '1 of 2 pictures and 1 of 2 letters' },
            },
            oneToOne: {
                minutes: 2,
                letters: 'qwertyuiopasdfghjklzxcvbnm'.split(''),
                letterPass: 20,
                sounds: ['a', 'n'],
                soundPass: 2,
                blend: [{ sounds: '/k/ - /a/ - /t/', word: 'cat' }],
                blendPass: 1,
                en: { teacherActions: ['Show the strip.'], teacherLanguage: ['"What is this letter?"'], studentActions: ['The child names the letters.'], watchFor: ['Children who say the sound, not the name.'] },
            },
            readingRecord: {
                minutes: 1,
                pass: 90,
                books: [
                    { title: 'Nan', week: 1, pages: ['Nan.', 'Nan, Nan.', 'Nan!', 'Nan.', 'Nan and Nan.', 'Nan can.', 'Nan.', 'Nan!'] },
                    { title: 'Can I?', week: 2, pages: ['Nan can nap.', 'Can I nap?'] },
                ],
            },
        },
        home: { line: { en: 'Unit 1 is done. Sing the songs and read the books with the QR code.' }, activity: { en: 'Sing one song together.' } },
    };
}
