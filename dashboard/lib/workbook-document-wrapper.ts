export interface TocEntry {
  id: string;
  title: string;
  genre?: string;
  articleType?: string;
}

export interface WorkbookDocumentOptions {
  seriesName: string;
  seriesLevel: string;
  seriesTagline: string;
  prefaceText?: string;
}

function generateTitlePage(options: WorkbookDocumentOptions): string {
  return `
    <div class="title-page">
      <h1 class="tp-main-title">Reading Advantage</h1>
      <h2 class="tp-series-title">${escapeHtml(options.seriesName)}</h2>
      <div class="tp-level-info">Level ${escapeHtml(options.seriesLevel)}</div>
      <div class="tp-tagline">${escapeHtml(options.seriesTagline)}</div>
      <div class="tp-publisher">Reading Advantage Series • ${new Date().getFullYear()} Edition</div>
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

const PRINT_STYLES = `
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

    .title-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      break-after: page;
      background: white;
      color: black;
      padding: 40px;
      box-sizing: border-box;
    }

    .tp-main-title {
      font-size: 24pt;
      margin-bottom: 20px;
      font-weight: normal;
      font-family: 'Merriweather', serif;
    }

    .tp-series-title {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-family: 'Open Sans', sans-serif;
      color: #1e40af;
    }

    .tp-level-info {
      font-size: 18pt;
      margin-bottom: 50px;
      color: #555;
    }

    .tp-tagline {
      font-size: 16pt;
      font-style: italic;
      margin-top: auto;
      margin-bottom: 80px;
    }

    .tp-publisher {
      font-size: 10pt;
      margin-bottom: 40px;
      color: #888;
    }

    .section-preface, .section-toc {
      break-after: page;
      padding-top: 40px;
      font-family: 'Open Sans', sans-serif;
    }

    .section-header {
      font-size: 24pt;
      border-bottom: 2px solid #1e40af;
      color: #1e40af;
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
  const titlePage = generateTitlePage(options);
  const prefaceSection = generatePrefaceSection(options.prefaceText);
  const tocSection = generateTocSection(tocEntries);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reading Advantage Workbook - ${escapeHtml(options.seriesName)}</title>
  <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"><\/script>
  <style>
    ${PRINT_STYLES}
  </style>
</head>
<body>
  ${titlePage}

  ${prefaceSection}

  ${tocSection}

  ${lessonsHtml}
</body>
</html>`;
}
