/**
 * The print CSS of the Chibi Quest look (track primary_v2_look_20261020). The document wrapper adds
 * it after the classic print CSS only for `look: 'chibi-quest'`, so the classic output does not change.
 * Flat fills only: no gradient, rgba, opacity, or shadow (PDF/X-1a has no transparency).
 */

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
};

/**
 * The CSS of the Chibi Quest look. Its rules start with `.look-chibi-quest` (the body class that the
 * wrapper sets), so they win over the classic rules of the same element.
 * @returns The CSS text.
 */
export function getChibiQuestStyles(): string {
  const tokens = Object.entries(CHIBI_QUEST_TOKENS).map(([name, value]) => `  --cq-${name}: ${value};`).join('\n');
  return `:root {
${tokens}
}`;
}
