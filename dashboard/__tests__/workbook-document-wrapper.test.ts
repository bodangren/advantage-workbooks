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
      expect(html).toMatch(/@page\s*:\s*first.*content:\s*none/s);
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
});
