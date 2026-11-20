import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument } from '../lib/print/print-export';

// Track primary_v2_look_20261020, Phase S5.R6 (Red): paragraph 1 type and
// marking-key order in the chibi hero row (Review A r7 F26, F27, F28).
// The file reads no Thai. It reads the origins-3.2 print fixture only,
// the same fixture as chibi-quest-page-flow.test.ts. Console lines print
// labeled values and counts only, never lesson text.

/** The winning declaration value of one property for one exact selector, print-aware. */
function winningPrintProperty(css: string, selector: string, property: string): string {
  const style = document.createElement('style');
  style.textContent = css.replace(/\/\*[\s\S]*?\*\//g, '');
  document.head.appendChild(style);
  try {
    if (!style.sheet) return '';
    let value = '';
    let important = false;
    const walk = (rules: ArrayLike<CSSRule>): void => {
      for (const rule of Array.from(rules)) {
        if ('media' in rule && 'cssRules' in rule) {
          walk((rule as CSSMediaRule).cssRules);
          continue;
        }
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
    };
    walk(style.sheet.cssRules);
    return value;
  } finally {
    style.remove();
  }
}

/** The full template CSS text from primary_template.html. */
function templateCss(): string {
  const tpl = fs.readFileSync(path.join(process.cwd(), 'templates', 'primary_template.html'), 'utf8');
  const blocks = tpl.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi) ?? [];
  return blocks.join('\n');
}

/** The row markup, found by class attribute only; embedded CSS never matches. */
function extractRowMarkup(html: string): string {
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

/** The markup index of the legend element (class attribute, never CSS text). */
function legendMarkupIndex(html: string): number {
  const at = html.search(/class\s*=\s*["'][^"']*\bmarking-legend\b[^"']*["']/);
  return at;
}

/** The markup index of paragraph N (span markup, never CSS text). */
function paraMarkupIndex(html: string, n: number): number {
  const plain = html.indexOf(`para-number">${n}`);
  if (plain >= 0) return plain;
  return html.indexOf(`para-number"> ${n}`);
}

/** The winning print line-height and font-size for paragraph N in the render. */
function paragraphPrintType(
  html: string,
  cssTemplate: string,
  cssChibi: string,
  n: number,
): { fontSize: string; lineHeight: string; insideArticleText: boolean } {
  const host = document.createElement('div');
  const bodyStart = html.indexOf('<body');
  const bodyOpen = bodyStart >= 0 ? html.indexOf('>', bodyStart) : -1;
  const bodyEnd = html.lastIndexOf('</body>');
  host.innerHTML = bodyOpen >= 0 && bodyEnd > bodyOpen ? html.slice(bodyOpen + 1, bodyEnd) : html;
  const paras = Array.from(host.querySelectorAll('.paragraph'));
  const target = paras.find((p) => (p.querySelector('.para-number')?.textContent ?? '').trim() === String(n));
  const insideArticleText = target ? target.closest('.article-text') !== null : false;
  const chibiLine =
    winningPrintProperty(cssChibi, '.look-chibi-quest .chibi-hero-row .paragraph', 'line-height') ||
    winningPrintProperty(cssChibi, '.look-chibi-quest .chibi-hero-row', 'line-height') ||
    winningPrintProperty(cssChibi, '.look-chibi-quest .paragraph', 'line-height');
  const chibiSize =
    winningPrintProperty(cssChibi, '.look-chibi-quest .chibi-hero-row .paragraph', 'font-size') ||
    winningPrintProperty(cssChibi, '.look-chibi-quest .chibi-hero-row', 'font-size') ||
    winningPrintProperty(cssChibi, '.look-chibi-quest .paragraph', 'font-size');
  if (n === 1 && target && target.closest('.chibi-hero-row') && (chibiLine || chibiSize)) {
    return {
      fontSize: chibiSize || winningPrintProperty(cssTemplate, '.article-text', 'font-size'),
      lineHeight: chibiLine || winningPrintProperty(cssTemplate, '.article-text', 'line-height'),
      insideArticleText,
    };
  }
  const scope = insideArticleText ? '.article-text' : 'body';
  return {
    fontSize: winningPrintProperty(cssTemplate, scope, 'font-size'),
    lineHeight: winningPrintProperty(cssTemplate, scope, 'line-height'),
    insideArticleText,
  };
}

describe('chibi-quest hero row type and key order (S5.R6, F26-F28)', () => {
  it('gives paragraph 1 the same print type as paragraph 2 (12 pt, line-height 2)', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const html = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'chibi-quest',
    });
    expect(html.includes('look-chibi-quest'), 'chibi-quest body class').toBe(true);
    const row = extractRowMarkup(html);
    expect(row.length, 'hero row markup length').toBeGreaterThan(0);
    expect(row.includes('article-image-area'), 'row holds hero').toBe(true);
    expect(paraMarkupIndex(row, 1), 'row holds paragraph 1').toBeGreaterThan(-1);
    expect(paraMarkupIndex(html, 2), 'paragraph 2 marker').toBeGreaterThan(-1);
    const cssTemplate = templateCss();
    const cssChibi = getChibiQuestStyles();
    expect(winningPrintProperty(cssTemplate, '.article-text', 'font-size'), 'article-text font-size').toBe('12pt');
    expect(winningPrintProperty(cssTemplate, '.article-text', 'line-height'), 'article-text line-height').toBe('2');
    const p1 = paragraphPrintType(html, cssTemplate, cssChibi, 1);
    const p2 = paragraphPrintType(html, cssTemplate, cssChibi, 2);
    console.log(`para1_font_size ${p1.fontSize}`);
    console.log(`para1_line_height ${p1.lineHeight}`);
    console.log(`para2_font_size ${p2.fontSize}`);
    console.log(`para2_line_height ${p2.lineHeight}`);
    console.log(`para1_inside_article_text ${p1.insideArticleText}`);
    expect(p1.fontSize, 'paragraph 1 print font-size').toBe('12pt');
    expect(p1.lineHeight, 'paragraph 1 print line-height').toBe('2');
    expect(p1.fontSize, 'paragraph 1 vs 2 font-size').toBe(p2.fontSize);
    expect(p1.lineHeight, 'paragraph 1 vs 2 line-height').toBe(p2.lineHeight);
  });

  it('prints the marking key before paragraph 1, as in the classic look', async () => {
    const base = path.join(path.resolve(process.cwd(), '..'), 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8'));
    const chibi = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'chibi-quest',
    });
    const classic = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'classic',
    });
    const chibiLegend = legendMarkupIndex(chibi);
    const chibiPara1 = paraMarkupIndex(chibi, 1);
    const classicLegend = legendMarkupIndex(classic);
    const classicPara1 = paraMarkupIndex(classic, 1);
    console.log(`chibi_legend_index ${chibiLegend}`);
    console.log(`chibi_para1_index ${chibiPara1}`);
    console.log(`classic_legend_index ${classicLegend}`);
    console.log(`classic_para1_index ${classicPara1}`);
    expect(classicLegend, 'classic legend marker').toBeGreaterThan(-1);
    expect(classicPara1, 'classic paragraph 1 marker').toBeGreaterThan(-1);
    expect(classicLegend < classicPara1, 'classic key before paragraph 1').toBe(true);
    expect(chibiLegend, 'chibi legend marker').toBeGreaterThan(-1);
    expect(chibiPara1, 'chibi paragraph 1 marker').toBeGreaterThan(-1);
    expect(chibiLegend < chibiPara1, 'chibi key before paragraph 1').toBe(true);
  });

  it('finds the row markup without matching the stylesheet text', () => {
    const synthetic =
      '<head><style>.chibi-hero-row{display:grid}.marking-legend{color:red}</style></head>' +
      '<body><div class="chibi-hero-row"><div class="article-image-area">hero</div></div></body>';
    const row = extractRowMarkup(synthetic);
    expect(row.length, 'synthetic row length').toBeGreaterThan(0);
    expect(row.includes('article-image-area'), 'synthetic row holds hero').toBe(true);
    expect(row.includes('<style'), 'synthetic row holds no stylesheet').toBe(false);
  });
});
