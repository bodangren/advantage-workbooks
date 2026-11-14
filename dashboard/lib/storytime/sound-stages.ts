/**
 * The sound skill stages of Storytime (Phase 14, decisions P14-D1, P14-D2, and P14-D10): the stage plan
 * of the sound positions, the sound positions that an English text asks, the units of a week, and the
 * three check rows R14-1 to R14-3. The module is pure: it reads no file and no Thai field.
 */
import { bankSound, soundLabels } from './phonemes';

/** The sound positions of the stage plan, in plan order. */
export const SOUND_POSITIONS = ['first', 'last', 'middle'] as const;

/** A sound position: the first, the last, or the middle sound of a word. */
export type SoundPosition = (typeof SOUND_POSITIONS)[number];

/** One entry of the stage plan: the stage of a level that adds one sound position from a week. */
export interface SoundStagePlanEntry {
    level: number;
    stage: number;
    position: SoundPosition;
    fromWeek: number;
    tag: string;
}

/**
 * The stage plan (P14-D1): Level 2 asks the first sound from week 1, adds the last sound from week 9,
 * and adds the middle sound from week 17. A stage keeps the positions of the earlier stages.
 */
export const SOUND_STAGE_PLAN: readonly SoundStagePlanEntry[] = [
    { level: 2, stage: 1, position: 'first', fromWeek: 1, tag: 'english.phonics.pa.initial-sound.identify' },
    { level: 2, stage: 2, position: 'last', fromWeek: 9, tag: 'english.phonics.pa.final-sound.identify' },
    { level: 2, stage: 3, position: 'middle', fromWeek: 17, tag: 'english.phonics.pa.medial-vowel.identify' },
];

/** The stage of a week: the stage number and the positions that the week may ask. */
export interface PlannedSoundStage {
    stage: number;
    positions: SoundPosition[];
}

/** One unit of a week: one activity, its English text, and the sound positions that it asks. */
export interface SoundUnit {
    where: string;
    text: string;
    positions: SoundPosition[];
}

/** One check row of the sound stages. */
export interface SoundStageRow {
    id: string;
    label: string;
    status: 'pass' | 'fail';
    detail?: string;
}

/** The English text of a bilingual field. */
interface EnText {
    en?: string;
}

/** A check item or a benchmark item: the kind and the position. */
interface SoundItem {
    kind?: string;
    position?: SoundPosition;
}

/** The fields of a week that the module reads. */
interface SoundStageWeek {
    meta?: { level?: number; week?: number };
    focus?: { element?: { sound?: string }; paSkill?: EnText; paStage?: { stage?: number; positions?: string[] } };
    opening?: { pa?: EnText[] };
    scripts?: {
        steps?: {
            en?: { teacherActions?: string[]; teacherLanguage?: string[]; studentActions?: string[] };
            easier?: EnText;
            harder?: EnText;
            group?: EnText;
            soundLoop?: { correct?: EnText; practise?: EnText; retest?: EnText };
        }[];
    }[];
    check?: { items?: SoundItem[] };
    benchmark?: { paper?: { items?: SoundItem[] } };
    home?: { line?: EnText; activity?: EnText };
    tags?: { taught?: string[]; reviewed?: string[] };
}

/** The pattern of each sound position (spec, Phase 14 check rows), in plan order. */
const POSITION_PATTERNS: Record<SoundPosition, RegExp> = {
    first: /\bfirst sounds?\b|\bstarts? with\b|\bat the start\b|\bfirst box\b/i,
    last: /\blast sounds?\b|\bends? with\b|\blast box\b|\blisten to the end\b|\bat the start or the end\b|(?:\/[a-z-]+\/|\b([a-z])\1{2,}\b|\b[a-z]\b) (?:is )?at the end\b/i,
    middle: /\bmiddle sounds?\b|\blisten to the middle\b|\bat the start or in the middle\b|(?:\/[a-z-]+\/|\b([a-z])\1{2,}\b|\b[a-z]\b) (?:is )?in the middle\b/i,
};

/** The item kinds that ask a sound position. */
const POSITION_ITEM_KINDS = new Set(['circle-picture', 'picture-sort']);

/** The exact label of the `sound-stage-mix` row (R14-1). */
const SOUND_STAGE_MIX_LABEL = 'No activity asks two sound positions (first, last, middle)';

/** The exact label of the `sound-stage-day1` row (R14-2). */
const SOUND_STAGE_DAY1_LABEL = 'The day-1 sound game holds no new sound and asks only a skill of an earlier stage';

/** The exact label of the `sound-stage-plan` row (R14-3). */
const SOUND_STAGE_PLAN_LABEL = 'The week follows the sound stage plan (focus.paStage, positions, tags)';

/**
 * The stage of a week by the stage plan.
 * @param level The level of the week.
 * @param week The week number.
 * @returns The stage of the entry of the level with the highest `fromWeek` at or below the week, and
 * the positions of that stage and the stages below it, in plan order; `undefined` for a level with no
 * entry and for a week below the first entry.
 */
export function plannedSoundStage(level: number, week: number): PlannedSoundStage | undefined {
    const entries = SOUND_STAGE_PLAN.filter((entry) => entry.level === level);
    const started = entries.filter((entry) => entry.fromWeek <= week);
    if (!started.length) return undefined;
    const stage = started.reduce((top, entry) => (entry.fromWeek > top.fromWeek ? entry : top)).stage;
    return { stage, positions: entries.filter((entry) => entry.stage <= stage).map((entry) => entry.position) };
}

/**
 * The sound positions that an English text asks.
 * @param text The English text.
 * @returns The positions, in plan order; an empty array when the text asks no position.
 */
export function soundPositionsAsked(text: string): SoundPosition[] {
    return SOUND_POSITIONS.filter((position) => POSITION_PATTERNS[position].test(text));
}

/**
 * The distinct positions of the items that ask a sound position.
 * @param items The check items or the benchmark items.
 * @returns The positions in plan order (an absent `position` is `first`), or `undefined` when no item
 * asks a sound position.
 */
function itemPositions(items: SoundItem[] | undefined): SoundPosition[] | undefined {
    const asking = (items ?? []).filter((item) => POSITION_ITEM_KINDS.has(item.kind ?? ''));
    if (!asking.length) return undefined;
    const used = new Set(asking.map((item) => item.position ?? 'first'));
    return SOUND_POSITIONS.filter((position) => used.has(position));
}

/**
 * The units of a week (spec, Phase 14 check rows): the skill text, each opening line, each step, the
 * check items, the benchmark items, and the home card. A step unit joins the teacher actions, the
 * teacher language, the student actions, the three variants, and the sound loop lines; it reads no
 * `watchFor`, no `materials`, no title, and no Thai field.
 * @param week The parsed week.
 * @returns The units, in the order of the spec.
 */
export function soundUnits(week: unknown): SoundUnit[] {
    const w = (week ?? {}) as SoundStageWeek;
    const units: SoundUnit[] = [];
    const addText = (where: string, text: string) => units.push({ where, text, positions: soundPositionsAsked(text) });
    if (typeof w.focus?.paSkill?.en === 'string') addText('focus.paSkill', w.focus.paSkill.en);
    (w.opening?.pa ?? []).forEach((line, i) => addText(`opening.pa.${i}`, line?.en ?? ''));
    (w.scripts ?? []).forEach((script, s) => {
        (script.steps ?? []).forEach((step, t) => {
            const loop = step.soundLoop;
            const lines = [
                ...(step.en?.teacherActions ?? []),
                ...(step.en?.teacherLanguage ?? []),
                ...(step.en?.studentActions ?? []),
                step.easier?.en,
                step.harder?.en,
                step.group?.en,
                ...(loop ? [loop.correct?.en, loop.practise?.en, loop.retest?.en] : []),
            ].filter((line): line is string => typeof line === 'string');
            addText(`scripts.${s}.steps.${t}`, lines.join('\n'));
        });
    });
    const checkPositions = itemPositions(w.check?.items);
    if (checkPositions) units.push({ where: 'check.items', text: '', positions: checkPositions });
    const benchmarkPositions = itemPositions(w.benchmark?.paper?.items);
    if (benchmarkPositions) units.push({ where: 'benchmark.paper.items', text: '', positions: benchmarkPositions });
    if (w.home) addText('home', `${w.home.line?.en ?? ''}\n${w.home.activity?.en ?? ''}`);
    return units;
}

/**
 * The level, the week number, and the planned stage of a week.
 * @param week The parsed week.
 * @returns The three values, or `undefined` when the week has no meta or no plan entry.
 */
function plannedWeek(week: unknown): { w: SoundStageWeek; level: number; n: number; planned: PlannedSoundStage } | undefined {
    const w = (week ?? {}) as SoundStageWeek;
    if (!w.meta || typeof w.meta.level !== 'number' || typeof w.meta.week !== 'number') return undefined;
    const planned = plannedSoundStage(w.meta.level, w.meta.week);
    if (!planned) return undefined;
    return { w, level: w.meta.level, n: w.meta.week, planned };
}

/**
 * A check row from its parts.
 * @param id The row id.
 * @param label The row label.
 * @param parts The detail parts; no part gives a pass.
 * @param prefix The text before the joined parts.
 * @returns The row.
 */
function rowOf(id: string, label: string, parts: string[], prefix = ''): SoundStageRow {
    return parts.length ? { id, label, status: 'fail', detail: `${prefix}${parts.join('; ')}` } : { id, label, status: 'pass' };
}

/**
 * R14-1 `sound-stage-mix`: no unit of the week asks two sound positions.
 * @param week The parsed week.
 * @returns The row, or `undefined` for a week with no meta or no plan entry.
 */
export function checkSoundStageMix(week: unknown): SoundStageRow | undefined {
    if (!plannedWeek(week)) return undefined;
    const parts = soundUnits(week)
        .filter((unit) => unit.positions.length > 1)
        .map((unit) => `${unit.where} (${unit.positions.join('+')})`);
    return rowOf('sound-stage-mix', SOUND_STAGE_MIX_LABEL, parts, 'mixed: ');
}

/**
 * R14-2 `sound-stage-day1`: the day-1 opening line holds no new sound and no untaught sound, and it asks
 * only the positions of the stage of the week before.
 * @param week The parsed week.
 * @param earlierSounds The `focus.element.sound` of each week of the same level with a smaller week number.
 * @returns The row, or `undefined` for a week with no meta or no plan entry.
 */
export function checkSoundStageDayOne(week: unknown, earlierSounds: string[]): SoundStageRow | undefined {
    const at = plannedWeek(week);
    if (!at) return undefined;
    const head = { id: 'sound-stage-day1', label: SOUND_STAGE_DAY1_LABEL };
    const line = at.w.opening?.pa?.[0]?.en;
    if (typeof line !== 'string') return rowOf(head.id, head.label, ['no opening']);
    const parts: string[] = [];
    const sound = at.w.focus?.element?.sound;
    const newSound = sound ? bankSound(sound) : undefined;
    const earlier = new Set(earlierSounds.map(bankSound));
    for (const label of soundLabels(line)) {
        const bank = bankSound(label);
        if (newSound !== undefined && bank === newSound) parts.push(`new sound: ${label}`);
        else if (!earlier.has(bank)) parts.push(`untaught sound: ${label}`);
    }
    const allowed = plannedSoundStage(at.level, at.n - 1)?.positions ?? [];
    for (const position of soundPositionsAsked(line)) {
        if (!allowed.includes(position)) parts.push(`position: ${position} (stage of week ${at.n - 1} allows ${allowed.length ? allowed.join(', ') : 'none'})`);
    }
    return rowOf(head.id, head.label, parts);
}

/**
 * R14-3 `sound-stage-plan`: the week holds the planned `focus.paStage`, asks no position outside the
 * planned stage, holds no tag of a later stage, and teaches the tag of a stage that starts in the week.
 * @param week The parsed week.
 * @returns The row, or `undefined` for a week with no meta or no plan entry.
 */
export function checkSoundStagePlan(week: unknown): SoundStageRow | undefined {
    const at = plannedWeek(week);
    if (!at) return undefined;
    const { planned } = at;
    const parts: string[] = [];
    const paStage = at.w.focus?.paStage;
    if (!paStage) parts.push('no paStage');
    else {
        if (paStage.stage !== planned.stage) parts.push(`stage ${paStage.stage}, plan ${planned.stage}`);
        const positions = paStage.positions ?? [];
        if (positions.join(',') !== planned.positions.join(',')) parts.push(`positions ${positions.join(',')}, plan ${planned.positions.join(',')}`);
    }
    for (const unit of soundUnits(week)) {
        for (const position of unit.positions) {
            if (!planned.positions.includes(position)) parts.push(`outside stage: ${unit.where} (${position})`);
        }
    }
    const taught = at.w.tags?.taught ?? [];
    const held = new Set([...taught, ...(at.w.tags?.reviewed ?? [])]);
    const entries = SOUND_STAGE_PLAN.filter((entry) => entry.level === at.level);
    for (const entry of entries) {
        if (!planned.positions.includes(entry.position) && held.has(entry.tag)) parts.push(`tag outside stage: ${entry.tag}`);
    }
    for (const entry of entries) {
        if (entry.fromWeek === at.n && !taught.includes(entry.tag)) parts.push(`stage start not taught: ${entry.tag}`);
    }
    return rowOf('sound-stage-plan', SOUND_STAGE_PLAN_LABEL, parts);
}
