import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gestureLineAt, lyricAt, sceneRuns, shots, showFrom } from '../src/timeline.ts';

const line = (start, end, picture, scene, actors, gesture = 'clap') => ({
    text: 't', gesture, start, end, picture, scene, actors, bubbles: [], segments: [{ start, end, words: [{ text: 't', start, end }] }],
});
const spec = (lines) => ({ key: 'st2/1', title: 'T', bpm: 120, duration: 40, audio: '', art: 'placeholder', lines });

test('lines with the same picture make one shot; the first shot starts at 0 and the last ends at the end', () => {
    const s = shots(spec([line(2, 4, 0, 'a', ['Pip']), line(5, 7, 0, 'a', ['Pip']), line(8, 10, 2, 'a', ['Nan'])]));
    assert.equal(s.length, 2);
    assert.deepEqual([s[0].start, s[0].end, s[1].start, s[1].end], [0, 8, 8, 40]);
});

test('actors slide only inside one scene and only when the cast changes', () => {
    const s = shots(spec([line(1, 2, 0, 'a', ['Pip']), line(3, 4, 1, 'a', ['Nan']), line(5, 6, 2, 'a', ['Nan']), line(7, 8, 3, 'b', ['Pip'])]));
    assert.deepEqual(s.map((x) => [x.enter, x.exit]), [[false, true], [true, false], [false, false], [false, false]]);
    assert.deepEqual(sceneRuns(s).map((r) => [r.scene, r.start, r.end]), [['a', 0, 7], ['b', 7, 40]]);
});

test('in a gap the next line shows at most 1.2 s early, never before the last line ends', () => {
    const sp = spec([line(1, 3, 0, 'a', []), line(10, 12, 1, 'a', []), line(12.1, 14, 2, 'a', [])]);
    assert.equal(showFrom(sp, 1), 8.8);
    assert.equal(showFrom(sp, 2), 12.1);
    assert.equal(lyricAt(sp, 8.7).line, 0);
    assert.equal(lyricAt(sp, 8.9).line, 1);
});

test('the gesture holds for the line and 0.5 s after it, else idle', () => {
    const sp = spec([line(1, 3, 0, 'a', []), line(10, 12, 1, 'a', [])]);
    assert.equal(gestureLineAt(sp, 0.5), -1);
    assert.equal(gestureLineAt(sp, 3.4), 0);
    assert.equal(gestureLineAt(sp, 3.6), -1);
    assert.equal(gestureLineAt(sp, 11), 1);
});
