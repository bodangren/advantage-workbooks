import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { renderMultipleLessons } from '../lib/template-renderer';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';

// Track print_layout_audit_20261001: the vocabulary write-in column (column 2 of step 2) collapsed
// to a sliver when the table width came from the cell content. The fix (a0acfc00) fixes the layout
// and the column widths. This test keeps the fix in both looks.
const CONTENT = path.resolve(process.cwd(), '..', 'content', 'primary');

async function render(look: 'classic' | 'chibi-quest'): Promise<string> {
    const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(path.join(CONTENT, 'quest-5', 'l01.json'), 'utf8')));
    return renderMultipleLessons([await buildWorkbookLesson(pkg, {})], { type: 'primary', look });
}

/** The bodies of every CSS rule whose last selector is `selector`, joined. */
function rule(css: string, selector: string): string {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bodies = [...css.matchAll(new RegExp(`(?:^|[}\\s,])${escaped}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]);
    expect(bodies.length, `rule ${selector}`).toBeGreaterThan(0);
    return bodies.join(' ');
}

describe.each(['classic', 'chibi-quest'] as const)('vocabulary write-in column (%s look)', (look) => {
    it('has a colgroup with a 42% word column and a 58% write-in column', async () => {
        const html = await render(look);
        const table = html.match(/<table class="vocab-table">([\s\S]*?)<\/table>/);
        expect(table).not.toBeNull();
        const cols = [...table![1].matchAll(/<col style="width:\s*(\d+)%"/g)].map((m) => Number(m[1]));
        expect(cols).toEqual([42, 58]);
        expect(table![1].match(/<tr>\s*<td>/g)?.length ?? 0).toBeGreaterThan(0);
    });

    it('fixes the table layout, the column widths, and the write-in cell height', async () => {
        const html = await render(look);
        expect(rule(html, '.vocab-table')).toMatch(/table-layout:\s*fixed/);
        expect(rule(html, '.vocab-table td:nth-child(1)')).toMatch(/width:\s*42%/);
        const second = rule(html, '.vocab-table td:nth-child(2)');
        expect(second).toMatch(/min-height:\s*20mm/);
        expect(second).toMatch(/height:\s*20mm/);
    });

    it('keeps each row on one page', async () => {
        const html = await render(look);
        expect(rule(html, '.vocab-table tr')).toMatch(/break-inside:\s*avoid/);
    });
});

describe('chibi-quest look does not undo the write-in column fix', () => {
    it('sets no table layout, column width, or write-in cell height of its own', () => {
        const css = getChibiQuestStyles();
        const lines = css.split('\n').filter((l) => l.includes('.vocab-table'));
        expect(lines.length).toBeGreaterThan(0);
        for (const l of lines) expect(l).not.toMatch(/table-layout|width|height|display/);
    });
});
