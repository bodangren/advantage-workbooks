import assert from "node:assert/strict";
import { test } from "node:test";
import { forgeSpec, SCREEN_PPM } from "../scripts/forge.mjs";

/** A manifest in the shape of the Forge week 1 set (out/chibi-sprouts/r1/week1/manifest.json). */
const manifest = {
  ppm: 1080,
  canvas: [1024, 1200],
  footPoint: { col: 512, row: 1184 },
  cast: {
    pip: { front: "cast/sprout-pip/front.png", sit: "cast/sprout-pip/sit.png" },
    nan: { front: "cast/sprout-nan/front.png" },
  },
  gestures: {
    adventurer: {
      clap: ["gestures/adventurer/clap-apart.png", "gestures/adventurer/clap-together.png"],
      "point-to-self": ["gestures/adventurer/point-to-self.png"],
      idle: ["gestures/adventurer/idle.png"],
    },
  },
  scenes: { classroom: { file: "scenes/classroom.png", size: [1920, 1080] } },
};
const boxes = {
  "gestures/adventurer/clap-apart.png": { x1: 240, x2: 780, y1: 250, y2: 1183 },
  "gestures/adventurer/clap-together.png": { x1: 236, x2: 788, y1: 243, y2: 1183 },
  "gestures/adventurer/point-to-self.png": { x1: 230, x2: 790, y1: 245, y2: 1184 },
  "gestures/adventurer/idle.png": { x1: 236, x2: 788, y1: 243, y2: 1183 },
};
const use = {
  actors: ["Pip", "Nan"],
  gestures: ["clap", "point to self"],
  scenes: ["classroom"],
};

test("the cast, the gesture frames, and the scene of the week map to files under public/", () => {
  const { forge, files } = forgeSpec(manifest, use, (f) => boxes[f], "l2/w01/forge");
  assert.equal(forge.scale, SCREEN_PPM / 1080);
  assert.deepEqual(forge.canvas, [1024, 1200]);
  assert.deepEqual(forge.foot, { col: 512, row: 1184 });
  assert.equal(forge.cast.Nan, "l2/w01/forge/cast/sprout-nan/front.png");
  assert.deepEqual(forge.gestures["point to self"], ["l2/w01/forge/gestures/adventurer/point-to-self.png"]);
  assert.equal(forge.gestures.clap.length, 2);
  assert.deepEqual(forge.idle, ["l2/w01/forge/gestures/adventurer/idle.png"]);
  assert.equal(forge.scenes.classroom, "l2/w01/forge/scenes/classroom.png");
  // The files to copy: each used file once, and no unused file (sit.png).
  assert.equal(files.length, 7);
  assert.ok(!files.includes("cast/sprout-pip/sit.png"));
});

test("the gesture box holds every frame of the inset", () => {
  const { forge } = forgeSpec(manifest, use, (f) => boxes[f], "w");
  assert.deepEqual(forge.gestureBox, { x: 230, y: 243, w: 560, h: 941 });
});

test("a cast member or a gesture with no cut-out is refused; a scene with no render keeps the placeholder", () => {
  assert.throws(() => forgeSpec(manifest, { ...use, actors: ["Ben"] }, (f) => boxes[f], "w"), /Ben/);
  assert.throws(() => forgeSpec(manifest, { ...use, gestures: ["hop"] }, (f) => boxes[f], "w"), /hop/);
  const { forge } = forgeSpec(manifest, { ...use, scenes: ["park"] }, (f) => boxes[f], "w");
  assert.deepEqual(forge.scenes, {});
});
