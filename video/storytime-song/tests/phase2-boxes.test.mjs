import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { prepare } from "../scripts/prepare.mjs";
// Green contract (missing 2026-11-23, Red P2 r5): provide src/actorBoxes.ts with
//   export type ActorBox = { name: string; kind: "cutout" | "figure" | "placeholder"; box: { left: number; top: number; width: number; height: number } };
//   export function actorBoxes(spec: Spec, line: number, cut: "classroom" | "portrait"): ActorBox[];
// Frame pixels of the drawn cut: 1920x1080 classroom, 1080x1920 portrait (before the 720x1280 encode scale).
// Same math as Actors.tsx with SceneLayer and layout.ts (row span, GROUND, PORTRAIT_SCENE_SCALE).
// Pure function of (spec, line index, cut): no hooks, no staticFile, no ffprobe, no disk reads.
import { actorBoxes } from "../src/actorBoxes.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);

const CLASSROOM = { width: 1920, height: 1080 };
const PORTRAIT = { width: 1080, height: 1920 };
const GROUND = 800;
const RUG = { x: 760, y: 700, w: 400, h: 180 };
const LYRIC = { x: 80, y: 872, w: 1480, h: 160 };
const INSET_CARD = { x: 1602, y: 708, w: 270, h: 324 };
const PHONE_LYRIC = { x: 40, y: 628, w: 1000, h: 380 };
const PHONE_PANEL = { x: 120, y: 1032, w: 840, h: 856 };
const PHONE_SCENE = { x: 0, y: 0, w: 1080, h: 607.5 };
const PHONE_SCALE = 1080 / 1920;

const scaleRect = (r, s) => ({ x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s });

function area(r) {
  return Math.max(0, r.w) * Math.max(0, r.h);
}

function intersect(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

function overlapRatio(a, b) {
  const small = Math.min(area(a), area(b));
  if (small <= 0) return 0;
  return area(intersect(a, b)) / small;
}

function preparedSpec(week) {
  return JSON.parse(fs.readFileSync(prepare(`l2/${week}`), "utf8"));
}

const FAMILY = ["Dad", "Mom", "Grandma", "Grandpa", "Tom"];

test("P2-F6 w04 family placeholders stand on the Forge room floor, clear of rug, lyrics, inset, and each other", () => {
  const spec = preparedSpec("w04");
  const familyLines = spec.lines.map((line, i) => ({ line, i })).filter(({ line }) => line.actors.some((name) => FAMILY.includes(name)));
  assert.ok(familyLines.length > 0, "w04 must hold lines naming the family");
  const dadLines = familyLines.filter(({ line }) => line.actors.includes("Dad"));
  assert.ok(dadLines.length > 0, "w04 must hold lines naming Dad");
  let boxTotal = 0;
  for (const cut of ["classroom", "portrait"]) {
    const frame = cut === "classroom" ? CLASSROOM : PORTRAIT;
    const rug = cut === "classroom" ? RUG : scaleRect(RUG, PHONE_SCALE);
    const lyric = cut === "classroom" ? LYRIC : PHONE_LYRIC;
    const inset = cut === "classroom" ? INSET_CARD : PHONE_PANEL;
    const feet = cut === "classroom" ? GROUND : GROUND * PHONE_SCALE;
    const slack = cut === "classroom" ? 80 : 45;
    for (const { line, i } of familyLines) {
      const boxes = actorBoxes(spec, i, cut);
      assert.ok(boxes.length >= line.actors.length, `w04 line ${i + 1} ${cut} must draw every actor`);
      for (const name of line.actors) {
        const mine = boxes.filter((b) => b.name === name);
        assert.equal(mine.length, 1, `w04 line ${i + 1} ${cut} must draw ${name} exactly once`);
        const item = mine[0];
        if (FAMILY.includes(name)) {
          assert.equal(item.kind, "figure", `w04 line ${i + 1} ${cut} ${name} must draw as a person figure, not a prop box`);
        } else {
          assert.equal(item.kind, "placeholder", `w04 line ${i + 1} ${cut} ${name} must draw as a flat placeholder`);
        }
        const b = item.box;
        assert.ok(b.width > 0 && b.height > 0, `w04 line ${i + 1} ${cut} ${name} box must hold size`);
        const heightShare = b.height / frame.height;
        assert.ok(heightShare >= 0.22 && heightShare <= 0.45, `w04 line ${i + 1} ${cut} ${name} height share ${heightShare.toFixed(2)} must sit between 22 and 45 percent of the frame height`);
        assert.ok(Math.abs(b.top + b.height - feet) <= slack, `w04 line ${i + 1} ${cut} ${name} feet must stand on the floor band`);
        assert.equal(area(intersect(b, rug)), 0, `w04 line ${i + 1} ${cut} ${name} must not cover the rug centre`);
        assert.equal(area(intersect(b, lyric)), 0, `w04 line ${i + 1} ${cut} ${name} must not cover the lyric box`);
        assert.equal(area(intersect(b, inset)), 0, `w04 line ${i + 1} ${cut} ${name} must not overlap the inset card`);
        if (cut === "classroom") boxTotal += 1;
      }
      const drawn = boxes.map((b) => b.box);
      for (let a = 0; a < drawn.length; a += 1) {
        for (let c = a + 1; c < drawn.length; c += 1) {
          assert.ok(overlapRatio(drawn[a], drawn[c]) <= 0.15, `w04 line ${i + 1} ${cut} placeholders must not overlap by more than 15 percent`);
        }
      }
    }
  }
  console.log(`W04 placeholder box count: ${boxTotal}`);
  assert.ok(boxTotal > 0, "w04 must draw placeholder boxes");
});

test("P2-F7 w07 draws a visible May placeholder in both cuts, uncovered by prop boxes", () => {
  const spec = preparedSpec("w07");
  const mayLines = spec.lines.map((line, i) => ({ line, i })).filter(({ line }) => line.actors.includes("May"));
  assert.ok(mayLines.length > 0, "w07 must hold lines listing May");
  let mayTotal = 0;
  for (const cut of ["classroom", "portrait"]) {
    for (const { line, i } of mayLines) {
      const boxes = actorBoxes(spec, i, cut);
      const may = boxes.filter((b) => b.name === "May");
      assert.equal(may.length, 1, `w07 line ${i + 1} ${cut} must draw May exactly once`);
      assert.equal(may[0].kind, "figure", `w07 line ${i + 1} ${cut} May must draw as a person figure, not a 3D cut-out or a prop box`);
      const b = may[0].box;
      assert.ok(b.width > 0 && b.height > 0, `w07 line ${i + 1} ${cut} May box must hold size`);
      if (cut === "portrait") {
        assert.ok(b.x >= PHONE_SCENE.x && b.y >= PHONE_SCENE.y && b.x + b.width <= PHONE_SCENE.x + PHONE_SCENE.w && b.y + b.height <= PHONE_SCENE.y + PHONE_SCENE.h, `w07 line ${i + 1} phone May must lie inside the scene band`);
      } else {
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= CLASSROOM.width && b.y + b.height <= CLASSROOM.height, `w07 line ${i + 1} classroom May must lie inside the frame`);
      }
      for (const other of boxes.filter((o) => o.name !== "May")) {
        assert.ok(overlapRatio(b, other.box) < 0.15, `w07 line ${i + 1} ${cut} May must not be covered by a prop box`);
      }
      if (cut === "classroom") mayTotal += 1;
    }
  }
  console.log(`W07 May box count: ${mayTotal}`);
  assert.equal(mayTotal, mayLines.length, "w07 must draw May on every line that lists her");
});
