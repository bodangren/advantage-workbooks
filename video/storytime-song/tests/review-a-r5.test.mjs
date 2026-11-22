import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..");
const REPO = path.resolve(PROJECT, "../..");
const CONTENT = path.join(REPO, "content/storytime");
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
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(root, "scenes/w04"), { recursive: true });
  fs.writeFileSync(path.join(root, "scenes/w04/manifest.json"), JSON.stringify({
    ppm: 450,
    canvas: [1024, 600],
    footPoint: { col: 512, row: 580 },
  }));
  for (const row of rows) {
    if (row.write === false) continue;
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

test("ADV-P1-F9 an audio or spec write failure after the Forge swap preserves the previous week output", async () => {
  const root = tempDir("song-r5-f9-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  const week = path.join(root, "video/storytime-song/public/l2/w02");
  const copySync = fs.copyFileSync;
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    fs.mkdirSync(path.join(week, "forge"), { recursive: true });
    const previousForge = Buffer.from([9, 9, 9, 9]);
    const previousSpec = Buffer.from([1, 2, 3, 4]);
    const previousAudio = Buffer.from([5, 6, 7, 8]);
    fs.writeFileSync(path.join(week, "forge/previous-good.bin"), previousForge);
    fs.writeFileSync(path.join(week, "spec.json"), previousSpec);
    fs.writeFileSync(path.join(week, "song.mp3"), previousAudio);
    console.log("Previous week file count: 3");
    fs.copyFileSync = (src, dst, ...rest) => {
      if (String(dst).endsWith("song.mp3") && !String(dst).includes(".forge-stage-"))
        throw new Error("simulated audio write failure after the Forge swap");
      return copySync(src, dst, ...rest);
    };
    assert.throws(() => sandbox.prepareWithManifest("l2/w02", art),
      /simulated audio write failure/);
    assert.ok(fs.existsSync(path.join(week, "forge/previous-good.bin")),
      "a failed refresh must leave the previous Forge set byte-identical");
    assert.deepEqual(fs.readFileSync(path.join(week, "forge/previous-good.bin")), previousForge,
      "the previous Forge file must keep its bytes when a later write fails");
    assert.deepEqual(fs.readFileSync(path.join(week, "spec.json")), previousSpec,
      "the previous spec must keep its bytes when a later write fails");
    assert.deepEqual(fs.readFileSync(path.join(week, "song.mp3")), previousAudio,
      "the previous audio must keep its bytes when its own write fails");
  } finally {
    fs.copyFileSync = copySync;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-F8 prepare validates the week output path before its first write", async () => {
  const root = tempDir("song-r5-f8-");
  const sandbox = await isolatedPrepare(root);
  try {
    const outside = path.join(root, "outside-week");
    fs.mkdirSync(outside, { recursive: true });
    const weekParent = path.join(root, "video/storytime-song/public/l2");
    fs.mkdirSync(weekParent, { recursive: true });
    fs.symlinkSync(outside, path.join(weekParent, "w02"), "dir");
    let threw = false;
    try {
      withArtDir(path.join(root, "missing-handoff"), () => sandbox.prepare("l2/w02"));
    } catch {
      threw = true;
    }
    console.log("Outside week file count: 0");
    assert.ok(threw, "prepare must refuse a symlinked week output folder before writing");
    assert.ok(!fs.existsSync(path.join(outside, "song.mp3")),
      "song.mp3 must not pass through an output symlink");
    assert.ok(!fs.existsSync(path.join(outside, "spec.json")),
      "spec.json must not pass through an output symlink");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
