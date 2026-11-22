import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT } from "../scripts/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../..");
const RUNS = path.join(REPO, "measure/runs/storytime_song_video_20261022");
const THAI = /[\u0E00-\u0E7F]/;
const HEX64 = "[0-9a-f]{64}";

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

function readEvidence() {
  const file = path.join(RUNS, "green-p1-w01-compare.txt");
  assert.ok(fs.existsSync(file), "missing green-p1-w01-compare.txt");
  const text = fs.readFileSync(file, "utf8");
  assert.ok(!THAI.test(text), "evidence holds Thai");
  return text;
}

test("T1.8 week 1 keeps approved media and matches source under one toolchain", () => {
  assert.ok(!RUNS.includes("video/measure"), "RUNS must resolve to repo measure/runs, not video/measure");
  assert.ok(RUNS.endsWith(path.join("measure", "runs", "storytime_song_video_20261022")), "RUNS has the wrong folder");
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
  const text = readEvidence();
  for (const r of rows) {
    const esc = r.file.replace(/[./]/g, (c) => `\\${c}`);
    const re = new RegExp(`^${esc} frame ${r.frame} approved sha256: ([0-9a-f]+)$`, "m");
    const m = text.match(re);
    assert.ok(m, `missing approved line for ${r.file} frame ${r.frame}`);
    assert.equal(m[1].length, 64, `approved hash must hold 64 hex chars for ${r.file} frame ${r.frame}`);
    assert.equal(m[1], r.sha, `approved hash moved for ${r.file} frame ${r.frame}`);
  }
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
  let pairCount = 0;
  // The P2-F3 framing fix changes every inset card, so the same-toolchain comparison masks the card.
  // Card rectangles: classroom 1602 708 270 324 (GestureInset INSET in the 1920x1080 frame);
  // phone 120 1032 840 856 (layout.ts PORTRAIT_BOXES.gesture in the 1080x1920 composition frame).
  const CARD = {
    classroom: { x: 1602, y: 708, w: 270, h: 324, frameW: 1920, frameH: 1080 },
    phone: { x: 120, y: 1032, w: 840, h: 856, frameW: 1080, frameH: 1920 },
  };
  for (const cut of ["classroom", "phone"]) {
    const maskRe = new RegExp(`^inset mask: ${cut} (\\d+) (\\d+) (\\d+) (\\d+)$`, "m");
    const mask = text.match(maskRe);
    assert.ok(mask, `missing labeled inset mask line for ${cut}`);
    const [mx, my, mw, mh] = mask.slice(1).map(Number);
    console.log(`Inset mask ${cut}: ${mx} ${my} ${mw} ${mh}`);
    const card = CARD[cut];
    assert.ok(mx >= 0 && my >= 0 && mx + mw <= card.frameW && my + mh <= card.frameH, `inset mask ${cut} must sit inside the frame`);
    assert.ok(Math.abs(mx - card.x) <= 8 && Math.abs(my - card.y) <= 8, `inset mask ${cut} must hug the inset card`);
    assert.ok(Math.abs(mw - card.w) <= 16 && Math.abs(mh - card.h) <= 16, `inset mask ${cut} must be no larger than the card plus 8 px a side`);
  }
  for (const r of rows) {
    const esc = r.file.replace(/[./]/g, (c) => `\\${c}`);
    const baseRe = new RegExp(`^same-toolchain masked base sha256: ${esc} frame ${r.frame}: ([0-9a-f]+)$`, "m");
    const newRe = new RegExp(`^same-toolchain masked new sha256: ${esc} frame ${r.frame}: ([0-9a-f]+)$`, "m");
    const base = text.match(baseRe);
    const next = text.match(newRe);
    assert.ok(base, `missing same-toolchain masked base line for ${r.file} frame ${r.frame}`);
    assert.ok(next, `missing same-toolchain masked new line for ${r.file} frame ${r.frame}`);
    assert.equal(base[1].length, 64, `same-toolchain masked base hash must hold 64 hex chars`);
    assert.equal(next[1].length, 64, `same-toolchain masked new hash must hold 64 hex chars`);
    assert.equal(base[1], next[1], `same-toolchain masked mismatch for ${r.file} frame ${r.frame}`);
    pairCount += 1;
  }
  console.log(`Same-toolchain masked pair count: ${pairCount}`);
  assert.equal(pairCount, 4);
  const driftCount = text.match(/^toolchain drift approved vs current match count: (\d+) of (\d+)$/m);
  assert.ok(driftCount, "missing labeled toolchain drift match count line");
  assert.ok(Number(driftCount[1]) >= 0 && Number(driftCount[2]) === 4, "drift match count must cover 4 frames");
  const psnr = text.match(/^toolchain drift PSNR dB: (\d+(?:\.\d+)?)$/m);
  assert.ok(psnr, "missing labeled toolchain drift PSNR dB line");
  assert.ok(Number(psnr[1]) > 0, "PSNR must parse as a number above 0");
  const result = text.match(/^Result: (PASS|MISMATCH|FAIL)(.*)$/m);
  assert.ok(result, "missing labeled Result line");
  assert.equal(result[1], "PASS", "evidence Result must be PASS");
});

test("T1.9 the week 1 evidence records exits and unchanged media", () => {
  const text = readEvidence();
  const room = text.match(/^render exit classroom: (\d+)$/m);
  const phone = text.match(/^render exit phone: (\d+)$/m);
  assert.ok(room, "missing labeled render exit classroom line");
  assert.ok(phone, "missing labeled render exit phone line");
  console.log(`Render exit classroom: ${room[1]}`);
  console.log(`Render exit phone: ${phone[1]}`);
  assert.equal(Number(room[1]), 0);
  assert.equal(Number(phone[1]), 0);
  const status = execFileSync("git", ["status", "--porcelain", "--", "content/storytime/l2/media/w01/song.mp4", "content/storytime/l2/media/w01/song-phone.mp4"], { cwd: REPO, encoding: "utf8" });
  assert.equal(status.trim(), "", "approved w01 media files changed in git");
});
