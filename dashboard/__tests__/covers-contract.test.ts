import { describe, it, expect } from 'vitest';
import { COVER_BOOKS, coverBook } from '../lib/covers/catalogue';
import { CoverDataSchema, CoverSeriesSchema } from '../lib/covers/schema';
import { bookNames, checkCoverText, expandCoverText } from '../lib/covers/check';

// Track book_covers_20261007. The Canva Origins 3.2 back (2026-10-07) had two copy errors.
const CANVA_32_BOOK = '**Origins3.2** เป็นก้าวแรกในการผจญภัยของคุณ ประกอบด้วย **14** บทเรียนที่ครอบคลุมทั้งบทความสารคดีและนิยาย';
const CANVA_32_NEXT = 'พร้อมก้าวสู่ **Origins 2** เพื่อเดินทางต่อไป';

describe('cover catalogue', () => {
    it('has the 16 books in teaching order, with Origins 2 after Origins 1', () => {
        expect(COVER_BOOKS).toHaveLength(16);
        expect(COVER_BOOKS.slice(0, 5)).toEqual(['origins-1', 'origins-2', 'origins-3.1', 'origins-3.2', 'quest-4']);
        expect(COVER_BOOKS.at(-1)).toBe('adventure-9.3');
    });

    it('gives the name, series, level, next book, badge, and file stem', () => {
        const b = coverBook('origins-3.2');
        expect(b).toMatchObject({ name: 'Origins 3.2', series: 'Origins', level: 3, lessons: 14, badge: 'A1', fileStem: 'PA-Origins-3.2' });
        expect(b.next?.name).toBe('Quest 4');
        expect(coverBook('quest-4')).toMatchObject({ name: 'Quest 4', level: 4, fileStem: 'PA-Quest-4' });
        expect(coverBook('quest-6.2').badge).toBe('A1');
        expect(coverBook('adventure-7.1').badge).toBeUndefined();
        expect(coverBook('adventure-9.3').next).toBeUndefined();
        expect(() => coverBook('bank-4')).toThrow('not a Primary Advantage book');
    });
});

describe('cover data schema', () => {
    const good = { book: 'quest-4', art: { front: 'assets/PA-Quest-4-background.png', back: 'assets/PA-Quest-4-back-cover-background.png' }, back: { book: '{book} มี {lessons} บทเรียน', canDo: ['a', 'b'] } };

    it('accepts two pictures or one wide picture', () => {
        expect(CoverDataSchema.safeParse(good).success).toBe(true);
        expect(CoverDataSchema.safeParse({ ...good, art: { wide: 'assets/x.png' } }).success).toBe(true);
    });

    it('rejects an unknown book, a mix of art forms, too few points, and unknown fields', () => {
        expect(CoverDataSchema.safeParse({ ...good, book: 'quest-4.1' }).success).toBe(false);
        expect(CoverDataSchema.safeParse({ ...good, art: { wide: 'a', front: 'b' } }).success).toBe(false);
        expect(CoverDataSchema.safeParse({ ...good, back: { ...good.back, canDo: ['a'] } }).success).toBe(false);
        expect(CoverDataSchema.safeParse({ ...good, title: 'Quest 4.1' }).success).toBe(false);
    });

    it('accepts the series text for some series only', () => {
        expect(CoverSeriesSchema.safeParse({ Origins: ['p1', 'p2'] }).success).toBe(true);
        expect(CoverSeriesSchema.safeParse({ Hero: ['p1'] }).success).toBe(false);
    });
});

describe('cover copy check', () => {
    it('finds book names, also without a space or in capitals', () => {
        expect(bookNames(`${CANVA_32_BOOK} ${CANVA_32_NEXT} QUEST 4.1`)).toEqual(['Origins 3.2', 'Origins 2', 'Quest 4.1']);
    });

    it('fails the Canva Origins 3.2 back text', () => {
        const errors = checkCoverText(coverBook('origins-3.2'), [
            { field: 'back.book', text: CANVA_32_BOOK },
            { field: 'next', text: CANVA_32_NEXT },
        ]);
        expect(errors).toEqual([
            'back.book: names "Origins 3.2"; write {book} or {next}',
            'back.book: "ก้าวแรก" is true only for the first book',
            'next: names "Origins 2"; write {book} or {next}',
        ]);
    });

    it('passes placeholders, and allows "first step" on Origins 1 only', () => {
        const text = '**{book}** เป็นก้าวแรก ประกอบด้วย **{lessons}** บทเรียน พร้อมก้าวสู่ **{next}** ซีรีส์ {series}';
        expect(checkCoverText(coverBook('origins-1'), [{ field: 'f', text }])).toEqual([]);
        expect(expandCoverText(text, coverBook('origins-3.2'))).toBe('**Origins 3.2** เป็นก้าวแรก ประกอบด้วย **14** บทเรียน พร้อมก้าวสู่ **Quest 4** ซีรีส์ Origins');
    });

    it('allows the own and the next series only, and fails unknown placeholders and {next} on the last book', () => {
        expect(checkCoverText(coverBook('origins-3.2'), [{ field: 'f', text: 'Origins และ Quest' }])).toEqual([]);
        expect(checkCoverText(coverBook('quest-4'), [{ field: 'f', text: 'ซีรีส์ Origins' }])).toEqual(['f: names the Origins series; the book is Quest 4']);
        expect(checkCoverText(coverBook('quest-4'), [{ field: 'f', text: '{title}' }])).toEqual(['f: unknown placeholder {title}']);
        expect(checkCoverText(coverBook('adventure-9.3'), [{ field: 'f', text: '{next}' }])).toEqual(['f: {next}, but Adventure 9.3 is the last book']);
        expect(() => expandCoverText('{next}', coverBook('adventure-9.3'))).toThrow('Adventure 9.3 is the last book');
    });
});
