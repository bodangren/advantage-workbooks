import { SpellingPracticeEntry, ThemeColors } from '../types';
import { escapeHtml } from '../utils';

export function generateSpellingPracticeSection(entries?: SpellingPracticeEntry[], theme?: ThemeColors): string {
  if (!entries || entries.length === 0) return '';

  const pages = entries.map(entry => {
    if (!entry.vocabulary || entry.vocabulary.length === 0) return '';

    const rows = entry.vocabulary.map(v => `
      <tr class="sp-row">
        <td class="sp-col-word"><strong>${escapeHtml(v.word)}</strong></td>
        <td class="sp-col-trace"><span class="sp-trace-text">${escapeHtml(v.word)}</span></td>
        <td class="sp-col-write"></td>
        <td class="sp-col-cover"></td>
      </tr>
    `).join('\n');

    return `
      <div class="sp-lesson-page">
        <div class="sp-header" style="border-bottom: 3px solid ${theme?.primary || '#333'};">
          <h3 class="sp-lesson-title" style="color: ${theme?.primary || '#333'};">Spelling Practice: ${escapeHtml(entry.lessonTitle)}</h3>
        </div>
        <table class="sp-table">
          <thead>
            <tr>
              <th style="background-color: ${theme?.primary || '#333'}; color: white;">Look</th>
              <th style="background-color: ${theme?.primary || '#333'}; color: white;">Trace</th>
              <th style="background-color: ${theme?.primary || '#333'}; color: white;">Write</th>
              <th style="background-color: ${theme?.primary || '#333'}; color: white;">Cover & Write</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }).filter(html => html.length > 0).join('\n');

  if (!pages) return '';

  return `
    <div class="section-spelling-practice">
      <h2 class="section-header">Spelling Practice</h2>
      <p class="sp-intro">Look at the word, trace it, write it once, and then cover it and write it from memory!</p>
      ${pages}
    </div>
  `;
}
