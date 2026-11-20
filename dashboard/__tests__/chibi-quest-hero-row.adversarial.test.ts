import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';

// S5 round 3: F31 partial declarations, look isolation, key order, and input boundaries.
// These are renderer and CSS artifact tests. They do not prove Paged.js pagination.
// Fixtures use the same renderer as the page-flow tests. No command or renderer is mocked.
// Assertions expose digests, declarations, and counts only. They never expose lesson text.
const ROOT = path.resolve(process.cwd(), '..');
const BASE = path.join(ROOT, 'content/primary/origins-3.2/print');
const PHASE_BASE = '04275398c9411b45685733e20fc003945524ad72';
const ROW_PARAGRAPH = '.look-chibi-quest .chibi-hero-row .paragraph';
const KEY = '.look-chibi-quest .read-article-step .marking-legend';
const THAI = /[\u0e00-\u0e7f]/u;

/** Remove every th key and every string that contains a Thai character. */
function englishOnly(value: unknown): unknown {
  if (typeof value === 'string') return THAI.test(value) ? undefined : value;
  if (Array.isArray(value)) return value.map(englishOnly).filter((item) => item !== undefined);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
      if (key === 'th' || THAI.test(key)) return [];
      const filtered = englishOnly(item);
      return filtered === undefined ? [] : [[key, filtered]];
    }));
  }
  return value;
}

/** Read the fixture without exposing its text. Keep raw data only for the byte-identity test. */
function fixture(filtered = true): PrintExport {
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(BASE, 'p05.json'), 'utf8'));
  if (!filtered) return raw as PrintExport;
  const clean = englishOnly(raw);
  expect(THAI.test(JSON.stringify(clean)), 'filtered fixture Thai presence').toBe(false);
  return clean as PrintExport;
}

/** Compare text or bytes without displaying the source. */
function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Parse only body markup, without loading styles, scripts, pictures, or remote resources. */
function body(html: string): HTMLElement {
  const open = html.indexOf('<body');
  const start = html.indexOf('>', open) + 1;
  const end = html.lastIndexOf('</body>');
  expect(open >= 0 && start > open && end > start, 'document body present').toBe(true);
  const host = document.createElement('div');
  host.className = /<body[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
  host.innerHTML = html.slice(start, end)
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/[\u0e00-\u0e7f]/gu, '');
  return host;
}

/** Parse active CSS rules after removing comments. Chibi kit rules have no media wrapper. */
function rules(css: string): CSSStyleRule[] {
  const style = document.createElement('style');
  style.textContent = css.replace(/\/\*[\s\S]*?\*\//g, '');
  document.head.appendChild(style);
  try {
    if (!style.sheet) throw new Error('The CSS parser produced no sheet.');
    return Array.from(style.sheet.cssRules).filter((rule): rule is CSSStyleRule => 'selectorText' in rule);
  } finally {
    style.remove();
  }
}

/** Read one exact property independently. Never substitute an unrelated ancestor declaration. */
function declaration(css: string, selector: string, property: string): string {
  let value = '';
  let important = false;
  for (const rule of rules(css)) {
    if (!rule.selectorText.split(',').some((part) => part.trim() === selector)) continue;
    const next = rule.style.getPropertyValue(property).trim();
    if (!next) continue;
    const priority = rule.style.getPropertyPriority(property) === 'important';
    if (important && !priority) continue;
    value = next;
    important = priority;
  }
  return value;
}

/** Render through the public print path with the supplied look and answer-key setting. */
async function render(record: PrintExport, look: 'classic' | 'chibi-quest', answerKey = true): Promise<string> {
  return lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { look, answerKey });
}

/** Require one article paragraph per source entry, with exact text and order. */
function assertParagraphs(host: HTMLElement, record: PrintExport): void {
  const paragraphs = Array.from(host.querySelectorAll('.read-article-step .paragraph'));
  expect(paragraphs.length, 'article paragraph count').toBe(record.lesson.article_paragraphs.length);
  paragraphs.forEach((paragraph, index) => {
    const source = record.lesson.article_paragraphs[index];
    expect(paragraph.querySelector('.para-number')?.textContent?.trim(), `paragraph ${index} number`).toBe(String(source.number));
    const text = paragraph.cloneNode(true) as HTMLElement;
    text.querySelectorAll('.para-number, .article-image-box, .clear-right').forEach((node) => node.remove());
    // The template adds indentation outside the source text. Preserve all source characters inside it.
    expect(digest(text.textContent?.trim() ?? ''), `paragraph ${index} text digest`).toBe(digest(source.text));
  });
}

describe('S5 adversarial hero row (round 3, F31)', () => {
  it('requires font-size and line-height independently on the real row paragraph', async () => {
    const host = body(await render(fixture(), 'chibi-quest'));
    const paragraph = host.querySelector('.chibi-hero-row .paragraph');
    expect(paragraph !== null, 'row paragraph present').toBe(true);
    expect(paragraph?.matches(ROW_PARAGRAPH), 'scoped selector matches the rendered paragraph').toBe(true);
    expect(paragraph?.closest('.article-text') === null, 'article-text is not an ancestor').toBe(true);
    const css = getChibiQuestStyles();
    expect(declaration(css, ROW_PARAGRAPH, 'font-size'), 'independent paragraph font-size').toBe('12pt');
    expect(declaration(css, ROW_PARAGRAPH, 'line-height'), 'independent paragraph line-height').toBe('2');
    expect(declaration(css, ROW_PARAGRAPH, 'margin-bottom'), 'independent paragraph bottom margin').toBe('0px');
  });

  it.each(['font-size', 'line-height'] as const)('rejects a partial %s deletion without an ancestor fallback', (property) => {
    const css = getChibiQuestStyles();
    const mutant = css.replace(/(\.look-chibi-quest \.chibi-hero-row \.paragraph\s*\{)([^}]*)(\})/,
      (_, open: string, declarations: string, close: string) =>
        open + declarations.replace(new RegExp(`\\b${property}\\s*:[^;]+;`), '') + close);
    expect(mutant !== css, 'partial mutant applied').toBe(true);
    expect(declaration(mutant, ROW_PARAGRAPH, property), 'deleted property stays absent').toBe('');
    const kept = property === 'font-size' ? 'line-height' : 'font-size';
    expect(declaration(mutant, ROW_PARAGRAPH, kept), 'other declaration survives').toBe(property === 'font-size' ? '2' : '12pt');
  });

  it.each([true, false])('keeps the marking key before the row and paragraph 1 (answer key: %s)', async (answerKey) => {
    const record = fixture();
    const host = body(await render(record, 'chibi-quest', answerKey));
    const section = host.querySelector('.read-article-step');
    const legends = section?.querySelectorAll('.marking-legend');
    const legend = legends?.[0];
    const row = section?.querySelector('.chibi-hero-row');
    const paragraph = row?.querySelector('.paragraph');
    expect(legends?.length, 'one marking key').toBe(1);
    expect(legend, 'marking key present').toBeDefined();
    expect(Boolean(row && paragraph), 'row and first paragraph present').toBe(true);
    expect(Boolean(legend!.compareDocumentPosition(row!) & Node.DOCUMENT_POSITION_FOLLOWING), 'key before row').toBe(true);
    expect(Boolean(legend!.compareDocumentPosition(paragraph!) & Node.DOCUMENT_POSITION_FOLLOWING), 'key before paragraph 1').toBe(true);
    expect(row?.querySelectorAll('.paragraph').length, 'one paragraph in row').toBe(1);
    assertParagraphs(host, record);
  });

  it('keeps the compact key and zero paragraph margin scoped to the chibi look', async () => {
    const css = getChibiQuestStyles();
    expect(declaration(css, KEY, 'margin-bottom'), 'compact key bottom margin').toBe('4px');
    expect(declaration(css, KEY, 'padding'), 'compact key padding').toBe('2px 10px');
    const classic = body(await render(fixture(), 'classic'));
    const paragraph = classic.querySelector('.read-article-step .paragraph');
    const legend = classic.querySelector('.read-article-step .marking-legend');
    expect(Boolean(paragraph && legend), 'classic targets present').toBe(true);
    for (const rule of rules(css)) {
      if (!['font-size', 'line-height', 'margin-bottom', 'padding'].some((property) => rule.style.getPropertyValue(property))) continue;
      for (const selector of rule.selectorText.split(',')) {
        expect(paragraph!.matches(selector.trim()) || legend!.matches(selector.trim()), 'chibi rule matches no classic target').toBe(false);
      }
    }
  });

  it('keeps all four classic variants byte-identical to the pinned phase-base goldens', async () => {
    // Raw Thai stays in process memory for byte comparison only. No assertion displays raw text.
    const record = fixture(false);
    for (const answerKey of [true, false]) {
      const file = `content/primary/origins-3.2/print/golden/lesson-05${answerKey ? '' : '-no-key'}.html`;
      const pinned = execFileSync('git', ['show', `${PHASE_BASE}:${file}`], { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
      expect(digest(fs.readFileSync(path.join(ROOT, file))), 'golden digest equals phase base').toBe(digest(pinned));
      for (const explicit of [true, false]) {
        const html = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel,
          explicit ? { look: 'classic', answerKey } : { answerKey });
        expect(digest(html), `classic bytes: key ${answerKey}, explicit ${explicit}`).toBe(digest(pinned));
        const host = body(html);
        expect(host.querySelectorAll('.chibi-hero-row').length, 'classic hero row count').toBe(0);
        expect(host.classList.contains('look-chibi-quest'), 'classic body class').toBe(false);
        expect(/<style\b[^>]*data-look="chibi-quest"/.test(html), 'classic chibi stylesheet').toBe(false);
      }
    }
  });

  it.each(['no hero', 'short first paragraph', 'long first paragraph', 'legacy hero', 'one paragraph', 'nonsequential numbers'])
    ('preserves every paragraph and inline image with %s', async (boundary) => {
      const record = fixture();
      if (boundary === 'no hero') {
        record.lesson.article_images = record.lesson.article_images?.filter((image) => image.position !== 'hero');
        record.lesson.article_image_url = '';
      }
      if (boundary === 'short first paragraph') record.lesson.article_paragraphs[0].text = 'Go.';
      if (boundary === 'long first paragraph') {
        record.lesson.article_paragraphs[0].text = Array.from({ length: 1200 }, (_, index) => `word${index}`).join(' ') + ' <end> & "last".';
      }
      if (boundary === 'legacy hero') {
        record.lesson.article_images = record.lesson.article_images?.filter((image) => image.position !== 'hero');
        record.lesson.article_image_url = 'https://example.invalid/legacy-hero.png';
        record.lesson.article_caption = 'Legacy <hero> & caption';
      }
      if (boundary === 'one paragraph') {
        record.lesson.article_paragraphs = record.lesson.article_paragraphs.slice(0, 1);
        record.lesson.article_images = record.lesson.article_images?.filter((image) => image.position === 'hero');
      }
      if (boundary === 'nonsequential numbers') {
        record.lesson.article_paragraphs.forEach((paragraph, index) => { paragraph.number = [7, 2, 11][index]; });
        record.lesson.article_images = record.lesson.article_images?.filter((image) => !image.position.startsWith('inline-'));
      }
      for (const look of ['chibi-quest', 'classic'] as const) {
        const host = body(await render(record, look));
        const section = host.querySelector('.read-article-step');
        expect(section !== null, 'article section present').toBe(true);
        assertParagraphs(host, record);
        expect(section?.querySelectorAll('.chibi-hero-row').length, 'look-specific row count').toBe(look === 'chibi-quest' ? 1 : 0);
        const expectedImages = (record.lesson.article_images ?? []).filter((image) => image.position === 'hero' || image.position.startsWith('inline-'));
        const actualImages = Array.from(section!.querySelectorAll('.article-container img'));
        expect(actualImages.length, 'article image count').toBe(expectedImages.length + (boundary === 'legacy hero' ? 1 : 0));
        for (const image of expectedImages) {
          expect(actualImages.filter((node) => node.getAttribute('src') === image.url).length, 'source image occurs once').toBe(1);
        }
        if (boundary === 'no hero') expect(section?.querySelectorAll('.article-image-area img').length, 'absent hero image').toBe(0);
        if (boundary === 'legacy hero') expect(section?.querySelector('.article-image-area img')?.getAttribute('src'), 'legacy hero source').toBe(record.lesson.article_image_url);
      }
    });
});
