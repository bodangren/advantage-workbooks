import { fontFaceCss, PRINT_FONT_FACES } from '../document-wrapper/print-fonts';
import type { ThemeColors } from '../document-wrapper/types';
import { wrapTeacherManualDocument } from '../teacher-manual/document-wrapper';
import { getTranslations, type SupportedLanguage } from '../teacher-manual/i18n';
import type { TeacherManualPaper } from '../teacher-manual/types';
import { storytimeLabels, type StorytimeLabels } from './i18n';
import type { BiText, StorytimeStep, StorytimeWeek } from './schema';

/**
 * The Storytime template of the teacher manual generator (track storytime_week_package_20261022,
 * design §3 and §8): a title page, then per week a header page and one section per day. A day
 * section starts on a new page, so the teacher takes the page of the day. It uses the print wrapper
 * of the Primary manual (paper, fonts, the four note headings), not its Primary front matter.
 */

/** A garden green; it prints as a dark gray on the school's black-and-white printer. */
const THEME: ThemeColors = { primary: '#2e6b30', secondary: '#6b4f10', gradient: 'none' };

const CSS = `
    .st-week, .st-day { break-before: page; }
    .st-week-title { font-size: 18pt; color: ${THEME.primary}; margin: 0 0 10px 0; }
    .st-facts { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .st-facts th, .st-facts td { border: 1px solid #999; padding: 4px 8px; text-align: left; vertical-align: top; }
    .st-facts th { width: 32%; }
    .st-day-title { font-size: 15pt; color: ${THEME.primary}; border-bottom: 2px solid ${THEME.primary}; padding-bottom: 4px; margin: 0 0 10px 0; }
    .st-min { font-weight: 600; color: #333; white-space: nowrap; }
    .st-opening { border: 1px solid #999; padding: 6px 10px; margin-bottom: 12px; font-size: 9.5pt; break-inside: avoid; }
    .st-opening h4, .st-opening h5 { margin: 4px 0; }
    .st-opening ol { margin: 0 0 4px 0; padding-left: 18px; }
    .st-card { display: inline-block; border: 1px solid #000; padding: 1px 6px; margin: 1px 3px 1px 0; }
    /* A step stays on one page: the teacher reads it while teaching. */
    .st-step { margin-bottom: 10px; break-inside: avoid; }
    .st-step .tm-teaching-notes { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; padding: 4px 0; }
    .st-title-series { font-size: 32pt; word-break: keep-all; overflow-wrap: normal; }
    .st-step-title { font-size: 11.5pt; margin: 8px 0 2px 0; color: ${THEME.primary}; }
    .st-en { font-weight: 400; color: #444; }
    .st-gloss { margin: 0 0 4px 12px; font-size: 9.5pt; }
    .st-variants { border-top: 1px dashed #999; padding: 4px 12px 0 12px; font-size: 9.5pt; break-inside: avoid; }
    .st-variants p { margin: 2px 0; }
    .st-moved { border-left: 4px solid #000; padding-left: 8px; }
    /* The heading of the moved steps stays with the first of them (Paged.js keeps a heading only inside one avoid block). */
    .st-moved-group { break-inside: avoid; }
    .st-prep { border: 2px solid #000; padding: 4px 10px; margin-bottom: 8px; font-size: 9.5pt; break-inside: avoid; }
    .st-prep h4 { margin: 2px 0; }
    .st-prep ul { margin: 0; padding-left: 18px; }
    .st-song { break-before: page; }
    .st-song table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .st-song th, .st-song td { border: 1px solid #999; padding: 3px 8px; text-align: left; vertical-align: top; }
    .st-song .st-part td { font-weight: 700; background: #eee; }
`;

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/** The Thai of a text in the Thai book when Daniel has written it, else the English. */
const pick = (t: BiText, lang: SupportedLanguage) => (lang === 'th' && t.th ? t.th : t.en);

function renderStep(step: StorytimeStep, lang: SupportedLanguage, l: StorytimeLabels): string {
    const h = getTranslations(lang).teachingNotes;
    const thai = lang === 'th' ? step.th : undefined;
    const note = thai ?? step.en;
    const list = (lines: string[]) => `<ul class="tm-note-list">${lines.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
    // The teacher says the English in both books; the Thai book adds the gloss under each line.
    const language = step.en.teacherLanguage
        .map((x, i) => `<p class="tm-language-quote">${escapeHtml(x)}</p>${thai?.teacherLanguage[i] ? `<p class="st-gloss">${escapeHtml(thai.teacherLanguage[i])}</p>` : ''}`)
        .join('');
    const title = lang === 'th' && step.title.th ? `${escapeHtml(step.title.th)} <span class="st-en">(${escapeHtml(step.title.en)})</span>` : escapeHtml(step.title.en);
    const section = (label: string, body: string, cls = '') => `<div class="tm-note-section${cls}"><h5 class="tm-note-title${cls ? ' tm-watch-title' : ''}" style="color: ${THEME.primary};">${escapeHtml(label)}</h5>${body}</div>`;
    const variant = (label: string, t: BiText) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(pick(t, lang))}</p>`;
    return `
    <div class="st-step${step.moved ? ' st-moved' : ''}">
      <h4 class="st-step-title">${escapeHtml(step.id)} · ${title} <span class="st-min">${escapeHtml(l.minutes(step.minutes))}</span></h4>
      ${step.materials.length ? `<p class="st-gloss"><strong>${escapeHtml(l.materials)}:</strong> ${escapeHtml(step.materials.join(', '))}</p>` : ''}
      <div class="tm-teaching-notes">
        ${section(h.teacherActions, list(note.teacherActions))}
        ${section(h.teacherLanguage, `<div class="tm-language-box">${language}</div>`)}
        ${section(h.studentActions, list(note.studentActions))}
        ${section(h.watchFor, `<ul class="tm-note-list tm-watch-list">${note.watchFor.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`, ' tm-watch-for')}
      </div>
      <div class="st-variants">
        ${variant(l.easier, step.easier)}
        ${variant(l.harder, step.harder)}
        ${variant(l.group, step.group)}
      </div>
    </div>`;
}

/** Splits "a, b, "Hello, I Am Pip" (song, karaoke)" at the commas outside quotes and parentheses. */
function splitList(text: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let quoted = false;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') quoted = !quoted;
        else if (!quoted && c === '(') depth++;
        else if (!quoted && c === ')') depth = Math.max(0, depth - 1);
        else if (c === ',' && !quoted && depth === 0) {
            parts.push(text.slice(start, i));
            start = i + 1;
        }
    }
    parts.push(text.slice(start));
    return parts.map((x) => x.trim()).filter(Boolean);
}

/**
 * The materials of a week, once each: items of one kind ("picture cards: nest, net") become one item
 * with every word once, in the order of first use. A word that one item repeats ("letter cards: p, a, n, n")
 * keeps that count.
 * @param items The materials of every step.
 * @returns The merged list.
 */
export function mergeMaterials(items: string[]): string[] {
    const order: string[] = [];
    const lists = new Map<string, string[]>();
    for (const item of items) {
        const m = item.match(/^([^:]+):\s*(.+)$/);
        const key = m ? m[1].trim() : item;
        if (!lists.has(key)) {
            lists.set(key, []);
            order.push(key);
        }
        if (!m) continue;
        // A part that one item repeats (letter cards: p, a, n, n) keeps its count; the same part in two items counts once.
        const list = lists.get(key)!;
        const seen = new Map<string, number>();
        for (const part of splitList(m[2])) {
            const n = (seen.get(part) ?? 0) + 1;
            seen.set(part, n);
            if (list.filter((x) => x === part).length < n) list.push(part);
        }
    }
    return order.map((key) => (lists.get(key)!.length ? `${key}: ${lists.get(key)!.join(', ')}` : key));
}

function renderHeader(w: StorytimeWeek, lang: SupportedLanguage, l: StorytimeLabels): string {
    const { focus, books, song, home } = w;
    const rows: [string, string][] = [];
    if (focus.element) rows.push([l.element, `${focus.element.graphemes.join(', ')} ${focus.element.sound}: ${pick(focus.element.action, lang)}`]);
    rows.push([l.paSkill, pick(focus.paSkill, lang)]);
    rows.push([l.frame, focus.frame]);
    if (focus.family.words.length) rows.push([l.family, `${pick(focus.family.name, lang)}: ${focus.family.words.map((x) => x.word).join(', ')}`]);
    if (focus.trickyWords.length) rows.push([l.tricky, focus.trickyWords.join(', ')]);
    for (const b of books) rows.push([b.kind === 'readalong' ? l.readAlong : l.decodable, b.title]);
    if (song) rows.push([l.song, song.title]);
    if (home) rows.push([l.homeLine, pick(home.line, lang)]);
    const materials = mergeMaterials(w.scripts.flatMap((s) => s.steps.flatMap((st) => st.materials)));
    if (materials.length) rows.push([l.materials, materials.join('; ')]);
    const kind = w.meta.kind === 'review' ? ` (${l.reviewWeek})` : '';
    return `
  <section class="st-week" id="week-${w.meta.week}">
    <h2 class="st-week-title">${escapeHtml(l.week(w.meta.week))}: ${escapeHtml(w.meta.title)}${escapeHtml(kind)}</h2>
    <table class="st-facts">${rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
  </section>`;
}

/**
 * The HTML of one week: the header page and the five day sections.
 * @param w The parsed week.
 * @param lang The book language. The Thai book prints the English of a part that has no Thai yet.
 * @returns The HTML.
 */
export function renderStorytimeWeek(w: StorytimeWeek, lang: SupportedLanguage): string {
    const l = storytimeLabels(lang);
    const scripts = [...w.scripts].sort((a, b) => a.day - b.day);
    const days = scripts.map((s, i) => {
        const prep = s.prep.length ? `<div class="st-prep"><h4>${escapeHtml(l.prep)}</h4><ul>${s.prep.map((x) => `<li>${escapeHtml(pick(x, lang))}</li>`).join('')}</ul></div>` : '';
        const strip = w.review.find((r) => r.day === s.day)?.cards ?? [];
        const kinds = (['sound', 'tricky', 'frame', 'word'] as const).filter((k) => strip.some((c) => c.kind === k));
        const stripHtml = strip.length
            ? kinds.map((k) => `<p><strong>${escapeHtml(l.cardKinds[k])}:</strong> ${strip.filter((c) => c.kind === k).map((c) => `<span class="st-card">${escapeHtml(c.text)}</span>`).join('')}</p>`).join('')
            : `<p>${escapeHtml(l.noCards)}</p>`;
        const recall = i > 0 ? scripts[i - 1].steps.filter((st) => st.moved) : [];
        const recallMinutes = recall.reduce((n, st) => n + st.minutes, 0);
        const moved = s.steps.filter((st) => st.moved);
        const soundGame = w.opening?.pa[s.day - 1];
        return `
  <section class="st-day" id="week-${w.meta.week}-day-${s.day}">
    <h3 class="st-day-title">${escapeHtml(l.day(s.day))} · ${escapeHtml(l.script(s.id, pick(s.title, lang)))} <span class="st-min">${escapeHtml(l.minutes(w.meta.periodMinutes))}</span></h3>
    ${prep}
    <div class="st-opening">
      <h4>${escapeHtml(l.opening(w.meta.openingMinutes, recallMinutes))}</h4>
      <ol>${l.openingSteps.map((x, j) => `<li>${escapeHtml(j === 1 && soundGame ? l.soundGame(pick(soundGame, lang)) : x)}</li>`).join('')}</ol>
      <h5>${escapeHtml(l.strip)}</h5>
      ${stripHtml}
    </div>
    ${movedGroup(l.recall, recall, lang, l)}
    ${s.steps.filter((st) => !st.moved).map((st) => renderStep(st, lang, l)).join('')}
    ${i === scripts.length - 1 ? movedGroup(l.nextOpening, moved, lang, l) : ''}
  </section>`;
    });
    return renderHeader(w, lang, l) + days.join('') + renderSong(w, lang, l);
}

/** A heading and moved steps: the heading and the first step in one block, the other steps after it. */
function movedGroup(heading: string, steps: StorytimeStep[], lang: SupportedLanguage, l: StorytimeLabels): string {
    if (!steps.length) return '';
    const [first, ...rest] = steps.map((st) => renderStep(st, lang, l));
    return `<div class="st-moved-group"><h4>${escapeHtml(heading)}</h4>${first}</div>${rest.join('')}`;
}

/** The choreography sheet of the song (design §6.3): each line with its action, in the order sung. */
function renderSong(w: StorytimeWeek, lang: SupportedLanguage, l: StorytimeLabels): string {
    const song = w.song;
    if (!song) return '';
    const rows: string[] = [];
    let part = '';
    for (const line of song.lines) {
        if (line.part !== part) {
            part = line.part;
            rows.push(`<tr class="st-part"><td colspan="2">${escapeHtml(l.parts[line.part])}</td></tr>`);
        }
        const note = line.note ? `<br><em>${escapeHtml(pick(line.note, lang))}</em>` : '';
        const thai = l.gestures[line.gesture];
        rows.push(`<tr><td>${escapeHtml(line.text)}${note}</td><td>${escapeHtml(line.gesture)}${thai ? ` (${escapeHtml(thai)})` : ''}</td></tr>`);
    }
    const { intro, outro } = song.choreography;
    return `
  <section class="st-song" id="week-${w.meta.week}-song">
    <h3 class="st-day-title">${escapeHtml(l.songActions(song.title))}</h3>
    ${intro ? `<p><strong>${escapeHtml(l.songStart)}:</strong> ${escapeHtml(pick(intro, lang))}</p>` : ''}
    <table><tr><th>${escapeHtml(l.lyricLine)}</th><th>${escapeHtml(l.action)}</th></tr>${rows.join('')}</table>
    ${outro ? `<p><strong>${escapeHtml(l.songEnd)}:</strong> ${escapeHtml(pick(outro, lang))}</p>` : ''}
  </section>`;
}

export interface StorytimeManualOptions {
    lang?: SupportedLanguage;
    /** `a4` (the office print, default) or `book` (the printer's page). */
    paper?: TeacherManualPaper;
}

/**
 * Compiles the teacher book of one Storytime level: the title page and every week in week order.
 * @param weeks The parsed weeks of one level.
 * @param options The language and the paper.
 * @returns The HTML document and the week count. Throws when the weeks are of more than one level.
 */
export function compileStorytimeManual(weeks: StorytimeWeek[], options: StorytimeManualOptions = {}): { html: string; weekCount: number } {
    const lang = options.lang ?? 'en';
    const levels = [...new Set(weeks.map((w) => w.meta.level))];
    if (levels.length > 1) throw new Error(`A Storytime manual holds one level; these weeks are of levels ${levels.join(', ')}`);
    const l = storytimeLabels(lang);
    const level = levels[0] ?? 1;
    const levelLabel = l.level(level, l.grades[level]);
    const title = `
  <div class="tm-title-page">
    <div class="tm-title-content" style="border-color: ${THEME.primary};">
      <div class="tm-title-badge">${escapeHtml(l.badge)}</div>
      <div class="tm-title-divider" style="background: ${THEME.primary};"></div>
      <h1 class="tm-title-series st-title-series" style="color: ${THEME.primary};">${escapeHtml(l.product)}</h1>
      <p class="tm-title-level">${escapeHtml(levelLabel)}</p>
      <p class="tm-title-subtitle" style="color: ${THEME.secondary};">${escapeHtml(l.subtitle)}</p>
    </div>
  </div>`;
    const body = [...weeks].sort((a, b) => a.meta.week - b.meta.week).map((w) => renderStorytimeWeek(w, lang)).join('\n');
    const html = wrapTeacherManualDocument(title, body, '', {
        seriesName: l.product,
        seriesLevel: levelLabel,
        cefrLevel: '',
        type: 'primary',
        theme: THEME,
        lang,
        paper: options.paper ?? 'a4',
    });
    // The English book also has Thai text (a Thai letter in a step): the Thai print font, not a system font.
    const thaiInEnglish = lang === 'en' && /[\u0e00-\u0e7f]/.test(body)
        ? `${fontFaceCss(PRINT_FONT_FACES.filter((f) => f.family === 'Sarabun'))}\n    body, body * { font-family: 'Open Sans', 'Sarabun', sans-serif; }`
        : '';
    // In the head, not the body: Paged.js reads its page breaks only from the head styles.
    return { html: html.replace('</head>', `<style>${CSS}${thaiInEnglish}</style>\n</head>`), weekCount: weeks.length };
}
