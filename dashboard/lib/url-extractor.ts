/**
 * Extracts plain text from HTML by stripping script, style, and noscript tags
 * and their content, then collapsing whitespace.
 */
export function extractTextFromHtml(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}