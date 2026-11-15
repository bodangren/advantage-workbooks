// Probe of the failing case "the taught tricky word can" (Red 2 test, line 483 to 487).
import fs from 'node:fs';
import { checkStorytimeWeek, taughtTo } from '/home/daniebo/Desktop/Workbooks/dashboard/lib/storytime/checks';
import { StorytimeWeekSchema } from '/home/daniebo/Desktop/Workbooks/dashboard/lib/storytime/schema';
import { LOOP_STEP_IDS, SAMPLE_DRILLS, SAMPLE_RECALL, SAMPLE_SOUND_LOOP, questionsFor, sampleLoopMinutes, sampleSightWords } from '/home/daniebo/Desktop/Workbooks/dashboard/__tests__/fixtures/storytime-loops-sample';

const root = '/home/daniebo/Desktop/Workbooks/content/storytime/l2';
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function complete(week: number): any {
    const raw = JSON.parse(fs.readFileSync(`${root}/w0${week}.json`, 'utf8'));
    for (const s of raw.scripts) {
        delete s.recall;
        for (const st of s.steps) { delete st.blendDrill; delete st.soundLoop; delete st.sightWords; delete st.loopMinutes; }
    }
    for (const b of raw.books ?? []) delete b.questions;
    if (week === 8) { for (const s of raw.scripts) s.recall = copy(SAMPLE_RECALL[8]); return raw; }
    const step = (sid: string, id: string) => raw.scripts.find((s: any) => s.id === sid).steps.find((x: any) => x.id === id);
    for (const id of ['A1', 'A2', 'A3']) step('A', id).soundLoop = copy(SAMPLE_SOUND_LOOP);
    step('A', 'A4').blendDrill = copy(SAMPLE_DRILLS[week]);
    step('A', 'A6').sightWords = sampleSightWords(raw.focus.trickyWords);
    step('D', 'D2').sightWords = sampleSightWords(raw.focus.trickyWords);
    const ra = raw.books.find((b: any) => b.kind === 'readalong');
    ra.questions = questionsFor(week, ra.pages.map((p: any) => p.text));
    for (const s of raw.scripts) for (const st of s.steps) if ((LOOP_STEP_IDS as readonly string[]).includes(st.id)) st.loopMinutes = sampleLoopMinutes(st.id, st.minutes);
    for (const s of raw.scripts) if (!(week === 1 && s.day === 1)) s.recall = copy(SAMPLE_RECALL[week]);
    return raw;
}
const known = Array.from({ length: 8 }, (_, i) => StorytimeWeekSchema.parse(complete(i + 1)));
function report(raw: any) {
    const parsed = StorytimeWeekSchema.parse(raw);
    return checkStorytimeWeek(raw, taughtTo(known, parsed), undefined, known);
}
const raw = complete(1);
const items = copy(raw.scripts.find((s: any) => s.day === 2).recall.items);
items[1] = { kind: 'tricky', text: 'can', week: 1 };
console.log('items of day 2 after the test replaces index 1:', JSON.stringify(items.map((i: any) => `${i.kind}:${i.text}`)));
raw.scripts.find((s: any) => s.day === 2).recall = { items, ask: SAMPLE_RECALL[1].ask };
const r = report(raw).checks.find((c) => c.id === 'loops-recall');
console.log('loops-recall:', r?.status, r?.detail);
// A variant that keeps 5 distinct items: replace index 3 (the other can) with a distinct taught tricky word.
const raw2 = complete(1);
const items2 = copy(raw2.scripts.find((s: any) => s.day === 2).recall.items);
items2[1] = { kind: 'tricky', text: 'can', week: 1 };
items2[3] = { kind: 'tricky', text: 'a', week: 1 };
raw2.scripts.find((s: any) => s.day === 2).recall = { items: items2, ask: SAMPLE_RECALL[1].ask };
const r2 = report(raw2).checks.find((c) => c.id === 'loops-recall');
console.log('variant with can once:', r2?.status, r2?.detail);
