import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';

// Track primary_v2_look_20261020, story S5 fix round 2 (PM decision 1): the hero
// prints at full inline width, 84.8 mm, like the other pictures. The hero rule
// requires width 84.8mm, max-width 100%, and height auto, with no max-height cap
// (review A F11). The inline keep and hero no-avoid guards stay (assertions 2
// and 3). Assertion 4 reads the real template (review A r2 F13). The classic
// golden stays byte-identical. This file reads no package, no Thai, and no image
// except the golden byte-identity guard, which compares bytes and prints no text
// on pass.

// The inline figure wrapper lives in dashboard/templates/primary_template.html:
// the caption sits inside the same inline-img-box as the image. The hero
// wrappers (the article-image-area and the article-image-box of the hero block)
// carry no keep rule here.

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

/** True when the CSS holds the selector in one rule block that declares every listed property. */
function scopedRule(css: string, selector: string, declarations: RegExp[]): boolean {
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at < 0) return false;
    const open = css.indexOf('{', at + selector.length);
    if (open < 0) return false;
    const close = css.indexOf('}', open + 1);
    if (close < 0) return false;
    const body = css.slice(open + 1, close);
    if (declarations.every((declaration) => declaration.test(body))) return true;
    from = close + 1;
  }
}

/** True when the CSS holds the selector in a rule block that declares both keep properties. */
function scopedKeepRule(css: string, selector: string): boolean {
  let from = 0;
  for (;;) {
    const at = css.indexOf(selector, from);
    if (at < 0) return false;
    const open = css.indexOf('{', at + selector.length);
    if (open < 0) return false;
    const close = css.indexOf('}', open + 1);
    if (close < 0) return false;
    const body = css.slice(open + 1, close);
    const keep = /break-inside\s*:\s*avoid/.test(body) && /page-break-inside\s*:\s*avoid/.test(body);
    if (keep) return true;
    from = close + 1;
  }
}

describe('chibi-quest picture keep (review A F5, S5 fix round 2)', () => {
  it('prints the hero at full inline width with no height cap in the chibi-quest look only', () => {
    const css = getChibiQuestStyles();
    expect(
      scopedRule(css, '.look-chibi-quest .hero-img-box img', [
        /(?<!max-)width\s*:\s*84\.8mm/,
        /max-width\s*:\s*100%/,
        /(?<!max-)height\s*:\s*auto/,
      ]),
      '.look-chibi-quest .hero-img-box img',
    ).toBe(true);
    for (const body of scopedBlocks(css, '.look-chibi-quest .hero-img-box img')) {
      expect(body, 'hero rule').not.toMatch(/max-height/);
    }
    const classic = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'document-wrapper', 'styles.ts'),
      'utf8',
    );
    expect(classic, 'classic styles').not.toContain('hero-img-box');
  });
  it('keeps the inline figure with its caption in the chibi-quest styles only', () => {
    const css = getChibiQuestStyles();
    expect(scopedKeepRule(css, '.look-chibi-quest .inline-img-box'), '.look-chibi-quest .inline-img-box').toBe(true);
  });

  it('puts no keep rule on the hero wrappers, so Paged.js keeps the hero', () => {
    const css = getChibiQuestStyles();
    for (const selector of [
      '.look-chibi-quest .article-image-area',
      '.look-chibi-quest .article-image-box',
    ]) {
      expect(scopedKeepRule(css, selector), selector).toBe(false);
    }
  });

  it('holds the image and its caption inside the same inline wrapper in the template', () => {
    const tpl = fs.readFileSync(
      path.join(process.cwd(), 'templates', 'primary_template.html'),
      'utf8',
    );
    const boxes = tpl.match(/<div class="article-image-box inline-img-box[^"]*">([\s\S]*?)<\/div>/g) ?? [];
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box).toMatch(/<img\b[^>]*>/);
      expect(box).toContain('article-image-caption');
    }
  });

  it('keeps the classic golden lesson byte-identical', async () => {
    const content = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary');
    const golden = path.join(content, 'origins-3.2', 'print', 'golden');
    const record = JSON.parse(
      fs.readFileSync(path.join(content, 'origins-3.2', 'print', 'p05.json'), 'utf8'),
    ) as PrintExport;
    const withKey = fs.readFileSync(path.join(golden, 'lesson-05.html'), 'utf8');
    const noKey = fs.readFileSync(path.join(golden, 'lesson-05-no-key.html'), 'utf8');
    expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel)).toBe(
      withKey,
    );
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        look: 'classic',
      }),
    ).toBe(withKey);
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        answerKey: false,
      }),
    ).toBe(noKey);
    expect(
      await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
        answerKey: false,
        look: 'classic',
      }),
    ).toBe(noKey);
  });

  it('keeps the chibi-quest styles flat with no transparency, shadow, or emoji', () => {
    const css = getChibiQuestStyles();
    expect(css).not.toMatch(/gradient|rgba\(|hsla\(|opacity|box-shadow|text-shadow/);
    expect(css).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
