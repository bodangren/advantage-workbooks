import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const PROJECT = path.resolve(HERE, "../..");
const RUNS = path.join(PROJECT, "measure/runs/storytime_song_video_20261022");
const THAI = /[\u0E00-\u0E7F]/;

function readBaseline() {
  const file = path.join(RUNS, "red-p1-w01-frames.txt");
  const text = fs.readFileSync(file, "utf8");
  assert.ok(!THAI.test(text), "baseline holds Thai");
  const rows = text.trim().split("\n").map((ln) => {
    const m = ln.match(/^(.*) frame (\d+) sha256: ([0-9a-f]{64})$/);
    assert.ok(m, `bad baseline line: ${ln}`);
    return { file: m[1], frame: Number(m[2]), sha: m[3] };
  });
  return rows;
}

test("T1.8 the approved week 1 frames stay pixel-identical and week 1 has no bubble", () => {
  const rows = readBaseline();
  console.log(`Approved frame hash count: ${rows.length}`);
  assert.equal(rows.length, 4);
  assert.ok(rows.length > 0, "no approved frames");
  const names = rows.map((r) => `${r.file}#${r.frame}`).sort();
  assert.deepEqual(names, [
    "content/storytime/l2/media/w01/song-phone.mp4#1652",
    "content/storytime/l2/media/w01/song-phone.mp4#753",
    "content/storytime/l2/media/w01/song.mp4#1652",
    "content/storytime/l2/media/w01/song.mp4#753",
  ]);
  const raw = JSON.parse(fs.readFileSync(path.join(CONTENT, "l2/w01.json"), "utf8"));
  const keep = (v) => {
    if (Array.isArray(v)) return v.map(keep);
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        if (k === "th" || THAI.test(k)) continue;
        out[k] = keep(val);
      }
      return out;
    }
    if (typeof v === "string") return THAI.test(v) ? "" : v;
    return v;
  };
  const week = keep(raw);
  const spec = buildSpec(week, 85.37);
  const bubbles = spec.lines.flatMap((l) => l.bubbles);
  console.log(`Week 1 bubble count: ${bubbles.length}`);
  assert.equal(bubbles.length, 0);
  // After Green the re-render compare evidence must exist with 4 equal hashes.
  const greenProof = path.join(RUNS, "green-p1-w01-compare.txt");
  assert.ok(fs.existsSync(greenProof), "missing green-p1-w01-compare.txt (Red: week 1 not re-rendered yet)");
});

test("T1.9 the week 1 render evidence records exits and hashes", () => {
  const proof = path.join(RUNS, "green-p1-w01-compare.txt");
  assert.ok(fs.existsSync(proof), "missing green-p1-w01-compare.txt (Red: no render evidence yet)");
  const text = fs.readFileSync(proof, "utf8");
  assert.ok(text.includes("exit: 0"), "render exit must be 0");
});
