import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHIBI_QUEST_THEME, getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { getPrintStyles } from '../lib/document-wrapper/styles';
import { lessonDocument } from '../lib/print/print-export';

// Track primary_v2_look_20261020, Phase S5.R5 (Red): page flow for UX2-3
// option B (PM 2026-11-20). The hero and paragraph 1 share one two-column
// row in the chibi-quest look only. The file reads no package, no Thai,
// and no image. It compares CSS declarations and digests only. Console
// lines print mm values and counts only, never lesson text.
//
// Page budget (mm): the book page is 210 mm x 285 mm with a 20 mm margin
// (getPrintStyles, @page size 210mm 285mm, margin 20mm). Content height is
// 285 - 20 - 20 = 245 mm. Proof round 9 leaves an empty column beside the
// hero on Adventure 9.2 page 3: the hero prints 84.67 mm wide, paragraph 1
// starts on page 4, P20 exits 1. A float does not fix it: Paged.js does not
// flow paragraph 1 beside the float. Option B puts the hero and paragraph 1
// in one row container with a two-column layout.
//
// Falsifiable fixture: a future proof where paragraph 1 starts on the hero
// page passes test 3; a proof where the strip shares its page with MY SCORE
// passes test 2; a proof where the step 11 header shares its page with the
// box start passes test 1. Proof round 9 fails test 3 only.

const GUIDED_STEP = '.look-chibi-quest .guided-writing-step';
const GUIDED_HEADER = '.look-chibi-quest .guided-writing-step .section-header';
const GUIDED_BOX = '.look-chibi-quest .guided-writing-section';
const SCORE_STRIP = '.look-chibi-quest .performance-check';
const SCORE_BOX = '.look-chibi-quest .score-box';
const HERO_ROW = '.look-chibi-quest .chibi-hero-row';

/** Parse the @page size and margin from the print CSS. */
function pageBudget(css: string): { widthMm: number; heightMm: number; marginMm: number } {
  const size = css.match(/@page\s*\{[^}]*size\s*:\s*([\d.]+)mm\s+([\d.]+)mm/) ?? [];
  const margin = css.match(/@page\s*\{[^}]*margin\s*:\s*([\d.]+)mm/) ?? [];
  return {
    widthMm: size.length >= 3 ? parseFloat(size[1]) : NaN,
    heightMm: size.length >= 3 ? parseFloat(size[2]) : NaN,
    marginMm: margin.length >= 2 ? parseFloat(margin[1]) : NaN,
  };
}

/** The winning declaration value of one property for one exact selector. */
function winningProperty(css: string, selector: string, property: string): string {
  const style = document.createElement('style');
  style.textContent = css.replace(/\/\*[\s\S]*?\*\//g, '');
  document.head.appendChild(style);
  try {
    if (!style.sheet) return '';
    let value = '';
    let important = false;
    for (const rule of Array.from(style.sheet.cssRules)) {
      if (!('selectorText' in rule)) continue;
      const text = (rule as CSSStyleRule).selectorText;
      if (!text.split(',').some((part) => part.trim() === selector)) continue;
      const next = (rule as CSSStyleRule).style.getPropertyValue(property).trim();
      if (!next) continue;
      const nextImportant = (rule as CSSStyleRule).style.getPropertyPriority(property) === 'important';
      if (important && !nextImportant) continue;
      value = next;
      important = nextImportant;
    }
    return value;
  } finally {
    style.remove();
  }
}

/** Convert an absolute CSS length to mm; NaN for anything else. */
function toMm(value: string): number {
  const match = value.trim().match(/^(-?[\d.]+)\s*(px|mm|cm|q|in|pt)?$/);
  if (!match) return NaN;
  const amount = parseFloat(match[1]);
  switch (match[2] ?? 'px') {
    case 'px':
      return (amount * 25.4) / 96;
    case 'mm':
      return amount;
    case 'cm':
      return amount * 10;
    case 'q':
      return amount / 4;
    case 'in':
      return amount * 25.4;
    case 'pt':
      return (amount * 25.4) / 72;
    default:
      return NaN;
  }
}

/** All mm widths declared in rule blocks whose selector holds the row hook. */
function rowWidthsMm(css: string): number[] {
  const out: number[] = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let found: RegExpExecArray | null;
  for (;;) {
    found = rule.exec(clean);
    if (!found) return out;
    if (!found[1].includes('chibi-hero-row')) continue;
    const widths = found[2].match(/[\d.]+mm/g) ?? [];
    for (const token of widths) {
      const mm = toMm(token);
      if (!Number.isNaN(mm)) out.push(mm);
    }
  }
}

/** The row element HTML, found by balanced div scan from its class hook.
 *  The hook requires a class attribute, so embedded CSS selectors never match. */
function extractRow(html: string): string {
  const styleRanges: Array<[number, number]> = [];
  const styleRe = /<style\b[\s\S]*?<\/style\s*>/gi;
  let span: RegExpExecArray | null;
  for (;;) {
    span = styleRe.exec(html);
    if (!span) break;
    styleRanges.push([span.index, span.index + span[0].length]);
  }
  const pattern = /class\s*=\s*["'][^"']*\bchibi-hero-row\b[^"']*["']/g;
  let hook = -1;
  let found: RegExpExecArray | null;
  for (;;) {
    found = pattern.exec(html);
    if (!found) break;
    const at = found.index + found[0].indexOf('chibi-hero-row');
    if (styleRanges.some(([a, b]) => at >= a && at < b)) continue;
    hook = at;
    break;
  }
  if (hook < 0) return '';
  const open = html.lastIndexOf('<div', hook);
  if (open < 0) return '';
  let depth = 0;
  const tag = /<\/?div\b[^>]*>/g;
  tag.lastIndex = open;
  let node: RegExpExecArray | null;
  for (;;) {
    node = tag.exec(html);
    if (!node) return '';
    depth += node[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(open, tag.lastIndex);
  }
}

describe('chibi-quest page flow (S5.R5, UX2-3 option B)', () => {
  it('keeps the step 11 header with its writing box within the 245 mm page', () => {
    const budget = pageBudget(getPrintStyles(CHIBI_QUEST_THEME, { cover: false }));
    const contentMm = budget.heightMm - budget.marginMm * 2;
    console.log(`page_content_height_mm ${contentMm}`);
    console.log('step11_header_mm 17');
    console.log('step11_box_mm 232');
    console.log('step11_total_mm 249');
    expect(budget.widthMm, 'page width mm').toBe(210);
    expect(budget.heightMm, 'page height mm').toBe(285);
    expect(budget.marginMm, 'page margin mm').toBe(20);
    expect(contentMm, 'page content height mm').toBe(245);
    const css = getChibiQuestStyles();
    // The forced page break strands the 17 mm header alone; the pair needs
    // about 249 mm against 245 mm of room, so the fix must remove the forced
    // break and keep the header with the box start.
    expect(winningProperty(css, GUIDED_STEP, 'break-before'), `${GUIDED_STEP} break-before`).toBe('avoid');
    expect(winningProperty(css, GUIDED_HEADER, 'break-after'), `${GUIDED_HEADER} break-after`).toBe('avoid');
    expect(winningProperty(css, GUIDED_BOX, 'break-before'), `${GUIDED_BOX} break-before`).toBe('avoid');
  });

  it('keeps the self-assessment strip with its score box', () => {
    const tpl = fs.readFileSync(path.join(process.cwd(), 'templates', 'primary_template.html'), 'utf8');
    expect(tpl.includes('MY SCORE:'), 'score box marker').toBe(true);
    expect(tpl.includes('Excellent (5/5)'), 'strip marker').toBe(true);
    const css = getChibiQuestStyles();
    console.log('score_markers 2');
    // The strip must not break before the next step header; it stays with
    // MY SCORE on the step 7 page.
    expect(winningProperty(css, SCORE_STRIP, 'break-before'), `${SCORE_STRIP} break-before`).toBe('avoid');
    expect(winningProperty(css, SCORE_BOX, 'break-after'), `${SCORE_BOX} break-after`).toBe('avoid');
  });

  it('puts the hero and paragraph 1 in one two-column row (option B)', async () => {
    const css = getChibiQuestStyles();
    console.log('hero_row_width_mm 84.8');
    // The row uses a two-column layout, not a float. Paged.js does not flow
    // paragraph 1 beside a float, so the float contract cannot fix UX2-3.
    const display = winningProperty(css, HERO_ROW, 'display');
    expect(['grid', 'flex', 'inline-grid', 'inline-flex'], `${HERO_ROW} display`).toContain(display);
    expect(winningProperty(css, HERO_ROW, 'float'), `${HERO_ROW} float`).not.toBe('left');
    expect(winningProperty(css, HERO_ROW, 'break-inside'), `${HERO_ROW} break-inside`).toBe('avoid');
    expect(winningProperty(css, HERO_ROW, 'page-break-inside'), `${HERO_ROW} page-break-inside`).toBe('avoid');
    // The hero column holds 84.8 mm within 1 mm, like the other pictures.
    const widths = rowWidthsMm(css);
    console.log(`hero_row_widths_found ${widths.length}`);
    expect(widths.length, 'hero row mm widths').toBeGreaterThan(0);
    expect(widths.some((mm) => Math.abs(mm - 84.8) <= 1.0), 'hero column 84.8 mm').toBe(true);
    // The render puts the hero block and the first paragraph in one row.
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const html = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'chibi-quest',
    });
    expect(html.includes('look-chibi-quest'), 'chibi-quest body class').toBe(true);
    expect(html.includes('article-image-area'), 'hero area marker').toBe(true);
    expect(html.includes('chibi-hero-row'), 'hero row marker').toBe(true);
    const row = extractRow(html);
    expect(row.includes('article-image-area'), 'row holds hero').toBe(true);
    expect(row.includes('para-number">1') || row.includes('para-number"> 1'), 'row holds paragraph 1').toBe(true);
    expect(row.includes('para-number">2') || row.includes('para-number"> 2'), 'row holds paragraph 2').toBe(false);
    const para2 = html.indexOf('para-number">2') >= 0 ? html.indexOf('para-number">2') : html.indexOf('para-number"> 2');
    expect(para2, 'paragraph 2 marker').toBeGreaterThan(-1);
    expect(para2, 'paragraph 2 after row').toBeGreaterThan(html.indexOf('chibi-hero-row'));
  });

  it('keeps the classic golden lesson byte-identical without printing its text', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const digest = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const golden = fs.readFileSync(path.join(base, 'golden', 'lesson-05.html'));
    const output = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel);
    expect(digest(output), 'classic variant').toBe(digest(golden));
  });

  it('keeps the hero row out of the classic render', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const html = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'classic',
    });
    expect(html.includes('article-image-area'), 'classic hero marker').toBe(true);
    expect(html.includes('para-number'), 'classic paragraph marker').toBe(true);
    expect(html.includes('chibi-hero-row'), 'classic hero row').toBe(false);
    const classic = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'document-wrapper', 'styles.ts'),
      'utf8',
    );
    expect(classic, 'classic styles').not.toContain('chibi-hero-row');
  });
});
