/**
 * Prints the `footer-strip` box of each reader cover of one week in the student book HTML
 * (Task "Hand-off from storytime_cover_options", Phase 9, cause of the week 7 leaf covers).
 * The compile needs no Chrome. Usage, from `dashboard`: `npx tsx <this file> <week>`.
 */
import { STORYTIME_PRINT_PROFILE } from '/home/daniebo/Desktop/Workbooks/dashboard/lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '/home/daniebo/Desktop/Workbooks/dashboard/lib/storytime/print/student-book';
import { readLevelWeeks, STORYTIME_ROOT } from '/home/daniebo/Desktop/Workbooks/dashboard/lib/storytime/files';

const week = Number(process.argv[2]);
const read = readLevelWeeks(STORYTIME_ROOT, 2).filter((r) => ((r.raw as { meta?: { week?: number } }).meta?.week ?? -1) === week);
const result = compileStorytimeStudentBook(read.map((r) => r.week!) as never, { profile: STORYTIME_PRINT_PROFILE, mode: 'final', pendingPictures: [] } as never);
const html = (result as unknown as { html: string }).html;
for (const found of html.matchAll(/data-part="footer-strip" style="left:|data-part="footer-strip" style="([^"]*)"/g)) {
    const style = found[1] ?? '';
    const box = /left:([\d.]+)mm;top:([\d.]+)mm;width:([\d.]+)mm;height:([\d.]+)mm/.exec(style);
    if (box) console.log(`week ${week} footer-strip left ${box[1]} mm, top ${box[2]} mm, width ${box[3]} mm, height ${box[4]} mm`);
}
