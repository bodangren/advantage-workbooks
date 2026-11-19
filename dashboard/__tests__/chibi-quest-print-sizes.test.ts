import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';

// Track primary_v2_look_20261020, story S5 fix round 2: print sizes in the
// chibi-quest look (UX-1 step-header margin; PM decisions 1 and 2), and the
// retry r2 step 3 spacing that keeps the step 3 title with its article (P17,
// spec line 72). All rules are scoped to the chibi-quest look. The file reads
// no package, no Thai, and no image; the golden guard compares digests and
// prints no text on pass.
//
// Unit conversion (CSS absolute units): 96 px = 1 in = 25.4 mm = 72 pt.
// So 8 pt = 10.67 px, 4 mm = 15.12 px, and 8 mm = 30.24 px (about 30 px).

const HEADER = '.look-chibi-quest div.section-header';
const THAI = '.look-chibi-quest .thai-translation';
const LABELS = [
  '.look-chibi-quest .q-label',
  '.look-chibi-quest .a-label',
  '.look-chibi-quest .para-note-label',
  '.look-chibi-quest .tip-label',
  '.look-chibi-quest .planning-label',
  '.look-chibi-quest .qr-label',
];
const LINES = ['.look-chibi-quest .writing-line', '.look-chibi-quest .writing-line-small'];
const STEP3_HEADER = '.look-chibi-quest .read-article-step .section-header';
const STEP3_QR = '.look-chibi-quest .read-article-step .qr-box';

/** Parse active rules after removing comments; CSSOM keeps property names separate. */
function rules(css: string): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = css.replace(/\/\*[\s\S]*?\*\//g, '');
  document.head.appendChild(style);
  try {
    if (!style.sheet) throw new Error('The CSS parser produced no sheet.');
    return Array.from(style.sheet.cssRules).filter(
      (rule): rule is CSSStyleRule => 'selectorText' in rule,
    );
  } finally {
    style.remove();
  }
}

/** Resolve exact-selector declarations by importance and then source order. */
function winningProperty(css: string, selector: string, property: string): string {
  let value = '';
  let important = false;
  for (const rule of rules(css)) {
    if (!rule.selectorText.split(',').some((part) => part.trim() === selector)) continue;
    const next = rule.style.getPropertyValue(property).trim();
    if (!next) continue;
    const nextImportant = rule.style.getPropertyPriority(property) === 'important';
    if (important && !nextImportant) continue;
    value = next;
    important = nextImportant;
  }
  return value;
}

/** Convert an absolute CSS length to px; NaN for anything else. */
function toPx(value: string): number {
  const match = value.trim().match(/^(-?[\d.]+)\s*(px|mm|cm|q|in|pt)?$/);
  if (!match) return NaN;
  const amount = parseFloat(match[1]);
  switch (match[2] ?? 'px') {
    case 'px':
      return amount;
    case 'mm':
      return (amount * 96) / 25.4;
    case 'cm':
      return ((amount * 10) * 96) / 25.4;
    case 'q':
      return ((amount / 4) * 96) / 25.4;
    case 'in':
      return amount * 96;
    case 'pt':
      return (amount * 96) / 72;
    default:
      return NaN;
  }
}

/** Convert an absolute CSS length to mm; NaN for anything else. */
function toMm(value: string): number {
  const px = toPx(value);
  return Number.isNaN(px) ? NaN : (px * 25.4) / 96;
}

/** The winning vertical margin side in px, expanding the margin shorthand. */
function marginSide(css: string, selector: string, side: 'top' | 'bottom'): number {
  const direct = toPx(winningProperty(css, selector, side === 'top' ? 'margin-top' : 'margin-bottom'));
  if (!Number.isNaN(direct)) return direct;
  const shorthand = winningProperty(css, selector, 'margin');
  if (!shorthand) return 0;
  const parts = shorthand.split(/\s+/);
  const pick = side === 'top' ? parts[0] : parts.length >= 3 ? parts[2] : parts[0];
  const px = toPx(pick ?? '');
  return Number.isNaN(px) ? 0 : px;
}

/** The winning vertical padding side in px, expanding the padding shorthand. */
function paddingSide(css: string, selector: string, side: 'top' | 'bottom'): number {
  const direct = toPx(winningProperty(css, selector, side === 'top' ? 'padding-top' : 'padding-bottom'));
  if (!Number.isNaN(direct)) return direct;
  const shorthand = winningProperty(css, selector, 'padding');
  if (!shorthand) return 0;
  const parts = shorthand.split(/\s+/);
  const pick = side === 'top' ? parts[0] : parts.length >= 3 ? parts[2] : parts[0];
  const px = toPx(pick ?? '');
  return Number.isNaN(px) ? 0 : px;
}

/** The line pitch in px: min-height plus top and bottom margins. */
function pitchOf(css: string, selector: string): number {
  const height = toPx(winningProperty(css, selector, 'min-height'));
  return (
    (Number.isNaN(height) ? 0 : height) +
    marginSide(css, selector, 'top') +
    marginSide(css, selector, 'bottom')
  );
}

/** Compare bytes without exposing source text in an assertion failure. */
function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('chibi-quest print sizes (S5 fix round 2)', () => {
  it('lifts the step header off the panel above by 3 to 5 mm', () => {
    const css = getChibiQuestStyles();
    const raw = winningProperty(css, HEADER, 'margin-top');
    expect(raw, `${HEADER} margin-top`).not.toBe('');
    const mm = toMm(raw);
    expect(mm, `${HEADER} margin-top`).toBeGreaterThanOrEqual(3);
    expect(mm, `${HEADER} margin-top`).toBeLessThanOrEqual(5);
  });

  it('sets every named label at 8 pt or more', () => {
    expect(LABELS).toEqual([
      '.look-chibi-quest .q-label',
      '.look-chibi-quest .a-label',
      '.look-chibi-quest .para-note-label',
      '.look-chibi-quest .tip-label',
      '.look-chibi-quest .planning-label',
      '.look-chibi-quest .qr-label',
    ]);
    const css = getChibiQuestStyles();
    for (const selector of LABELS) {
      const px = toPx(winningProperty(css, selector, 'font-size'));
      expect(px, `${selector} font-size`).toBeGreaterThanOrEqual(10.67);
    }
  });

  it('spaces writing lines at least 8 mm apart', () => {
    const css = getChibiQuestStyles();
    for (const selector of LINES) {
      expect(pitchOf(css, selector), `${selector} pitch`).toBeGreaterThanOrEqual(30);
    }
  });

  it('sets the Thai gloss upright at 8 pt or more', () => {
    const css = getChibiQuestStyles();
    const px = toPx(winningProperty(css, THAI, 'font-size'));
    expect(px, `${THAI} font-size`).toBeGreaterThanOrEqual(10.67);
    expect(winningProperty(css, THAI, 'font-style'), `${THAI} font-style`).toBe('normal');
    for (const rule of rules(css)) {
      if (rule.selectorText.split(',').some((part) => part.trim() === THAI)) {
        expect(rule.style.cssText, THAI).not.toMatch(/italic/);
      }
    }
  });

  it('keeps the step 3 title with its article by tightening step 3 spacing', () => {
    const css = getChibiQuestStyles();
    const headerMargin = winningProperty(css, STEP3_HEADER, 'margin-bottom');
    expect(headerMargin, `${STEP3_HEADER} margin-bottom`).not.toBe('');
    expect(toPx(headerMargin), `${STEP3_HEADER} margin-bottom`).toBeLessThanOrEqual(4);
    const qrMargin = winningProperty(css, STEP3_QR, 'margin');
    expect(qrMargin, `${STEP3_QR} margin`).not.toBe('');
    expect(
      marginSide(css, STEP3_QR, 'top') + marginSide(css, STEP3_QR, 'bottom'),
      `${STEP3_QR} vertical margin`,
    ).toBeLessThanOrEqual(6);
    const qrPadding = winningProperty(css, STEP3_QR, 'padding');
    expect(qrPadding, `${STEP3_QR} padding`).not.toBe('');
    expect(paddingSide(css, STEP3_QR, 'top'), `${STEP3_QR} padding-top`).toBeLessThanOrEqual(4);
    expect(paddingSide(css, STEP3_QR, 'bottom'), `${STEP3_QR} padding-bottom`).toBeLessThanOrEqual(4);
  });

  it('keeps the new size rules out of the classic styles', () => {
    const classic = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'document-wrapper', 'styles.ts'),
      'utf8',
    );
    expect(classic, 'classic styles').not.toContain('.look-chibi-quest');
  });

  it('keeps the classic golden lesson byte-identical without printing its text', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8')) as PrintExport;
    const variants = [
      lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel),
      lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { look: 'classic' }),
      lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { answerKey: false }),
      lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        answerKey: false,
        look: 'classic',
      }),
    ];
    const goldens = ['lesson-05.html', 'lesson-05.html', 'lesson-05-no-key.html', 'lesson-05-no-key.html'].map(
      (name) => fs.readFileSync(path.join(base, 'golden', name)),
    );
    for (const [index, output] of (await Promise.all(variants)).entries()) {
      expect(digest(output), `variant ${index}`).toBe(digest(goldens[index]));
    }
  });
});
