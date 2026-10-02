import { GlossaryEntry } from '../types';
import { escapeHtml } from '../utils';

export function generateGlossarySection(glossary?: GlossaryEntry[]): string {
  if (!glossary || glossary.length === 0) return '';

  // Word and Thai only, three columns (Daniel, 2026-10-02): each lesson already defines its words.
  const glossaryItems = glossary.map(entry => `
    <div class="glossary-item">
      <span class="glossary-word">${escapeHtml(entry.word)}</span>
      ${entry.thaiDefinition ? `<span class="glossary-thai">${escapeHtml(entry.thaiDefinition)}</span>` : ''}
    </div>`).join('\n');

  return `
    <div class="section-glossary">
      <h2 class="section-header">Glossary</h2>
      <div class="glossary-list">
        ${glossaryItems}
      </div>
    </div>
  `;
}