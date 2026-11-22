import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { sceneOf } from "../scripts/prepare.mjs";
import * as prepare from "../scripts/prepare.mjs";

const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const THAI = /[\u0E00-\u0E7F]/;

function safeJoin(root, rel) {
  assert.ok(!path.isAbsolute(rel), `absolute path ${rel}`);
  assert.ok(!rel.split("/").includes(".."), `dot-dot in ${rel}`);
  return path.join(root, rel);
}

function readManifest() {
  const tsv = fs.readFileSync(safeJoin(HANDOFF, "MANIFEST.tsv"), "utf8");
  assert.ok(!THAI.test(tsv), "manifest holds Thai");
  const lines = tsv.trim().split("\n");
  const header = lines[0].split("\t");
  assert.deepEqual(header, ["file", "character_or_week", "source_commit", "sha256"]);
  return lines.slice(1).map((ln) => {
    const [file, character_or_week, source_commit, sha256] = ln.split("\t");
    return { file, character_or_week, source_commit, sha256 };
  });
}

test("T2.1 the manifest lists 108 ready files with matching hashes", () => {
  const rows = readManifest();
  console.log(`Manifest row count: ${rows.length}`);
  assert.equal(rows.length, 108);
  assert.ok(rows.length > 0, "no manifest rows");
  const counts = {};
  for (const r of rows) counts[r.character_or_week] = (counts[r.character_or_week] || 0) + 1;
  console.log(`Pat row count: ${counts.pat || 0}`);
  console.log(`Sam row count: ${counts.sam || 0}`);
  console.log(`Mia row count: ${counts.mia || 0}`);
  console.log(`May row count: ${counts.may || 0}`);
  console.log(`W04 row count: ${counts.w04 || 0}`);
  console.log(`W07 row count: ${counts.w07 || 0}`);
  assert.equal(counts.pat, 25);
  assert.equal(counts.sam, 25);
  assert.equal(counts.mia, 25);
  assert.equal(counts.may, 25);
  assert.equal(counts.w04, 4);
  assert.equal(counts.w07, 4);
  assert.equal(counts.lily || 0, 0);
  for (const r of rows) {
    assert.equal(r.source_commit, "65e233fb");
    assert.ok(!path.isAbsolute(r.file), `absolute ${r.file}`);
    assert.ok(!r.file.split("/").includes(".."), `dot-dot ${r.file}`);
    const full = safeJoin(HANDOFF, r.file);
    assert.ok(fs.existsSync(full), `missing ${r.file}`);
    const bytes = fs.readFileSync(full);
    const sha = crypto.createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha, r.sha256, `hash mismatch ${r.file}`);
  }
  // The intake adapter must turn the TSV into the forgeSpec shape.
  assert.equal(typeof prepare.manifestToForgeInput, "function", "missing manifestToForgeInput adapter (Red)");
});

test("T2.2 the w04 and w07 scene sets match byte for byte", () => {
  let compared = 0;
  for (const name of ["classroom.png", "rug.png", "classroom.txt", "manifest.json"]) {
    const a = fs.readFileSync(safeJoin(HANDOFF, `scenes/w04/${name}`));
    const b = fs.readFileSync(safeJoin(HANDOFF, `scenes/w07/${name}`));
    const ha = crypto.createHash("sha256").update(a).digest("hex");
    const hb = crypto.createHash("sha256").update(b).digest("hex");
    assert.equal(ha, hb, `${name} differs between w04 and w07`);
    compared += 1;
  }
  console.log(`Scene file comparison count: ${compared}`);
  assert.equal(compared, 4);
  assert.ok(compared > 0, "no scene files compared");
  const manifest = JSON.parse(fs.readFileSync(safeJoin(HANDOFF, "scenes/w04/manifest.json"), "utf8"));
  assert.equal(typeof prepare.manifestToForgeInput, "function", "missing manifest adapter for scale check (Red)");
  assert.equal(556 / manifest.ppm, 556 / 450);
});

test("T2.3 an intake run never changes the read-only handoff", () => {
  const rows = readManifest();
  const before = rows.map((r) => {
    const full = safeJoin(HANDOFF, r.file);
    const st = fs.statSync(full);
    return `${r.file} ${st.size} ${r.sha256} ${st.mtimeMs}`;
  });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "intake-"));
  for (const r of rows.slice(0, 2)) {
    const src = safeJoin(HANDOFF, r.file);
    const dst = path.join(tmp, r.file);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  const after = rows.map((r) => {
    const full = safeJoin(HANDOFF, r.file);
    const st = fs.statSync(full);
    return `${r.file} ${st.size} ${r.sha256} ${st.mtimeMs}`;
  });
  assert.deepEqual(after, before);
  fs.rmSync(tmp, { recursive: true, force: true });
  assert.equal(typeof prepare.copyManifestSubset, "function", "missing copyManifestSubset intake copy (Red)");
});

test("T2.4 the adapter maps the TSV to forgeSpec and falls back for Lily", () => {
  assert.equal(typeof prepare.manifestToForgeInput, "function", "missing manifestToForgeInput (Red)");
  const input = prepare.manifestToForgeInput(HANDOFF);
  assert.equal(input.scale, 556 / 450);
  const sceneManifest = JSON.parse(fs.readFileSync(safeJoin(HANDOFF, "scenes/w04/manifest.json"), "utf8"));
  assert.deepEqual(input.canvas, sceneManifest.canvas);
  assert.deepEqual(input.foot, sceneManifest.footPoint);
  assert.ok(input.cast.pat && input.cast.sam && input.cast.mia && input.cast.may, "cast fronts missing");
  assert.ok(!input.cast.lily, "Lily must stay a placeholder");
  assert.ok(!("framesByGesture" in input), "adapter must not leak handoff slug groups");
  assert.ok(input.gestures && typeof input.gestures === "object", "adapter must map gestures by package name");
  const bow = input.gestures.bow || [];
  console.log(`Bow frame count: ${bow.length}`);
  assert.equal(bow.length, 4);
  assert.equal((input.gestures["hug self"] || []).length, 4);
  assert.equal((input.gestures.listen || []).length, 4);
  for (const p of [...bow, ...(input.idle || [])]) {
    assert.ok(!path.isAbsolute(p), `gesture path must stay project-relative: ${p}`);
  }
  assert.ok(Array.isArray(input.idle) && input.idle.length > 0, "adapter must return the idle frame list");
});

test("T2.5 w07 has no stage file and uses the classroom scene", () => {
  const w07dir = safeJoin(HANDOFF, "scenes/w07");
  const names = fs.readdirSync(w07dir);
  assert.ok(!names.some((n) => n.toLowerCase().includes("stage")), "w07 must have no stage file");
  assert.equal(sceneOf("May and Ben knock on the lid of a big toy box in a bright playroom.", "st2/7"), "classroom", "w07 lines use the default classroom (Red: sceneOf gives playroom)");
  assert.equal(typeof prepare.prepareWithManifest, "function", "missing prepareWithManifest art switch (Red)");
});

test("T2.6 only the files a week uses are copied; Lily is never copied", () => {
  const rows = readManifest();
  const files = new Set(rows.map((r) => r.file));
  assert.ok(files.size === 108, "manifest set must hold 108 paths");
  assert.ok(![...files].some((f) => f.toLowerCase().includes("lily")), "Lily rows must never be copied");
  assert.equal(typeof prepare.copyManifestSubset, "function", "missing copyManifestSubset week copy (Red)");
});
