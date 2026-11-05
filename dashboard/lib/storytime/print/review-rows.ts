/**
 * The sound rows of a week 8 review page (B20, B21, A-48 part F F3): the same rows that
 * `reviewPage` of `student-book.ts` prints and that the teacher key of the manual names. The
 * module holds the one selection rule, so the printed page and the answer key cannot drift
 * apart: the teacher key names only the pictures that the student page prints in the row.
 */

/** One picture-sort group of a review paper center. */
export interface StorytimeReviewGroup {
    /** The sound label of the group, such as "/n/". */
    sound: string;
    /** The picture words of the group, in data order. */
    pictures: string[];
}

/** One sound row of a review page: the sound, the target pictures of the group, and the 4 printed picture words. */
export interface StorytimeReviewSoundRow {
    /** The sound label of the row. */
    sound: string;
    /** The pictures of this group that the row prints (the first 2 of the group, or the one picture of a single-picture group). */
    targets: string[];
    /** The 4 picture words of the row in print order: the targets and pictures of the other sounds. */
    printed: string[];
}

/**
 * The sound rows of one review day: each group keeps its sound and its target pictures, and the
 * other places of the 4-picture row take pictures of the other sounds, in rotation (the review
 * page is doable alone, with no teacher voice). The printed list is the truth that the answer
 * key of the manual names for the row.
 * @param groups The picture-sort groups of the day, in print order.
 * @returns One row per group, in the same order.
 */
export function storytimeReviewSoundRows(groups: readonly StorytimeReviewGroup[]): StorytimeReviewSoundRow[] {
    const targetCount = Math.min(2, ...groups.map((group) => group.pictures.length));
    return groups.map((group, index) => {
        const targets = group.pictures.slice(0, targetCount);
        const pool = Array.from({ length: groups.length - 1 }, (_value, step) => groups[(index + step + 1) % groups.length].pictures).flat();
        const others = pool.slice(0, 4 - targets.length);
        const places = targets.length === 2 ? (index % 2 === 0 ? [0, 3] : [1, 2]) : [index % 4];
        const printed: string[] = [];
        let next = 0;
        for (let place = 0; place < 4; place++) printed.push(places.includes(place) ? targets[places.indexOf(place)] : others[next++]);
        return { sound: group.sound, targets, printed };
    });
}
