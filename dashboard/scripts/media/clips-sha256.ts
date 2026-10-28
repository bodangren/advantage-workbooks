import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runClipChecksumLists } from '../../lib/media/clips-sha256';

const USAGE = `Creates or checks SHA-256 lists for cached lesson clips.

Usage: cd dashboard && npx tsx scripts/media/clips-sha256.ts [--write | --check]

Options:
  --write   Write the checksum lists (default)
  --check   Compare the lists with the clip caches; change nothing`;

/** Parses the command-line mode. */
export function parseArgs(argv: string[]): 'write' | 'check' | null {
    if (!argv.length || argv.length === 1 && argv[0] === '--write') return 'write';
    if (argv.length === 1 && argv[0] === '--check') return 'check';
    console.error(USAGE);
    return null;
}

/** Runs the checksum-list command. */
export function main(argv: string[]): number {
    const mode = parseArgs(argv);
    if (!mode) return 2;
    const dashboard = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const repo = path.resolve(dashboard, '..');
    const result = runClipChecksumLists({ primaryRoot: path.join(repo, 'content/primary'), storytimeRoot: path.join(repo, 'content/storytime'), mode });
    if (result.differences.length) {
        result.differences.forEach((line) => console.log(line));
        return 1;
    }
    if (mode === 'check') console.log(`Check passed: ${result.files} clip files across 26 lists.`);
    else console.log(`Wrote ${result.files} clip entries across 26 lists.`);
    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
