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

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(root, e.name);
    if (e.isDirectory()) return listFiles(full);
    return fs.lstatSync(full).isFile() ? [path.relative(root, full)] : [];
  });
}

function spyFsReads(log) {
  const realRead = fs.readFileSync;
  const realStream = fs.createReadStream;
  fs.readFileSync = (...args) => {
    log.push(String(args[0]));
    return realRead(...args);
  };
  fs.createReadStream = (...args) => {
    log.push(String(args[0]));
    return realStream(...args);
  };
  return () => {
    fs.readFileSync = realRead;
    fs.createReadStream = realStream;
  };
}

test("P2-B1 prepare verifies every manifest sha256 before any copy into public or any write", async () => {
  const root = tempDir("song-p2-b1-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  const publicRoot = path.join(root, "video/storytime-song/public");
  try {
    const good = (file, who, bytes) => ({ file, who, bytes, sha: hash(bytes) });
    const base = [
      good("cutouts/pat/listen.png", "pat", Buffer.from("pat front")),
      good("cutouts/sam/listen.png", "sam", Buffer.from("sam front")),
      good("cutouts/mia/listen.png", "mia", Buffer.from("mia front")),
      good("cutouts/may/listen.png", "may", Buffer.from("may front")),
    ];
    const rug = Buffer.from("rug picture bytes");
    handoffFixture(art, [...base, { file: "scenes/w04/rug.png", who: "w04", bytes: Buffer.from("tampered rug bytes"), sha: hash(rug) }]);
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /manifest|sha256|digest|integrity|preflight|verif/i,
      "a corrupted unused row must fail the all-row preflight before any copy");
    assert.deepEqual(listFiles(publicRoot), [], "a failed preflight must write no file under the public root");
    const goodMeta = Buffer.from(JSON.stringify({ ppm: 450, canvas: [1024, 600], footPoint: { col: 512, row: 580 } }));
    const badMeta = Buffer.from(JSON.stringify({ ppm: 451, canvas: [1024, 600], footPoint: { col: 512, row: 580 } }));
    handoffFixture(art, [...base,
      { file: "scenes/w04/manifest.json", who: "w04", bytes: badMeta, sha: hash(goodMeta) },
      { file: "scenes/w04/rug.png", who: "w04", bytes: rug, sha: hash(rug) }]);
    assert.throws(() => withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art)),
      /manifest|sha256|digest|integrity|preflight|verif/i,
      "unverified scene metadata must fail the preflight before use");
    assert.deepEqual(listFiles(publicRoot), [], "unverified scene metadata must write no file under the public root");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("P2-B2 the classroom copies only through a verified manifest row from a regular file inside the handoff root", async () => {
  const root = tempDir("song-p2-b2-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  const publicRoot = path.join(root, "video/storytime-song/public");
  const realCopy = fs.copyFileSync;
  try {
    const room = Buffer.from("forge classroom picture");
    const outside = Buffer.from("outside bytes that must never enter the project");
    fs.writeFileSync(path.join(root, "external.png"), outside);
    const manifest = { ppm: 450, canvas: [1024, 600], footPoint: { col: 512, row: 580 } };
    const manifestBytes = Buffer.from(JSON.stringify(manifest));
    for (const variant of ["symlink", "unlisted"]) {
      handoffFixture(art, [
        { file: "scenes/w04/manifest.json", who: "w04", bytes: manifestBytes, sha: hash(manifestBytes) },
      ]);
      // The classroom file stays off the manifest in both variants: the row validator never inspects it.
      fs.mkdirSync(path.join(art, "scenes/w04"), { recursive: true });
      fs.writeFileSync(path.join(art, "scenes/w04/classroom.png"), room);
      if (variant === "symlink") {
        fs.unlinkSync(path.join(art, "scenes/w04/classroom.png"));
        fs.symlinkSync(path.join(root, "external.png"), path.join(art, "scenes/w04/classroom.png"));
      }
      const copies = [];
      fs.copyFileSync = (src, dst, ...rest) => {
        copies.push({ src: String(src), dst: String(dst) });
        return realCopy(src, dst, ...rest);
      };
      let threw = false;
      let message = "";
      try {
        withArtDir(art, () => sandbox.prepareWithManifest("l2/w04", art));
      } catch (error) {
        threw = true;
        message = String((error && error.message) || error);
      } finally {
        fs.copyFileSync = realCopy;
      }
      assert.ok(threw, `a ${variant} classroom source must fail before bytes land in public`);
      assert.match(message, /manifest|symlink|row|sha256|digest|regular|outside|verified|refus/i,
        `a ${variant} classroom source must fail with a manifest-integrity error, not ${message}`);
      const rootAbs = path.resolve(art);
      const manifestFiles = new Set(["scenes/w04/manifest.json"]);
      for (const copy of copies) {
        const srcAbs = path.resolve(copy.src);
        const inside = srcAbs === rootAbs || srcAbs.startsWith(rootAbs + path.sep);
        if (!inside) continue;
        const rel = path.relative(rootAbs, srcAbs);
        assert.ok(manifestFiles.has(rel), `no handoff-sourced copy may run for an unlisted file: ${rel} (${variant})`);
        let stat = null;
        try {
          stat = fs.lstatSync(srcAbs);
        } catch {
          stat = null;
        }
        assert.ok(stat && stat.isFile() && !stat.isSymbolicLink(), `the classroom copy source must be a regular file inside the handoff root (${variant})`);
      }
    }
    assert.deepEqual(listFiles(publicRoot), [], "a refused classroom copy must leave no file under the public root");
  } finally {
    fs.copyFileSync = realCopy;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("P2-B5 the preflight rejects non-asset manifest rows before reading their bytes", async () => {
  const root = tempDir("song-p2-b5-");
  const art = path.join(root, "handoff");
  const sandbox = await isolatedPrepare(root);
  const publicRoot = path.join(root, "video/storytime-song/public");
  const realHandoff = path.join(os.homedir(), "Desktop/handoff/storytime-song-art");
  try {
  const realRows = fs.readFileSync(path.join(realHandoff, "MANIFEST.tsv"), "utf8")
    .trim().split("\n").slice(1).map((ln) => ln.split("\t")[0]);
  assert.ok(!THAI.test(realRows.join("\n")), "real manifest holds Thai");
  const APPROVED_ASSET_EXT = new Set(realRows.map((file) => path.extname(file).toLowerCase()));
  console.log(`Approved asset extension count: ${APPROVED_ASSET_EXT.size}`);
  console.log(`Approved asset extensions: ${[...APPROVED_ASSET_EXT].sort().join(",")}`);
  assert.ok(APPROVED_ASSET_EXT.size > 0, "the real manifest must declare asset extensions");
  const badReal = realRows.filter((file) => file.split("/").some((part) => part.startsWith(".")) || !APPROVED_ASSET_EXT.has(path.extname(file).toLowerCase()));
  assert.deepEqual(badReal, [], "every real manifest row must name an approved asset with no dot segment");
  const good = (file, who, bytes) => ({ file, who, bytes, sha: hash(bytes) });
  const base = (extra) => [
    good("cutouts/pat/listen.png", "pat", Buffer.from("pat front")),
    good("cutouts/sam/listen.png", "sam", Buffer.from("sam front")),
    good("cutouts/mia/listen.png", "mia", Buffer.from("mia front")),
    good("cutouts/may/listen.png", "may", Buffer.from("may front")),
    extra,
  ];
  for (const [variant, forbidden] of [
    ["dotfile", good("cutouts/pat/.hidden.png", "pat", Buffer.from("nested dotfile bytes"))],
    ["extension", good("payload.bin", "w04", Buffer.from("non-asset bytes"))],
  ]) {
    handoffFixture(art, base(forbidden));
    const reads = [];
    const unspy = spyFsReads(reads);
    try {
      let threw = false;
      let message = "";
      try {
        withArtDir(art, () => sandbox.prepareWithManifest("l2/w02", art));
      } catch (error) {
        threw = true;
        message = String((error && error.message) || error);
      }
      const artAbs = path.resolve(art);
      const forbiddenAbs = path.join(artAbs, forbidden.file);
      const byteReads = reads.filter((file) => {
        try {
          return path.resolve(file) === forbiddenAbs;
        } catch {
          return false;
        }
      });
      assert.ok(threw, `a ${variant} manifest row must fail before any copy`);
      assert.match(message, /manifest|dotfile|asset|extension|forbidden|row|refus|non-asset/i,
        `a ${variant} manifest row must fail with a manifest-integrity error, not ${message}`);
      assert.deepEqual(byteReads, [], `the preflight must not read the bytes of a ${variant} row`);
    } finally {
      unspy();
    }
  }
  assert.deepEqual(listFiles(publicRoot), [], "a refused non-asset row must leave no file under the public root");
  } finally {
    if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
  }
});
