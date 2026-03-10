import { TocEntry, ThemeColors } from '../types';
import { escapeHtml } from '../utils';

export function generateProgressTracker(tocEntries: TocEntry[], theme: ThemeColors): string {
  const badges = tocEntries.map((entry, index) => `
    <div class="progress-badge">
      <div class="pb-number">${index + 1}</div>
      <div class="pb-title">${escapeHtml(entry.title)}</div>
      <div class="pb-circle" style="border-color: ${theme.primary};"></div>
    </div>
  `).join('\n');

  return `
    <div class="section-progress-tracker">
      <h2 class="section-header">My Reading Journey</h2>
      <p class="pt-instructions">Color in the circle for each lesson you complete!</p>
      <div class="pt-grid">
        ${badges}
      </div>
    </div>
  `;
}