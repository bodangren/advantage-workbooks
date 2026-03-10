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
  thaiDefinition?: string;
}

export interface McAnswer {
  number: number;
  letter: string;
  text: string;
}

export interface OrderAnswer {
  number: number;
  sentence: string;
}

export interface AnswerKeyEntry {
  lessonTitle: string;
  mcAnswers?: McAnswer[];
  vocabMatchAnswerString?: string;
  vocabFillAnswerString?: string;
  sentenceOrderAnswers?: OrderAnswer[];
  shortAnswerHint?: string;
}

export interface TeacherGuideEntry {
  lessonTitle: string;
  genre?: string;
  articleType?: string;
  cefrLevel?: string;
  vocabulary: GlossaryEntry[];
  writingPrompt?: string;
  comprehensionQuestions?: { question: string; options?: string[]; answer?: string }[];
}

export interface WorkbookDocumentOptions {
  seriesName: string;
  seriesLevel: string;
  seriesTagline: string;
  prefaceText?: string;
  type?: 'primary' | 'secondary';
  glossary?: GlossaryEntry[];
  answerKey?: AnswerKeyEntry[];
  teacherGuide?: TeacherGuideEntry[];
  includeFlashcards?: boolean;
  includeProgressTracker?: boolean;
  includeCertificate?: boolean;
  includeTeacherGuide?: boolean;
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

function generateProgressTracker(tocEntries: TocEntry[], theme: ThemeColors): string {
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

function generateGlossarySection(glossary?: GlossaryEntry[]): string {
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

function generateAnswerKeySection(answerKey?: AnswerKeyEntry[]): string {
  if (!answerKey || answerKey.length === 0) return '';

  const answerItems = answerKey.map(entry => {
    let content = '';

    if (entry.mcAnswers && entry.mcAnswers.length > 0) {
      const mc = entry.mcAnswers.map(ans => `${ans.number}. ${ans.letter}`).join('  ');
      content += `<div class="ak-block"><strong>Multiple Choice:</strong> ${escapeHtml(mc)}</div>`;
    }

    if (entry.vocabMatchAnswerString) {
      content += `<div class="ak-block"><strong>Vocabulary Match:</strong> ${escapeHtml(entry.vocabMatchAnswerString)}</div>`;
    }

    if (entry.vocabFillAnswerString) {
      content += `<div class="ak-block"><strong>Vocabulary Fill:</strong> ${escapeHtml(entry.vocabFillAnswerString)}</div>`;
    }

    if (entry.sentenceOrderAnswers && entry.sentenceOrderAnswers.length > 0) {
      const order = entry.sentenceOrderAnswers.map(ans => `<div>${ans.number}. ${escapeHtml(ans.sentence)}</div>`).join('');
      content += `<div class="ak-block"><strong>Sentence Order:</strong> ${order}</div>`;
    }

    if (entry.shortAnswerHint) {
      content += `<div class="ak-block"><strong>Short Answer Hint:</strong> ${escapeHtml(entry.shortAnswerHint)}</div>`;
    }

    if (!content) return '';

    return `
      <div class="ak-lesson-entry">
        <h3 class="ak-lesson-title">${escapeHtml(entry.lessonTitle)}</h3>
        ${content}
      </div>
    `;
  }).join('\n');

  return `
    <div class="section-answer-key">
      <h2 class="section-header">Answer Key</h2>
      <div class="ak-list">
        ${answerItems}
      </div>
    </div>
  `;
}

function generateFlashcardsSection(glossary?: GlossaryEntry[]): string {
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

function generateTeacherGuideSection(entries?: TeacherGuideEntry[], theme?: ThemeColors): string {
  if (!entries || entries.length === 0) return '';

  const pages = entries.map(entry => {
    let vocabHtml = '';
    if (entry.vocabulary && entry.vocabulary.length > 0) {
      vocabHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Key Vocabulary</h4>
          <ul class="tg-vocab-list">
            ${entry.vocabulary.map(v => `<li><strong>${escapeHtml(v.word)}</strong>: ${escapeHtml(v.definition)} ${v.thaiDefinition ? `<em>(${escapeHtml(v.thaiDefinition)})</em>` : ''}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let compHtml = '';
    if (entry.comprehensionQuestions && entry.comprehensionQuestions.length > 0) {
      compHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Comprehension Questions</h4>
          <ol class="tg-comp-list">
            ${entry.comprehensionQuestions.map(q => `<li><strong>Q:</strong> ${escapeHtml(q.question)}<br/><strong>A:</strong> ${q.answer ? escapeHtml(q.answer) : '<em>See Answer Key</em>'}</li>`).join('')}
          </ol>
        </div>
      `;
    }

    let writingHtml = '';
    if (entry.writingPrompt) {
      writingHtml = `
        <div class="tg-section">
          <h4 class="tg-section-title">Writing Task</h4>
          <p class="tg-writing-prompt"><strong>Prompt:</strong> ${escapeHtml(entry.writingPrompt)}</p>
          <div class="tg-rubric">
            <strong>Suggested Rubric:</strong>
            <ul>
              <li><strong>Content:</strong> Directly addresses the prompt (40%)</li>
              <li><strong>Vocabulary:</strong> Uses key vocabulary from the lesson (30%)</li>
              <li><strong>Grammar/Mechanics:</strong> Correct sentence structure and spelling (30%)</li>
            </ul>
          </div>
        </div>
      `;
    }

    return `
      <div class="tg-lesson-page">
        <div class="tg-header" style="border-bottom: 3px solid ${theme?.primary || '#333'};">
          <h3 class="tg-lesson-title" style="color: ${theme?.primary || '#333'};">Teacher's Guide: ${escapeHtml(entry.lessonTitle)}</h3>
          <div class="tg-meta">
            ${entry.genre ? `<span class="tg-meta-item"><strong>Genre:</strong> ${escapeHtml(entry.genre)}</span>` : ''}
            ${entry.articleType ? `<span class="tg-meta-item"><strong>Type:</strong> ${escapeHtml(entry.articleType)}</span>` : ''}
            ${entry.cefrLevel ? `<span class="tg-meta-item"><strong>CEFR:</strong> ${escapeHtml(entry.cefrLevel)}</span>` : ''}
          </div>
        </div>
        <div class="tg-content">
          ${vocabHtml}
          ${compHtml}
          ${writingHtml}
        </div>
      </div>
    `;
  }).join('\\n');

  return `
    <div class="section-teacher-guide">
      <h2 class="section-header">Teacher's Guide</h2>
      <p class="tg-intro">This section provides a quick reference for each lesson to assist with classroom instruction.</p>
      ${pages}
    </div>
  `;
}

function generateCertificateSection(options: WorkbookDocumentOptions, theme: ThemeColors): string {
  return `
    <div class="section-certificate">
      <div class="certificate-border">
        <div class="certificate-inner">
          <h1 class="cert-title" style="color: ${theme.primary};">Certificate of Completion</h1>
          <div class="cert-subtitle">This is to certify that</div>
          <div class="cert-student-name"></div>
          <div class="cert-text">has successfully completed the Reading Advantage</div>
          <div class="cert-course-name">${escapeHtml(options.seriesName)} Level ${escapeHtml(options.seriesLevel)}</div>
          <div class="cert-text">workbook program, demonstrating dedication and outstanding effort in developing their English reading and writing skills.</div>
          
          <div class="cert-signatures">
            <div class="cert-sig-block">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">Teacher's Signature</div>
            </div>
            <div class="cert-sig-block">
              <div class="cert-sig-line"></div>
              <div class="cert-sig-label">Date</div>
            </div>
          </div>
        </div>
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

    .section-preface, .section-toc, .section-glossary, .section-answer-key {
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

    .glossary-thai {
      color: #4b5563;
      font-weight: 600;
      margin-right: 5px;
    }

    .ak-list {
      column-count: 2;
      column-gap: 30px;
      font-size: 11pt;
    }

    .ak-lesson-entry {
      break-inside: avoid;
      margin-bottom: 20px;
    }

    .ak-lesson-title {
      font-size: 13pt;
      color: ${theme.primary};
      margin: 0 0 8px 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }

    .ak-block {
      margin-bottom: 6px;
      line-height: 1.3;
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

    .section-flashcards {
      break-before: right; /* Always start on an odd page */
      padding-top: 40px;
      font-family: 'Open Sans', sans-serif;
    }

    .section-flashcards-page {
      break-after: right; /* Force blank page after each flashcards page */
      height: 285mm;
    }

    .fc-instructions {
      font-style: italic;
      color: #666;
      margin-bottom: 20px;
    }

    .flashcard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      width: 100%;
      border-top: 1px dashed #999;
      border-left: 1px dashed #999;
    }

    .flashcard {
      display: flex;
      flex-direction: row;
      border-right: 1px dashed #999;
      border-bottom: 1px dashed #999;
      break-inside: avoid;
      height: 60mm;
    }

    .fc-front, .fc-back {
      flex: 1;
      padding: 15px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .fc-fold-line {
      width: 1px;
      background-color: #ddd;
    }

    .fc-word {
      font-size: 16pt;
      font-weight: bold;
      color: ${theme.primary};
    }

    .fc-phonetic {
      font-size: 11pt;
      font-style: italic;
      color: #666;
      margin-bottom: 10px;
    }

    .fc-definition {
      font-size: 12pt;
    }

    .fc-thai {
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 5px;
    }

    .section-progress-tracker {
      break-after: page;
      padding-top: 40px;
      font-family: 'Open Sans', sans-serif;
    }

    .pt-instructions {
      font-size: 12pt;
      margin-bottom: 30px;
      color: #4b5563;
      text-align: center;
    }

    .pt-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
    }

    .progress-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 110px;
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 20px;
    }

    .pb-circle {
      width: 60px;
      height: 60px;
      border: 3px solid #ccc;
      border-radius: 50%;
      margin-top: 10px;
      background-color: transparent;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
    }

    .pb-number {
      font-size: 24pt;
      font-weight: 800;
      color: ${theme.primary};
      margin-bottom: 5px;
    }

    .pb-title {
      font-size: 10pt;
      color: #333;
      line-height: 1.2;
      height: 40px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .section-certificate {
      break-before: right;
      height: 285mm;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      padding: 20mm;
      font-family: 'Merriweather', serif;
    }

    .certificate-border {
      border: 8px solid ${theme.primary};
      padding: 10px;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background-color: #fdfdfd;
      box-shadow: inset 0 0 0 4px ${theme.secondary};
    }

    .certificate-inner {
      border: 2px solid ${theme.secondary};
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }

    .cert-title {
      font-size: 36pt;
      text-transform: uppercase;
      margin-bottom: 20px;
      letter-spacing: 2px;
    }

    .cert-subtitle {
      font-size: 16pt;
      color: #4b5563;
      margin-bottom: 30px;
      font-family: 'Open Sans', sans-serif;
    }

    .cert-student-name {
      border-bottom: 2px solid #333;
      width: 70%;
      height: 40px;
      margin-bottom: 30px;
    }

    .cert-text {
      font-size: 14pt;
      color: #333;
      max-width: 80%;
      line-height: 1.6;
      margin-bottom: 10px;
    }

    .cert-course-name {
      font-size: 20pt;
      font-weight: bold;
      color: ${theme.primary};
      margin: 15px 0;
      font-family: 'Open Sans', sans-serif;
    }

    .cert-signatures {
      display: flex;
      justify-content: space-between;
      width: 80%;
      margin-top: 60px;
    }

    .cert-sig-block {
      width: 40%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .cert-sig-line {
      border-bottom: 1px solid #333;
      width: 100%;
      height: 20px;
      margin-bottom: 10px;
    }

    .cert-sig-label {
      font-size: 12pt;
      color: #4b5563;
      font-family: 'Open Sans', sans-serif;
    }

    .section-teacher-guide {
      break-before: right;
      padding-top: 40px;
      font-family: 'Open Sans', sans-serif;
    }

    .tg-intro {
      font-style: italic;
      color: #666;
      margin-bottom: 30px;
      font-size: 12pt;
    }

    .tg-lesson-page {
      break-after: page;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      margin-bottom: 20px;
      background: #fafafa;
    }

    .tg-header {
      margin-bottom: 20px;
      padding-bottom: 10px;
    }

    .tg-lesson-title {
      font-size: 18pt;
      margin: 0 0 10px 0;
    }

    .tg-meta {
      display: flex;
      gap: 15px;
      font-size: 11pt;
      color: #555;
    }

    .tg-meta-item strong {
      color: #333;
    }

    .tg-section {
      margin-bottom: 20px;
      background: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }

    .tg-section-title {
      font-size: 14pt;
      margin: 0 0 10px 0;
      color: #4b5563;
    }

    .tg-vocab-list, .tg-comp-list {
      margin: 0;
      padding-left: 20px;
      font-size: 11pt;
      line-height: 1.5;
    }

    .tg-vocab-list li, .tg-comp-list li {
      margin-bottom: 8px;
    }

    .tg-writing-prompt {
      font-size: 11pt;
      margin-bottom: 10px;
    }

    .tg-rubric {
      font-size: 10pt;
      color: #444;
      background: #f8fafc;
      padding: 10px;
      border-left: 3px solid #cbd5e1;
    }

    .tg-rubric ul {
      margin: 5px 0 0 0;
      padding-left: 20px;
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
  const progressTrackerSection = options.includeProgressTracker ? generateProgressTracker(tocEntries, theme) : '';
  const glossarySection = generateGlossarySection(options.glossary);
  const answerKeySection = generateAnswerKeySection(options.answerKey);
  const flashcardsSection = options.includeFlashcards ? generateFlashcardsSection(options.glossary) : '';
  const teacherGuideSection = options.includeTeacherGuide ? generateTeacherGuideSection(options.teacherGuide, theme) : '';
  const certificateSection = options.includeCertificate ? generateCertificateSection(options, theme) : '';

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

  ${progressTrackerSection}

  ${lessonsHtml}

  ${glossarySection}

  ${answerKeySection}

  ${flashcardsSection}

  ${teacherGuideSection}

  ${certificateSection}
</body>
</html>`;
}