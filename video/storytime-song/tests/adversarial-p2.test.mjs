import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Internals, Sequence } from "remotion";
import ts from "typescript";
import { buildSpec, resolveActorArt } from "../scripts/prepare.mjs";
import { actorBoxes } from "../src/actorBoxes.ts";

const PROJECT = fileURLToPath(new URL("../", import.meta.url));
const RUNS = path.resolve(PROJECT, "../../measure/runs/storytime_song_video_20261022");
const HEADER = "file\tcharacter_or_week\tsource_commit\tsha256";
const META = JSON.stringify({ ppm: 450, canvas: [1024, 600], footPoint: { col: 512, row: 580 } });
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4z8DwH4QZYAwAR8oH+WdZbrcAAAAASUVORK5CYII=",
  "base64",
);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const row = (file, bytes = PNG, who = "pat") => ({ file, bytes, who });
const pngFront = row("cutouts/pat/listen.png");
const sceneMeta = row("scenes/w04/manifest.json", META, "w04");
const room = row("scenes/w04/classroom.png", PNG, "w04");
const cuts = [["classroom", 1920, 1080], ["portrait", 1080, 607.5]];

function temp(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "adversarial-p2-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function put(root, file, bytes) {
  const dest = path.join(root, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, bytes);
  return dest;
}

function tsvRow({ file, who, bytes }) {
  return `${file}\t${who}\t65e233fb\t${sha(bytes)}`;
}

function manifest(root, rows, { separator = "\n", header = HEADER, lines = rows.map(tsvRow) } = {}) {
  for (const { file, bytes } of rows) put(root, file, bytes);
  put(root, "MANIFEST.tsv", [header, ...lines, ""].join(separator));
}

function week(weekNumber) {
  return {
    meta: { key: `st2/${weekNumber}`, level: 2, week: weekNumber },
    song: {
      title: "A song",
      audio: "audio.wav",
      lines: [{ text: "Hello", gesture: "wave", image: { prompt: "", characters: ["Pat", "Lily"] } }],
      times: [{ sentence: "Hello", startTime: 0, endTime: 1, words: [{ word: "Hello", start: 0, end: 1 }] }],
    },
  };
}

function waveFile(firstSample = 0) {
  const wave = Buffer.alloc(44 + 16000);
  wave.write("RIFF");
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write("WAVEfmt ", 8);
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(8000, 24);
  wave.writeUInt32LE(16000, 28);
  wave.writeUInt16LE(2, 32);
  wave.writeUInt16LE(16, 34);
  wave.write("data", 36);
  wave.writeUInt32LE(wave.length - 44, 40);
  wave.writeInt16LE(firstSample, 44);
  return wave;
}

async function sandbox(t) {
  const root = temp(t);
  const project = path.join(root, "video/storytime-song");
  const content = path.join(root, "content/storytime");
  for (const file of ["prepare.mjs", "forge.mjs"]) {
    put(project, `scripts/${file}`, fs.readFileSync(path.join(PROJECT, "scripts", file)));
  }
  for (const n of [1, 2, 4]) put(content, `l2/w0${n}.json`, JSON.stringify(week(n)));
  put(content, "audio.wav", waveFile());
  const idle = "gestures/adventurer/idle.png";
  const front = (who) => `cutouts/${who}/listen.png`;
  for (const file of [idle, front("pat"), front("lily")]) put(content, `l2/media/w01/forge/${file}`, PNG);
  put(content, "l2/media/w01/forge/manifest.json", JSON.stringify({
    gestures: { adventurer: { idle: [idle], wave: [idle] } },
    cast: { pat: { front: front("pat") }, lily: { front: front("lily") } },
    scenes: {}, ppm: 450, canvas: [2, 2], footPoint: { col: 1, row: 2 },
  }));
  const art = path.join(root, "handoff");
  const publicDir = path.join(project, "public");
  const api = await import(pathToFileURL(path.join(project, "scripts/prepare.mjs")).href);
  return { root, art, content, publicDir, api, prepare: (rel) => {
    const previous = process.env.STORYTIME_SONG_ART_DIR;
    process.env.STORYTIME_SONG_ART_DIR = art;
    try {
      return api.prepare(rel);
    } finally {
      if (previous === undefined) delete process.env.STORYTIME_SONG_ART_DIR;
      else process.env.STORYTIME_SONG_ART_DIR = previous;
    }
  } };
}

function handoff108() {
  const cast = ["pat", "sam", "mia", "may"].flatMap((who) =>
    Array.from({ length: 25 }, (_, i) =>
      row(`cutouts/${who}/${i === 0 ? "listen" : `frame-${i}`}.png`, PNG, who)));
  const scenes = ["w04", "w07"].flatMap((who) => [
    row(`scenes/${who}/manifest.json`, META, who),
    row(`scenes/${who}/classroom.png`, PNG, who),
    row(`scenes/${who}/rug.png`, PNG, who),
    row(`scenes/${who}/classroom.txt`, "A classroom.\n", who),
  ]);
  return [...cast, ...scenes];
}

test("ADV-P2-1 reads all 108 rows and checks the final unused digest", async (t) => {
  const { api, art } = await sandbox(t);
  const rows = handoff108();
  assert.equal(rows.length, 108);
  manifest(art, rows);
  const result = api.manifestToForgeInput(art);
  assert.deepEqual(Object.keys(result.cast).sort(), ["may", "mia", "pat", "sam"]);
  const last = rows.at(-1);
  put(art, last.file, "One changed value.\n");
  assert.throws(() => api.manifestToForgeInput(art), {
    message: `sha256 mismatch for ${last.file} in the handoff manifest`,
  });
});

test("ADV-P2-2 refuses noncanonical paths, dot segments and non-asset suffixes", async (t) => {
  const { api, art } = await sandbox(t);
  const rows = [sceneMeta, pngFront];
  for (const [file, reason] of [
    ["cutouts//pat/listen.png", "noncanonical manifest path"],
    ["cutouts/pat/./listen.png", "noncanonical manifest path"],
    ["notes/.draft/image.png", "forbidden dot segment in manifest path"],
    ["notes/asset.png.bin", "forbidden asset extension in manifest path"],
  ]) {
    manifest(art, rows, { lines: [...rows.map(tsvRow), tsvRow(row(file))] });
    assert.throws(() => api.manifestToForgeInput(art), { message: `${reason} ${file}` });
  }
  manifest(art, [...rows, row("notes/classroom.release.TXT", "A classroom.", "w04")]);
  assert.equal(api.manifestToForgeInput(art).cast.pat, "forge/cutouts/pat/listen.png");
});

test("ADV-P2-3 refuses duplicate, blank interior, short and oversized digest rows", async (t) => {
  const { api, art } = await sandbox(t);
  const rows = [sceneMeta, pngFront];
  for (const [extra, expected] of [
    [tsvRow(pngFront), /^duplicate manifest row cutouts\/pat\/listen\.png$/],
    ["", /^unsafe manifest path /],
    [`notes/readme.txt\tpat\t65e233fb`, /^invalid sha256 in manifest row notes\/readme\.txt$/],
    [`notes/readme.txt\tpat\t65e233fb\t${"a".repeat(256 * 1024)}`, /^invalid sha256 in manifest row notes\/readme\.txt$/],
  ]) {
    const note = row("notes/readme.txt", "A note.");
    manifest(art, [...rows, note], { lines: [...rows.map(tsvRow), extra, tsvRow(note)] });
    assert.throws(() => api.manifestToForgeInput(art), { message: expected });
  }
});

test("ADV-P2-4 refuses manifest file and asset directory symlinks", async (t) => {
  const { root, api, art } = await sandbox(t);
  manifest(art, [sceneMeta, pngFront]);
  const tsv = path.join(art, "MANIFEST.tsv");
  fs.renameSync(tsv, path.join(root, "manifest.tsv"));
  fs.symlinkSync(path.join(root, "manifest.tsv"), tsv);
  assert.throws(() => api.manifestToForgeInput(art), { message: "symlink refused in manifest path MANIFEST.tsv" });
  fs.unlinkSync(tsv);
  fs.renameSync(path.join(root, "manifest.tsv"), tsv);
  const dir = path.join(art, "cutouts/pat");
  fs.renameSync(dir, path.join(root, "pat"));
  fs.symlinkSync(path.join(root, "pat"), dir);
  assert.throws(() => api.manifestToForgeInput(art), { message: "symlink refused in manifest path cutouts/pat/listen.png" });
});

test("ADV-P2-9 prepare uses the covered actor and preserves a named placeholder", async (t) => {
  const { art, publicDir, prepare } = await sandbox(t);
  manifest(art, [sceneMeta, pngFront, row("cutouts/lily/listen.png", PNG, "lily")]);
  const spec = JSON.parse(fs.readFileSync(prepare("l2/w02"), "utf8"));
  assert.equal(spec.art, "forge");
  assert.deepEqual(Object.keys(spec.forge.cast), ["Pat"]);
  assert.deepEqual(fs.readFileSync(path.join(publicDir, spec.forge.cast.Pat)), PNG);
  assert.deepEqual(resolveActorArt("Lily", spec.forge), { kind: "placeholder", label: "Lily" });
  assert.deepEqual(actorBoxes(spec, 0, "portrait").map(({ name, kind }) => [name, kind]),
    [["Pat", "cutout"], ["Lily", "placeholder"]]);
});

test("ADV-P2-12 song.mp3 symlink refusal leaves the target and the week intact", async (t) => {
  const { root, art, publicDir, prepare } = await sandbox(t);
  const rel = "l2/w02";
  const spec = put(publicDir, `${rel}/spec.json`, "Previous spec");
  const audio = path.join(publicDir, rel, "song.mp3");
  const target = put(root, "unchanged.txt", "Previous audio");
  fs.symlinkSync(target, audio);
  manifest(art, [sceneMeta, pngFront]);
  assert.throws(() => prepare(rel), { message: `symlink refused in week output file ${audio}` });
  assert.equal(fs.readlinkSync(audio), target);
  assert.equal(fs.readFileSync(target, "utf8"), "Previous audio");
  assert.equal(fs.readFileSync(spec, "utf8"), "Previous spec");
});

function assertBoxes(boxes, names, width, height) {
  assert.deepEqual(boxes.map(({ name }) => name), names);
  for (const [i, { box: a, name }] of boxes.entries()) {
    assert.ok(a.width > 0 && a.height > 0 && a.left >= 0 && a.left + a.width <= width + 1e-6
      && a.top >= 0 && a.top + a.height <= height, `${name} must stay inside the scene`);
    for (const { box: b, name: other } of boxes.slice(i + 1)) {
      const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
      const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
      assert.ok(w <= 1e-6 || h <= 1e-6, `${name} and ${other} overlap by ${w} × ${h} px`);
    }
  }
}

test("ADV-P2-13 both cuts fit the six-actor family row, an unknown actor, and no actors", () => {
  const names = ["Mom", "Dad", "Grandma", "Grandpa", "Tom", "Lily"];
  const spec = { lines: [{ actors: names }, { actors: ["Unknown"] }, { actors: [] }] };
  for (const [cut, width, height] of cuts) {
    assertBoxes(actorBoxes(spec, 0, cut), names, width, height);
    assert.equal(actorBoxes(spec, 1, cut)[0].kind, "placeholder");
    assert.deepEqual(actorBoxes(spec, 2, cut), []);
    assert.deepEqual(actorBoxes(spec, -1, cut), []);
  }
});

async function renderer(t) {
  // Compile the real TSX in a temp root. Read Sequence props before Remotion draws a frame.
  const target = temp(t);
  fs.symlinkSync(path.join(PROJECT, "node_modules"), path.join(target, "node_modules"));
  put(target, "package.json", '{"type":"module"}');
  const source = path.join(PROJECT, "src");
  for (const file of fs.readdirSync(source, { recursive: true })) {
    if (!/\.tsx?$/.test(file)) continue;
    const result = ts.transpileModule(fs.readFileSync(path.join(source, file), "utf8"), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    const output = result.outputText.replace(/(\bfrom\s+["'])(\.{1,2}\/[^"']+)(["'])/g, "$1$2.js$3");
    put(target, file.replace(/\.tsx?$/, ".js"), output);
  }
  return {
    ...await import(pathToFileURL(path.join(target, "Song.js")).href),
    ...await import(pathToFileURL(path.join(target, "Actors.js")).href),
  };
}

function captureWindows(components, spec, portrait) {
  const windows = [];
  function visit(node) {
    if (Array.isArray(node)) node.forEach(visit);
    else if (React.isValidElement(node)) {
      if (node.type === Sequence && node.props.children?.type === components.Actors) {
        const { from, durationInFrames, children } = node.props;
        windows.push({ from, durationInFrames, names: children.props.boxes.map(({ name }) => name) });
      }
      visit(node.props.children);
    }
  }
  const e = React.createElement;
  function Probe() {
    visit(components.SceneShots({ spec, portrait }));
    return null;
  }
  const asset = "/synthetic.mp4";
  renderToStaticMarkup(e(Internals.CompositionManager.Provider, { value: {
    canvasContent: { type: "asset", asset },
    compositions: [],
    currentAssetMetadata: { asset, fps: 30, durationInFrames: 60, width: 1920, height: 1080 },
  } }, e(Internals.VideoProvider, null, e(Internals.CanUseRemotionHooks.Provider, { value: true }, e(Probe)))));
  return windows;
}

const line = (start, picture, name) => ({ start, picture, scene: "classroom", actors: [name], bubbles: [] });

test("ADV-P2-15 the rendered Sequence inputs tile on a frame boundary and keep picture identity", async (t) => {
  const components = await renderer(t);
  const spec = { duration: 2, lines: [
    line(0, 0, "Pat"), line(0.3, 0, "Pat"), line(0.5, 2, "Lily"), line(1, 0, "Pat"),
  ] };
  for (const portrait of [false, true]) {
    assert.deepEqual(captureWindows(components, spec, portrait), [
      { from: 0, durationInFrames: 15, names: ["Pat"] },
      { from: 15, durationInFrames: 15, names: ["Lily"] },
      { from: 30, durationInFrames: 30, names: ["Pat"] },
    ]);
  }
  const source = week(2);
  source.song.lines[0].imageOf = 4;
  assert.throws(() => buildSpec(source, 2), "an unmatched imageOf must fail before rendering");
});

test("ADV-P2-17 the week 1 masked guard detects a changed pair and a mask outside the card", async (t) => {
  const { root } = await sandbox(t);
  const project = path.join(root, "video/storytime-song");
  const runs = path.join(root, "measure/runs/storytime_song_video_20261022");
  const regression = put(project, "tests/week1-regression.test.mjs",
    fs.readFileSync(path.join(PROJECT, "tests/week1-regression.test.mjs")));
  const baseline = "red-p1-w01-frames.txt";
  put(runs, baseline, fs.readFileSync(path.join(RUNS, baseline)));
  const compare = "green-p1-w01-compare.txt";
  const good = fs.readFileSync(path.join(RUNS, compare), "utf8");
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const run = (input) => {
    assert.doesNotMatch(input, /[\u0e00-\u0e7f]/);
    put(runs, compare, input);
    const result = spawnSync(process.execPath, [
      "--test", "--test-concurrency=1", "--test-name-pattern=^T1\\.8 ", regression,
    ], { cwd: project, encoding: "utf8", env });
    if (result.error) throw result.error;
    return result;
  };
  const control = run(good);
  assert.equal(control.status, 0, control.stdout + control.stderr);
  assert.match(control.stdout, /Same-toolchain masked pair count: 4/);
  const newHash = good.replace(/^(same-toolchain masked new sha256: .*: )([a-f0-9])/m,
    (_, head, digit) => head + (digit === "0" ? "1" : "0"));
  assert.notEqual(newHash, good);
  const changedPair = run(newHash);
  assert.equal(changedPair.status, 1);
  assert.match(changedPair.stdout, /same-toolchain masked mismatch/);
  const oversized = good.replace(/^inset mask: classroom .*$/m, "inset mask: classroom 1602 708 304 324");
  assert.notEqual(oversized, good);
  const changedMask = run(oversized);
  assert.equal(changedMask.status, 1);
  assert.match(changedMask.stdout, /inset mask classroom must be no larger/);
});
