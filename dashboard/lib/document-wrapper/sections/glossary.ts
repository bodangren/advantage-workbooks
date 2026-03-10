import { GlossaryEntry } from '../types';
import { escapeHtml } from '../utils';

export function generateGlossarySection(glossary?: GlossaryEntry[]): string {
  if (!glossary || glossary.length === 0) return '';

  const glossaryItems = glossary.map(entry => `
    <div class="glossary-item">
      <span class="glossary-word">${escapeHtml(entry.word)}</span>
      <span class="glossary-phonetic">${escapeHtml(entry.phonetic)}</span>
      <span class="glossary-definition">
        ${entry.thaiDefinition ? `<span class="glossary-thai">${escapeHtml(entry.thaiDefinition)}</span> ` : ''}
        ${escapeHtml(entry.definition)}
      </span>
    </div>
  `).join('\n');

  return `
    <div class="section-glossary">
      <h2 class="section-header">Glossary</h2>
      <div class="glossary-list">
        ${glossaryItems}
      </div>
    </div>
  `;
}