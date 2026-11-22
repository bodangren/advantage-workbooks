import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT, placeholderOf } from "../scripts/prepare.mjs";
import { bubbleAt, shots } from "../src/timeline.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.resolve(HERE, "../src");
const THAI = /[\u0E00-\u0E7F]/;

function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "th" || THAI.test(key)) continue;
      out[key] = stripThai(child);
    }
    return out;
  }
  return typeof value === "string" && THAI.test(value) ? "" : value;
}

function readFilteredWeek(week) {
  const parsed = stripThai(JSON.parse(fs.readFileSync(path.join(CONTENT, `l2/${week}.json`), "utf8")));
  const serialized = JSON.stringify(parsed);
  assert.equal((serialized.match(/[\u0E00-\u0E7F]/g) ?? []).length, 0);
  return parsed;
}

function weekDuration(pkg) {
  return Math.max(...pkg.song.times.map((t) => t.endTime));
}

/** The prop labels of the package prompts: the toys of w07. */
const PROP_LABELS = new Set(["ToyBox", "Ball", "Doll", "ToyCar", "Kite", "Drum", "ToyTrain", "SpinningTop"]);

/** The placeholder words of src/Actors.tsx: a drawn actor holding one is a flat shape. */
const PLACEHOLDER_WORDS = ["cat", "dog", "bird", "fish", "frog", "duck", "box", "ball", "doll", "car", "kite", "drum", "train", "top"];
const isPlaceholderDraw = (name) => PLACEHOLDER_WORDS.some((word) => name.toLowerCase().includes(word));

function recognisedProps(prompt) {
  const mapped = placeholderOf(prompt);
  if (!mapped) return [];
  return mapped.split(" + ").filter((label) => PROP_LABELS.has(label));
}

/**
 * What one cut draws for each line: the actor names and their draw kinds from the shot the line plays in.
 * Both cuts share SceneLayer (SongPortrait imports it from Song), so the classroom and portrait lists match.
 * A Forge scene video replaces the scene and the actors (Song.tsx SceneLayer), so the actor list is empty.
 */
function cutDraws(spec) {
  const list = shots(spec);
  const perLine = spec.lines.map((line) => {
    if (spec.sceneVideo) return [];
    const shot = list.find((item) => item.picture === line.picture);
    const actors = shot ? shot.actors : line.actors;
    return actors.map((name) => ({
      name,
      kind: spec.forge && spec.forge.cast && name in spec.forge.cast ? "cutout"
        : isPlaceholderDraw(name) ? "placeholder" : "figure",
    }));
  });
  return { classroom: perLine, portrait: perLine };
}

test("PA-F1 w07 prop lines draw their props with their characters in both cuts", () => {
  const pkg = readFilteredWeek("w07");
  const spec = buildSpec(pkg, weekDuration(pkg));
  let recognisedTotal = 0;
  let drawnTotal = 0;
  let propLineCount = 0;
  spec.lines.forEach((line, i) => {
    const picture = pkg.song.lines[i].imageOf ?? i;
    const image = pkg.song.lines[picture].image ?? { prompt: "", characters: [] };
    const recognised = recognisedProps(image.prompt ?? "");
    if (!recognised.length) return;
    propLineCount += 1;
    recognisedTotal += recognised.length;
    for (const cut of ["classroom", "portrait"]) {
      const drawn = cutDraws(spec)[cut][i].map((item) => item.name);
      const drawnProps = drawn.filter((name) => PROP_LABELS.has(name));
      if (cut === "classroom") drawnTotal += drawnProps.length;
      for (const prop of recognised) {
        assert.ok(drawn.includes(prop), `w07 line ${i + 1} ${cut} must draw ${prop} with ${line.actors.join(", ")}`);
      }
      assert.equal(drawnProps.length, recognised.length, `w07 line ${i + 1} ${cut} prop draw count must equal its recognised prop count`);
      for (const actor of line.actors) {
        assert.ok(drawn.includes(actor), `w07 line ${i + 1} ${cut} must keep drawing ${actor}`);
      }
    }
  });
  console.log(`W07 prop line count: ${propLineCount}`);
  console.log(`W07 recognised prop count: ${recognisedTotal}`);
  console.log(`W07 drawn prop count: ${drawnTotal}`);
  assert.ok(propLineCount > 0, "w07 must hold prop lines");
  assert.ok(recognisedTotal > 0, "w07 must hold recognised props");
  assert.equal(drawnTotal, recognisedTotal, "every recognised w07 prop must be drawn");
});

test("PA-F2 Forge-video weeks draw no actor layer while w04 and w07 draw theirs, bubbles on top in both cuts", () => {
  const songSrc = fs.readFileSync(path.join(SRC, "Song.tsx"), "utf8");
  const portraitSrc = fs.readFileSync(path.join(SRC, "SongPortrait.tsx"), "utf8");
  assert.ok(portraitSrc.includes("SceneLayer") && portraitSrc.includes('from "./Song"'), "the phone cut must share SceneLayer with the classroom cut");
  assert.ok(songSrc.includes("spec.sceneVideo ? ("), "SceneLayer must prefer the Forge scene video over shots and actors");
  assert.ok(songSrc.includes("<SoundCard spec={spec} />"), "the classroom cut must mount the bubble card");
  assert.ok(portraitSrc.includes("<SoundCard spec={spec} portrait />"), "the phone cut must mount the bubble card");
  for (const week of ["w02", "w03", "w05", "w06"]) {
    const pkg = readFilteredWeek(week);
    const spec = buildSpec(pkg, weekDuration(pkg));
    assert.ok(spec.lines.length > 0, `${week} must hold lines`);
    spec.sceneVideo = `l2/${week}/scene.mp4`;
    const draws = cutDraws(spec);
    let actorDrawTotal = 0;
    for (const cut of ["classroom", "portrait"]) {
      const names = draws[cut].flatMap((line) => line.map((item) => item.name));
      if (cut === "classroom") actorDrawTotal += names.length;
      assert.deepEqual(names, [], `${week} ${cut} draws no actor layer under its Forge scene video`);
    }
    console.log(`${week} actor draw count: ${actorDrawTotal}`);
    assert.equal(actorDrawTotal, 0, `${week} must draw no actors under its Forge scene video`);
    let bubbleTotal = 0;
    for (const line of spec.lines) {
      for (const bubble of line.bubbles) {
        bubbleTotal += 1;
        const mid = (bubble.start + bubble.end) / 2;
        assert.deepEqual(bubbleAt(spec, mid), bubble, `${week} must draw its bubble at the sound-word time in both cuts`);
      }
    }
    console.log(`${week} bubble count: ${bubbleTotal}`);
  }
  for (const week of ["w04", "w07"]) {
    const pkg = readFilteredWeek(week);
    const spec = buildSpec(pkg, weekDuration(pkg));
    assert.ok(spec.lines.length > 0, `${week} must hold lines`);
    assert.ok(!spec.sceneVideo, `${week} has no Forge scene video`);
    const draws = cutDraws(spec);
    let actorDrawTotal = 0;
    for (const cut of ["classroom", "portrait"]) {
      const flat = draws[cut].flatMap((line) => line);
      if (cut === "classroom") actorDrawTotal += flat.length;
      assert.ok(flat.length > 0, `${week} ${cut} must draw its actor layer`);
      for (const item of flat) {
        assert.ok(item.kind === "figure" || item.kind === "placeholder", `${week} ${cut} draws ${item.name} as ${item.kind} without Forge art`);
      }
    }
    console.log(`${week} actor draw count: ${actorDrawTotal}`);
    assert.ok(actorDrawTotal > 0, `${week} must draw actors without a Forge scene video`);
  }
});
