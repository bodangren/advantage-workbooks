/**
 * The print CSS of the Chibi Quest look (track primary_v2_look_20261020). The document wrapper adds
 * it after the classic print CSS only for `look: 'chibi-quest'`, so the classic output does not change.
 * Flat fills only: no gradient, rgba, opacity, or shadow (PDF/X-1a has no transparency).
 */
import type { ThemeColors } from './types';

/**
 * The print colors: the `--cq-*` tokens of the app (monorepo `apps/primary-advantage/styles/rpg.css`,
 * without the dark world color), and the answer and label colors of its lesson classes.
 */
export const CHIBI_QUEST_TOKENS: Readonly<Record<string, string>> = {
  ink: '#3b2a1a',
  'ink-soft': '#6b5438',
  parchment: '#f3e4c3',
  'parchment-2': '#e9d4a8',
  'parchment-edge': '#b58a4e',
  wood: '#8a5a2b',
  'wood-dark': '#5c391a',
  'wood-light': '#b37a3f',
  iron: '#4a4f57',
  'iron-light': '#8b929c',
  gold: '#e8b534',
  'gold-dark': '#a8781a',
  'gold-text': '#7a5410',
  red: '#d64545',
  green: '#4fb45a',
  blue: '#3f7fd6',
  'on-wood': '#fff4dc',
  'right-fill': '#dfeccd',
  'right-edge': '#2f6b35',
  'right-text': '#1f4a23',
  'wrong-fill': '#f3d6cc',
  'wrong-edge': '#8f2424',
  'wrong-text': '#6b1717',
  // Print only: a light parchment for label areas on the white page (not an app token).
  'parchment-light': '#faf3e3',
};

/**
 * The book colors of the Chibi Quest look for the back matter (title page, flashcards, spelling,
 * tracker, certificate): wood and gold, flat. The gradient value is a flat color too.
 */
export const CHIBI_QUEST_THEME: Readonly<ThemeColors> = { primary: '#5c391a', secondary: '#a8781a', gradient: '#5c391a' };

/**
 * The kit CSS (story S3): the parts of the app lesson look on a white page. Each rule starts with
 * `.look-chibi-quest`, so it wins over the classic rule of the same element; the rules that the
 * classic print CSS sets with `!important` get `!important` too. Write-in areas stay white.
 */
const KIT_CSS = `
/* Base: ink text, the app fonts, the classic color variables mapped to the tokens. */
body.look-chibi-quest {
  color: var(--cq-ink) !important;
  --primary-blue: var(--cq-wood-dark);
  --primary-light: var(--cq-wood-light);
  --accent-orange: var(--cq-gold-dark);
  --accent-green: var(--cq-right-edge);
  --accent-purple: var(--cq-wood);
  --text-dark: var(--cq-ink);
  --text-medium: var(--cq-ink-soft);
  --text-light: var(--cq-ink-soft);
  --bg-cream: var(--cq-parchment-light);
  --bg-light: var(--cq-parchment-light);
  --border-light: var(--cq-parchment-2);
  --border-medium: var(--cq-parchment-edge);
  --border-dark: var(--cq-parchment-edge);
}
.look-chibi-quest, .look-chibi-quest * { font-family: 'Quicksand', 'Sarabun', sans-serif !important; }
.look-chibi-quest :is(h1, h2, h3, h4, .section-title, .section-icon, .section-time, .lesson-number, .workbook-title, .badge,
  .para-number, .para-note-number, .question-number, .vocab-word, .vocab-table th, .tip-label, .practice-title, .writing-header,
  .translation-header, .prompt-label, .planning-label, .starter-label, .q-label, .a-label, .score-label, .score-divider, .homework-title,
  .qr-label, .collection-item label, .marking-legend, .match-word, .bank-word, .ak-lesson-title, .toc-item, .perf-option) {
  font-family: 'Fredoka', 'Mitr', sans-serif !important;
}

/* The lesson header: a parchment panel with the lesson label in gold text, as on the app lesson page. */
.look-chibi-quest .lesson-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; background: var(--cq-parchment); border: 3px solid var(--cq-parchment-edge); border-radius: 14px; padding: 10px 16px; margin-bottom: 16px; }
.look-chibi-quest .workbook-title { color: var(--cq-ink-soft); font-size: 11px; font-weight: 500; }
.look-chibi-quest .lesson-number { color: var(--cq-gold-text); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.look-chibi-quest .lesson-title { color: var(--cq-ink); font-weight: 700; }
.look-chibi-quest .badge { display: inline-block; background: var(--cq-wood); color: var(--cq-on-wood); border: 2px solid var(--cq-wood-dark); border-radius: 999px; padding: 1px 10px; font-size: 11px; font-weight: 600; }
.look-chibi-quest .badge-cefr { background: var(--cq-gold); color: var(--cq-ink); border-color: var(--cq-gold-dark); }

/* The step header: the gold medal with the number, the wood sign with two rivets, and the time chip. */
.look-chibi-quest div.section-header { background: #ffffff !important; border: 0 !important; border-radius: 0; padding: 0; margin-bottom: 14px; gap: 10px; font-size: 14px; }
.look-chibi-quest div.section-header .section-icon { width: 38px; height: 38px; background: var(--cq-gold) !important; color: var(--cq-ink) !important; border: 3px solid var(--cq-wood-dark); font-size: 16px; font-weight: 700; }
.look-chibi-quest div.section-header .section-title { flex: 0 1 auto; position: relative; background: var(--cq-wood); border: 3px solid var(--cq-wood-dark); border-radius: 8px; color: var(--cq-on-wood); padding: 4px 24px; font-size: 18px; font-weight: 700; line-height: 1.35; }
.look-chibi-quest div.section-header .section-title::before, .look-chibi-quest div.section-header .section-title::after { content: ''; position: absolute; top: 50%; width: 7px; height: 7px; margin-top: -4.5px; border-radius: 50%; background: var(--cq-iron); border: 1px solid var(--cq-iron-light); }
.look-chibi-quest div.section-header .section-title::before { left: 7px; }
.look-chibi-quest div.section-header .section-title::after { right: 7px; }
.look-chibi-quest div.section-header .section-time { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; background: var(--cq-parchment); border: 2px solid var(--cq-parchment-edge); border-radius: 999px; padding: 1px 10px; color: var(--cq-ink); font-size: 12px; font-weight: 600; }

/* Medals: the paragraph numbers and the deep-reading note numbers. */
.look-chibi-quest .para-number, .look-chibi-quest .para-note-number { background: var(--cq-gold) !important; color: var(--cq-ink) !important; border: 2px solid var(--cq-wood-dark); font-weight: 700; }

/* Panels: a 3 px parchment-edge frame with a 14 px radius; label areas in parchment, write-in areas white. */
.look-chibi-quest .short-answer-box, .look-chibi-quest .reflection-box, .look-chibi-quest .language-q-box,
.look-chibi-quest .writing-section, .look-chibi-quest .translation-section, .look-chibi-quest .collection-box,
.look-chibi-quest .qr-box, .look-chibi-quest .digital-qr-box, .look-chibi-quest .sentence-starters {
  background: #ffffff; border: 3px solid var(--cq-parchment-edge) !important; border-radius: 14px;
}
.look-chibi-quest .homework-box, .look-chibi-quest .score-box { background: var(--cq-parchment); border: 3px solid var(--cq-parchment-edge); border-radius: 14px; }
.look-chibi-quest .qr-box::before { background: #ffffff; }
.look-chibi-quest .writing-header, .look-chibi-quest .translation-header { background: var(--cq-parchment-2); color: var(--cq-ink); border-bottom: 2px solid var(--cq-parchment-edge); font-weight: 600; }
.look-chibi-quest .prompt-box { background: var(--cq-parchment-light); border-bottom: 2px solid var(--cq-parchment-2); }
.look-chibi-quest .translation-para strong { color: var(--cq-gold-text); }
.look-chibi-quest .tip-box { background: var(--cq-parchment-light); border: 2px solid var(--cq-parchment-2); border-left: 5px solid var(--cq-wood-light); border-radius: 10px; }
.look-chibi-quest .tip-label, .look-chibi-quest .q-label, .look-chibi-quest .practice-title, .look-chibi-quest .homework-title, .look-chibi-quest .score-label, .look-chibi-quest .qr-label { color: var(--cq-wood-dark); }
.look-chibi-quest .a-label, .look-chibi-quest .starter-label, .look-chibi-quest .prompt-label { color: var(--cq-gold-text); }
.look-chibi-quest .practice-title { border-bottom: 2px solid var(--cq-parchment-edge); }

/* Write-in parts: white wells with a parchment frame. */
.look-chibi-quest .vocab-table td { background: #ffffff; border: 2px solid var(--cq-parchment-2); border-radius: 10px; }
.look-chibi-quest .vocab-table td:first-child { background: var(--cq-parchment-light); }
.look-chibi-quest .collection-item, .look-chibi-quest .bank-word { background: #ffffff; border: 2px solid var(--cq-parchment-2); border-radius: 10px; }
.look-chibi-quest .option-circle, .look-chibi-quest .checkbox, .look-chibi-quest .answer-bubble { border: 2px solid var(--cq-parchment-edge) !important; background: #ffffff !important; }
.look-chibi-quest .answer-box { border: 2px solid var(--cq-parchment-edge); border-radius: 6px; background: #ffffff; }
.look-chibi-quest .collection-box::before { background: #ffffff; }
.look-chibi-quest .planning-box, .look-chibi-quest .para-note { background: #ffffff; border: 2px solid var(--cq-parchment-2); border-radius: 10px; }
.look-chibi-quest .writing-line, .look-chibi-quest .writing-line-small { border-bottom: 1px solid var(--cq-parchment-edge); }
.look-chibi-quest .score-circle { width: 32px; height: 32px; border: 3px solid var(--cq-wood-dark); background: #ffffff; }
.look-chibi-quest .rating-star, .look-chibi-quest .star { color: var(--cq-gold-dark); }

/* Right and wrong: the app colors, and each option keeps its word (Excellent, Good, Review needed). */
.look-chibi-quest .perf-option { display: inline-flex; align-items: center; gap: 4px; border: 2px solid var(--cq-parchment-edge); border-radius: 999px; padding: 1px 10px; background: #ffffff; }
.look-chibi-quest .perf-option:nth-child(1) { background: var(--cq-right-fill); border-color: var(--cq-right-edge); color: var(--cq-right-text); }
.look-chibi-quest .perf-option:nth-child(3) { background: var(--cq-wrong-fill); border-color: var(--cq-wrong-edge); color: var(--cq-wrong-text); }

/* Back matter: the section headings as wood signs, and lesson titles in wood-dark (answer key, glossary, contents). */
.look-chibi-quest h2.section-header { display: inline-block; position: relative; background: var(--cq-wood) !important; border: 3px solid var(--cq-wood-dark) !important; border-radius: 8px; color: var(--cq-on-wood) !important; padding: 6px 28px; font-size: 20pt; font-weight: 700; }
.look-chibi-quest h2.section-header::before, .look-chibi-quest h2.section-header::after { content: ''; position: absolute; top: 50%; width: 8px; height: 8px; margin-top: -5px; border-radius: 50%; background: var(--cq-iron); border: 1px solid var(--cq-iron-light); }
.look-chibi-quest h2.section-header::before { left: 9px; }
.look-chibi-quest h2.section-header::after { right: 9px; }
.look-chibi-quest .ak-lesson-title { color: var(--cq-wood-dark) !important; border-bottom: 2px solid var(--cq-parchment-2); }
.look-chibi-quest .sa-table th { background: var(--cq-parchment); color: var(--cq-ink); }
.look-chibi-quest .sa-table th, .look-chibi-quest .sa-table td { border: 1px solid var(--cq-parchment-edge); }
`;

/**
 * The CSS of the Chibi Quest look. Its rules start with `.look-chibi-quest` (the body class that the
 * wrapper sets), so they win over the classic rules of the same element.
 * @returns The CSS text.
 */
export function getChibiQuestStyles(): string {
  const tokens = Object.entries(CHIBI_QUEST_TOKENS).map(([name, value]) => `  --cq-${name}: ${value};`).join('\n');
  // Chrome writes a synthetic bold or italic as a Type 3 font, and Fredoka, Mitr, and Quicksand
  // have no italic face: a missing face prints upright and at the nearest weight instead.
  return `:root {
${tokens}
}
.look-chibi-quest { font-synthesis: none; }
${KIT_CSS}`;
}
