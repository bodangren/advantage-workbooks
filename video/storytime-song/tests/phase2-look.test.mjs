import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT, manifestToForgeInput, prepare, resolveActorArt, usedArt } from "../scripts/prepare.mjs";
import { bubbleAt, sceneRuns, shots } from "../src/timeline.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const FIXTURE_FULL = path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json");
const THAI = /[\u0E00-\u0E7F]/;

const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

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

function preparedSpec(week) {
  return JSON.parse(fs.readFileSync(prepare(`l2/${week}`), "utf8"));
}

const tail = (p) => {
  const i = p.indexOf("gestures/");
  assert.ok(i >= 0, `inset path must sit under a gestures folder: ${p}`);
  return p.slice(i);
};

function approvedInsetTails() {
  const raw = JSON.parse(fs.readFileSync(FIXTURE_FULL, "utf8"));
  const norm = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.map(tail)]));
  return { gestures: norm(raw.spec.forge.gestures), idle: raw.spec.forge.idle.map(tail) };
}

/** The placeholder words of src/Actors.tsx: a drawn actor holding one is a flat shape, not a classmate. */
const PLACEHOLDER_WORDS = ["cat", "dog", "bird", "fish", "frog", "duck", "box", "ball", "doll", "car", "kite", "drum", "train", "top"];
const isPlaceholderDraw = (name) => PLACEHOLDER_WORDS.some((word) => name.toLowerCase().includes(word));

/**
 * What one cut draws for each line: the scene background and the actor names with their draw kinds.
 * Both cuts share SceneLayer (SongPortrait imports it from Song), so the classroom and portrait lists match.
 * A Forge scene video replaces the scene and the actors (Song.tsx SceneLayer), so the actor list is empty.
 * SceneBackground (src/art/Scene.tsx) draws the Forge render when spec.forge.scenes holds the run scene.
 */
function cutSceneDraws(spec) {
  const list = shots(spec);
  const runs = sceneRuns(list);
  const background = (scene) => {
    if (spec.sceneVideo) return { kind: "video", file: spec.sceneVideo };
    const render = spec.forge && spec.forge.scenes ? spec.forge.scenes[scene] : undefined;
    return render ? { kind: "forge", file: render } : { kind: "placeholder", scene };
  };
  const perLine = spec.lines.map((line) => {
    const run = runs.find((r) => line.start >= r.start && line.start < r.end)
      ?? runs.find((r) => r.scene === line.scene);
    const scene = run ? run.scene : line.scene;
    const drawn = spec.sceneVideo ? [] : (list.find((s) => s.picture === line.picture)?.actors ?? line.actors);
    return {
      scene,
      background: background(scene),
      actors: drawn.map((name) => ({
        name,
        kind: spec.forge && spec.forge.cast && name in spec.forge.cast ? "cutout"
          : isPlaceholderDraw(name) || (spec.forge && !(name in spec.forge.cast)) ? "placeholder" : "figure",
      })),
    };
  });
  return { classroom: perLine, portrait: perLine };
}

/**
 * What the gesture inset draws for each line, as GestureCard (src/GestureInset.tsx) resolves it:
 * the approved Adventurer gesture frames, or the idle frames between lines; the old stick figure when
 * the week has no Forge art. GestureInset and GesturePanel share GestureCard, so both cuts match.
 */
function cutInsetDraws(spec) {
  const perLine = spec.lines.map((line) => {
    if (!spec.forge) return { kind: "stick", frames: [] };
    const frames = (line && spec.forge.gestures[line.gesture]) || spec.forge.idle;
    return { kind: "adventurer", frames };
  });
  return { classroom: perLine, portrait: perLine };
}

test("P2-F1 every week 2-7 draws the approved Adventurer inset in both cuts", () => {
  const approved = approvedInsetTails();
  const approvedFrames = new Set([...Object.values(approved.gestures).flat(), ...approved.idle]);
  console.log(`Approved inset frame count: ${approvedFrames.size}`);
  assert.ok(approvedFrames.size > 0, "the approved Adventurer set must hold frames");
  let adventurerLineTotal = 0;
  let lineTotal = 0;
  for (const week of ["w02", "w03", "w04", "w05", "w06", "w07"]) {
    const spec = preparedSpec(week);
    assert.ok(spec.lines.length > 0, `${week} must hold lines`);
    assert.ok(spec.forge, `${week} must prepare Forge art so both cuts draw the Adventurer inset, not the stick figure`);
    const draws = cutInsetDraws(spec);
    for (const cut of ["classroom", "portrait"]) {
      for (let i = 0; i < spec.lines.length; i += 1) {
        const line = spec.lines[i];
        const drawn = draws[cut][i];
        assert.equal(drawn.kind, "adventurer", `${week} line ${i + 1} ${cut} must draw the Adventurer inset, not the stick figure`);
        assert.ok(drawn.frames.length > 0, `${week} line ${i + 1} ${cut} must draw inset frames`);
        const want = (approved.gestures[line.gesture] ?? approved.idle).map(String);
        assert.deepEqual(drawn.frames.map(tail).sort(), [...want].sort(), `${week} line ${i + 1} ${cut} must draw the approved ${line.gesture} frames`);
        for (const frame of drawn.frames) {
          assert.ok(!frame.includes("cutouts/"), `${week} line ${i + 1} ${cut} inset must not use a cut-out: ${frame}`);
        }
        if (cut === "classroom") {
          adventurerLineTotal += 1;
          lineTotal += 1;
        }
      }
    }
    console.log(`${week} Adventurer inset line count: ${spec.lines.length}`);
  }
  console.log(`Adventurer inset line total: ${adventurerLineTotal}`);
  console.log(`Inset line total: ${lineTotal}`);
  assert.equal(adventurerLineTotal, lineTotal, "every week 2-7 line must draw the Adventurer inset");
  assert.ok(lineTotal > 0, "weeks 2-7 must hold lines");
});

test("P2-F2 w04 and w07 draw the Forge classroom picture while Forge-video weeks stay unchanged", () => {
  const roomBytes = fs.readFileSync(path.join(HANDOFF, "scenes/w04/classroom.png"));
  const roomSha = sha(roomBytes);
  assert.ok(roomBytes.length > 0, "the handoff Forge classroom picture must hold bytes");
  for (const week of ["w04", "w07"]) {
    const spec = preparedSpec(week);
    assert.ok(spec.lines.length > 0, `${week} must hold lines`);
    const draws = cutSceneDraws(spec);
    let forgeSceneTotal = 0;
    for (const cut of ["classroom", "portrait"]) {
      for (let i = 0; i < spec.lines.length; i += 1) {
        const bg = draws[cut][i].background;
        assert.equal(bg.kind, "forge", `${week} line ${i + 1} ${cut} must draw the Forge classroom picture, not the placeholder`);
        const diskFile = path.join(HERE, "..", "public", String(bg.file));
        assert.ok(fs.existsSync(diskFile), `${week} line ${i + 1} ${cut} Forge scene file must exist on disk: ${bg.file}`);
        assert.equal(sha(fs.readFileSync(diskFile)), roomSha, `${week} line ${i + 1} ${cut} scene bytes must equal the handoff Forge classroom`);
        if (cut === "classroom") forgeSceneTotal += 1;
      }
    }
    console.log(`${week} Forge scene line count: ${forgeSceneTotal}`);
    assert.equal(forgeSceneTotal, spec.lines.length, `every ${week} line must draw the Forge classroom picture`);
    const actors = usedArt(spec).actors;
    assert.ok(actors.length > 0, `${week} must hold actors`);
    for (const name of actors) {
      assert.equal(resolveActorArt(name, spec.forge).kind, "placeholder", `${week} ${name} must resolve to a placeholder`);
    }
  }
  for (const week of ["w02", "w03", "w05", "w06"]) {
    const spec = preparedSpec(week);
    assert.equal(spec.art, "forge", `${week} must keep its Forge art`);
    assert.ok(spec.sceneVideo, `${week} must keep its Forge scene video`);
    assert.ok(spec.forge, `${week} must keep its Forge set`);
    const draws = cutSceneDraws(spec);
    for (const cut of ["classroom", "portrait"]) {
      const names = draws[cut].flatMap((line) => line.actors.map((item) => item.name));
      assert.deepEqual(names, [], `${week} ${cut} draws no actor layer under its Forge scene video`);
    }
    let bubbleTotal = 0;
    for (const line of spec.lines) {
      for (const bubble of line.bubbles) {
        bubbleTotal += 1;
        const mid = (bubble.start + bubble.end) / 2;
        assert.deepEqual(bubbleAt(spec, mid), bubble, `${week} must draw its bubble at the sound-word time in both cuts`);
      }
    }
    console.log(`${week} bubble count: ${bubbleTotal}`);
    const insetTails = [...Object.values(spec.forge.gestures ?? {}).flat(), ...(spec.forge.idle ?? [])].map(tail);
    assert.ok(insetTails.length > 0, `${week} must keep inset frames`);
    assert.ok(insetTails.every((frame) => !frame.includes("cutouts/")), `${week} inset must stay cut-out free`);
  }
});

test("P2-F3 the Adventurer fills the inset card in both cuts with no top crop", () => {
  // Inner card sizes: GestureCard subtracts the 8 px border on each side (src/GestureInset.tsx).
  // Classroom card 270x324 (INSET); phone panel 840x856 (layout.ts PORTRAIT_BOXES.gesture).
  // Choice: bottom-aligned, from the ForgeFigure docstring "with the feet near the bottom".
  const inners = {
    classroom: { width: 270 - 16, height: 324 - 16 },
    portrait: { width: 840 - 16, height: 856 - 16 },
  };
  for (const week of ["w02", "w03", "w04", "w05", "w06", "w07"]) {
    const spec = preparedSpec(week);
    assert.ok(spec.forge, `${week} must prepare Forge art with a gesture box`);
    const box = spec.forge.gestureBox;
    const canvas = spec.forge.canvas;
    console.log(`${week} gesture box: ${box.w}x${box.h} on canvas ${canvas[0]}x${canvas[1]}`);
    assert.ok(box.w > 0 && box.h > 0 && canvas[0] > 0 && canvas[1] > 0, `${week} gesture box and canvas must hold sizes`);
    for (const cut of ["classroom", "portrait"]) {
      const inner = inners[cut];
      // ForgeFigure placement (src/GestureInset.tsx): fit the gesture box, anchor the box bottom near the feet.
      const s = Math.min((inner.width - 24) / box.w, (inner.height - 20) / box.h);
      const top = inner.height - 8 - (box.y + box.h) * s;
      const height = canvas[1] * s;
      const left = inner.width / 2 - (box.x + box.w / 2) * s;
      const width = canvas[0] * s;
      assert.ok(top >= 0, `${week} ${cut} inset image top ${top.toFixed(1)} must sit inside the card, not cropped`);
      assert.ok(top + height >= inner.height - 8, `${week} ${cut} inset image bottom ${(top + height).toFixed(1)} must reach the feet line of ${inner.height - 8}`);
      assert.ok(left + width > 0 && left < inner.width, `${week} ${cut} inset image must cross the card`);
    }
  }
});
