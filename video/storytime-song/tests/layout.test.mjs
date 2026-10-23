import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTOR_SPAN,
  lyricSize,
  PORTRAIT,
  PORTRAIT_BOXES,
  SCENE,
} from "../src/layout.ts";

test("the phone cut shows the whole classroom scene at full width, at 16:9", () => {
  const { scene } = PORTRAIT_BOXES;
  assert.equal(scene.width, PORTRAIT.width);
  assert.equal(scene.width / scene.height, SCENE.width / SCENE.height);
});

test("the parts of the portrait frame are in the frame, from the top, and do not overlap", () => {
  const { scene, lyrics, gesture } = PORTRAIT_BOXES;
  for (const b of [scene, lyrics, gesture]) {
    assert.ok(b.left >= 0 && b.left + b.width <= PORTRAIT.width);
    assert.ok(b.top >= 0 && b.top + b.height <= PORTRAIT.height);
  }
  assert.ok(scene.top + scene.height <= lyrics.top);
  assert.ok(lyrics.top + lyrics.height <= gesture.top);
  // The child copies the gesture, so the gesture panel is the largest part after the scene band.
  assert.ok(gesture.height > lyrics.height);
});

test("the line text is larger in the phone cut than in the classroom cut, for the same frame width", () => {
  for (const chars of [10, 16, 24, 29, 32, 41]) {
    const phone = lyricSize(chars, true) / PORTRAIT.width;
    const classroom = lyricSize(chars) / SCENE.width;
    assert.ok(phone >= 2 * classroom, `${chars} letters`);
  }
  // A longer line gets a smaller size, so the longest week 1 to 7 line (41) fits in three lines.
  assert.ok(lyricSize(41, true) < lyricSize(29, true));
  assert.ok(lyricSize(29, true) < lyricSize(12, true));
});

test("the phone cut centres the actor row in the scene; the classroom cut keeps the inset side free", () => {
  const [l, r] = ACTOR_SPAN.portrait;
  assert.equal((l + r) / 2, SCENE.width / 2);
  assert.ok(ACTOR_SPAN.landscape[1] < SCENE.width - 270);
});
