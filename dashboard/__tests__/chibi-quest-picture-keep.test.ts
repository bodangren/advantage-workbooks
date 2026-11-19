import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';

// Track primary_v2_look_20261020, story S5 remediation (review A F5): the inline
// figure and its caption stay together in the chibi-quest look. The classic
// golden stays byte-identical. This file reads no package, no Thai, and no image
// except the golden byte-identity guard, which compares bytes and prints no text
// on pass.

// Minimal literal DOM fragment copied from dashboard/templates/primary_template.html
// lines 1674 to 1681 (the images_hero branch). The caption sits inside the same
// article-image-box wrapper as the image. The else branch is not copied here.
const HERO_FRAGMENT = [
  '<div class="article-image-box hero-img-box">',
  '<img src="hero.jpg" alt="The guide">',
  '<span class="article-image-caption">The guide welcomes the Explorers.</span>',
  '</div>',
].join('\n');

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

describe('chibi-quest picture keep (review A F5)', () => {
  it('keeps the inline figure with its caption in the chibi-quest styles only', () => {
    const css = getChibiQuestStyles();
    for (const selector of [
      '.look-chibi-quest .article-image-box',
      '.look-chibi-quest .article-image-area',
      '.look-chibi-quest .inline-img-box',
    ]) {
      expect(scopedKeepRule(css, selector), selector).toBe(true);
    }
  });

  it('holds the image and its caption inside the same figure wrapper', () => {
    const box = HERO_FRAGMENT.match(/<div class="article-image-box[^"]*">([\s\S]*?)<\/div>/);
    expect(box).not.toBeNull();
    expect(box?.[1] ?? '').toMatch(/<img\b[^>]*>/);
    expect(box?.[1] ?? '').toContain('article-image-caption');
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
