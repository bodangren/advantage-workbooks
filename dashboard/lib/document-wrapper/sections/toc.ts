import { TocEntry } from '../types';
import { escapeHtml } from '../utils';

export function generateTocSection(tocEntries: TocEntry[]): string {
  const tocItems = tocEntries.map(entry => {
    const meta = entry.genre || entry.articleType
      ? `<span class="toc-meta">(${[entry.genre, entry.articleType].filter(Boolean).join(' / ')})</span>`
      : '';

    return `
      <li class="toc-item">
        <a href="#${entry.id}">
          <span class="toc-text">${escapeHtml(entry.title)}</span>
          ${meta}
        </a>
      </li>
    `;
  }).join('\n');

  return `
    <div class="section-toc">
      <h2 class="section-header">Table of Contents</h2>
      <ul class="toc-list">
        ${tocItems}
      </ul>
    </div>
  `;
}