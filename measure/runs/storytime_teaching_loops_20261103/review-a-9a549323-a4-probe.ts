// Review A A4 probe: missing-deliverable fixtures for the six loop checks and the published check.
import fs from 'node:fs';
import { checkStorytimeWeek, taughtTo } from '../../../dashboard/lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../../../dashboard/lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../../../dashboard/lib/storytime/schema';

const load = (n: number): any => JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8'));
const known: StorytimeWeek[] = Array.from({ length: 8 }, (_, i) => StorytimeWeekSchema.parse(load(i + 1)));

function report(raw: any) {
    const parsed = StorytimeWeekSchema.parse(JSON.parse(JSON.stringify(raw)));
    return checkStorytimeWeek(raw, taughtTo(known, parsed), undefined, known);
}
const status = (r: any, id: string) => r.checks.find((c: any) => c.id === id)?.status ?? 'ABSENT';

// Fixture 1: shipped w01 with every routine deliverable MISSING.
const r1 = report(load(1));
console.log('missing deliverables on shipped w01:');
for (const id of ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall', 'loops-minutes'])
    console.log(`  ${id} -> ${status(r1, id)}`);

// Fixture 2: loop-complete w02 (deliverables present) must report pass on the routine checks.
const complete = load(2);
const step = (w: any, sid: string, id: string) => w.scripts.find((s: any) => s.id === sid).steps.find((s: any) => s.id === id);
const drill = {
    words: [
        { word: 'cat', sounds: ['/k/', '/a/', '/t/'] },
        { word: 'hat', sounds: ['/h/', '/a/', '/t/'] },
        { word: 'fan', sounds: ['/f/', '/a/', '/n/'] },
    ],
    model: { en: 'm', th: '' }, lead: { en: 'l', th: '' }, test: { en: 't', th: '' }, repeats: 3, correction: { en: 'c', th: '' },
};
for (const id of ['A1', 'A2', 'A3']) step(complete, 'A', id).soundLoop = { correct: { en: 'x', th: '' }, practise: { en: 'x', th: '' }, retest: { en: 'x', th: '' } };
step(complete, 'A', 'A4').blendDrill = drill;
step(complete, 'A', 'A6').sightWords = { words: [...complete.focus.trickyWords], slide: { en: 'x', th: '' }, check: { en: 'x', th: '' }, seconds: 3 };
step(complete, 'D', 'D2').sightWords = { words: [...complete.focus.trickyWords], slide: { en: 'x', th: '' }, check: { en: 'x', th: '' }, seconds: 3 };
const book = complete.books.find((b: any) => b.kind === 'readalong');
const last = (i: number) => book.pages[i].text.trim().split(/\s+/).pop() as string;
book.questions = [
    { kind: 'who', ask: { en: 'a', th: '' }, answer: { page: 1, word: last(0) } },
    { kind: 'what', ask: { en: 'b', th: '' }, answer: { page: 2, word: last(1) } },
    { kind: 'where', ask: { en: 'c', th: '' }, answer: { page: 3, word: last(2) } },
];
for (const s of complete.scripts) if (s.day !== 1) s.recall = { items: Array.from({ length: 5 }, (_, i) => ({ kind: 'word', text: 'the', week: 1 })), ask: { en: 'r', th: '' } };
const r2 = report(complete);
console.log('present deliverables on w02 copy:');
for (const id of ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall', 'loops-minutes'])
    console.log(`  ${id} -> ${status(r2, id)}`);

// Fixture 3: published gate with the loops part missing (spec FR-1: the exclusion is intended).
const pub = load(1);
const a = { status: 'approved', date: '2026-10-23' };
for (const p of ['text', 'thai', 'images', 'audio', 'song', 'scripts']) pub.approval[p] = { ...a };
delete pub.approval.loops;
const rp = report(pub);
console.log('published with loops key absent ->', status(rp, 'published'));

// Fixture 4: the falsifier - a draft images part must still fail published.
const pub2 = load(1);
for (const p of ['text', 'thai', 'audio', 'song', 'scripts']) pub2.approval[p] = { ...a };
pub2.approval.images = { status: 'draft' };
pub2.approval.loops = { status: 'draft' };
const rp2 = report(pub2);
console.log('published with draft images ->', status(rp2, 'published'), '|', rp2.checks.find((c: any) => c.id === 'published')?.detail);

// Fixture 5: Q4 skip branch - count rule runs without taught/others, and the skip is named.
const four = load(1);
four.scripts.find((s: any) => s.day === 2).recall = { items: Array.from({ length: 4 }, () => ({ kind: 'word', text: 'the', week: 1 })), ask: { en: 'r', th: '' } };
const r5 = checkStorytimeWeek(four);
const c5 = r5.checks.find((c: any) => c.id === 'loops-recall');
console.log('recall, 4 items, no taught/others ->', c5.status, '|', c5.detail);
const five = load(1);
five.scripts.find((s: any) => s.day === 2).recall = { items: Array.from({ length: 5 }, () => ({ kind: 'frame', text: 'Hello, I am ___.', week: 1 })), ask: { en: 'r', th: '' } };
const r6 = checkStorytimeWeek(five);
const c6 = r6.checks.find((c: any) => c.id === 'loops-recall');
console.log('recall, 5 frame items of an earlier week, no taught/others ->', c6.status, '|', c6.detail);
