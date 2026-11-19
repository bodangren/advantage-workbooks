import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';
import { renderMultipleLessons } from '../lib/template-renderer';
import { wrapSingleLessonDocument } from '../lib/workbook-document-wrapper';
import { WorkbookLessonSchema } from '../lib/workbook-schema';

// Track primary_v2_look_20261020, S5, review A F18.
// These artifact tests do not prove Paged.js pagination or the printed picture size.
// The synthetic lesson has English text only. Hash assertions never print golden text.
const HERO = '.look-chibi-quest .hero-img-box img';
const INLINE = '.look-chibi-quest .inline-img-box';
const PHASE_BASE = '82c58b7ecaa64da87eb69a755ce9111fa1ac3c93';
const ROOT = path.resolve(process.cwd(), '..');

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

/** Compare bytes without exposing source text in an assertion failure. */
function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

const lesson = WorkbookLessonSchema.parse({
  lesson_title: 'Picture guards',
  vocabulary: [{ word: 'map', definition: 'A drawing of a place.' }],
  article_paragraphs: [{ number: 1, text: 'Mia has a map.' }],
  article_images: [
    { url: 'https://example.invalid/hero.png', caption: 'Hero caption.', position: 'hero' },
    { url: 'https://example.invalid/inline.png', caption: 'Inline caption.', position: 'inline-para-1' },
  ],
  comprehension_questions: [{ number: 1, question: 'What does Mia have?', options: ['A map', 'A cat'] }],
  short_answer_question: 'What does Mia have?',
  writing_prompt: 'Write about a map.',
});

describe('S5 adversarial picture guards (review A F18)', () => {
  it.each([
    ['width', 'auto'],
    ['max-width', '100%'],
    ['max-height', '240px'],
  ])('uses the last active hero %s declaration with its exact property name', (property, value) => {
    expect(winningProperty(getChibiQuestStyles(), HERO, property), property).toBe(value);
  });

  it('rejects the F18 typo, later override, and commented rule in parser controls', () => {
    const valid = `${HERO} { width: auto; max-width: 100%; max-height: 240px; }`;
    expect(winningProperty(valid, HERO, 'width')).toBe('auto');
    expect(winningProperty(valid.replace('width: auto', 'max-width: auto'), HERO, 'width')).toBe('');
    expect(winningProperty(`${valid}\n${HERO} { width: 100%; }`, HERO, 'width')).toBe('100%');
    expect(winningProperty(`/* ${valid} */`, HERO, 'width')).toBe('');
    expect(winningProperty('', HERO, 'width')).toBe('');
    expect(winningProperty(`${HERO} { width: auto !important; }\n${HERO} { width: 100%; }`, HERO, 'width')).toBe('auto');
  });

  it('scopes every hero and inline rule to the chibi-quest look', () => {
    const pictureRules = rules(getChibiQuestStyles()).filter(
      (rule) => /\.(?:hero-img-box|inline-img-box)\b/.test(rule.selectorText),
    );
    expect(pictureRules.length).toBeGreaterThanOrEqual(2);
    for (const rule of pictureRules) {
      expect(rule.selectorText.split(',').every((selector) => selector.trim().startsWith('.look-chibi-quest '))).toBe(true);
    }
    expect(winningProperty(getChibiQuestStyles(), INLINE, 'break-inside')).toBe('avoid');
    expect(winningProperty(getChibiQuestStyles(), INLINE, 'page-break-inside')).toBe('avoid');
    for (const wrapper of ['.article-image-area', '.article-image-box']) {
      for (const property of ['break-inside', 'page-break-inside']) {
        expect(winningProperty(getChibiQuestStyles(), `.look-chibi-quest ${wrapper}`, property)).toBe('');
      }
    }
  });

  it('renders the hero and inline image inside their distinct wrappers with their captions', async () => {
    const html = await renderMultipleLessons([lesson], { type: 'primary', look: 'chibi-quest' });
    const fragment = document.createElement('template');
    fragment.innerHTML = html;
    expect(fragment.content.querySelectorAll('.hero-img-box')).toHaveLength(1);
    expect(fragment.content.querySelectorAll('.inline-img-box')).toHaveLength(1);
    for (const [boxClass, source, caption] of [
      ['hero-img-box', 'hero.png', 'Hero caption.'],
      ['inline-img-box', 'inline.png', 'Inline caption.'],
    ]) {
      const box = fragment.content.querySelector(`.${boxClass}`);
      expect(box?.querySelectorAll('img')).toHaveLength(1);
      expect(box?.querySelector('img')?.getAttribute('src')).toBe(`https://example.invalid/${source}`);
      expect(box?.querySelector('.article-image-caption')?.textContent?.trim()).toBe(caption);
    }
  });

  it('adds the scoped picture rules only to the chibi-quest document', async () => {
    const html = await renderMultipleLessons([lesson], { type: 'primary', look: 'chibi-quest' });
    for (const look of ['classic', 'chibi-quest'] as const) {
      const output = wrapSingleLessonDocument(html, null, {
        type: 'primary', seriesName: 'Quest 5', seriesLevel: 'A1', seriesTagline: '', look,
      });
      const lookStyles = output.match(/<style data-look="chibi-quest">([\s\S]*?)<\/style>/g) ?? [];
      expect(lookStyles).toHaveLength(look === 'classic' ? 0 : 1);
      expect(output.includes(HERO)).toBe(look === 'chibi-quest');
      expect(output.includes(INLINE)).toBe(look === 'chibi-quest');
    }
  });

  it('keeps the classic styles and golden files unchanged from the phase base', () => {
    for (const file of [
      'dashboard/lib/document-wrapper/styles.ts',
      'content/primary/origins-3.2/print/golden/lesson-05.html',
      'content/primary/origins-3.2/print/golden/lesson-05-no-key.html',
    ]) {
      const before = execFileSync('git', ['show', `${PHASE_BASE}:${file}`], { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
      expect(digest(fs.readFileSync(path.join(ROOT, file))), file).toBe(digest(before));
    }
  });

  it.each([undefined, 'classic'] as const)('keeps the %s classic render byte-identical without printing its text', async (look) => {
    const base = path.join(ROOT, 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8')) as PrintExport;
    for (const answerKey of [true, false]) {
      const output = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { look, answerKey });
      const golden = fs.readFileSync(path.join(base, 'golden', answerKey ? 'lesson-05.html' : 'lesson-05-no-key.html'));
      expect(digest(output)).toBe(digest(golden));
    }
  });
});
