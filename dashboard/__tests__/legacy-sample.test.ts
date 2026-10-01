// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isReadOnlySql, jsonShape, SAMPLE_QUERIES } from '../lib/inject/legacy-sample';

describe('legacy sample', () => {
    it('gives the shape of a JSON value, not its text', () => {
        const sentences = [
            { sentence: 'Pip is happy.', startTime: 0, endTime: 1.2, words: [{ word: 'Pip', start: 0, end: 0.3 }] },
            { sentence: 'Lisa runs.', startTime: 1.2, endTime: 2 },
        ];
        expect(jsonShape(sentences)).toBe('[{sentence:string,startTime:number,endTime:number,words:[{word:string,start:number,end:number}] (1)}] (2)');
        expect(jsonShape({ th: ['a'], cn: [], tw: [], vi: [] })).toBe('{th:[string] (1),cn:[] (0),tw:[] (0),vi:[] (0)}');
        expect(jsonShape(null)).toBe('null');
        expect(jsonShape({ a: { b: { c: { d: 1 } } } })).toBe('{a:{b:{c:{…}}}}');
    });

    it('only reads: every query is one SELECT', () => {
        expect(isReadOnlySql('select 1')).toBe(true);
        expect(isReadOnlySql('  WITH x AS (select 1) select * from x')).toBe(true);
        expect(isReadOnlySql('update article set title = $1')).toBe(false);
        expect(isReadOnlySql('select 1; delete from article')).toBe(false);
        expect(isReadOnlySql('with x as (delete from article returning id) select * from x')).toBe(false);
        for (const [name, sql] of Object.entries(SAMPLE_QUERIES)) expect(isReadOnlySql(sql), name).toBe(true);
    });

    it('gives every query the article ids as $1, because the script binds them to each query', () => {
        for (const [name, sql] of Object.entries(SAMPLE_QUERIES)) expect(sql, name).toMatch(/\$1\b/);
    });
});
