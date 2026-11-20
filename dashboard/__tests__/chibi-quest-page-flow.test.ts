import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHIBI_QUEST_THEME, getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { getPrintStyles } from '../lib/document-wrapper/styles';
import { lessonDocument } from '../lib/print/print-export';

// Track primary_v2_look_20261020, Phase S5.R4 (Red): page flow for UX2-1,
// UX2-2, and UX2-3 (proof round 8, reviewer report ux-browser-s5-8ae1bb25).
// The file reads no package, no Thai, and no image. It compares CSS
// declarations and digests only. Console lines print mm values and counts
// only, never lesson text.
//
// Page budget (mm): the book page is 210 mm x 285 mm with a 20 mm margin
// (getPrintStyles, @page size 210mm 285mm, margin 20mm). Content height is
// 285 - 20 - 20 = 245 mm. UX2-1 measures the step 11 header at about 17 mm
// and the guided-writing box at about 232 mm, for a total of about 249 mm,
// which is 4 mm over the 245 mm page. The forced break-before on
// .guided-writing-step (primary_template.html line 580) then strands the
// header alone on page 11 (Quest 5) and page 13 (Adventure 9.2).
//
// Falsifiable fixture: a future proof where the step 11 header shares its
// page with the first lines of the writing box passes test 1; a proof where
// the strip shares its page with MY SCORE passes test 2; a proof where
// paragraph 1 starts on the hero page passes test 3. Proof round 8 fails
// tests 1 to 3 at HEAD.

const GUIDED_STEP = '.look-chibi-quest .guided-writing-step';
const GUIDED_HEADER = '.look-chibi-quest .guided-writing-step .section-header';
const GUIDED_BOX = '.look-chibi-quest .guided-writing-section';
const SCORE_STRIP = '.look-chibi-quest .performance-check';
const SCORE_BOX = '.look-chibi-quest .score-box';
const HERO_AREA = '.look-chibi-quest .read-article-step .article-image-area';
const FIRST_PARA = '.look-chibi-quest .read-article-step .paragraph';

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

/** Every declaration block of the selector in the CSS text. */
function scopedBlocks(css: string, selector: string): string[] {
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at < 0) return bodies;
    const open = css.indexOf('{', at + selector.length);
    if (open < 0) return bodies;
    const close = css.indexOf('}', open + 1);
    if (close < 0) return bodies;
    bodies.push(css.slice(open + 1, close));
    from = close + 1;
  }
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

describe('chibi-quest page flow (S5.R4, UX2-1 to UX2-3)', () => {
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

  it('lets article paragraph 1 sit beside the hero', () => {
    const tpl = fs.readFileSync(path.join(process.cwd(), 'templates', 'primary_template.html'), 'utf8');
    expect(tpl.includes('article-image-area'), 'hero area marker').toBe(true);
    expect(tpl.includes('article-text'), 'article text marker').toBe(true);
    const css = getChibiQuestStyles();
    console.log('hero_width_mm 84.8');
    // No rule may force the first paragraph below or past the hero; the hero
    // keeps its left float at full inline width (84.8 mm) and the first
    // paragraph clears nothing.
    expect(winningProperty(css, HERO_AREA, 'float'), `${HERO_AREA} float`).toBe('left');
    const blocks = scopedBlocks(css, FIRST_PARA);
    for (const body of blocks) {
      expect(body, FIRST_PARA).not.toMatch(/clear\s*:\s*both/);
      expect(body, FIRST_PARA).not.toMatch(/break-before\s*:\s*page/);
    }
    expect(blocks.length > 0 || winningProperty(css, FIRST_PARA, 'clear') === 'none', `${FIRST_PARA} clear`).toBe(true);
  });

  it('keeps the classic golden lesson byte-identical without printing its text', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const digest = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const golden = fs.readFileSync(path.join(base, 'golden', 'lesson-05.html'));
    const output = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel);
    expect(digest(output), 'classic variant').toBe(digest(golden));
  });
});
