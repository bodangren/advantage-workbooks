import fs from 'fs';
import path from 'path';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { WorkbookLessonSchema } from '../lib/workbook-schema';

const USAGE = `Builds the workbook lesson JSON from a lesson package (no AI call).

Usage: npx tsx scripts/build-workbook-json.ts <package.json> [--out <file>] [--media-base <url>]

Run scripts/check-lesson-package.ts first. Without --out, the JSON goes to standard output.
Exit code: 0 on success, 1 when the output fails WorkbookLessonSchema, 2 on a usage or file error.`;

function main(argv: string[]): number {
    let input: string | undefined;
    let out: string | undefined;
    let mediaBase: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--media-base') mediaBase = argv[++i];
        else input = path.resolve(a);
    }
    if (!input || !fs.existsSync(input)) {
        console.error(USAGE);
        return 2;
    }
    const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(input, 'utf8')));
    if (!parsed.success) {
        console.error(`Not a valid package: ${parsed.error.issues[0]?.path.join('.')}: ${parsed.error.issues[0]?.message}`);
        return 2;
    }
    const lesson = buildWorkbookLesson(parsed.data, { mediaBase });
    const valid = WorkbookLessonSchema.safeParse(lesson);
    if (!valid.success) {
        console.error(`Output fails WorkbookLessonSchema: ${valid.error.issues[0]?.path.join('.')}: ${valid.error.issues[0]?.message}`);
        return 1;
    }
    const text = `${JSON.stringify(lesson, null, 2)}\n`;
    if (out) fs.writeFileSync(out, text);
    else process.stdout.write(text);
    return 0;
}

process.exitCode = main(process.argv.slice(2));
