import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { sceneOf } from "../scripts/prepare.mjs";
import * as prepare from "../scripts/prepare.mjs";

const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";
const HERE = path.dirname(new URL(import.meta.url).pathname);
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
  const rows = readManifest();
  const perName = {};
  for (const r of rows.filter((x) => x.file.startsWith("cutouts/"))) {
    perName[r.character_or_week] = (perName[r.character_or_week] || 0) + 1;
  }
  for (const name of ["pat", "sam", "mia", "may"]) {
    console.log(`Cutout row count for ${name}: ${perName[name] || 0}`);
    assert.equal(perName[name], 25, `cut-out frames counted under cast: 25 per character for ${name}`);
  }
  const gesturePaths = [...Object.values(input.gestures).flat(), ...(input.idle || [])];
  assert.ok(gesturePaths.length > 0, "no inset frames to guard");
  for (const p of gesturePaths) {
    assert.ok(!p.includes("cutouts/"), `no cut-out path in gestures or idle: ${p}`);
    assert.ok(!path.isAbsolute(p), `gesture path must stay project-relative: ${p}`);
  }
  assert.ok(!("framesByGesture" in input), "adapter must not leak handoff slug groups");
  const raw = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json"), "utf8"));
  const tail = (p) => p.slice(p.indexOf("gestures/"));
  for (const key of Object.keys(raw.spec.forge.gestures)) {
    assert.deepEqual((input.gestures[key] || []).map(tail), raw.spec.forge.gestures[key].map(tail), `gesture ${key} must equal the approved Adventurer inset`);
  }
  assert.deepEqual(input.idle.map(tail), raw.spec.forge.idle.map(tail), "idle must equal the approved Adventurer idle");
});

test("T2.5 w07 has no stage file and uses the classroom scene", () => {
  const w07dir = safeJoin(HANDOFF, "scenes/w07");
  const names = fs.readdirSync(w07dir);
  assert.ok(!names.some((n) => n.toLowerCase().includes("stage")), "w07 must have no stage file");
  assert.equal(sceneOf("May and Ben knock on the lid of a big toy box in a bright playroom.", "st2/7"), "classroom", "w07 lines use the default classroom (Red: sceneOf gives playroom)");
  assert.equal(typeof prepare.prepareWithManifest, "function", "missing prepareWithManifest art switch (Red)");
});

test("T2.6 every week 2-7 copies only its own files, with placeholders for the missing cast", () => {
  const rows = readManifest();
  const files = new Set(rows.map((r) => r.file));
  assert.ok(files.size === 108, "manifest set must hold 108 paths");
  assert.ok(![...files].some((f) => f.toLowerCase().includes("lily")), "Lily rows must never be copied");
  const coveredNames = new Set(
    rows.filter((r) => r.file.startsWith("cutouts/")).map((r) => r.character_or_week.toLowerCase()),
  );
  /** PM 2026-11-23: Daniel scrapped the 3D sprout base model; w07 must not draw the 3D May cut-out. */
  const SCRAPPED_3D = { "l2/w07": ["may"] };
  console.log(`Manifest covered actor count: ${coveredNames.size}`);
  assert.equal(coveredNames.size, 4);
  for (const name of ["pat", "sam", "mia", "may"]) {
    assert.ok(coveredNames.has(name), `manifest must cover ${name}`);
  }
  const sceneRowsW04 = rows.filter((r) => r.character_or_week === "w04");
  const sceneRowsW07 = rows.filter((r) => r.character_or_week === "w07");
  console.log(`W04 scene row count: ${sceneRowsW04.length}`);
  console.log(`W07 scene row count: ${sceneRowsW07.length}`);
  assert.equal(sceneRowsW04.length, 4);
  assert.equal(sceneRowsW07.length, 4);
  const before = rows.map((r) => `${r.file} ${fs.statSync(safeJoin(HANDOFF, r.file)).mtimeMs}`);
  let forgeWeeks = 0;
  let placeholderWeeks = 0;
  for (const rel of ["l2/w02", "l2/w03", "l2/w04", "l2/w05", "l2/w06", "l2/w07"]) {
    const spec = JSON.parse(fs.readFileSync(prepare.prepare(rel), "utf8"));
    const use = prepare.usedArt(spec);
    console.log(`${rel} actor count: ${use.actors.length}`);
    assert.ok(use.actors.length > 0, `no actors in ${rel}`);
    const scrapped = (SCRAPPED_3D[rel] ?? []).map((n) => n.toLowerCase());
    const coveredActors = use.actors.filter((n) => coveredNames.has(String(n).toLowerCase()) && !scrapped.includes(String(n).toLowerCase()));
    console.log(`${rel} covered actor count: ${coveredActors.length}`);
    console.log(`${rel} scrapped actor count: ${scrapped.length}`);
    assert.ok(coveredActors.length >= 0, `negative covered actors in ${rel}`);
    for (const name of use.actors) {
      const kind = spec.forge?.cast?.[name] ?? spec.forge?.cast?.[String(name).toLowerCase()]
        ? "forge"
        : prepare.resolveActorArt(name, spec.forge).kind;
      if (name === "Lily" || name === "Ben" || ["Mom", "Dad", "Grandma", "Grandpa", "Tom"].includes(name)) {
        assert.equal(kind, "placeholder", `${rel} ${name} must resolve to a placeholder`);
      }
    }
    assert.ok(!JSON.stringify(spec.forge?.cast ?? {}).toLowerCase().includes("lily"), `${rel} cast must never hold Lily`);
    for (const list of Object.values(spec.forge?.gestures ?? {})) {
      for (const p of list) assert.ok(!p.includes("cutouts/"), `${rel} inset must not use a cut-out gesture frame: ${p}`);
    }
    for (const p of spec.forge?.idle ?? []) assert.ok(!p.includes("cutouts/"), `${rel} idle must not use a cut-out: ${p}`);
    const dir = path.join(HERE, "..", "public", rel, "forge");
    if (coveredActors.length > 0) {
      assert.equal(spec.art, "forge", `${rel} has manifest-covered cast but prepares ${spec.art}`);
      forgeWeeks += 1;
      for (const name of coveredActors) {
        const entry = spec.forge?.cast?.[name] ?? spec.forge?.cast?.[String(name).toLowerCase()];
        assert.ok(entry, `${rel} covered actor ${name} must keep a Forge cast entry`);
        const copied = path.join(HERE, "..", "public", String(entry));
        assert.ok(fs.existsSync(copied), `${rel} covered actor ${name} copy must exist on disk: ${entry}`);
      }
    } else {
      assert.notEqual(spec.art, "forge", `${rel} with no covered cast must not claim Forge art`);
      placeholderWeeks += 1;
      assert.ok(!fs.existsSync(dir) || fs.readdirSync(dir).length === 0, `${rel} without Forge art keeps no forge folder`);
      continue;
    }
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.relative(dir, path.join(d, e.name))]);
    const onDisk = walk(dir);
    assert.ok(onDisk.length > 0, `${rel} Forge art must copy week files`);
    for (const f of onDisk) {
      assert.ok(!f.toLowerCase().includes("lily"), `${rel} must never copy Lily: ${f}`);
      assert.ok(files.has(f) || f.includes("adventurer"), `${rel} copied file must be manifest-listed or Adventurer inset: ${f}`);
    }
    if (rel === "l2/w04" || rel === "l2/w07") {
      const tag = rel.slice(3);
      const sceneRows = rows.filter((r) => r.file.startsWith(`scenes/${tag}/`));
      console.log(`${rel} scene row count: ${sceneRows.length}`);
      assert.equal(sceneRows.length, 4, `${rel} must hold 4 manifest scene rows`);
      for (const r of sceneRows) {
        assert.ok(fs.existsSync(safeJoin(HANDOFF, r.file)), `${rel} scene file must exist in the handoff: ${r.file}`);
      }
    }
    if (rel === "l2/w07") {
      for (const line of spec.lines) {
        assert.equal(line.scene, "classroom", "w07 lines use the classroom default");
      }
    }
  }
  console.log(`Forge week count: ${forgeWeeks}`);
  console.log(`Placeholder week count: ${placeholderWeeks}`);
  assert.equal(forgeWeeks, 5);
  assert.equal(placeholderWeeks, 1);
  const after = rows.map((r) => `${r.file} ${fs.statSync(safeJoin(HANDOFF, r.file)).mtimeMs}`);
  assert.deepEqual(after, before, "the handoff folder must stay unchanged");
});
