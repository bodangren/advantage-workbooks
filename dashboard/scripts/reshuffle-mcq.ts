import fs from 'fs';
import path from 'path';
import { shuffleOptions } from '../lib/lesson-package/author';
import { CONTENT_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import type { LessonPackage } from '../lib/lesson-package/schema';
import { tutorItems } from '../lib/media/tutor-audio';

const USAGE = `Puts the MCQ options of authored packages in the fixed shuffle order (one-off, 2026-10-06).

Usage: npx tsx scripts/reshuffle-mcq.ts <book> [<book> ...] [--write]

The old option shuffle put 99% of answers last. This script changes only bank.mcq[].options (the
same options, the same answer) to the order that author-package now makes, and renames the local
Tutor option clips to their new ids (the clip text does not change, so no TTS). Approvals stay:
the content of each question does not change. Only books with a src/ folder take part (printed
books keep their printed order). Without --write it prints what it would change.`;

interface Rename {
    from: string;
    to: string;
}

/**
 * The option clip renames for one package: the same text under its new option key.
 * @param before The package with the old option order.
 * @param after The package with the new option order.
 * @param folder The absolute Tutor clip folder.
 * @returns The renames whose source file exists.
 */
function clipRenames(before: LessonPackage, after: LessonPackage, folder: string): Rename[] {
    const oldQ = tutorItems(before).questions;
    const newQ = tutorItems(after).questions;
    const out: Rename[] = [];
    oldQ.forEach((q, i) => {
        for (const o of q.options) {
            const n = newQ[i].options.find((x) => x.text === o.text);
            if (!n || n.id === o.id) continue;
            const from = path.join(folder, `${o.id}.mp3`);
            if (fs.existsSync(from)) out.push({ from, to: path.join(folder, `${n.id}.mp3`) });
        }
    });
    return out;
}

function main(argv: string[]): number {
    const write = argv.includes('--write');
    const books = argv.filter((a) => !a.startsWith('--'));
    if (!books.length || argv.includes('--help')) {
        console.log(USAGE);
        return books.length ? 0 : 2;
    }
    const position = [0, 0, 0, 0];
    let changed = 0;
    let clips = 0;
    for (const book of books) {
        const dir = path.join(CONTENT_ROOT, book);
        if (!fs.existsSync(path.join(dir, 'src'))) {
            console.error(`${book}: no src/ folder; skipped (printed order)`);
            continue;
        }
        for (const f of loadPackageFolder(dir)) {
            if (!f.pkg) {
                console.error(`${f.file}: ${f.error}`);
                return 1;
            }
            const lesson = path.basename(f.file, '.json');
            const raw = f.raw as { bank: { mcq: { id: string; options: string[]; answer: string }[] } };
            let edits = 0;
            for (const q of raw.bank.mcq) {
                const next = shuffleOptions(q.options, `${book}/${lesson}/${q.id}`);
                if (next.join('\n') !== q.options.join('\n')) edits++;
                q.options = next;
                position[next.indexOf(q.answer)]++;
            }
            const after: LessonPackage = { ...f.pkg, bank: { ...f.pkg.bank, mcq: f.pkg.bank.mcq.map((q, i) => ({ ...q, options: raw.bank.mcq[i].options })) } };
            const renames = f.pkg.audio?.tutor ? clipRenames(f.pkg, after, path.join(CONTENT_ROOT, f.pkg.audio.tutor)) : [];
            if (!edits) continue;
            changed++;
            clips += renames.length;
            console.log(`${book}/${lesson}: ${edits} MCQ reordered, ${renames.length} Tutor clips renamed`);
            if (!write) continue;
            fs.writeFileSync(f.file, `${JSON.stringify(raw, null, 2)}\n`);
            for (const r of renames) fs.renameSync(r.from, `${r.to}.tmp`);
            for (const r of renames) fs.renameSync(`${r.to}.tmp`, r.to);
        }
    }
    console.log(`\n${changed} packages, ${clips} clips${write ? '' : ' (dry run; add --write)'}. Answer positions after: ${position.join(' / ')}`);
    return 0;
}

process.exit(main(process.argv.slice(2)));
