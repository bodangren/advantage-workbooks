import { describe, it, expect } from 'vitest';
import { wrapTeacherManualDocument } from '@/lib/teacher-manual/document-wrapper';
import type { TeacherManualOptions } from '@/lib/teacher-manual/types';

describe('Teacher Manual Document Wrapper', () => {
  const defaultOptions: TeacherManualOptions = {
    seriesName: 'Origins',
    seriesLevel: '2',
    cefrLevel: 'A0',
    type: 'primary',
    lang: 'en',
  };

  const frontMatterHtml = '<div class="tm-title-page"><h1>Title</h1></div><div class="tm-section tm-preface"><h2>Preface</h2></div>';
  const lessonPlansHtml = '<div class="tm-lesson-plan" id="lesson-1"><div class="tm-step-block"><div class="step-insert" data-step="1"></div></div></div>';
  const endMatterHtml = '<div class="tm-section tm-end-section"><h2>End</h2></div>';

  describe('wrapTeacherManualDocument', () => {
    it('should generate a complete HTML document', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<body>');
    });

    it('should include the Paged.js polyfill', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      expect(html).toMatch(/paged\.polyfill\.js/);
    });

    it('should inject the rAF resilience shim before the Paged.js polyfill', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      const shimIdx = html.indexOf('requestAnimationFrame');
      const polyfillIdx = html.indexOf('paged.polyfill.js');
      expect(shimIdx).toBeGreaterThanOrEqual(0);
      expect(polyfillIdx).toBeGreaterThan(shimIdx);
      expect(html).toContain('visibilityState');
    });

    it('should arm a setTimeout(0) fallback alongside rAF so progress survives frame starvation', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      // The visible path must not depend on native rAF: a callback is wrapped
      // so whichever of rAF / setTimeout(0) fires first runs it once.
      expect(html).toContain('nativeRaf(wrapped)');
      expect(html).toContain('wrapped(performance.now())');
      expect(html).toContain('setTimeout(function () {');
    });

    it('should flush the hidden-queue on visibilitychange so a hidden tab resumes on show', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      expect(html).toContain("addEventListener('visibilitychange'");
      expect(html).toContain('flushPending()');
      expect(html).toContain('nativeCancelRaf');
    });

    it('should not mark the full step block as unbreakable', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      const stepBlockRule = html.match(/\.tm-step-block \{[^}]*\}/)?.[0] ?? '';
      expect(stepBlockRule).toContain('margin-bottom');
      expect(stepBlockRule).not.toContain('break-inside');
    });

    it('should keep the student-view insert unbreakable (Task 3.3 intent)', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      expect(html).toMatch(/\.step-insert \{[\s\S]*?break-inside:\s*avoid/);
    });

    it('should include front matter, lesson plans, and end matter in the body', () => {
      const html = wrapTeacherManualDocument(frontMatterHtml, lessonPlansHtml, endMatterHtml, defaultOptions);

      expect(html).toContain('tm-title-page');
      expect(html).toContain('tm-lesson-plan');
      expect(html).toContain('tm-end-section');
    });
  });
});
