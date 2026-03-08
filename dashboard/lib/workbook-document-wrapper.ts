export interface TocEntry {
  id: string;
  title: string;
  genre?: string;
  articleType?: string;
}

export interface GlossaryEntry {
  word: string;
  phonetic: string;
  definition: string;
}

export interface WorkbookDocumentOptions {
  seriesName: string;
  seriesLevel: string;
  seriesTagline: string;
  prefaceText?: string;
  type?: 'primary' | 'secondary';
  glossary?: GlossaryEntry[];
}

interface ThemeColors {
  primary: string;
  secondary: string;
  gradient: string;
}

function getThemeColors(seriesName: string, type?: 'primary' | 'secondary'): ThemeColors {
  const name = seriesName.toLowerCase();
  if (name.includes('origins')) {
    return { primary: '#228b22', secondary: '#8b4513', gradient: 'linear-gradient(135deg, #228b22, #8b4513)' };
  }
  if (name.includes('quest')) {
    return { primary: '#0284c7', secondary: '#eab308', gradient: 'linear-gradient(135deg, #0ea5e9, #eab308)' };
  }
  if (name.includes('adventure')) {
    return { primary: '#4c1d95', secondary: '#475569', gradient: 'linear-gradient(135deg, #4c1d95, #475569)' };
  }
  if (name.includes('hero')) {
    return { primary: '#be123c', secondary: '#b45309', gradient: 'linear-gradient(135deg, #be123c, #b45309)' };
  }
  if (name.includes('legend')) {
    return { primary: '#1e3a8a', secondary: '#ca8a04', gradient: 'linear-gradient(135deg, #1e3a8a, #ca8a04)' };
  }
  // Default fallback
  const fallbackPrimary = type === 'primary' ? '#0284c7' : '#1e40af';
  return { primary: fallbackPrimary, secondary: '#334155', gradient: `linear-gradient(135deg, ${fallbackPrimary}, #334155)` };
}

function generateTitlePage(options: WorkbookDocumentOptions): string {
  const theme = getThemeColors(options.seriesName, options.type);
  return `
    <div class="cover-page" style="background: ${theme.gradient};">
      <div class="cover-content">
        <h1 class="tp-main-title">Reading Advantage</h1>
        <div class="tp-divider"></div>
        <h2 class="tp-series-title">${escapeHtml(options.seriesName)}</h2>
        <div class="tp-level-info">Level ${escapeHtml(options.seriesLevel)}</div>
        <div class="tp-tagline">${escapeHtml(options.seriesTagline)}</div>
      </div>
      <div class="tp-publisher">Reading Advantage Series &bull; ${new Date().getFullYear()} Edition</div>
    </div>
  `;
}

function generatePrefaceSection(prefaceText?: string): string {
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

function generateTocSection(tocEntries: TocEntry[]): string {
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

function generateGlossarySection(glossary?: GlossaryEntry[]): string {
  if (!glossary || glossary.length === 0) return '';

  const glossaryItems = glossary.map(entry => `
    <div class="glossary-item">
      <span class="glossary-word">${escapeHtml(entry.word)}</span>
      <span class="glossary-phonetic">${escapeHtml(entry.phonetic)}</span>
      <span class="glossary-definition">${escapeHtml(entry.definition)}</span>
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

function getPrintStyles(theme: ThemeColors): string {
  return `
    @page {
      size: 210mm 285mm;
      margin: 20mm;
      
      @bottom-center {
        content: "Page " counter(page);
        font-family: 'Open Sans', sans-serif;
        font-size: 10pt;
      }
    }

    @page :first {
      margin: 0;
      @bottom-center { content: none; }
    }

    body {
      background-color: #555;
      margin: 0;
      padding: 0;
    }

    .pagedjs_pages {
      display: flex;
      width: calc(var(--pagedjs-width) * 2);
      min-width: 200%;
      flex-direction: column;
      align-items: center;
      margin: 0 auto;
      padding: 20px 0;
    }

    .pagedjs_page {
      background: white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      margin-bottom: 20px;
    }

    @media print {
      body {
        background: white;
        width: 100%;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .pagedjs_pages {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        transform: none !important;
      }
      .pagedjs_page {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
      }
      .pagedjs_margin-bottom-center {
        transform: translateY(-6mm) !important;
      }
    }

    .cover-page {
      height: 285mm; /* Exact height of A4/custom page */
      width: 210mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      break-after: page;
      color: white;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      margin: 0 !important;
      padding: 0 !important;
    }

    .cover-content {
      background: rgba(255, 255, 255, 0.9);
      padding: 60px 80px;
      border-radius: 12px;
      color: #1f2937;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      max-width: 80%;
      position: relative;
      z-index: 10;
      border: 4px solid ${theme.secondary};
    }

    .tp-main-title {
      font-size: 28pt;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 300;
      font-family: 'Merriweather', serif;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4b5563;
    }

    .tp-divider {
      height: 4px;
      width: 60px;
      background: ${theme.primary};
      margin: 0 auto 30px auto;
    }

    .tp-series-title {
      font-size: 52pt;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-family: 'Open Sans', sans-serif;
      color: ${theme.primary};
      letter-spacing: 4px;
      line-height: 1.1;
    }

    .tp-level-info {
      font-size: 22pt;
      margin-bottom: 40px;
      color: #4b5563;
      font-weight: 600;
      letter-spacing: 2px;
    }

    .tp-tagline {
      font-size: 18pt;
      font-style: italic;
      color: ${theme.secondary};
      margin-bottom: 0;
      font-family: 'Merriweather', serif;
    }

    .tp-publisher {
      position: absolute;
      bottom: 40px;
      font-size: 12pt;
      color: rgba(255, 255, 255, 0.9);
      font-family: 'Open Sans', sans-serif;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .section-preface, .section-toc, .section-glossary {
      break-after: page;
      padding-top: 40px;
      font-family: 'Open Sans', sans-serif;
    }

    .section-header {
      font-size: 24pt;
      border-bottom: 2px solid ${theme.primary};
      color: ${theme.primary};
      padding-bottom: 10px;
      margin-bottom: 30px;
      text-align: left;
    }

    .preface-content {
      font-size: 12pt;
      line-height: 1.6;
      text-align: left;
    }

    ul.toc-list {
      list-style: none;
      padding: 0;
    }

    li.toc-item {
      margin-bottom: 12px;
    }

    li.toc-item a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: baseline;
    }

    li.toc-item a::after {
      content: target-counter(attr(href), page);
      float: right;
      font-weight: bold;
      margin-left: 10px;
    }

    li.toc-item a .toc-text {
      font-weight: bold;
    }

    li.toc-item a .toc-meta {
      font-size: 0.9em;
      color: #666;
      margin-left: 10px;
      font-style: italic;
      flex-grow: 1;
      border-bottom: 1px dotted #ccc;
      margin-right: 5px;
    }

    .glossary-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      font-family: 'Open Sans', sans-serif;
    }

    .glossary-item {
      margin-bottom: 15px;
      break-inside: avoid;
    }

    .glossary-word {
      font-weight: bold;
      font-size: 12pt;
      color: ${theme.primary};
      display: block;
    }

    .glossary-phonetic {
      font-style: italic;
      color: #666;
      font-size: 10.5pt;
      display: block;
      margin-bottom: 4px;
    }

    .glossary-definition {
      font-size: 11pt;
      line-height: 1.4;
      display: block;
    }

    .lesson-section {
      break-after: page;
    }

    .lesson-section > *:last-child {
      margin-bottom: 0 !important;
    }

    .lesson-header {
      margin-top: 0;
    }

    .question-box, .practice-box, .vocab-table tr {
      break-inside: avoid;
    }
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function wrapWorkbookDocument(
  lessonsHtml: string,
  tocEntries: TocEntry[],
  options: WorkbookDocumentOptions
): string {
  const theme = getThemeColors(options.seriesName, options.type);
  const titlePage = generateTitlePage(options);
  const prefaceSection = generatePrefaceSection(options.prefaceText);
  const tocSection = generateTocSection(tocEntries);
  const glossarySection = generateGlossarySection(options.glossary);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reading Advantage Workbook - ${escapeHtml(options.seriesName)}</title>
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
  <style>
    ${getPrintStyles(theme)}
  </style>
</head>
<body>
  ${titlePage}

  ${prefaceSection}

  ${tocSection}

  ${lessonsHtml}

  ${glossarySection}
</body>
</html>`;
}
