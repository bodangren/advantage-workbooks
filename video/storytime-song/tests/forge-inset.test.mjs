import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { manifestToForgeInput } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const FIXTURE_FULL = path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json");
const THAI = /[\u0e00-\u0e7f]/;

const tail = (p) => {
  const i = p.indexOf("gestures/");
  assert.ok(i >= 0, `inset path must sit under a gestures folder: ${p}`);
  return p.slice(i);
};

test("A-F5 the gesture inset keeps the approved Adventurer frames", () => {
  const raw = JSON.parse(fs.readFileSync(FIXTURE_FULL, "utf8"));
  assert.equal(raw.generated_from, `git show 1ffd649b:video/storytime-song/scripts/prepare.mjs prepare("l2/w01")`, "fixture must name the phase-base prepare");
  const want = raw.spec.forge;
  const input = manifestToForgeInput(HANDOFF);
  const gesturePaths = [...Object.values(input.gestures).flat(), ...(input.idle || [])];
  console.log(`Inset frame count: ${gesturePaths.length}`);
  assert.ok(gesturePaths.length > 0, "no inset frames to guard");
  for (const p of gesturePaths) {
    assert.ok(!p.includes("cutouts/"), `inset must not use a classmate cut-out: ${p} (Red r6 A-F5)`);
  }
  for (const name of ["pat", "sam", "mia", "may"]) {
    assert.ok((input.cast[name] || "").includes("cutouts/"), `${name} front must stay a cut-out under cast`);
  }
  const norm = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.map(tail)]));
  const wantGestures = norm(want.gestures);
  assert.deepEqual(norm(input.gestures), wantGestures, "gestures must equal the approved Adventurer inset (Red r6 A-F5)");
  const wantIdle = want.idle.map(tail);
  assert.deepEqual(input.idle.map(tail), wantIdle, "idle must equal the approved Adventurer idle (Red r6 A-F5)");
});
