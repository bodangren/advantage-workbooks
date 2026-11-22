import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { buildSpec, manifestToForgeInput, prepareWithManifest } from "../scripts/prepare.mjs";
import * as timeline from "../src/timeline.ts";
import * as layout from "../src/layout.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..");
const REPO = path.resolve(PROJECT, "../..");
const CONTENT = path.join(REPO, "content/storytime");
const REAL_HANDOFF = path.join(os.homedir(), "Desktop/handoff/storytime-song-art");
const THAI = /[\u0E00-\u0E7F]/;

const tempDir = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== "th" && !THAI.test(key))
      .map(([key, child]) => [key, stripThai(child)]));
  }
  return typeof value === "string" && THAI.test(value) ? "" : value;
}

function readFilteredWeek(week) {
  const file = path.join(CONTENT, "l2", `${week}.json`);
  const parsed = stripThai(JSON.parse(fs.readFileSync(file, "utf8")));
  const serialized = JSON.stringify(parsed);
  assert.equal((serialized.match(/[\u0E00-\u0E7F]/g) ?? []).length, 0);
  return parsed;
}

function copyTree(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

function handoffFixture(root, rows) {
  fs.mkdirSync(path.join(root, "scenes/w04"), { recursive: true });
  fs.writeFileSync(path.join(root, "scenes/w04/manifest.json"), JSON.stringify({
    ppm: 450,
    canvas: [1024, 600],
    footPoint: { col: 512, row: 580 },
  }));
  for (const row of rows) {
    const target = path.join(root, row.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, row.bytes);
  }
  fs.writeFileSync(
    path.join(root, "MANIFEST.tsv"),
    ["file\tcharacter_or_week\tsource_commit\tsha256",
      ...rows.map((r) => `${r.file}\t${r.who}\ttest\t${r.sha}`)].join("\n") + "\n",
  );
}

function withArtDir(dir, run) {
  const old = process.env.STORYTIME_SONG_ART_DIR;
  process.env.STORYTIME_SONG_ART_DIR = dir;
  try {
    return run();
  } finally {
    if (old === undefined) delete process.env.STORYTIME_SONG_ART_DIR;
    else process.env.STORYTIME_SONG_ART_DIR = old;
  }
}

function isolatedPrepare(root) {
  const video = path.join(root, "video/storytime-song");
  const scripts = path.join(video, "scripts");
  fs.mkdirSync(scripts, { recursive: true });
  fs.copyFileSync(path.join(PROJECT, "scripts/prepare.mjs"), path.join(scripts, "prepare.mjs"));
  fs.copyFileSync(path.join(PROJECT, "scripts/forge.mjs"), path.join(scripts, "forge.mjs"));
  const content = path.join(root, "content/storytime/l2");
  fs.mkdirSync(content, { recursive: true });
  for (const week of ["w01", "w02", "w04"]) {
    const pkg = readFilteredWeek(week);
    fs.writeFileSync(path.join(content, `${week}.json`), JSON.stringify(pkg));
    const audioSource = path.join(REPO, "content/storytime", pkg.song.audio);
    const audioTarget = path.join(root, "content/storytime", pkg.song.audio);
    fs.mkdirSync(path.dirname(audioTarget), { recursive: true });
    fs.copyFileSync(audioSource, audioTarget);
  }
  copyTree(
    path.join(REPO, "content/storytime/l2/media/w01/forge"),
    path.join(root, "content/storytime/l2/media/w01/forge"),
  );
  return import(`${pathToFileURL(path.join(scripts, "prepare.mjs")).href}?sandbox=${Date.now()}-${Math.random()}`);
}

test("ADV-P1-1 bubble times honor half-open edges, overlap, repeats, and sung parentheses", () => {
  const spec = { lines: [
    { bubbles: [
      { text: "meow meow", start: 1, end: 2 },
      { text: "woof", start: 1.5, end: 2.5 },
      { text: "meow", start: 3, end: 4 },
      { text: "meow", start: 4, end: 5 },
    ] },
  ] };
  assert.equal(timeline.bubbleAt(spec, 1), spec.lines[0].bubbles[0]);
  assert.equal(timeline.bubbleAt(spec, 1.5), spec.lines[0].bubbles[0], "earlier bubble wins during overlap");
  assert.equal(timeline.bubbleAt(spec, 2), spec.lines[0].bubbles[1]);
  assert.equal(timeline.bubbleAt(spec, 2.5), null);
  assert.equal(timeline.bubbleAt(spec, 4), spec.lines[0].bubbles[3]);

  const synthetic = {
    meta: { key: "st2/6", level: 2, week: 6 },
    song: {
      audio: "audio.mp3",
      title: "Test",
      bpm: 100,
      lines: [{
        text: "Meow, meow! (Meow, meow!)",
        gesture: "listen",
        image: { prompt: "A cat.", characters: [] },
      }],
      times: [{
        sentence: "Meow, meow! (Meow, meow!)",
        startTime: 0,
        endTime: 5,
        words: [
          { word: "Meow,", start: 0, end: 0.5 },
          { word: "meow!", start: 0.5, end: 1 },
          { word: "(Meow,", start: 2, end: 2.5 },
          { word: "meow!)", start: 2.5, end: 3 },
        ],
      }],
    },
  };
  const built = buildSpec(synthetic, 5);
  assert.deepEqual(built.lines[0].bubbles, [
    { text: "Meow, meow!", start: 0, end: 1 },
    { text: "Meow, meow!", start: 2, end: 3 },
  ]);
});

test("ADV-P1-2a long unbroken bubble text wraps inside BUBBLE_BOX", () => {
  const soundCard = fs.readFileSync(path.join(PROJECT, "src/SoundCard.tsx"), "utf8");
  assert.match(soundCard, /overflowWrap:\s*["']anywhere["']|wordBreak:\s*["']break-word["']/,
    "long unbroken sound text needs a wrapping rule inside BUBBLE_BOX");
});

test("ADV-P1-2b bubble boxes remain clear of the lyric and gesture areas in both cuts", () => {
  const overlap = (a, b) => !(a.left + a.width <= b.left || b.left + b.width <= a.left
    || a.top + a.height <= b.top || b.top + b.height <= a.top);
  const landscapeInset = { left: 1920 - 48 - 270, top: 1080 - 48 - 324, width: 270, height: 324 };
  const landscapeLyrics = { left: 80, top: 1080 - 48 - 324, width: 1482, height: 200 };
  const portraitBubble = layout.BUBBLE_BOX.portrait;
  const portraitSceneBottom = layout.PORTRAIT_BOXES.scene.top + layout.PORTRAIT_BOXES.scene.height;
  assert.ok(!overlap(layout.BUBBLE_BOX.landscape, landscapeInset));
  assert.ok(!overlap(layout.BUBBLE_BOX.landscape, landscapeLyrics));
  assert.ok(portraitBubble.top + portraitBubble.height <= portraitSceneBottom);
  assert.ok(!overlap(portraitBubble, layout.PORTRAIT_BOXES.lyrics));
  assert.ok(!overlap(portraitBubble, layout.PORTRAIT_BOXES.gesture));
});

test("ADV-P1-3 manifest adapter rejects traversal, absolute, missing, and duplicate rows", () => {
  const root = tempDir("song-adversarial-manifest-");
  try {
    const good = { file: "cutouts/pat/listen.png", who: "pat", bytes: Buffer.from("pat"), sha: hash(Buffer.from("pat")) };
    const accepted = [];
    const rejected = (name, rows) => {
      handoffFixture(root, rows);
      try {
        manifestToForgeInput(root);
        accepted.push(name);
      } catch {
        // A malformed manifest row must stop intake.
      }
    };
    for (const file of ["../outside.png", path.resolve(root, "outside.png")]) {
      rejected(`unsafe path ${file}`, [{ ...good, file }]);
    }
    rejected("missing manifest file", [{ ...good, file: "cutouts/pat/missing.png" }]);
    rejected("duplicate manifest row", [good, good]);
    assert.deepEqual(accepted, [], `intake accepted invalid rows: ${accepted.join(", ")}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4a manifest copy accepts an upper-case SHA-256 digest", async () => {
  const root = tempDir("song-adversarial-copy-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    const row = { file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data).toUpperCase() };
    handoffFixture(art, [row]);
    assert.doesNotThrow(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4b a wrong digest removes stale and partial week output", async () => {
  const root = tempDir("song-adversarial-copy-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    const wrong = hash(data).replace(/^./, (c) => c === "0" ? "1" : "0");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: wrong }]);
    const week = path.join(root, "video/storytime-song/public/l2/w02");
    fs.mkdirSync(path.join(week, "forge"), { recursive: true });
    fs.writeFileSync(path.join(week, "forge/stale.png"), "old manifest");
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /sha256|hash|mismatch|integrity|digest/i);
    assert.ok(!fs.existsSync(week),
      "failed manifest copy must remove the incomplete week output");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4c a digest with surrounding spaces is rejected before output changes", async () => {
  const root = tempDir("song-adversarial-copy-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{
      file: "cutouts/pat/listen.png",
      who: "pat",
      bytes: data,
      sha: ` ${hash(data)} `,
    }]);
    const week = path.join(root, "video/storytime-song/public/l2/w02");
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /sha256|hash|mismatch|integrity|digest/i);
    assert.ok(!fs.existsSync(week), "invalid digest must not leave a partial week folder");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4d a successful refresh removes files from the previous manifest", async () => {
  const root = tempDir("song-adversarial-stale-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    const forge = path.join(root, "video/storytime-song/public/l2/w02/forge");
    fs.mkdirSync(forge, { recursive: true });
    fs.writeFileSync(path.join(forge, "stale.png"), "old manifest");
    withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art));
    assert.ok(!fs.existsSync(path.join(forge, "stale.png")), "stale Forge files must not survive a manifest refresh");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-5 no cut-out reaches gestures or idle, and Lily never enters cast", () => {
  const root = tempDir("song-adversarial-inset-");
  try {
    const data = Buffer.from("pat");
    const rows = ["pat", "lily"].map((name) => ({
      file: `cutouts/${name}/listen.png`,
      who: name,
      bytes: data,
      sha: hash(data),
    }));
    handoffFixture(root, rows);
    const art = manifestToForgeInput(root);
    assert.deepEqual(Object.keys(art.cast), ["pat"]);
    const allInset = [...Object.values(art.gestures).flat(), ...art.idle];
    assert.ok(allInset.length > 0);
    assert.ok(allInset.every((file) => !file.includes("cutouts/")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-6 every prepared week 1 output equals the phase-base fixture with and without handoff", async () => {
  const root = tempDir("song-adversarial-w01-");
  const sandbox = await isolatedPrepare(root);
  const fixture = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures/w01-prepare-spec-1ffd649b.json"), "utf8")).spec;
  try {
    const handoff = path.join(root, "present-handoff");
    handoffFixture(handoff, [{
      file: "cutouts/pat/listen.png",
      who: "pat",
      bytes: Buffer.from("pat"),
      sha: hash(Buffer.from("pat")),
    }]);
    for (const art of [path.join(root, "missing-handoff"), path.join(root, "file-not-directory"), handoff]) {
      if (art.endsWith("file-not-directory")) fs.writeFileSync(art, "not a directory");
      const result = withArtDir(art, () => sandbox.prepare("l2/w01"));
      assert.deepEqual(JSON.parse(fs.readFileSync(result, "utf8")), fixture);
    }
    const noArt = withArtDir(path.join(root, "file-not-directory"), () => sandbox.prepare("l2/w04"));
    const fallback = JSON.parse(fs.readFileSync(noArt, "utf8"));
    assert.equal(fallback.art, "placeholder");
    assert.ok(!fallback.forge);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-7 filtered week packages 1-7 contain no Thai in generated spec strings", () => {
  let stringsChecked = 0;
  for (let week = 1; week <= 7; week += 1) {
    const pkg = readFilteredWeek(`w${String(week).padStart(2, "0")}`);
    const spec = buildSpec(pkg, 1);
    const inspect = (value) => {
      if (typeof value === "string") {
        stringsChecked += 1;
        assert.ok(!THAI.test(value), `Thai text in week ${week} spec string`);
      } else if (Array.isArray(value)) value.forEach(inspect);
      else if (value && typeof value === "object") Object.values(value).forEach(inspect);
    };
    inspect(spec);
  }
  assert.ok(stringsChecked > 0);
});
