import type { PackageReport } from './checks';

/**
 * Formats package reports as text, one block per lesson, then a summary line.
 * @param reports One report per package, with the file it came from.
 * @returns The text report.
 */
export function formatPackageReports(reports: (PackageReport & { file: string })[]): string {
    const lines: string[] = [];
    let fails = 0;
    let warns = 0;
    for (const r of reports) {
        lines.push(`${r.lesson} — ${r.title}   [${r.file}]`);
        for (const c of r.checks) {
            if (c.status === 'fail') fails++;
            if (c.status === 'warn') warns++;
            lines.push(`  ${c.status.toUpperCase().padEnd(7)} ${c.id.padEnd(15)} ${c.label}${c.detail ? ` — ${c.detail}` : ''}`);
        }
        const warnText = r.text?.checks.filter((c) => c.status === 'warn').map((c) => `${c.id} ${c.value}`) ?? [];
        if (warnText.length) lines.push(`  Text-check warnings: ${warnText.join(', ')}`);
        if (r.text?.nonStarters.length) lines.push(`  Non-Starters words: ${r.text.nonStarters.map((w) => `${w.word} (${w.level})`).join(', ')}`);
        lines.push('');
    }
    lines.push(`Summary: ${reports.length} package(s), ${fails} failed check(s), ${warns} warning(s).`);
    return lines.join('\n');
}
