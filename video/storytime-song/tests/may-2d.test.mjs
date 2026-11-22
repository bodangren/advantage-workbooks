import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import zlib from "node:zlib";
import { prepare, resolveActorArt } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const MAY_DIR = path.join(os.homedir(), "Desktop/handoff/storytime-song-may");
const BOOK_PAGE = "/home/daniebo/Desktop/advantage-forge/out/storytime-review/judge/cal/w01/l2-w01-story-page-hello-i-am-may-v1.png";

const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

function crc32(bytes) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "latin1"), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function makeRgbaPng(w, h, px) {
  const stride = 1 + w * 4;
  const raw = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < w; x += 1) {
      const [r, g, b, a] = px(x, y);
      raw.set([r, g, b, a], y * stride + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function readPngHead(file) {
  const bytes = fs.readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${file} must hold a PNG signature`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
  };
}

function decodeAlpha(bytes) {
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  let plte = null;
  let trns = null;
  while (pos < bytes.length) {
    const length = bytes.readUInt32BE(pos);
    const type = bytes.subarray(pos + 4, pos + 8).toString("latin1");
    const data = bytes.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "PLTE") {
      plte = data;
    } else if (type === "tRNS") {
      trns = data;
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + length;
  }
  const sampleBytes = bitDepth > 8 ? 2 : 1;
  const channels = colorType === 6 ? 4 : colorType === 4 ? 2 : colorType === 2 ? 3 : colorType === 0 ? 1 : 1;
  const bpp = channels * sampleBytes;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let previous = Buffer.alloc(stride);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const current = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const a = i >= bpp ? current[i - bpp] : 0;
      const b = previous[i];
      const c = i >= bpp ? previous[i - bpp] : 0;
      const value = line[i];
      current[i] = (value + (filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c))) & 0xff;
    }
    current.copy(out, y * stride);
    previous = current;
  }
  const alphaAt = (x, y) => {
    const base = y * stride + x * bpp;
    if (colorType === 6) {
      const a = out.subarray(base + 3 * sampleBytes, base + 4 * sampleBytes);
      return a.every((byte) => byte === 0) ? 0 : 255;
    }
    if (colorType === 4) {
      const a = out.subarray(base + sampleBytes, base + 2 * sampleBytes);
      return a.every((byte) => byte === 0) ? 0 : 255;
    }
    if (colorType === 3) {
      const index = out[base];
      if (!trns) return 255;
      return index < trns.length ? trns[index] : 255;
    }
    return 255;
  };
  return { width, height, bitDepth, colorType, hasAlpha: colorType === 6 || colorType === 4 || (colorType === 3 && !!trns), alphaAt };
}

function checkCleanCut(bytes) {
  let image;
  try {
    image = decodeAlpha(bytes);
  } catch (error) {
    return { ok: false, reason: `unreadable PNG: ${error.message}` };
  }
  if (!image.hasAlpha) return { ok: false, reason: "the cut must carry an alpha channel" };
  const bad = [];
  for (let x = 0; x < image.width; x += 1) {
    for (const y of [0, image.height - 1]) {
      if (image.alphaAt(x, y) !== 0) bad.push(`${x},${y}`);
    }
  }
  for (let y = 0; y < image.height; y += 1) {
    for (const x of [0, image.width - 1]) {
      if (image.alphaAt(x, y) !== 0) bad.push(`${x},${y}`);
    }
  }
  if (bad.length) return { ok: false, reason: `opaque border pixels (room background left): ${bad.slice(0, 4).join(" ")}` };
  return { ok: true };
}

test("P2-F4 w07 draws no 3D sprout art in either cut", () => {
  const spec = JSON.parse(fs.readFileSync(prepare("l2/w07"), "utf8"));
  assert.ok(spec.lines.length > 0, "w07 must hold lines");
  const castValues = Object.values(spec.forge?.cast ?? {}).map(String);
  console.log(`W07 cast entry count: ${castValues.length}`);
  for (const entry of castValues) {
    assert.ok(!entry.toLowerCase().includes("cutouts/may/"), `w07 must not reference the scrapped 3D May frames: ${entry}`);
  }
  const diskFiles = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(d, e.name);
    if (e.isDirectory()) return walk(full);
    diskFiles.push(path.relative(path.join(HERE, "..", "public", "l2/w07"), full));
    return [full];
  });
  const weekDir = path.join(HERE, "..", "public", "l2/w07");
  if (fs.existsSync(weekDir)) walk(weekDir);
  console.log(`W07 week file count: ${diskFiles.length}`);
  for (const file of diskFiles) {
    assert.ok(!file.toLowerCase().includes("cutouts/may"), `w07 must not copy the scrapped 3D May frames: ${file}`);
  }
  for (const cut of ["classroom", "portrait"]) {
    for (const line of spec.lines) {
      for (const name of line.actors) {
        const file = spec.forge?.cast?.[name] ?? spec.forge?.cast?.[String(name).toLowerCase()];
        if (file) {
          assert.ok(!String(file).toLowerCase().includes("cutouts/"), `w07 ${cut} ${name} must not draw a handoff cut-out: ${file}`);
        }
      }
    }
  }
});

test("P2-F5 w07 May comes from verified 2D book art or the placeholder", () => {
  const clean = makeRgbaPng(4, 3, (x, y) => (x === 0 || y === 0 || x === 3 || y === 2 ? [0, 0, 0, 0] : [200, 50, 50, 255]));
  assert.deepEqual(checkCleanCut(clean), { ok: true }, "the checker must pass a clean cut");
  const dirty = makeRgbaPng(4, 3, (x, y) => (x === 0 && y === 0 ? [10, 10, 10, 255] : (x === 0 || y === 0 || x === 3 || y === 2 ? [0, 0, 0, 0] : [200, 50, 50, 255])));
  assert.equal(checkCleanCut(dirty).ok, false, "the checker must fail a cut with an opaque border pixel");
  const head = readPngHead(BOOK_PAGE);
  console.log(`May book page size: ${head.width}x${head.height}`);
  assert.equal(head.width, 900, "the approved May book page must stay 900 px wide");
  assert.equal(head.height, 675, "the approved May book page must stay 675 px high");
  const spec = JSON.parse(fs.readFileSync(prepare("l2/w07"), "utf8"));
  const mayFiles = Object.values(spec.forge?.cast ?? {}).map(String).filter((file) => file.toLowerCase().includes("/may"));
  console.log(`W07 May file count: ${mayFiles.length}`);
  assert.ok(!mayFiles.some((file) => file.toLowerCase().includes("cutouts/may/")), "w07 May must not use the scrapped 3D frames");
  const manifestFile = path.join(MAY_DIR, "MANIFEST.tsv");
  if (fs.existsSync(MAY_DIR) && fs.existsSync(manifestFile)) {
    const lines = fs.readFileSync(manifestFile, "utf8").trim().split("\n");
    assert.deepEqual(lines[0].split("\t"), ["file", "source_path", "sha256"], "the May manifest must hold file, source_path, sha256");
    assert.ok(mayFiles.length > 0, "a 2D May branch must copy a May file for w07");
    for (const used of mayFiles) {
      const diskFile = path.join(HERE, "..", "public", used);
      assert.ok(fs.existsSync(diskFile), `the used 2D May file must exist on disk: ${used}`);
      const bytes = fs.readFileSync(diskFile);
      const actual = sha(bytes);
      const row = lines.slice(1).map((ln) => ln.split("\t")).find((cells) => actual === (cells[2] ?? "").toLowerCase());
      assert.ok(row, `the used 2D May file must match a manifest sha256: ${used}`);
      assert.ok((row[1] ?? "").endsWith("l2-w01-story-page-hello-i-am-may-v1.png"), "the 2D May source must be the approved book page");
      assert.deepEqual(checkCleanCut(bytes), { ok: true }, `the used 2D May file must be a clean cut: ${used}`);
    }
    return;
  }
  console.log("May 2D folder: missing");
  assert.equal(resolveActorArt("May", spec.forge).kind, "placeholder", "without verified 2D May art, w07 May must resolve to the placeholder");
});
