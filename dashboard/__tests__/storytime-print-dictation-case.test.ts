// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';

const weekFivePath = storytimeWeekFile(STORYTIME_ROOT, 2, 5);

function shippedWeekFive() {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(weekFivePath, 'utf8')));
}

describe('Storytime print dictation case', () => {
    it('accepts a capitalised dictated word that C3 says', () => {
        const week = shippedWeekFive();
        if (!week.print) throw new Error('Week 5 has no print block.');
        week.print.dictation.words = ['Sam'];

        const dictation = checkStorytimePrintText(week).find((item) => item.id === 'print-dictation');
        expect(dictation?.status).toBe('pass');
    });

    it('rejects a dictated word that C3 does not say', () => {
        const week = shippedWeekFive();
        if (!week.print) throw new Error('Week 5 has no print block.');
        week.print.dictation.words = ['Sax'];

        const dictation = checkStorytimePrintText(week).find((item) => item.id === 'print-dictation');
        expect(dictation?.status).toBe('fail');
    });
});
