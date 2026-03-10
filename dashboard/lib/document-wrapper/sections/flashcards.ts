import { GlossaryEntry } from '../types';
import { escapeHtml } from '../utils';

export function generateFlashcardsSection(glossary?: GlossaryEntry[]): string {
  if (!glossary || glossary.length === 0) return '';

  // Chunk flashcards into groups of 8 (4 rows x 2 columns) per page
  const chunkSize = 8;
  const chunks = [];
  for (let i = 0; i < glossary.length; i += chunkSize) {
    chunks.push(glossary.slice(i, i + chunkSize));
  }

  const pages = chunks.map((chunk, pageIndex) => {
    const flashcardItems = chunk.map(entry => `
      <div class="flashcard">
        <div class="fc-front">
          <div class="fc-word">${escapeHtml(entry.word)}</div>
        </div>
        <div class="fc-fold-line"></div>
        <div class="fc-back">
          <div class="fc-phonetic">${escapeHtml(entry.phonetic)}</div>
          <div class="fc-definition">
            ${entry.thaiDefinition ? `<div class="fc-thai">${escapeHtml(entry.thaiDefinition)}</div>` : ''}
            ${escapeHtml(entry.definition)}
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="section-flashcards-page">
        ${pageIndex === 0 ? '<h2 class="section-header">Vocabulary Flashcards</h2><p class="fc-instructions">Cut along the dashed lines and fold down the middle to create your flashcards. <strong>Note: This section is designed for single-sided printing/copying. Blank pages are inserted automatically between flashcard pages.</strong></p>' : ''}
        <div class="flashcard-grid">
          ${flashcardItems}
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div class="section-flashcards">
      ${pages}
    </div>
  `;
}