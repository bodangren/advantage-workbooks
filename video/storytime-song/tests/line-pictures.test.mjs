import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  beatFrame,
  gestureSet,
  pictureCrop,
  poseCrop,
} from "../scripts/line-pictures.mjs";

const manifest = {
  gestures: {
    adventurer: {
      clap: [
        "gestures/adventurer/clap-apart.png",
        "gestures/adventurer/clap-together.png",
      ],
      "point-to-self": ["gestures/adventurer/point-to-self.png"],
      march: [
        "gestures/adventurer/march-left.png",
        "gestures/adventurer/march-right.png",
      ],
      "march-picture": ["gestures/adventurer/march-picture.png"],
    },
  },
};

/** The alpha boxes of the week 1 beat frames (measured on the Forge r1 set). */
const week1 = [
  { x1: 235, x2: 790, y1: 240, y2: 1184 },
  { x1: 247, x2: 800, y1: 241, y2: 1184 },
  { x1: 235, x2: 789, y1: 241, y2: 1184 },
  { x1: 237, x2: 788, y1: 247, y2: 1184 },
  { x1: 222, x2: 793, y1: 241, y2: 1184 },
  { x1: 233, x2: 792, y1: 243, y2: 1184 },
];

test("the frame is the picture pose of the gesture, else the last frame (the beat frame)", () => {
  assert.equal(
    beatFrame(manifest, "clap"),
    "gestures/adventurer/clap-together.png",
  );
  assert.equal(
    beatFrame(manifest, "point to self"),
    "gestures/adventurer/point-to-self.png",
  );
  assert.equal(
    beatFrame(manifest, "march"),
    "gestures/adventurer/march-picture.png",
    "a picture pose wins over the video frames",
  );
  assert.throws(
    () => beatFrame(manifest, "jump"),
    /no frames of the gesture jump/,
  );
});

test("the crop is one square from above the head to below the belt, with every hand, in the frame", () => {
  const { x, y, side } = pictureCrop(week1, [1024, 1200]);
  assert.ok(y < 240 && y >= 0, "a margin above the head");
  assert.ok(x <= 222 && x + side >= 800, "every hand is in the square");
  // The belt is at about row 920 and the shoes start at about row 1090 (the feet are at 1184).
  assert.ok(
    y + side > 940 && y + side < 1050,
    "below the belt, above the shoes",
  );
  assert.ok(x >= 0 && x + side <= 1024 && y + side <= 1200, "in the frame");
  assert.ok(Math.abs(x + side / 2 - 511) <= 1, "centred on the figure");
});

test("a crop outside the frame is an error", () => {
  assert.throws(
    () => pictureCrop([{ x1: 0, x2: 1000, y1: 10, y2: 1190 }], [1024, 1200]),
    /outside the frame/,
  );
});

test("a week with its own Forge set uses it; another week uses the gesture library", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "line-pictures-"));
  const library = path.join(root, "forge-gestures");
  const week = path.join(root, "w01", "forge");
  fs.mkdirSync(library, { recursive: true });
  fs.writeFileSync(path.join(library, "manifest.json"), "{}");
  assert.equal(gestureSet(week, library), library);
  fs.mkdirSync(week, { recursive: true });
  assert.equal(
    gestureSet(week, library),
    library,
    "a forge folder without a manifest",
  );
  fs.writeFileSync(path.join(week, "manifest.json"), "{}");
  assert.equal(gestureSet(week, library), week);
  fs.rmSync(root, { recursive: true, force: true });
});

test("a picture pose has its own crop: the whole figure with the raised foot, in the frame", () => {
  // The march and sway picture poses (chibi-sprouts, 2026-10-24).
  for (const box of [
    { x1: 206, x2: 789, y1: 248, y2: 1184 },
    { x1: 331, x2: 950, y1: 276, y2: 1184 },
  ]) {
    const { x, y, side } = poseCrop(box, [1024, 1200]);
    assert.ok(y < box.y1, "a margin above the head");
    assert.equal(y + side, 1200, "down to the bottom of the frame");
    assert.ok(x <= box.x1 && x + side >= box.x2, "every hand is in the square");
    assert.ok(x >= 0 && x + side <= 1024, "in the frame");
  }
  assert.throws(
    () => poseCrop({ x1: 0, x2: 1000, y1: 5, y2: 1184 }, [1024, 1200]),
    /outside the frame/,
  );
});
