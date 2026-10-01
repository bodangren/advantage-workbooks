import type { BookReport, CheckResult } from './check';

function checkLine(c: CheckResult): string {
    const line = `  ${c.status.toUpperCase().padEnd(7)} ${c.id.padEnd(15)} ${c.value.padEnd(22)} target ${c.target}`;
    return c.detail ? `${line}\n${' '.repeat(26)}${c.detail}` : line;
}

/**
 * Formats a book report as plain text for the terminal.
 * @param book The report from checkBook.
 * @returns The report text.
 */
export function formatReport(book: BookReport): string {
    const out: string[] = [];
    for (const r of book.lessons) {
        out.push(`${r.id} — ${r.title}   [${r.source}, profile ${r.profile}]`);
        out.push(...r.checks.map(checkLine));
        out.push(`  Longest sentence (${r.stats.longestSentence} words): ${r.stats.longestSentenceText}`);
        out.push(
            `  Non-Starters words: ${
                r.nonStarters.length ? r.nonStarters.map((w) => `${w.word} (${w.level}${w.count > 1 ? ` ×${w.count}` : ''})`).join(', ') : 'none'
            }`,
        );
        if (r.allowed.length) out.push(`  Allowed words: ${r.allowed.map((w) => `${w.word}${w.count > 1 ? ` ×${w.count}` : ''}`).join(', ')}`);
        out.push(`  Names: ${r.names.join(', ') || 'none'}${r.guessedNames.length ? `   Guessed names: ${r.guessedNames.join(', ')}` : ''}`);
        out.push(`  New Starters words (${r.newWords.length}): ${r.newWords.join(', ') || 'none'}`);
        out.push(`  Recycled words (${r.recycled.length}): ${r.recycled.join(', ') || 'none'}`);
        out.push('');
    }
    if (book.checks.length) {
        out.push('Book');
        out.push(...book.checks.map(checkLine));
        out.push('');
    }
    const all = [...book.lessons.flatMap((r) => r.checks), ...book.checks];
    const fails = all.filter((c) => c.status === 'fail').length;
    const warns = all.filter((c) => c.status === 'warn').length;
    out.push(`Summary: ${book.lessons.length} lesson(s), ${fails} failed check(s), ${warns} warning(s).`);
    return out.join('\n');
}
