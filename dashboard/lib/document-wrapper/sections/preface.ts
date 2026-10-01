import { escapeHtml } from '../utils';

export function generatePrefaceSection(prefaceText?: string): string {
  // No text, no page: an empty "Preface" page wasted a printed page (print layout audit, 2026-10-01).
  if (!prefaceText?.trim()) return '';
  const formattedPreface = prefaceText
    ? prefaceText.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('\n')
    : '';

  return `
    <div class="section-preface">
      <h2 class="section-header">Preface</h2>
      <div class="preface-content">
        ${formattedPreface}
      </div>
    </div>
  `;
}