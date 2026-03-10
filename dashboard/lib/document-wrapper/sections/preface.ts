import { escapeHtml } from '../utils';

export function generatePrefaceSection(prefaceText?: string): string {
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