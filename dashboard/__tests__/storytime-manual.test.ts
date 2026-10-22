// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { StorytimeWeekSchema, type StorytimeWeek, type StorytimeWeekInput } from '../lib/storytime/schema';
import { compileStorytimeManual, mergeMaterials, renderStorytimeWeek } from '../lib/storytime/manual';
import { getTranslations } from '../lib/teacher-manual/i18n';
import { fixtureReviewWeek, fixtureWeek } from './fixtures/storytime-week-fixture';

const CJK = /[぀-ヿ㐀-鿿豈-﫿]/;

function week(change?: (w: StorytimeWeekInput) => void): StorytimeWeek {
    const w = fixtureWeek();
    change?.(w);
    return StorytimeWeekSchema.parse(w);
}

/** The HTML of one day section: from its heading to the next day section. */
function daySection(html: string, day: number): string {
    const parts = html.split('<section class="st-day"');
    return parts[day] ?? '';
}

describe('Storytime manual template', () => {
    it('gives a week header and five day sections, each with its script, period, and steps', () => {
        const html = renderStorytimeWeek(week(), 'en');
        expect(html.split('<section class="st-day"').length - 1).toBe(5);
        expect(html).toContain('Week 1: Hello, I am Nat');
        expect(daySection(html, 1)).toContain('Day 1');
        expect(daySection(html, 1)).toContain('Script A: Sound Lesson');
        expect(daySection(html, 1)).toContain('30 min');
        expect(daySection(html, 1)).toMatch(/A1 · Hear it[\s\S]*5 min/);
        expect(daySection(html, 5)).toContain('Script E: Play and Check');
    });

    it('shows the four headings and the Easier, Harder, and Group lines for every step', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const h = getTranslations('en').teachingNotes;
        const steps = week().scripts.reduce((n, s) => n + s.steps.length, 0);
        for (const label of [h.teacherActions, h.teacherLanguage, h.studentActions, h.watchFor]) {
            expect(html.split(`>${label}<`).length - 1).toBe(steps);
        }
        expect(html.split('>Easier:<').length - 1).toBe(steps);
        expect(html).toContain('Harder A1.');
        expect(html).toContain('Pairs A1.');
    });

    it('puts the opening routine and the strip of the day at the start of each day', () => {
        const html = renderStorytimeWeek(week(), 'en');
        expect(daySection(html, 1)).toContain('Opening routine (6 min)');
        expect(daySection(html, 1)).toContain('No review cards today.');
        expect(daySection(html, 2)).toMatch(/Sounds[\s\S]*>n</);
    });

    it('moves the moved steps to the next day, and the day 5 ones to the next opening', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const day1 = daySection(html, 1);
        const day2 = daySection(html, 2);
        expect(day1).not.toContain('A7 · Read it');
        expect(day2).toMatch(/Recall from the last lesson[\s\S]*A7 · Read it[\s\S]*A8 · Home card[\s\S]*B1 · Family words/);
        expect(daySection(html, 5)).toMatch(/At the next opening[\s\S]*E5 · Check/);
    });

    it('shows the facts of the week in the header', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const header = html.split('<section class="st-day"')[0];
        for (const s of ['/n/', 'Hello, I am ___.', 'goodbye', 'a, and, can', 'Hello!', 'Nan', 'Hello, I Am ___']) expect(header).toContain(s);
    });

    it('prints the Thai action, listening skill, and family name in the Thai header, and the English without Thai', () => {
        const thai = week((w) => {
            w.focus.element!.action.th = 'ฮัมเสียง nnn';
            w.focus.paSkill.th = 'ฟังเสียงแรก';
            w.focus.family.name.th = 'ชื่อและการทักทาย';
        });
        const header = renderStorytimeWeek(thai, 'th').split('<section class="st-day"')[0];
        for (const s of ['ฮัมเสียง nnn', 'ฟังเสียงแรก', 'ชื่อและการทักทาย: hello']) expect(header).toContain(s);
        expect(renderStorytimeWeek(thai, 'en').split('<section class="st-day"')[0]).toContain('Names and greetings: hello');
        expect(renderStorytimeWeek(week(), 'th').split('<section class="st-day"')[0]).toContain('initial-sound');
    });

    it('prints the Thai notes, with the teacher English kept and the Thai gloss under it', () => {
        const html = renderStorytimeWeek(
            week((w) => {
                const s = w.scripts[0].steps[0];
                s.title.th = 'ฟังเสียง';
                s.th = { teacherActions: ['ครูพูดคำ'], teacherLanguage: ['ฟังเสียงนะ'], studentActions: ['เด็กชูนิ้วโป้ง'], watchFor: ['เด็กที่ไม่ร่วม'] };
                s.easier.th = 'ใช้สามคำ';
            }),
            'th',
        );
        const h = getTranslations('th').teachingNotes;
        expect(html).toContain(`>${h.teacherActions}<`);
        expect(html).toContain('A1 · ฟังเสียง');
        expect(html).toMatch(/&quot;Hear it\. Your turn\.&quot;[\s\S]{0,80}ฟังเสียงนะ/);
        expect(html).toContain('ครูพูดคำ');
        expect(html).toContain('ใช้สามคำ');
        // A step without Thai prints its English, so a draft book is complete.
        expect(html).toContain('Run A2.');
        expect(html).toContain('วันที่ 1');
    });

    it('compiles a level into one A4 document with the product name and no CJK or CEFR', () => {
        const { html, weekCount } = compileStorytimeManual([week()], { lang: 'th', paper: 'a4' });
        expect(weekCount).toBe(1);
        expect(html).toContain('<html lang="th">');
        expect(html).toContain('Storytime Advantage');
        expect(html).toContain('ระดับ 2 (อนุบาล 3)');
        expect(html).toContain('size: A4');
        // The Storytime CSS is in the head, where Paged.js reads the page breaks.
        expect(html.indexOf('.st-week, .st-day { break-before: page; }')).toBeLessThan(html.indexOf('</head>'));
        expect(html).not.toMatch(CJK);
        expect(html).not.toMatch(/CEFR/);
    });

    it('sorts the weeks and refuses weeks of two levels', () => {
        const w2 = week((w) => {
            w.meta.week = 2;
            w.meta.key = 'st2/2';
            w.meta.title = 'Second';
        });
        const { html } = compileStorytimeManual([w2, week()], { lang: 'en' });
        expect(html.indexOf('Week 1:')).toBeLessThan(html.indexOf('Week 2:'));
        expect(() => compileStorytimeManual([week(), week((w) => (w.meta.level = 3))], { lang: 'en' })).toThrow(/one level/);
    });

    it('lists the materials of the week once, with the words of one kind merged', () => {
        expect(mergeMaterials(['picture cards: nest, net, cat', 'board', 'picture cards: net, nut', 'board', 'sound card: n'])).toEqual([
            'picture cards: nest, net, cat, nut',
            'board',
            'sound card: n',
        ]);
        // A part that one item repeats keeps its count.
        expect(mergeMaterials(['letter cards (class set): p, a, n, n', 'letter cards (class set): p, a, n'])).toEqual(['letter cards (class set): p, a, n, n']);
        // A comma in a title or in parentheses does not split the item.
        expect(mergeMaterials(['videos: "Hello, I Am Pip" (song, karaoke)', 'videos: "Hello!"', 'videos: "Hello, I Am Pip" (song, karaoke)'])).toEqual([
            'videos: "Hello, I Am Pip" (song, karaoke), "Hello!"',
        ]);
    });

    it('keeps the heading of the moved steps in one block with the steps', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const day2 = daySection(html, 2);
        const group = day2.indexOf('<div class="st-moved-group"><h4>Recall from the last lesson');
        expect(group).toBeGreaterThan(-1);
        // A7 is inside the block; at the A8 title only the A8 step's own div is open, so the block is closed.
        const open = (text: string) => (text.match(/<div/g)?.length ?? 0) - (text.match(/<\/div>/g)?.length ?? 0);
        expect(day2.slice(group, day2.indexOf('A7 · Read it'))).toMatch(/st-moved-group/);
        expect(open(day2.slice(group, day2.indexOf('A8 · Home card')))).toBe(1);
        expect(daySection(html, 5)).toMatch(/<div class="st-moved-group"><h4>At the next opening/);
    });

    it('prints the prep box at the top of the day and the recall minutes in the opening', () => {
        const html = renderStorytimeWeek(
            week((w) => {
                w.scripts[3].prep = [{ en: "Write each child's name on a name card." }];
                w.scripts[0].steps.find((s) => s.id === 'A8')!.minutes = 0;
            }),
            'en',
        );
        expect(daySection(html, 4)).toMatch(/^[^>]*>\s*<h3[\s\S]*?<div class="st-prep"><h4>Before this lesson<\/h4><ul><li>Write each child&#039;s name/);
        expect(daySection(html, 1)).not.toContain('st-prep');
        // Day 2 recalls A7 (1 min) and A8 (0 min); day 3 recalls B6 and B7 (1 min each).
        expect(daySection(html, 2)).toContain('Opening routine (6 min, incl. 1 min recall)');
        expect(daySection(html, 3)).toContain('Opening routine (6 min, incl. 2 min recall)');
        expect(daySection(html, 1)).toContain('Opening routine (6 min)<');
    });

    it('prints the sound game of the day as opening item 2, and the calendar without it', () => {
        const pa = [1, 2, 3, 4, 5].map((d) => ({ en: `"Listen: day ${d}."`, th: `"ฟัง: วันที่ ${d}"` }));
        const html = renderStorytimeWeek(week((w) => (w.opening = { pa })), 'en');
        expect(daySection(html, 3)).toContain('<li>Sound game (1 min): &quot;Listen: day 3.&quot;</li>');
        expect(daySection(html, 3)).not.toContain('Calendar');
        expect(renderStorytimeWeek(week((w) => (w.opening = { pa })), 'th')).toContain('เกมเสียง (1 นาที): &quot;ฟัง: วันที่ 1&quot;');
        expect(daySection(renderStorytimeWeek(week(), 'en'), 3)).toContain('Calendar');
    });

    it('prints the choreography sheet after day 5: parts, lines, actions, notes, start and end', () => {
        const html = renderStorytimeWeek(
            week((w) => {
                w.song!.lines[0].note = { en: 'Sing it as written.' };
                w.song!.choreography = { outro: { en: 'Nod and hum nnn.' } };
            }),
            'en',
        );
        const song = html.slice(html.indexOf('<section class="st-song"'));
        expect(html.indexOf('<section class="st-song"')).toBeGreaterThan(html.lastIndexOf('<section class="st-day"'));
        expect(song).toContain('Song actions: Hello, I Am ___');
        expect(song).toMatch(/>Verse<[\s\S]*Hello, hello, hello to you![\s\S]*Sing it as written\.[\s\S]*>wave<[\s\S]*>Chorus</);
        expect(song.split('<tr><td>').length - 1).toBe(week().song!.lines.length);
        expect(song).toContain('<strong>End:</strong> Nod and hum nnn.');
    });

    it('prints the Thai gesture name after the English one in the Thai book only', () => {
        expect(renderStorytimeWeek(week(), 'th')).toContain('<td>wave (โบกมือ)</td>');
        expect(renderStorytimeWeek(week(), 'en')).toContain('<td>wave</td>');
    });

    it('gives the English book the Thai print font when a step has Thai text', () => {
        const plain = compileStorytimeManual([week()], { lang: 'en' }).html;
        expect(plain).not.toContain("'Open Sans', 'Sarabun'");
        const html = compileStorytimeManual([week((w) => (w.scripts[0].steps[1].en.teacherActions![0] = 'It is the Thai letter น.'))], { lang: 'en' }).html;
        expect(html).toMatch(/font-family: 'Sarabun'/);
        expect(html).toContain("body, body * { font-family: 'Open Sans', 'Sarabun', sans-serif; }");
    });

    it('escapes the package text', () => {
        const html = renderStorytimeWeek(week((w) => (w.meta.title = 'Cats <b> & dogs')), 'en');
        expect(html).toContain('Cats &lt;b&gt; &amp; dogs');
    });
});

describe('Storytime manual: review week (design §3.5)', () => {
    const review = (lang: 'en' | 'th' = 'en', change?: (w: StorytimeWeekInput) => void) => {
        const w = fixtureReviewWeek();
        change?.(w);
        return renderStorytimeWeek(StorytimeWeekSchema.parse(w), lang);
    };

    it('prints the block, the day plan, and the benchmark in the header, and the medley of the day as opening item 3', () => {
        const html = review();
        expect(html).toContain('Review week');
        expect(html).toContain('weeks 1, 2');
        expect(html).toContain('Day 4: week 2, and the weakest week from the Friday checks');
        expect(html).toContain('Day 5: the child&#039;s choice');
        expect(daySection(html, 2)).toContain('Song medley (2 min): &quot;How Many? One, Two!&quot;, &quot;Hello, I Am ___&quot;.');
        expect(daySection(html, 2)).not.toContain('Song of the week with the actions.');
    });

    it('prints the benchmark page: the paper items with the position and the dictated sound, the sitting, the strip, the cards, and the blend words', () => {
        const html = review();
        const bench = html.split('<section class="st-bench"')[1].split('<section class="st-record"')[0];
        expect(bench).toContain('Paper part, whole class (10 min)');
        expect(bench).toContain('Circle the picture with /n/ at the start: nest, cat (answer: nest)');
        expect(bench).toContain('Circle the picture with /n/ at the end: sun, cup (answer: sun)');
        expect(bench).toContain('Write the letter for nnn (answer: n)');
        expect(bench).toContain('One to one, at the check table (2 min)');
        expect(bench).toContain('&quot;What is this letter?&quot;');
        expect(bench.match(/<div class="st-strip">(.*?)<\/div>/)![1].match(/<span>/g)).toHaveLength(26);
        expect(bench).toContain('pass: 20 of 26');
        expect(bench).toContain('/k/ - /a/ - /t/ → cat');
        expect(bench).toContain('Pass: 90 percent.');
    });

    it('prints the answer key of the review pages after the benchmark: the circle-word rows and the sort columns', () => {
        const bench = review().split('<section class="st-bench"')[1].split('<section class="st-record"')[0];
        expect(bench).toContain('Review pages: answer key (the paper center)');
        expect(bench).toContain('Review page 5 (day 5)');
        expect(bench).toContain('Circle the word that I say: an, Nan, nap (answer: Nan)');
        expect(bench).toContain('Sort the pictures by the first sound: /n/: nest, nose; /a/: apple, ant');
    });

    it('prints the class record sheet with 30 rows and the counts, and one reading form per decodable with each word marked', () => {
        const html = review();
        const [, sheet, forms] = html.split('<section class="st-record"');
        expect(sheet).toContain('Letter names /26');
        expect(sheet).toContain('Paper: pictures /2');
        expect(sheet).toContain('Paper: letters /2');
        expect(sheet.match(/<tr><td>/g)).toHaveLength(30);
        expect(forms).toContain('Reading record: &quot;Nan&quot; (week 1)');
        expect(forms).toContain('Reading record: &quot;Can I?&quot; (week 2)');
        expect(forms).toContain('<span class="st-word">nap?</span>');
        expect(forms).toContain('Self-corrections: ______');
    });

    it('prints the Thai labels and the Thai sitting in the Thai book', () => {
        const html = review('th', (w) => {
            w.benchmark!.oneToOne.th = { teacherActions: ['ชูแถบตัวอักษร'], teacherLanguage: ['(นี่คือตัวอักษรอะไร)'], studentActions: ['เด็กบอกชื่อตัวอักษร'], watchFor: ['เด็กที่ออกเสียงแทนชื่อ'] };
        });
        expect(html).toContain('เพลงรวม (2 นาที)');
        expect(html).toContain('วงกลมภาพที่มีเสียง /n/ ท้ายคำ');
        expect(html).toContain('ชูแถบตัวอักษร');
        expect(html).toContain('แบบบันทึกผลทั้งชั้น');
        expect(html).not.toMatch(CJK);
    });

    it('prints no benchmark pages for a teaching week', () => {
        expect(renderStorytimeWeek(week(), 'en')).not.toContain('st-bench');
    });
});
