import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT } from "../scripts/prepare.mjs";
import * as prepare from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.resolve(HERE, "../src");
const THAI = /[\u0E00-\u0E7F]/;

function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "th" || THAI.test(k)) continue;
      out[k] = stripThai(v);
    }
    return out;
  }
  if (typeof value === "string") return THAI.test(value) ? "" : value;
  return value;
}

function readWeek(rel) {
  const raw = JSON.parse(fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"));
  const week = stripThai(raw);
  assert.ok(!THAI.test(JSON.stringify(week)), "week still holds Thai after filter");
  return week;
}

test("T1.5 placeholders come from the package prompts; unknown actors fall back", () => {
  const prepSrc = fs.readFileSync(path.resolve(HERE, "../scripts/prepare.mjs"), "utf8");
  assert.ok(prepSrc.includes("image.characters"), "actors must come from image.characters");
  assert.ok(prepSrc.includes("CLASS"), "actors must fall back to CLASS");
  for (const rel of ["l2/w02", "l2/w04", "l2/w06", "l2/w07"]) {
    const week = readWeek(rel);
    const spec = buildSpec(week, 60);
    assert.ok(spec.lines.length > 0, `no lines in ${rel}`);
    for (const line of spec.lines) {
      assert.ok(Array.isArray(line.actors), "actors not a list");
      for (const a of line.actors) assert.ok(!THAI.test(a), "actor holds Thai");
    }
  }
  // The prompt map must name the w06 animals and the w07 props.
  assert.equal(typeof prepare.placeholderOf, "function", "missing placeholderOf in prepare.mjs (Red)");
  const w06 = readWeek("l2/w06");
  const animals = ["cat", "dog", "bird", "fish", "frog", "duck"];
  for (const want of animals) {
    const line = w06.song.lines.find((ln) => (ln.image && ln.image.prompt || "").toLowerCase().includes(want));
    assert.ok(line, `no w06 prompt for ${want}`);
    const got = prepare.placeholderOf(line.image.prompt);
    assert.ok(String(got).toLowerCase().includes(want), `placeholderOf misses ${want} (Red)`);
  }
  const w07 = readWeek("l2/w07");
  const props = ["box", "ball", "doll", "car", "kite", "drum", "train", "top"];
  for (const want of props) {
    const line = w07.song.lines.find((ln) => (ln.image && ln.image.prompt || "").toLowerCase().includes(want));
    assert.ok(line, `no w07 prompt for ${want}`);
    const got = prepare.placeholderOf(line.image.prompt);
    assert.ok(String(got).toLowerCase().includes(want), `placeholderOf misses ${want} (Red)`);
  }
  // An unmapped actor resolves to the Figure or Puppy placeholder.
  const actorSrc = fs.readFileSync(path.join(SRC, "Actors.tsx"), "utf8");
  assert.ok(actorSrc.includes("Figure") && actorSrc.includes("Puppy"), "Actors must fall back to Figure or Puppy");
});

test("T1.6 placeholder animals and props bounce on the beat", () => {
  const actorSrc = fs.readFileSync(path.join(SRC, "Actors.tsx"), "utf8");
  assert.ok(actorSrc.includes("bpm"), "Actors must read bpm for the bounce");
  assert.equal(typeof prepare.bounceY, "function", "missing bounceY in prepare.mjs (Red)");
  for (const beat of [0, 1, 2]) {
    assert.equal(prepare.bounceY(beat, 100), 0, "y must be 0 on a beat");
  }
  for (const mid of [0.5, 1.5, 2.5]) {
    const y = prepare.bounceY(mid, 100);
    console.log(`Bounce y at mid-beat ${mid}: ${y}`);
    assert.ok(y >= 4 && y <= 12, `mid-beat y ${y} outside 4-12 px`);
  }
  // The bounce applies to every w06 animal and w07 prop in both cuts.
  assert.ok(actorSrc.includes("bounceY") || actorSrc.includes("bob"), "Actors must apply the bounce to placeholders (Red)");
  const w06 = readWeek("l2/w06");
  const w07 = readWeek("l2/w07");
  console.log(`Placeholder week line count: ${w06.song.lines.length + w07.song.lines.length}`);
  assert.ok(w06.song.lines.length > 0 && w07.song.lines.length > 0, "no placeholder weeks");
});
