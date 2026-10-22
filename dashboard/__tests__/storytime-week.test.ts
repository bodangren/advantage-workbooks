// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { StorytimeWeekSchema, scriptIdsOf, storytimeKey, type StorytimeWeekInput } from '../lib/storytime/schema';
import { checkStorytimeWeek, decodability, frameCount, taughtTo } from '../lib/storytime/checks';
import { storytimeMediaDir, storytimeWeekFile } from '../lib/storytime/files';
import { fixtureWeek } from './fixtures/storytime-week-fixture';

function run(change?: (w: StorytimeWeekInput) => void) {
    const week = fixtureWeek();
    change?.(week);
    return checkStorytimeWeek(week);
}

const status = (report: ReturnType<typeof run>, id: string) => report.checks.find((c) => c.id === id)?.status;
const failed = (report: ReturnType<typeof run>) => report.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.detail}`);
const script = (w: StorytimeWeekInput, id: string) => w.scripts.find((s) => s.id === id)!;

describe('storytime-week schema', () => {
    it('parses the fixture week', () => {
        const parsed = StorytimeWeekSchema.parse(fixtureWeek());
        expect(parsed.meta.key).toBe('st2/1');
        expect(parsed.approval.scripts.status).toBe('draft');
        expect(parsed.meta.status).toBe('draft');
        expect(parsed.books.map((b) => [b.kind, b.audio.sentences])).toEqual([['readalong', []], ['decodable', []]]);
    });

    it('refuses another program, another shape, a level out of range, and a wrong step id', () => {
        const cases: ((w: StorytimeWeekInput) => void)[] = [
            (w) => ((w.meta as { program: string }).program = 'primary'),
            (w) => ((w.meta as { shape: string }).shape = 'lesson'),
            (w) => (w.meta.level = 5),
            (w) => (w.scripts[0].steps[0].id = 'a1'),
        ];
        for (const change of cases) {
            const w = fixtureWeek();
            change(w);
            expect(StorytimeWeekSchema.safeParse(w).success).toBe(false);
        }
    });

    it('gives the script ids of a level and the URL key', () => {
        expect(scriptIdsOf(1)).toEqual(['L', 'M', 'S', 'V', 'P']);
        expect(scriptIdsOf(3)).toEqual(['A', 'B', 'C', 'D', 'E']);
        expect(storytimeKey(2, 7)).toBe('st2/7');
    });

    it('gives the file of a week', () => {
        expect(storytimeWeekFile('/c', 2, 1)).toBe('/c/l2/w01.json');
        expect(storytimeWeekFile('/c', 1, 32)).toBe('/c/l1/w32.json');
        expect(storytimeMediaDir('/c', 2, 1)).toBe('/c/l2/media/w01');
    });
});

describe('storytime-week checks', () => {
    it('passes the fixture week with no failure', () => {
        const report = run();
        expect(failed(report)).toEqual([]);
        expect(report.lesson).toBe('st2/1');
    });

    it('reports a package that does not parse as the schema check only', () => {
        const report = run((w) => ((w as { version: number }).version = 2));
        expect(report.checks.map((c) => c.id)).toEqual(['schema']);
        expect(status(report, 'schema')).toBe('fail');
    });

    it('fails a key that is not st<level>/<week>', () => {
        expect(status(run((w) => (w.meta.key = 'st2/2')), 'key')).toBe('fail');
    });

    it('fails a week without five scripts on days 1 to 5 in the order of the level', () => {
        expect(status(run((w) => w.scripts.pop()), 'scripts')).toBe('fail');
        expect(status(run((w) => (w.scripts[1].day = 1)), 'scripts')).toBe('fail');
        expect(status(run((w) => (w.scripts[0].id = 'L')), 'scripts')).toBe('fail');
    });

    it('fails a script whose opening and main steps do not fill the period', () => {
        const report = run((w) => (script(w, 'B').steps[0].minutes = 9));
        expect(status(report, 'minutes')).toBe('fail');
        expect(report.checks.find((c) => c.id === 'minutes')?.detail).toMatch(/B: 6 \+ 28 = 34, not 30/);
    });

    it('fails a step id that does not start with its script letter, or that repeats', () => {
        expect(status(run((w) => (script(w, 'C').steps[0].id = 'D1')), 'step-ids')).toBe('fail');
        expect(status(run((w) => (script(w, 'C').steps[1].id = 'C1')), 'step-ids')).toBe('fail');
    });

    it('fails a Level 1 step over 8 minutes', () => {
        const report = run((w) => {
            w.meta.level = 1;
            w.meta.key = 'st1/1';
            w.books = w.books!.filter((b) => b.kind !== 'decodable');
            const ids = ['L', 'M', 'S', 'V', 'P'] as const;
            w.scripts.forEach((s, i) => {
                s.id = ids[i];
                s.steps.forEach((st) => (st.id = st.id.replace(/^[A-Z]/, ids[i])));
            });
            w.scripts[0].steps[0].minutes = 9;
            w.scripts[0].steps[1].minutes = 1;
        });
        expect(failed(report)).toEqual([expect.stringMatching(/^step-length: L1 9 min/)]);
    });

    it('warns about a moved step in a period over 30 minutes', () => {
        const report = run((w) => {
            w.meta.periodMinutes = 32;
            w.meta.openingMinutes = 8;
        });
        expect(status(report, 'moved')).toBe('warn');
    });

    it('fails a family of fewer than 6 or more than 8 words, and warns about more than 3 new tricky words', () => {
        expect(status(run((w) => w.focus.family.words!.splice(5)), 'family')).toBe('fail');
        expect(status(run((w) => w.focus.family.words!.push(...['a', 'b', 'c'].map((word) => ({ word })))), 'family')).toBe('fail');
        expect(status(run((w) => (w.focus.trickyWords = ['cannot', 'he', 'put', 'see'])), 'tricky')).toBe('warn');
    });

    it('counts the song lines that carry the hook of the frame', () => {
        expect(frameCount('Hello, I am ___.', ['Hello, I am Nat!', 'hello I am big Nan', 'Hello to you'])).toBe(2);
        // The slot takes one to three words.
        expect(frameCount('I can see a ___ here.', ['I can see a big red ball here!', 'I can see a here.', 'I can see a one two three four here.'])).toBe(1);
        expect(frameCount('How many? One, two...', ['How many? One, two, three!', 'How many cats?', 'One, two'])).toBe(2);
        expect(frameCount('Is it a ___? Yes/No.', ['Is it a ball? Yes, it is.', 'It is a ball.'])).toBe(1);
    });

    it('fails a song with the frame fewer than 8 times or with a gesture outside the 24', () => {
        expect(status(run((w) => w.song!.lines.splice(8)), 'song-frame')).toBe('fail');
        expect(status(run((w) => (w.song!.lines[0].gesture = 'jump')), 'song-gestures')).toBe('fail');
    });

    it('warns when the sung lines differ from the lyric sheet (the lines follow the audio)', () => {
        const sheet = (w: StorytimeWeekInput) => ['[intro]', '[verse]', ...w.song!.lines.map((l) => l.text), '[outro]'].join('\n');
        expect(status(run((w) => (w.song!.lyricSheet = sheet(w))), 'song-sheet')).toBe('pass');
        expect(status(run((w) => (w.song!.lyricSheet = sheet(w).replace('Hello, hello, hello to you!', 'Hello to you!'))), 'song-sheet')).toBe('warn');
        expect(status(run((w) => (w.song!.lyricSheet = `${sheet(w)}\nOne more line`)), 'song-sheet')).toBe('warn');
        // A sung echo in parentheses where the sheet has "(clap clap)" is the same line.
        expect(
            status(
                run((w) => {
                    w.song!.lyricSheet = sheet(w).replace('Hello, I am Nat!', 'Hello, I am Nat! (clap clap)');
                    w.song!.lines[1].text = 'Hello, I am Nat! (Hello, I am Nat!)';
                }),
                'song-sheet',
            ),
        ).toBe('pass');
    });

    it('fails a read-along marked as a sound book', () => {
        expect(status(run((w) => (w.books![0].soundBook = true)), 'books')).toBe('fail');
        expect(status(run((w) => (w.books![1].soundBook = true)), 'books')).toBe('pass');
    });

    it('warns about a song line with no picture and no imageOf, and fails an imageOf that is not an earlier pictured line', () => {
        expect(status(run(), 'song-pictures')).toBe('pass');
        expect(status(run(), 'song-picture-refs')).toBe('pass');
        expect(status(run((w) => delete w.song!.lines[3].imageOf), 'song-pictures')).toBe('warn');
        expect(status(run((w) => (w.song!.lines[3].imageOf = 5)), 'song-picture-refs')).toBe('fail');
        expect(status(run((w) => delete w.song!.lines[1].image), 'song-picture-refs')).toBe('fail');
    });

    it('takes 0 minutes only for a moved step', () => {
        expect(status(run((w) => (w.scripts[0].steps[5].minutes = 0)), 'step-minutes')).toBe('pass');
        const report = run((w) => {
            w.scripts[0].steps[0].minutes = 0;
            w.scripts[0].steps[1].minutes = 9;
        });
        expect(report.checks.find((c) => c.id === 'step-minutes')?.detail).toBe('A1 0 min');
    });

    it('parses a write-letter check item and a script prep line', () => {
        const w = fixtureWeek();
        w.check = { items: [{ kind: 'write-letter', letter: 'n' }] };
        w.scripts[3].prep = [{ en: "Write each child's name on a name card." }];
        const parsed = StorytimeWeekSchema.parse(w);
        expect(parsed.check.items[0]).toEqual({ kind: 'write-letter', letter: 'n' });
        expect(parsed.scripts[3].prep[0].th).toBe('');
    });

    it('fails a teach week without the read-along, the decodable (Level 2 up), or the song', () => {
        expect(status(run((w) => (w.books = w.books!.filter((b) => b.kind !== 'readalong'))), 'books')).toBe('fail');
        expect(status(run((w) => (w.books = w.books!.filter((b) => b.kind !== 'decodable'))), 'books')).toBe('fail');
        expect(status(run((w) => w.books![0].pages.pop()), 'books')).toBe('fail');
        expect(status(run((w) => w.books!.push({ ...w.books![1] })), 'books')).toBe('fail');
        expect(status(run((w) => delete w.song), 'song-frame')).toBe('fail');
    });

    it('lets a review week leave out the books, the song, and the family', () => {
        const report = run((w) => {
            w.meta.kind = 'review';
            w.books = [];
            delete w.song;
            w.focus.family.words = [];
        });
        expect(failed(report)).toEqual([]);
    });

    it('fails a Level 1 week with a decodable', () => {
        const report = run((w) => (w.meta.level = 1));
        expect(failed(report).some((f) => f.startsWith('books:') && /Level 1/.test(f))).toBe(true);
    });

    it('fails Thai notes whose line counts differ from the English, and warns while Thai is missing', () => {
        expect(status(run(), 'thai')).toBe('warn');
        // The focus texts, the prep lines, and the song notes count as lines.
        const missing = (r: ReturnType<typeof run>) => Number(r.checks.find((c) => c.id === 'thai')?.detail?.match(/(\d+) of \d+ lines/)?.[1]);
        const fill = run((w) => {
            w.focus.paSkill.th = 'ฟัง';
            w.focus.family.name.th = 'ชื่อ';
            w.focus.element!.action.th = 'ฮัม';
        });
        expect(missing(run()) - missing(fill)).toBe(3);
        expect(missing(run((w) => (w.scripts[0].prep = [{ en: 'Cut the cards.' }]))) - missing(run())).toBe(1);
        const report = run((w) => {
            const s = script(w, 'A').steps[0];
            s.th = { teacherActions: ['ทำ', 'สอง'], teacherLanguage: ['ฟัง'], studentActions: ['ทำ'], watchFor: ['ดู'] };
        });
        expect(status(report, 'thai-lines')).toBe('fail');
        expect(report.checks.find((c) => c.id === 'thai-lines')?.detail).toMatch(/A1 teacherActions: 2 Thai, 1 English/);
    });

    it('fails a strip over 18 cards, a card from a later week, or a missing day', () => {
        expect(status(run((w) => (w.review![1].cards = Array.from({ length: 19 }, () => ({ kind: 'sound' as const, text: 'n', week: 1 })))), 'review')).toBe('fail');
        expect(status(run((w) => (w.review![1].cards = [{ kind: 'sound', text: 'a', week: 2 }])), 'review')).toBe('fail');
        expect(status(run((w) => w.review!.pop()), 'review')).toBe('fail');
    });

    it('takes the app player timing shape for book and song audio', () => {
        const w = fixtureWeek();
        w.books![0].audio = { file: 'l2/media/w01/readalong.mp3', sentences: [{ sentence: 'Hello, I am Nat.', startTime: 0, endTime: 1.4, page: 1, words: [{ word: 'Hello', start: 0, end: 0.5 }] }] };
        w.song!.times = [{ sentence: 'Hello, hello, hello to you!', startTime: 0, endTime: 2 }];
        const parsed = StorytimeWeekSchema.parse(w);
        expect(parsed.books[0].audio.sentences[0].words[0]).toEqual({ word: 'Hello', start: 0, end: 0.5 });
        expect(parsed.song?.times[0].words).toEqual([]);
        (w.books![0].audio.sentences![0] as { text?: string }).text = 'x';
        delete (w.books![0].audio.sentences![0] as { sentence?: string }).sentence;
        expect(StorytimeWeekSchema.safeParse(w).success).toBe(false);
    });

    it('fails a published week with a part not approved or a failed check', () => {
        expect(status(run(), 'published')).toBeUndefined();
        const report = run((w) => (w.meta.status = 'published'));
        expect(status(report, 'published')).toBe('fail');
        expect(report.checks.find((c) => c.id === 'published')?.detail).toMatch(/text not approved/);
        const ok = run((w) => {
            w.meta.status = 'published';
            const a = { status: 'approved' as const, date: '2026-10-22' };
            w.approval = { text: a, thai: a, images: a, audio: a, song: a, scripts: a };
        });
        expect(status(ok, 'published')).toBe('pass');
        const broken = run((w) => {
            w.meta.status = 'published';
            const a = { status: 'approved' as const };
            w.approval = { text: a, thai: a, images: a, audio: a, song: a, scripts: a };
            w.meta.key = 'st2/9';
        });
        expect(broken.checks.find((c) => c.id === 'published')?.detail).toBe('key fails');
    });

    it('counts decodable, tricky, name, and untaught words (design §5.6)', () => {
        const taught = { graphemes: ['n', 'a', 'sh'], tricky: ['I', 'can', 'and'] };
        expect(decodability('Nan can. Can I? An ash!', taught)).toMatchObject({ running: 6, decodable: 3, tricky: 3, untaught: [], ratio: 1 });
        // Every letter of a word must be taught; a name is listed, not untaught, and counts against the ratio.
        const d = decodability('Nan and Pip can nap.', taught, ['Pip']);
        expect(d).toMatchObject({ running: 5, decodable: 1, tricky: 2, names: ['Pip'], untaught: ['nap'] });
        expect(d.ratio).toBeCloseTo(0.6);
        expect(decodability('', taught).ratio).toBe(1);
    });

    it('collects the taught letters and tricky words from Level 2 week 1 to the week', () => {
        const at = (level: number, week: number, graphemes: string[], tricky: string[]) => {
            const w = StorytimeWeekSchema.parse(fixtureWeek());
            w.meta = { ...w.meta, level, week };
            w.focus = { ...w.focus, element: { ...w.focus.element!, graphemes }, trickyWords: tricky };
            return w;
        };
        const weeks = [at(1, 3, ['n'], []), at(2, 1, ['n'], ['a']), at(2, 3, ['p'], ['the']), at(3, 1, ['sh'], ['was'])];
        expect(taughtTo(weeks, at(2, 2, ['a'], ['I']))).toEqual({ graphemes: ['n', 'a'], tricky: ['a', 'I'] });
        expect(taughtTo(weeks, at(3, 2, ['ch'], []))).toEqual({ graphemes: ['n', 'p', 'sh', 'ch'], tricky: ['a', 'the', 'was'] });
    });

    it('fails a decodable under 90 percent or with an untaught word, lists names, skips a sound book, and warns with no level', () => {
        const taught = { graphemes: ['n', 'a'], tricky: ['a', 'and', 'can', 'I'] };
        const week = (pages: string[], change?: (w: StorytimeWeekInput) => void) => {
            const w = fixtureWeek();
            w.books![1] = { kind: 'decodable', title: 'Nan Can', pages: pages.map((text) => ({ text })) };
            change?.(w);
            return checkStorytimeWeek(w, taught);
        };
        const good = ['Nan can.', 'Can I?', 'I can!', 'Nan can.', 'Can I?', 'I can!', 'Can Nan?', 'Nan and I can!'];
        expect(status(week(good), 'decodable')).toBe('pass');
        const nap = week(good.map((p, i) => (i === 7 ? 'Nan can nap!' : p)));
        expect(nap.checks.find((c) => c.id === 'decodable')?.detail).toMatch(/untaught: nap/);
        const pip = ['Pip can.', 'Pip can.', 'Pip can.', 'Can I?', 'I can!', 'Can I?', 'I can!', 'Nan can!'];
        const named = week(pip, (w) => (w.books![1].names = ['Pip']));
        expect(named.checks.find((c) => c.id === 'decodable')).toMatchObject({ status: 'fail', label: expect.stringContaining('names: Pip') });
        expect(named.checks.find((c) => c.id === 'decodable')?.detail).toMatch(/^83 percent of 18 words$/);
        expect(status(week(good, (w) => (w.books![1].soundBook = true)), 'decodable')).toBeUndefined();
        expect(status(checkStorytimeWeek(fixtureWeek()), 'decodable')).toBe('warn');
    });

    it('warns about a teach week without a Friday check or a home card with other than 3 words', () => {
        expect(status(run((w) => (w.check = { items: [] })), 'check')).toBe('warn');
        expect(status(run((w) => (w.home!.words = ['a'])), 'home')).toBe('warn');
        expect(status(run((w) => delete w.home), 'home')).toBe('fail');
    });
});
