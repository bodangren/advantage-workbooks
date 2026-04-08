import { describe, it, expect } from 'vitest';
import { extractTextFromHtml } from '../lib/url-extractor';

describe('extractTextFromHtml', () => {
    it('should strip script tags and their content', () => {
        const html = '<html><body><p>Hello</p><script>alert("test");</script></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('alert');
        expect(result).toContain('Hello');
    });

    it('should strip style tags and their content', () => {
        const html = '<html><head><style>body { color: red; }</style></head><body><p>Content</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('color: red');
        expect(result).toContain('Content');
    });

    it('should strip noscript tags and their content', () => {
        const html = '<html><body><noscript>Please enable JS</noscript><p>Real content</p></body></html>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('Please enable JS');
        expect(result).toContain('Real content');
    });

    it('should strip all HTML tags', () => {
        const html = '<div class="test"><span>Text with <strong>bold</strong></span></div>';
        const result = extractTextFromHtml(html);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        expect(result).toContain('Text with bold');
    });

    it('should collapse multiple whitespace characters', () => {
        const html = '<p>Text    with\n\n\ttabs   and\n\nspaces</p>';
        const result = extractTextFromHtml(html);
        expect(result).toBe('Text with tabs and spaces');
    });

    it('should trim leading and trailing whitespace', () => {
        const html = '   <p>Hello</p>   ';
        const result = extractTextFromHtml(html);
        expect(result).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
        expect(extractTextFromHtml('')).toBe('');
    });

    it('should return empty string for null/undefined input', () => {
        expect(extractTextFromHtml(null as any)).toBe('');
        expect(extractTextFromHtml(undefined as any)).toBe('');
    });

    it('should handle nested script tags', () => {
        const html = '<div><script>inner</script><p>visible</p></div>';
        const result = extractTextFromHtml(html);
        expect(result).toContain('visible');
        expect(result).not.toContain('inner');
    });

    it('should handle HTML with only tags', () => {
        const html = '<div></div><span></span>';
        const result = extractTextFromHtml(html);
        expect(result).toBe('');
    });

    it('should preserve text across multiple paragraphs', () => {
        const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
        const result = extractTextFromHtml(html);
        expect(result).toBe('First paragraph. Second paragraph.');
    });
});