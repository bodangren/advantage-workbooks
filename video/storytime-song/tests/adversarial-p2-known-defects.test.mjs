import assert from "node:assert/strict";
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
import { resolveActorArt } from "../scripts/prepare.mjs";
import { actorBoxes } from "../src/actorBoxes.ts";

/**
 * Known-defect shelf for adversarial Phase 2 findings (PM ruling 2026-11-24: adversarial
 * F1-F3 go to tech debt under the round-4 rule). Each test keeps its body unchanged and is
 * registered skipped, so the file exits 0 and never runs its fixture. Ordered F3 first:
 * a refused w04 refresh can replace song.mp3 before the classroom row check fails, which
 * only bites on a w04 refresh with a missing row. This file is NOT in the GREEN command.
 */
const PROJECT = fileURLToPath(new URL("../", import.meta.url));
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

test("ADV-P2-11 refusing a refresh preserves the previous audio and spec",
  { skip: "tech debt: F3 refresh can replace song.mp3 before the classroom row check fails" }, async (t) => {
  const { art, content, publicDir, prepare } = await sandbox(t);
  const rel = "l2/w04";
  manifest(art, [sceneMeta, pngFront, room]);
  const spec = prepare(rel);
  const audio = path.join(publicDir, rel, "song.mp3");
  const oldAudio = sha(fs.readFileSync(audio));
  const oldSpec = fs.readFileSync(spec);
  const newAudio = waveFile(256);
  assert.notEqual(sha(newAudio), oldAudio);
  put(content, "audio.wav", newAudio);
  manifest(art, [sceneMeta, pngFront]);
  assert.throws(() => prepare(rel), {
    message: `no manifest row for the Forge classroom picture ${room.file}`,
  });
  assert.deepEqual(fs.readFileSync(spec), oldSpec);
  assert.equal(sha(fs.readFileSync(audio)), oldAudio, "the previous song.mp3 must stay byte-identical");
});

test("ADV-P2-6 rejects a manifest without the required header and data",
  { skip: "tech debt: F1 headerless and rowless manifests need explicit rejection" }, async (t) => {
  const { api, art } = await sandbox(t);
  const rows = [sceneMeta, pngFront];
  manifest(art, rows);
  for (const [name, input, message] of [
    ["no header", rows.map(tsvRow).join("\n"), /header/i],
    ["wrong header", ["other\towner\tcommit\tdigest", ...rows.map(tsvRow)].join("\n"), /header/i],
    ["no data rows", HEADER, /empty|no (?:data )?rows/i],
  ]) {
    await t.test(name, () => {
      put(art, "MANIFEST.tsv", input + "\n");
      assert.throws(() => api.manifestToForgeInput(art), message);
    });
  }
});

test("ADV-P2-7 refuses an unlisted cast front instead of dropping a covered actor",
  { skip: "tech debt: F1 unlisted cast front silently drops a covered actor" }, async (t) => {
  const { art, prepare, publicDir } = await sandbox(t);
  const rows = handoff108();
  manifest(art, rows, { lines: rows.filter((r) => r.file !== pngFront.file).map(tsvRow) });
  let output;
  try {
    output = prepare("l2/w02");
  } catch (error) {
    assert.match(error.message, /(?:missing|no) manifest (?:row|file).*cutouts\/pat\/listen\.png/i);
    assert.equal(fs.existsSync(publicDir), false);
    return;
  }
  const spec = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.fail(`prepare accepted the missing front row: art=${spec.art}, cast=${JSON.stringify(spec.forge?.cast)}`);
});

test("ADV-P2-8 a case variant of a cast front resolves or fails explicitly",
  { skip: "tech debt: F1 case-variant cast front resolves Pat to a placeholder" }, async (t) => {
  const { api, art } = await sandbox(t);
  const front = row("cutouts/pat/listen.PNG");
  manifest(art, [sceneMeta, front]);
  let adapter;
  try {
    adapter = api.manifestToForgeInput(art);
  } catch (error) {
    assert.match(error.message, /cutouts\/pat\/listen\.png/i);
    return;
  }
  assert.deepEqual(resolveActorArt("Pat", adapter), { kind: "forge", file: `forge/${front.file}` });
});

test("ADV-P2-10 week 1 prepare is independent of a stale Phase 2 handoff",
  { skip: "tech debt: F2 week 1 prepare depends on a stale Phase 2 handoff" }, async (t) => {
  const { art, prepare } = await sandbox(t);
  const rel = "l2/w01";
  // The no-handoff control uses the same module, week, and media.
  const baseline = fs.readFileSync(prepare(rel));
  manifest(art, [sceneMeta, pngFront, room]);
  assert.deepEqual(fs.readFileSync(prepare(rel)), baseline);
  put(art, room.file, "A different classroom.");
  assert.deepEqual(fs.readFileSync(prepare(rel)), baseline);
});

test("ADV-P2-5 equivalent LF and CRLF manifests select the same art",
  { skip: "tech debt: N1 CRLF manifests unsupported; release handoff uses LF" }, async (t) => {
  const { api, art } = await sandbox(t);
  const rows = [sceneMeta, pngFront];
  manifest(art, rows);
  const lf = api.manifestToForgeInput(art);
  manifest(art, rows, { separator: "\r\n" });
  assert.deepEqual(api.manifestToForgeInput(art), lf);
});

test("ADV-P2-14 a seventh actor must not reuse a visible actor's slot",
  { skip: "tech debt: N2 seventh actor reuses a visible slot; release shots use at most six" }, async (t) => {
  const names = ["Mom", "Dad", "Grandma", "Grandpa", "Tom", "Lily", "Ben"];
  for (const [cut, width, height] of cuts) {
    await t.test(cut, () => {
      assertBoxes(actorBoxes({ lines: [{ actors: names }] }, 0, cut), names, width, height);
    });
  }
});

test("ADV-P2-16 shots with no frame budget must not overlap the next shot",
  { skip: "tech debt: N3 zero-budget shots overlap on frame 0; release windows span 79 plus frames" }, async (t) => {
  const components = await renderer(t);
  for (const start of [0, 0.01]) {
    const spec = { duration: 2, lines: [line(0, 0, "Pat"), line(start, 1, "Lily")] };
    for (const portrait of [false, true]) {
      await t.test(`next start=${start} portrait=${portrait}`, () => {
        const windows = captureWindows(components, spec, portrait);
        const visible = windows.filter(({ from, durationInFrames }) => from <= 0 && 0 < from + durationInFrames);
        assert.deepEqual(visible.map(({ names }) => names), [["Lily"]], "only the next shot may draw on frame 0");
      });
    }
  }
});
