import { describe, it, expect } from 'vitest';
import { wrapWorkbookDocument, type WorkbookDocumentOptions, type TocEntry } from '@/lib/workbook-document-wrapper';

describe('Workbook Document Wrapper', () => {
  const defaultOptions: WorkbookDocumentOptions = {
    seriesName: 'Origins',
    seriesLevel: '3.1',
    seriesTagline: 'Learning Made Fun',
    prefaceText: 'Welcome to the workbook.\n\nThis is the second paragraph.'
  };

  const sampleLessonsHtml = `
    <div class="lesson-section" id="lesson-0">
      <h1>Lesson 1: Introduction</h1>
      <p>Content for lesson 1</p>
    </div>
    <div class="lesson-section" id="lesson-1">
      <h1>Lesson 2: Chapter One</h1>
      <p>Content for lesson 2</p>
    </div>
  `;

  const sampleTocEntries: TocEntry[] = [
    { id: 'lesson-0', title: 'Introduction', genre: 'Fiction', articleType: 'Article' },
    { id: 'lesson-1', title: 'Chapter One', genre: 'Non-Fiction', articleType: 'Story' }
  ];

  describe('wrapWorkbookDocument', () => {
    it('should generate a complete HTML document', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include Paged.js script', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('pagedjs');
      expect(html).toMatch(/paged\.polyfill\.js|paged\.js/);
    });

    it('should include title page', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('cover-page');
      expect(html).toContain('Reading Advantage');
      expect(html).toContain('Origins');
      expect(html).toContain('Level 3.1');
      expect(html).toContain('Learning Made Fun');
    });

    it('should include preface section', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('section-preface');
      expect(html).toContain('Preface');
      expect(html).toContain('Welcome to the workbook');
    });

    it('should include table of contents', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('section-toc');
      expect(html).toContain('Table of Contents');
      expect(html).toContain('lesson-0');
      expect(html).toContain('Introduction');
      expect(html).toContain('Fiction');
    });

    it('should include TOC entries with target-counter for page numbers', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('target-counter');
      expect(html).toContain('href="#lesson-0"');
    });

    it('should include print CSS with @page rules', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('@page');
      expect(html).toContain('size:');
      expect(html).toContain('margin:');
    });

    it('should include page number counter in @bottom-center', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('@bottom-center');
      expect(html).toContain('counter(page)');
    });

    it('should hide page number on first page', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('@page :first');
      expect(html).toMatch(/@page\s*:\s*first[^]*content:\s*none/);
    });

    it('should include screen preview styles', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('.pagedjs_page');
      expect(html).toContain('.pagedjs_pages');
    });

    it('should include lesson content', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('Lesson 1: Introduction');
      expect(html).toContain('Lesson 2: Chapter One');
      expect(html).toContain('Content for lesson 1');
    });

    it('should handle empty lessons HTML', () => {
      const html = wrapWorkbookDocument('', [], defaultOptions);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('cover-page');
    });

    it('should handle missing preface text', () => {
      const optionsWithoutPreface = { ...defaultOptions, prefaceText: undefined };
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, optionsWithoutPreface);
      
      expect(html).toContain('section-preface');
    });

    it('should handle multi-paragraph preface text', () => {
      const multiParagraphPreface = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const options = { ...defaultOptions, prefaceText: multiParagraphPreface };
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, options);
      
      const prefaceMatch = html.match(/<div class="preface-content">([\s\S]*?)<\/div>/);
      expect(prefaceMatch).not.toBeNull();
      const pTags = (prefaceMatch![1].match(/<p>/g) || []).length;
      expect(pTags).toBe(3);
    });

    it('should include break-inside:avoid for question boxes', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('break-inside');
      expect(html).toContain('avoid');
    });

    it('should not emit literal backslash-n text nodes in generated sections', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        teacherGuide: [
          {
            lessonTitle: 'Lesson 1: Sample',
            vocabulary: [{ word: 'word', phonetic: '', definition: 'meaning' }],
            writingPrompt: 'Write something.',
            comprehensionQuestions: [{ question: 'Q1?', answer: 'A1' }],
          },
        ],
        spellingPractice: [
          {
            lessonTitle: 'Lesson 1: Sample',
            vocabulary: [{ word: 'word', phonetic: '', definition: 'meaning' }],
          },
        ],
        includeTeacherGuide: true,
        includeSpellingPractice: true,
      });

      expect(html).not.toContain('\\n');
    });
  });

  describe('TOC entry formatting', () => {
    it('should include genre and article type in TOC items', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('Fiction');
      expect(html).toContain('Non-Fiction');
      expect(html).toContain('Article');
      expect(html).toContain('Story');
    });

    it('should handle TOC entries without genre/articleType', () => {
      const minimalToc: TocEntry[] = [
        { id: 'lesson-0', title: 'Simple Title' }
      ];
      const html = wrapWorkbookDocument(sampleLessonsHtml, minimalToc, defaultOptions);
      
      expect(html).toContain('Simple Title');
    });
  });

  describe('brand color by workbook type', () => {
    it('uses primary theme for Origins', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        seriesName: 'Origins',
      });
      expect(html).toContain('#228b22');
      expect(html).toContain('#8b4513');
    });

    it('uses primary blue (#0284c7) for fallback primary workbooks', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        seriesName: 'Unknown',
        type: 'primary',
      });
      expect(html).toContain('#0284c7');
    });

    it('uses secondary blue (#1e40af) for fallback secondary workbooks', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        seriesName: 'Unknown',
        type: 'secondary',
      });
      expect(html).toContain('#1e40af');
    });

    it('defaults to secondary blue when type is omitted', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        seriesName: 'Unknown'
      });
      expect(html).toContain('#1e40af');
    });
  });

  describe('print media styles', () => {
    it('should include @media print rules', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toContain('@media print');
    });

    it('should set white background for print', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toMatch(/@media print[\s\S]*background:\s*white/i);
    });

    it('should remove box-shadow for print', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      
      expect(html).toMatch(/@media print[\s\S]*box-shadow:\s*none/i);
    });
  });

  describe('certificate section', () => {
    it('should include certificate section when includeCertificate is true', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeCertificate: true
      });
      
      expect(html).toContain('section-certificate');
      expect(html).toContain('Certificate of Completion');
    });

    it('should not include certificate section when includeCertificate is false or undefined', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeCertificate: false
      });
      
      expect(html).not.toContain('<div class="section-certificate">');
      expect(html).not.toContain('Certificate of Completion');
      
      const htmlUndefined = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      expect(htmlUndefined).not.toContain('<div class="section-certificate">');
    });
  });

  describe('self assessment section', () => {
    it('should include self assessment section when includeSelfAssessment is true', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeSelfAssessment: true
      });
      
      expect(html).toContain('section-self-assessment');
      expect(html).toContain('My Learning Reflection');
    });

    it('should not include self assessment section when includeSelfAssessment is false or undefined', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeSelfAssessment: false
      });
      
      expect(html).not.toContain('<div class="section-self-assessment">');
      expect(html).not.toContain('My Learning Reflection');
      
      const htmlUndefined = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      expect(htmlUndefined).not.toContain('<div class="section-self-assessment">');
    });
  });

  describe('teacher guide section', () => {
    const sampleTeacherGuide = [
      {
        lessonTitle: 'Lesson 1: Introduction',
        genre: 'Fiction',
        vocabulary: [{ word: 'Test', phonetic: '/tɛst/', definition: 'A procedure intended to establish the quality, performance, or reliability of something.' }],
        writingPrompt: 'Write a story.',
      }
    ];

    it('should include teacher guide section when includeTeacherGuide is true', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeTeacherGuide: true,
        teacherGuide: sampleTeacherGuide
      });
      
      expect(html).toContain('section-teacher-guide');
      expect(html).toContain("Teacher's Guide");
      expect(html).toContain('Lesson 1: Introduction');
      expect(html).toContain('Write a story.');
    });

    it('should not include teacher guide section when includeTeacherGuide is false or undefined', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeTeacherGuide: false,
        teacherGuide: sampleTeacherGuide
      });
      
      expect(html).not.toContain('<div class="section-teacher-guide">');
      
      const htmlUndefined = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      expect(htmlUndefined).not.toContain('<div class="section-teacher-guide">');
    });
  });

  describe('spelling practice section', () => {
    const sampleSpellingPractice = [
      {
        lessonTitle: 'Lesson 1: Introduction',
        vocabulary: [{ word: 'Test', phonetic: '/tɛst/', definition: 'A procedure' }]
      }
    ];

    it('should include spelling practice section when includeSpellingPractice is true', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeSpellingPractice: true,
        spellingPractice: sampleSpellingPractice
      });
      
      expect(html).toContain('section-spelling-practice');
      expect(html).toContain('Spelling Practice: Lesson 1: Introduction');
    });

    it('should not include spelling practice section when includeSpellingPractice is false or undefined', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeSpellingPractice: false,
        spellingPractice: sampleSpellingPractice
      });
      
      expect(html).not.toContain('<div class="section-spelling-practice">');
      
      const htmlUndefined = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      expect(htmlUndefined).not.toContain('<div class="section-spelling-practice">');
    });
  });

  describe('goal setting section', () => {
    it('should include goal setting section when includeGoalSetting is true', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeGoalSetting: true
      });
      
      expect(html).toContain('section-goal-setting');
      expect(html).toContain('My English Learning Goals');
    });

    it('should not include goal setting section when includeGoalSetting is false or undefined', () => {
      const html = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, {
        ...defaultOptions,
        includeGoalSetting: false
      });
      
      expect(html).not.toContain('<div class="section-goal-setting">');
      
      const htmlUndefined = wrapWorkbookDocument(sampleLessonsHtml, sampleTocEntries, defaultOptions);
      expect(htmlUndefined).not.toContain('<div class="section-goal-setting">');
    });
  });
});
