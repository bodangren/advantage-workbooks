import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT, copyManifestSubset, manifestToForgeInput, prepare, usedArt } from "../scripts/prepare.mjs";
import * as prepareAll from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.resolve(HERE, "../src");
const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const THAI = /[\u0e00-\u0e7f]/;

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

test("A-F1 missing-cast actors fall back to placeholders with Forge art on", () => {
  const input = manifestToForgeInput(HANDOFF);
  assert.ok(input.cast.pat, "Pat must have a cut-out front");
  assert.ok(!input.cast.lily, "Lily must have no cut-out row");
  assert.ok(!input.cast.ben, "Ben must have no cut-out row");
  const w04 = readWeek("l2/w04");
  const actors = usedArt(buildSpec(w04, 60)).actors;
  console.log(`W04 actor count: ${actors.length}`);
  assert.ok(actors.includes("Lily"), "w04 must use Lily");
  const uncovered = actors.filter((a) => !input.cast[a.toLowerCase()]);
  console.log(`W04 uncovered actor count: ${uncovered.length}`);
  assert.ok(uncovered.length > 0, "no missing-cast actor to fall back");
  assert.equal(typeof prepareAll.resolveActorArt, "function", "missing resolveActorArt(name, forge) per-actor fallback (Red r3 A-F1)");
  for (const name of uncovered) {
    assert.equal(prepareAll.resolveActorArt(name, input).kind, "placeholder", `${name} must resolve to a placeholder`);
  }
  assert.equal(prepareAll.resolveActorArt("Pat", input).kind, "forge", "Pat must resolve to its cut-out");
  const actorSrc = fs.readFileSync(path.join(SRC, "Actors.tsx"), "utf8");
  assert.ok(/resolveActorArt|forge\.cast\[name\] \?\?|in forge\.cast/.test(actorSrc), "Actors must guard each forge.cast[name] lookup before staticFile (Red r3 A-F1)");
});

test("A-F2 the manifest adapter returns the ForgeArt shape with project paths", () => {
  const input = manifestToForgeInput(HANDOFF);
  assert.ok(input.gestures && typeof input.gestures === "object", "adapter must return gestures by package name (Red r3 A-F2)");
  assert.ok(Array.isArray(input.idle), "adapter must return the idle frame list (Red r3 A-F2)");
  assert.ok(input.gestureBox && ["x", "y", "w", "h"].every((k) => typeof input.gestureBox[k] === "number"), "adapter must return the numeric gestureBox (Red r3 A-F2)");
  assert.ok(input.scenes && typeof input.scenes === "object", "adapter must return the scene render map (Red r3 A-F2)");
  assert.ok(!("framesByGesture" in input), "adapter must not leak handoff slug groups (Red r3 A-F2)");
  const paths = [...Object.values(input.cast || {})];
  for (const list of Object.values(input.gestures || {})) paths.push(...list);
  paths.push(...(input.idle || []), ...Object.values(input.scenes || {}));
  console.log(`ForgeArt path count: ${paths.length}`);
  assert.ok(paths.length > 0, "no adapter paths to check");
  for (const p of paths) {
    assert.ok(!path.isAbsolute(p), `adapter path must stay project-relative: ${p}`);
    assert.ok(!p.includes("handoff"), `adapter path must never name the handoff folder: ${p}`);
  }
});

test("A-F3 the render path prepares weeks from the manifest", () => {
  const renderSrc = fs.readFileSync(path.resolve(HERE, "../scripts/render.mjs"), "utf8");
  assert.ok(renderSrc.includes("prepare(rel)"), "render.mjs must keep calling prepare(rel)");
  assert.ok(prepare.toString().includes("manifestToForgeInput") || prepare.toString().includes("prepareWithManifest") || prepare.toString().includes("HANDOFF") || prepare.toString().includes("MANIFEST"), "prepare(rel) must consult the handoff manifest (Red r3 A-F3)");
  assert.ok(renderSrc.includes("prepareWithManifest"), "the render path must reach prepareWithManifest (Red r3 A-F3)");
  const w02 = readWeek("l2/w02");
  const spec = buildSpec(w02, 60);
  const input = manifestToForgeInput(HANDOFF);
  const names = usedArt(spec).actors.filter((a) => input.cast[a.toLowerCase()]);
  console.log(`W02 covered actor count: ${names.length}`);
  assert.ok(names.includes("Pat"), "w02 must cover Pat from the manifest");
  for (const name of names) {
    const p = input.cast[name.toLowerCase()];
    assert.ok(!path.isAbsolute(p), `w02 ${name} cut-out must be project-relative (Red r3 A-F3)`);
  }
});

test("A-F4 the intake copy runs into a temp project folder and skips Lily", () => {
  const rows = fs.readFileSync(path.join(HANDOFF, "MANIFEST.tsv"), "utf8").trim().split("\n").slice(1);
  const byFile = new Map(rows.map((ln) => { const [file, , , sha] = ln.split("\t"); return [file, sha]; }));
  const w02 = readWeek("l2/w02");
  const input = manifestToForgeInput(HANDOFF);
  const wanted = usedArt(buildSpec(w02, 60)).actors.filter((a) => input.cast[a.toLowerCase()]).map((a) => path.relative(HANDOFF, input.cast[a.toLowerCase()]));
  const unique = [...new Set(wanted)];
  console.log(`W02 copy file count: ${unique.length}`);
  assert.ok(unique.length > 0, "no week files to copy");
  assert.ok(!unique.some((f) => f.toLowerCase().includes("lily")), "Lily must never be copied");
  const before = [...byFile.keys()].map((f) => `${f} ${fs.statSync(path.join(HANDOFF, f)).mtimeMs}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "w02-intake-"));
  const copied = copyManifestSubset(HANDOFF, tmp, unique);
  assert.deepEqual(copied, unique, "copyManifestSubset must return the project-relative copies (Red r3 A-F4)");
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.relative(tmp, path.join(dir, e.name))]);
  assert.deepEqual(walk(tmp).sort(), unique.sort(), "temp folder must hold only the week files");
  for (const rel of unique) {
    const sha = crypto.createHash("sha256").update(fs.readFileSync(path.join(tmp, rel))).digest("hex");
    assert.equal(sha, byFile.get(rel), `sha256 mismatch for copied ${rel}`);
  }
  const after = [...byFile.keys()].map((f) => `${f} ${fs.statSync(path.join(HANDOFF, f)).mtimeMs}`);
  assert.deepEqual(after, before, "the handoff folder must stay unchanged");
  fs.rmSync(tmp, { recursive: true, force: true });
});
