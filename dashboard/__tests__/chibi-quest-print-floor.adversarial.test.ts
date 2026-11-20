import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { lessonDocument, type PrintExport } from '../lib/print/print-export';

// Track primary_v2_look_20261020, S5 round 2. These adversarial tests attack the
// 8 pt floor, its look scope, the hero width, the step-header gap, and review A
// F24 (a marker loop that passed from stylesheet text alone). The synthetic
// lesson holds English text only; assertions never print golden or page text.
// CSS absolute units: 96 px = 1 in = 25.4 mm = 72 pt, so 8 pt = 10.67 px.

const ROOT = path.resolve(process.cwd(), '..');
const PHASE_BASE = '04275398c9411b45685733e20fc003945524ad72';
const FLOOR_PX = 10.67;

type Spec = [number, number, number];
type Step = { tag: string; cls?: string };
type Resolution = { value: string; important: boolean; spec: Spec; order: number };

// The eight P16 groups (chibi-quest-styles.ts, the shared 11px selector list).
const NODE: Record<string, Step[]> = {
  'read-article-step .qr-desc': [{ tag: 'div', cls: 'read-article-step' }, { tag: 'span', cls: 'qr-desc' }],
  'guided-writing-section .qr-desc': [{ tag: 'div', cls: 'guided-writing-section' }, { tag: 'span', cls: 'qr-desc' }],
  'collection-item label': [{ tag: 'div', cls: 'collection-item' }, { tag: 'label' }],
  'writing-header p': [
    { tag: 'div', cls: 'guided-writing-section' }, { tag: 'div', cls: 'writing-header' }, { tag: 'p' },
  ],
  'prompt-label': [{ tag: 'span', cls: 'prompt-label' }],
  'word-count-box': [{ tag: 'div', cls: 'guided-writing-section' }, { tag: 'span', cls: 'word-count-box' }],
  'ai-score-box': [{ tag: 'div', cls: 'guided-writing-section' }, { tag: 'span', cls: 'ai-score-box' }],
  'check-item': [{ tag: 'div', cls: 'guided-writing-section' }, { tag: 'span', cls: 'check-item' }],
};
const LABELS = ['q-label', 'a-label', 'para-note-label', 'tip-label', 'planning-label', 'qr-label'];
const MARKERS = ['qr-desc', 'collection-item', 'writing-header', 'prompt-label', 'word-count-box', 'ai-score-box', 'check-item'];

/** Parse active rules after removing comments. */
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

/** The specificity of a plain selector (ids, classes/attributes/pseudo-classes, elements). */
function specificity(selector: string): Spec {
  const a = (selector.match(/#[\w-]+/g) ?? []).length;
  const b = (selector.match(/\.[\w-]+/g) ?? []).length
    + (selector.match(/\[[^\]]*\]/g) ?? []).length
    + (selector.match(/:(?!:)[\w-]+/g) ?? []).length;
  const c = (selector.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length
    + (selector.match(/::[\w-]+/g) ?? []).length;
  return [a, b, c];
}

/** Lexicographic comparison of two specificities. */
function compareSpec(left: Spec, right: Spec): number {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

/** Build a detached element under a .look-chibi-quest root from a chain of steps. */
function makeTarget(steps: Step[]): HTMLElement {
  const root = document.createElement('div');
  root.className = 'look-chibi-quest';
  let node: HTMLElement = root;
  for (const step of steps) {
    const child = document.createElement(step.tag);
    if (step.cls) child.className = step.cls;
    node.appendChild(child);
    node = child;
  }
  return node as HTMLElement;
}

/** Resolve a property by importance, then specificity, then source order. */
function resolveProperty(css: string, element: Element, property: string): Resolution {
  let best: Resolution = { value: '', important: false, spec: [-1, -1, -1], order: -1 };
  rules(css).forEach((rule, order) => {
    const value = rule.style.getPropertyValue(property).trim();
    if (!value) return;
    let matched: Spec | null = null;
    for (const part of rule.selectorText.split(',')) {
      const selector = part.trim();
      let applies = false;
      try {
        applies = element.matches(selector);
      } catch {
        applies = false;
      }
      if (!applies) continue;
      const candidate = specificity(selector);
      if (matched === null || compareSpec(candidate, matched) > 0) matched = candidate;
    }
    if (matched === null) return;
    const important = rule.style.getPropertyPriority(property) === 'important';
    if (important && !best.important) {
      best = { value, important, spec: matched, order };
      return;
    }
    if (!important && best.important) return;
    const specOrder = compareSpec(matched, best.spec);
    if (specOrder > 0 || (specOrder === 0 && order > best.order)) {
      best = { value, important, spec: matched, order };
    }
  });
  return best;
}

/** Convert a plain absolute CSS length to px; NaN for em, rem, percent, calc, var, or empty. */
function toPx(value: string): number {
  const match = value.trim().match(/^(-?[\d.]+)\s*(px|mm|cm|q|in|pt)$/);
  if (!match) return NaN;
  const amount = parseFloat(match[1]);
  switch (match[2]) {
    case 'px': return amount;
    case 'mm': return (amount * 96) / 25.4;
    case 'cm': return (amount * 10 * 96) / 25.4;
    case 'q': return (amount / 4 * 96) / 25.4;
    case 'in': return amount * 96;
    case 'pt': return (amount * 96) / 72;
    default: return NaN;
  }
}

/** Count a marker in class attributes after the stylesheet is stripped (review A F24). */
function bodyClassCount(html: string, marker: string): number {
  const body = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  const values = Array.from(body.matchAll(/class="([^"]*)"/g), (match) => match[1]);
  return values.filter((value) => value.split(/\s+/).includes(marker)).length;
}

/** Compare bytes without exposing source text in an assertion failure. */
function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('S5 adversarial 8 pt floor guards (round 2)', () => {
  it('counts the P16 markers in rendered body markup, not in stylesheet text', async () => {
    const base = path.join(ROOT, 'content', 'primary', 'origins-3.2', 'print');
    const record = JSON.parse(fs.readFileSync(path.join(base, 'p05.json'), 'utf8')) as PrintExport;
    const html = await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, {
      look: 'chibi-quest',
    });
    // Control: the stylesheet alone contains every marker in selector text but has no class attribute.
    for (const marker of MARKERS) {
      expect(bodyClassCount(getChibiQuestStyles(), marker), `stylesheet-only marker ${marker}`).toBe(0);
    }
    expect(bodyClassCount(html, 'prompt-label') + bodyClassCount(html, 'check-item')).toBeGreaterThan(0);
    const body = html.replace(/<style[\s\S]*?<\/style>/gi, '');
    expect(body).not.toContain('<style');
    expect(body).not.toContain('.look-chibi-quest .');
    for (const marker of MARKERS) {
      expect(bodyClassCount(html, marker), `rendered body marker ${marker}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('resolves the effective font size at or above 8 pt for all eight P16 groups', () => {
    const css = getChibiQuestStyles();
    for (const [name, steps] of Object.entries(NODE)) {
      const resolution = resolveProperty(css, makeTarget(steps), 'font-size');
      expect(resolution.value, `${name} font-size`).not.toBe('');
      expect(toPx(resolution.value), `${name} font-size px`).toBeGreaterThanOrEqual(FLOOR_PX);
    }
  });

  it('resolves the labels and Thai gloss at or above 8 pt through the full cascade', () => {
    const css = getChibiQuestStyles();
    for (const label of LABELS) {
      const resolution = resolveProperty(css, makeTarget([{ tag: 'span', cls: label }]), 'font-size');
      expect(resolution.value, `${label} font-size`).not.toBe('');
      expect(toPx(resolution.value), `${label} font-size px`).toBeGreaterThanOrEqual(FLOOR_PX);
    }
    const thai = makeTarget([{ tag: 'span', cls: 'thai-translation' }]);
    expect(toPx(resolveProperty(css, thai, 'font-size').value)).toBeGreaterThanOrEqual(FLOOR_PX);
    expect(resolveProperty(css, thai, 'font-style').value).toBe('normal');
  });

  it('declares every protected font size in plain px, never pt, em, rem, percent, or calc', () => {
    const css = getChibiQuestStyles();
    const cases = Object.entries(NODE).concat(LABELS.map((label) => [label, [{ tag: 'span', cls: label }] as Step[]]));
    cases.push(['thai-translation', [{ tag: 'span', cls: 'thai-translation' }]]);
    for (const [name, steps] of cases) {
      const value = resolveProperty(css, makeTarget(steps), 'font-size').value;
      expect(value, `${name} font-size unit`).toMatch(/^\d+(\.\d+)?px$/);
    }
  });

  it('catches higher-specificity, important, and dropped-selector regressions', () => {
    const css = getChibiQuestStyles();
    const prompt = makeTarget(NODE['prompt-label']);
    const label = makeTarget(NODE['collection-item label']);
    // Control: the unmutated stylesheet resolves above the floor.
    expect(toPx(resolveProperty(css, prompt, 'font-size').value)).toBeGreaterThanOrEqual(FLOOR_PX);
    // A later, more specific non-important rule must win the cascade and fail.
    const higher = `${css}\n.look-chibi-quest span.prompt-label { font-size: 9px; }`;
    expect(toPx(resolveProperty(higher, prompt, 'font-size').value)).toBeLessThan(FLOOR_PX);
    // A later important rule must win and fail.
    const important = `${css}\n.look-chibi-quest .prompt-label { font-size: 9px !important; }`;
    expect(toPx(resolveProperty(important, prompt, 'font-size').value)).toBeLessThan(FLOOR_PX);
    // Dropping one selector from the shared list must leave that element with no floor rule.
    const dropped = css.replace('.look-chibi-quest .collection-item label,', '');
    expect(dropped).not.toBe(css);
    expect(toPx(resolveProperty(dropped, label, 'font-size').value)).toBeNaN();
  });

  it('keeps the hero at a literal 84.8 mm with no calc, vw, or smaller max-width', () => {
    const css = getChibiQuestStyles();
    const hero = makeTarget([{ tag: 'div', cls: 'hero-img-box' }, { tag: 'img' }]);
    const width = resolveProperty(css, hero, 'width').value;
    expect(width, 'hero width').toBe('84.8mm');
    expect((toPx(width) * 25.4) / 96).toBeCloseTo(84.8, 1);
    expect(resolveProperty(css, hero, 'max-width').value, 'hero max-width').toBe('100%');
    for (const rule of rules(css)) {
      const declaresWidth = rule.style.getPropertyValue('width').trim();
      if (!declaresWidth) continue;
      const applies = rule.selectorText.split(',').some((part) => {
        try {
          return hero.matches(part.trim());
        } catch {
          return false;
        }
      });
      if (applies) expect(declaresWidth, 'hero width unit').toMatch(/^\d+(\.\d+)?(px|mm|cm|q|in|pt)$/);
    }
    const shrunk = `${css}\n.look-chibi-quest .hero-img-box img { width: 60mm; }`;
    expect((toPx(resolveProperty(shrunk, hero, 'width').value) * 25.4) / 96).not.toBeCloseTo(84.8, 1);
  });

  it('keeps the step-header top gap a plain 4 mm, not calc, vw, or percent', () => {
    const css = getChibiQuestStyles();
    const header = makeTarget([{ tag: 'div', cls: 'section-header' }]);
    const marginTop = resolveProperty(css, header, 'margin-top').value;
    expect(marginTop, 'header margin-top').toMatch(/^\d+(\.\d+)?(px|mm|cm|q|in|pt)$/);
    const mm = (toPx(marginTop) * 25.4) / 96;
    expect(mm, 'header margin-top mm').toBeGreaterThanOrEqual(3);
    expect(mm, 'header margin-top mm').toBeLessThanOrEqual(5);
    const tight = `${css}\n.look-chibi-quest div.section-header { margin-top: 1mm; }`;
    const tightMm = (toPx(resolveProperty(tight, header, 'margin-top').value) * 25.4) / 96;
    expect(tightMm).toBeLessThan(3);
  });

  it('keeps every floor rule out of the classic look and the phase-base bytes', () => {
    const classic = fs.readFileSync(path.join(ROOT, 'dashboard', 'lib', 'document-wrapper', 'styles.ts'), 'utf8');
    expect(classic).not.toContain('.look-chibi-quest');
    for (const file of [
      'dashboard/lib/document-wrapper/styles.ts',
      'content/primary/origins-3.2/print/golden/lesson-05.html',
      'content/primary/origins-3.2/print/golden/lesson-05-no-key.html',
    ]) {
      const before = execFileSync('git', ['show', `${PHASE_BASE}:${file}`], { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 });
      expect(digest(fs.readFileSync(path.join(ROOT, file))), file).toBe(digest(before));
    }
  });
});
