import { WorkbookDocumentOptions } from '../types';
import { brandName, escapeHtml, getThemeColors } from '../utils';

export function generateTitlePage(options: WorkbookDocumentOptions): string {
  const theme = getThemeColors(options.seriesName, options.type);
  const brand = brandName(options.type);
  return `
    <div class="cover-page" style="background: ${theme.primary};">
      <div class="cover-content">
        <h1 class="tp-main-title">${brand}</h1>
        <div class="tp-divider"></div>
        <h2 class="tp-series-title">${escapeHtml(options.seriesName)}</h2>
        <div class="tp-level-info">Level ${escapeHtml(options.seriesLevel)}</div>
        <div class="tp-tagline">${escapeHtml(options.seriesTagline)}</div>
      </div>
      <div class="tp-publisher">${brand} Series &bull; ${new Date().getFullYear()} Edition</div>
    </div>
  `;
}