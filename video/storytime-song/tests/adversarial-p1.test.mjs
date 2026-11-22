import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
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
const execFileAsync = promisify(execFile);

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
      rejected(`unsafe path ${file}`, [{ ...good, file, write: false }]);
    }
    rejected("missing manifest file", [{ ...good, file: "cutouts/pat/missing.png", write: false }]);
    rejected("duplicate manifest row", [good, good]);
    rejected("cut-out character without a listen front", [{
      ...good,
      file: "cutouts/pat/wave.png",
      bytes: Buffer.from("wave"),
      sha: hash(Buffer.from("wave")),
    }]);
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
    const wrong = hash(data).replace(/^./, (c) => c === "0" ? "1" : "0").toUpperCase();
    handoffFixture(art, [{ ...row, sha: wrong }]);
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /sha256|hash|mismatch|integrity|digest/i,
      "an upper-case digest with the wrong value must still fail");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4b a wrong digest preserves the previous good week output", async () => {
  const root = tempDir("song-adversarial-copy-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    const wrong = hash(data).replace(/^./, (c) => c === "0" ? "1" : "0");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: wrong }]);
    const week = path.join(root, "video/storytime-song/public/l2/w02");
    fs.mkdirSync(path.join(week, "forge"), { recursive: true });
    fs.writeFileSync(path.join(week, "forge/previous-good.png"), Buffer.from([0, 1, 2, 255]));
    fs.writeFileSync(path.join(week, "spec.json"), Buffer.from([10, 0, 13, 255]));
    fs.writeFileSync(path.join(week, "song.mp3"), Buffer.from([255, 7, 0, 4]));
    const before = ["forge/previous-good.png", "spec.json", "song.mp3"]
      .map((file) => fs.readFileSync(path.join(week, file)));
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /sha256|hash|mismatch|integrity|digest/i);
    assert.ok(fs.existsSync(path.join(week, "forge/previous-good.png")),
      "failed refresh must preserve the previous good cast file");
    const after = ["forge/previous-good.png", "spec.json", "song.mp3"]
      .map((file) => fs.readFileSync(path.join(week, file)));
    assert.deepEqual(after, before, "the prior week output must remain byte-identical");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4c a digest with surrounding spaces is rejected before creating output", async () => {
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

test("ADV-P1-4e a failed first copy leaves no partial week output", async () => {
  const root = tempDir("song-adversarial-empty-copy-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    const wrong = hash(data).replace(/^./, (c) => c === "0" ? "1" : "0");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: wrong }]);
    const week = path.join(root, "video/storytime-song/public/l2/w02");
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /sha256|hash|mismatch|integrity|digest/i);
    assert.ok(!fs.existsSync(week), "failed initial copy must leave no partial week output");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4f failed refresh cleanup cannot remove a path outside the project", async () => {
  const root = tempDir("song-adversarial-boundary-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const payload = readFilteredWeek("w02");
    fs.writeFileSync(path.join(root, "payload.json"), JSON.stringify(payload));
    const data = Buffer.from("cutout bytes");
    const wrong = hash(data).replace(/^./, (c) => c === "0" ? "1" : "0");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: wrong }]);
    const outsideProject = path.join(root, "video/payload");
    fs.mkdirSync(outsideProject, { recursive: true });
    fs.writeFileSync(path.join(outsideProject, "keep.txt"), "must survive");
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("../../payload", art)),
      /sha256|hash|mismatch|integrity|digest/i);
    assert.equal(fs.readFileSync(path.join(outsideProject, "keep.txt"), "utf8"), "must survive");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4g symlinked week output cannot redirect Forge replacement outside the project", async () => {
  const root = tempDir("song-adversarial-week-link-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    const outsideWeek = path.join(root, "outside-week");
    const outsideForge = path.join(outsideWeek, "forge");
    fs.mkdirSync(outsideForge, { recursive: true });
    fs.writeFileSync(path.join(outsideForge, "keep.bin"), Buffer.from([1, 2, 3]));
    const weekParent = path.join(root, "video/storytime-song/public/l2");
    fs.mkdirSync(weekParent, { recursive: true });
    fs.symlinkSync(outsideWeek, path.join(weekParent, "w02"), "dir");
    try {
      withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art));
    } catch {
      // Rejecting the symlink is safe; following it to write output is not.
    }
    assert.deepEqual(fs.readFileSync(path.join(outsideForge, "keep.bin")), Buffer.from([1, 2, 3]));
    assert.ok(!fs.existsSync(path.join(outsideWeek, "spec.json")),
      "Forge preparation must not write the week spec through an output symlink");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4h handoff symlinks cannot import bytes from outside the handoff root", async () => {
  const root = tempDir("song-adversarial-handoff-link-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("external secret bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    const link = path.join(art, "cutouts/pat/listen.png");
    const external = path.join(root, "external.png");
    fs.writeFileSync(external, data);
    fs.unlinkSync(link);
    fs.symlinkSync(external, link);
    try {
      withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art));
    } catch {
      // Rejecting the symlink is safe; copying from outside the handoff root is not.
    }
    const copied = path.join(root,
      "video/storytime-song/public/l2/w02/forge/cutouts/pat/listen.png");
    assert.ok(!fs.existsSync(copied) || !fs.readFileSync(copied).equals(data),
      "Forge preparation must not import bytes from outside the handoff root");
    assert.ok(fs.existsSync(external), "the outside handoff target must remain untouched");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4i abandoned staging-name prefixes do not block the next refresh", async () => {
  const root = tempDir("song-adversarial-stale-stage-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    const publicLevel = path.join(root, "video/storytime-song/public/l2");
    const stale = path.join(publicLevel, ".forge-stage-w02-abcdef");
    fs.mkdirSync(stale, { recursive: true });
    fs.writeFileSync(path.join(stale, "interrupted.bin"), "crash before swap");
    assert.doesNotThrow(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)));
    assert.equal(fs.readFileSync(path.join(stale, "interrupted.bin"), "utf8"), "crash before swap");
    assert.ok(fs.existsSync(path.join(publicLevel, "w02/forge/cutouts/pat/listen.png")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4m a failed staging rename preserves the previous Forge set", async () => {
  const root = tempDir("song-adversarial-swap-failure-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  const week = path.join(root, "video/storytime-song/public/l2/w02");
  const previous = Buffer.from([0, 19, 200, 255]);
  const renameSync = fs.renameSync;
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    fs.mkdirSync(path.join(week, "forge"), { recursive: true });
    fs.writeFileSync(path.join(week, "forge/previous-good.bin"), previous);
    fs.renameSync = (source, destination) => {
      if (path.basename(source).startsWith(".forge-stage-w02-"))
        throw new Error("simulated crash before staged Forge swap");
      return renameSync(source, destination);
    };
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /simulated crash before staged Forge swap/);
  } finally {
    fs.renameSync = renameSync;
    try {
      assert.deepEqual(fs.readFileSync(path.join(week, "forge/previous-good.bin")), previous,
        "a failed swap must leave the prior Forge set intact");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

test("ADV-P1-4j week ids with Unicode or trailing newlines reject before filesystem changes", async () => {
  const root = tempDir("song-adversarial-week-id-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  try {
    const data = Buffer.from("cutout bytes");
    handoffFixture(art, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: data, sha: hash(data) }]);
    for (const rel of ["l２/w02", "l2/w02\n", "l2/w02\u2028"]) {
      assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest(rel, art)),
        /week|output|path|invalid/i);
    }
    assert.ok(!fs.existsSync(path.join(root, "video/storytime-song/public/l2")),
      "rejected week ids must not create a public output directory");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4k manifest paths with dot segments or backslashes cannot silently drop cast art", () => {
  const root = tempDir("song-adversarial-manifest-path-");
  try {
    const data = Buffer.from("pat");
    for (const file of ["./cutouts/pat/listen.png", "cutouts\\pat\\listen.png"]) {
      handoffFixture(root, [{
        file,
        who: "pat",
        bytes: data,
        sha: hash(data),
        write: file.includes("\\"),
      }]);
      if (file.includes("\\")) {
        fs.mkdirSync(path.join(root, "cutouts/pat"), { recursive: true });
        fs.writeFileSync(path.join(root, "cutouts/pat/listen.png"), data);
      }
      let adapted;
      try {
        adapted = manifestToForgeInput(root);
      } catch {
        // Rejecting noncanonical paths is safe; accepting them without the cast art is not.
        continue;
      }
      assert.equal(adapted.cast.pat, "forge/cutouts/pat/listen.png",
        `${JSON.stringify(file)} must normalize to the canonical Forge path`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("ADV-P1-4l concurrent refreshes of one week leave a complete Forge file", async () => {
  const root = tempDir("song-adversarial-concurrent-stage-");
  const sandbox = await isolatedPrepare(root);
  try {
    const artA = path.join(root, "handoff-a");
    const artB = path.join(root, "handoff-b");
    const dataA = Buffer.from("first concurrent cast");
    const dataB = Buffer.from("second concurrent cast");
    handoffFixture(artA, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: dataA, sha: hash(dataA) }]);
    handoffFixture(artB, [{ file: "cutouts/pat/listen.png", who: "pat", bytes: dataB, sha: hash(dataB) }]);
    const moduleUrl = pathToFileURL(path.join(root, "video/storytime-song/scripts/prepare.mjs")).href;
    const source = `import { prepareWithManifest } from ${JSON.stringify(moduleUrl)}; prepareWithManifest("l2/w02", process.env.TEST_ART_DIR);`;
    await Promise.all([artA, artB].map((dir) => execFileAsync(process.execPath, [
      "--input-type=module", "-e", source,
    ], { env: { ...process.env, TEST_ART_DIR: dir } })));
    const output = fs.readFileSync(path.join(root,
      "video/storytime-song/public/l2/w02/forge/cutouts/pat/listen.png"));
    assert.ok(output.equals(dataA) || output.equals(dataB),
      "the committed Forge file must match one complete, verified source");
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
