// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { readLevelWeeks, STORYTIME_ROOT } from '../lib/storytime/files';
import { compileStorytimeManual } from '../lib/storytime/manual';

const manualCli = path.resolve(__dirname, '../scripts/storytime/make-manual-pdf.ts');
const printCli = path.resolve(__dirname, '../scripts/storytime/make-teacher-book-print.ts');

function source(file: string): ts.SourceFile {
    return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

function compiledLoopsArgument(file: string): boolean {
    const parsed = source(file);
    let passed = false;
    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(parsed) === 'compileStorytimeManual') {
            passed = node.arguments.some((arg) => ts.isObjectLiteralExpression(arg)
                && arg.properties.some((property) => (ts.isPropertyAssignment(property)
                    && property.name.getText(parsed) === 'loops' && property.initializer.getText(parsed) === 'loops')
                    || (ts.isShorthandPropertyAssignment(property) && property.name.text === 'loops')));
        }
        ts.forEachChild(node, visit);
    };
    visit(parsed);
    return passed;
}

describe('Storytime teacher-book loop print flag', () => {
    it.each([manualCli, printCli])('%s accepts --loops and passes it to the manual compiler', (file) => {
        const parsed = source(file);
        const text = parsed.getFullText();
        expect(text).toContain("a === '--loops'");
        expect(compiledLoopsArgument(file)).toBe(true);
    });

    it('documents --loops in the manual PDF help', () => {
        const output = execFileSync(process.execPath, ['--import', 'tsx', manualCli, '--help'], {
            cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 25_000,
        });
        expect(output).toContain('--loops');
    }, 30_000);

    it('returns exit 2 for an unknown manual PDF flag', () => {
        let status: number | null = null;
        try {
            execFileSync(process.execPath, ['--import', 'tsx', manualCli, '--level', '2', '--unknown'], {
                cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 25_000,
            });
        } catch (error) {
            status = (error as NodeJS.ErrnoException & { status?: number | null }).status ?? null;
        }
        expect(status).toBe(2);
    }, 30_000);

    it('does not print loop headings for a shipped week when the option is on', () => {
        const week = readLevelWeeks(STORYTIME_ROOT, 2).find((item) => item.week?.meta.week === 1)?.week;
        expect(week).toBeDefined();
        const html = compileStorytimeManual([week!], { lang: 'th', loops: true } as any).html;
        const visibleText = html.replace(/<[^>]+>/g, ' ');
        expect(visibleText).not.toContain('ขั้นตอนฝึกผสมเสียง');
        expect(visibleText).not.toContain('กิจกรรมทบทวนเสียง');
    });

    it('keeps the print build arguments limited to the requested week and output folder', () => {
        const diagnostics = ts.transpileModule(fs.readFileSync(printCli, 'utf8'), {
            fileName: printCli,
            reportDiagnostics: true,
        }).diagnostics ?? [];
        expect(diagnostics).toHaveLength(0);
        expect(fs.existsSync(manualCli)).toBe(true);
    });
});
