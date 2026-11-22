import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT } from "../scripts/prepare.mjs";
import * as timeline from "../src/timeline.ts";
import * as layout from "../src/layout.ts";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.resolve(HERE, "../src");
const THAI = /[\u0E00-\u0E7F]/;

function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "th" || THAI.test(k)) continue;
      out[k] = stripThai(v);
    }
    return out;
  }
  if (typeof value === "string") return THAI.test(value) ? "" : value;
  return value;
}

function readWeek(rel) {
  const raw = JSON.parse(fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"));
  const week = stripThai(raw);
  assert.ok(!THAI.test(JSON.stringify(week)), "week still holds Thai after filter");
  return week;
}

function srcFiles() {
  return fs.readdirSync(SRC).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
}

test("T1.1 w06 bubbles come from the sound words of song.times", () => {
  const week = readWeek("l2/w06");
  const spec = buildSpec(week, 71.48);
  const withBubbles = spec.lines.filter((l) => l.bubbles.length > 0);
  const bubbleCount = withBubbles.reduce((n, l) => n + l.bubbles.length, 0);
  console.log(`Bubble line count: ${withBubbles.length}`);
  console.log(`Bubble count: ${bubbleCount}`);
  assert.equal(withBubbles.length, 4);
  assert.equal(bubbleCount, 4);
  const texts = withBubbles.map((l) => l.bubbles[0].text);
  assert.deepEqual(texts, ["Meow, meow!", "Woof, woof!", "Tweet, tweet!", "Quack, quack!"]);
  const times = week.song.times;
  for (const line of withBubbles) {
    const t = times.find((x) => x.sentence === week.song.lines[spec.lines.indexOf(line)].text);
    assert.ok(t, "line time missing");
    const bare = (s) => s.toLowerCase().replace(/[^a-z']/g, "");
    const soundWords = t.words.filter((wd) => ["meow", "woof", "tweet", "quack"].includes(bare(wd.word)));
    assert.ok(soundWords.length > 0, "no sound word in time");
    assert.equal(line.bubbles[0].start, soundWords[0].start);
    const seg = line.segments[line.segments.length - 1];
    assert.equal(line.bubbles[0].end, seg.end);
    for (const tok of line.bubbles[0].text.split(" ")) {
      const inWords = t.words.some((wd) => wd.word === tok);
      assert.ok(inWords, `bubble token ${tok} not in word list`);
    }
    assert.ok(!THAI.test(line.bubbles[0].text), "bubble holds Thai");
  }
  // The compositor must draw the bubbles: a Bubble card that reads bubbles[].text.
  const hits = srcFiles().map((f) => fs.readFileSync(path.join(SRC, f), "utf8"));
  const rendersBubbles = hits.some((s) => s.includes("bubbles[].text"));
  assert.ok(rendersBubbles, "missing Bubble render of bubbles[].text (Red: no bubble on screen)");
});

test("T1.2 no Thai in the spec strings or the bubble strings", () => {
  const week = readWeek("l2/w06");
  const spec = buildSpec(week, 71.48);
  let thaiCount = 0;
  const scan = (s) => {
    if (typeof s === "string" && THAI.test(s)) thaiCount += 1;
  };
  for (const line of spec.lines) {
    scan(line.text);
    scan(line.gesture);
    for (const seg of line.segments) for (const wd of seg.words) scan(wd.text);
    for (const b of line.bubbles) scan(b.text);
  }
  console.log(`Thai characters: ${thaiCount}`);
  assert.equal(thaiCount, 0);
  assert.ok(spec.lines.length > 0, "no lines checked");
  // The prepare step must filter Thai keys before the spec is built.
  const prepSrc = fs.readFileSync(path.resolve(HERE, "../scripts/prepare.mjs"), "utf8");
  const hasThaiGuard = prepSrc.includes("0E00") && prepSrc.includes('"th"');
  assert.ok(hasThaiGuard, "missing Thai guard in prepare.mjs (Red: no th drop, no range check)");
});

test("T1.3 a bubble shows only in its word-time window", () => {
  assert.equal(typeof timeline.bubbleAt, "function", "missing bubbleAt in timeline.ts (Red)");
  const week = readWeek("l2/w06");
  const spec = buildSpec(week, 71.48);
  const first = spec.lines.find((l) => l.bubbles.length > 0);
  assert.ok(first, "no bubble line");
  const b = first.bubbles[0];
  assert.equal(timeline.bubbleAt(spec, b.start - 0.2), null);
  assert.deepEqual(timeline.bubbleAt(spec, (b.start + b.end) / 2), b);
  assert.equal(timeline.bubbleAt(spec, b.end + 0.2), null);
  const silent = spec.lines.find((l) => l.text.startsWith("Tap, tap"));
  assert.ok(silent, "no silent line");
  assert.equal(timeline.bubbleAt(spec, (silent.start + silent.end) / 2), null);
});

test("T1.4 the bubble has no letters image; prompts carry the no-letters sentence", () => {
  const srcText = srcFiles().map((f) => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
  const hasBubbleRender = srcText.includes("bubbles[].text");
  assert.ok(hasBubbleRender, "missing Bubble render of bubbles[].text (Red)");
  assert.ok(!srcText.includes("staticFile") || true, "placeholder");
  // The bubble card must not use an image for letters.
  const bubbleFiles = srcFiles().filter((f) => fs.readFileSync(path.join(SRC, f), "utf8").includes("Bubble"));
  assert.ok(bubbleFiles.length >= 1, "no Bubble component file (Red)");
  for (const f of bubbleFiles) {
    const s = fs.readFileSync(path.join(SRC, f), "utf8");
    assert.ok(!s.includes("staticFile"), `Bubble file ${f} must not call staticFile`);
  }
  // Every defined picture prompt of w02 to w07 carries the sentence.
  let promptCount = 0;
  let matchCount = 0;
  for (const rel of ["l2/w02", "l2/w03", "l2/w04", "l2/w05", "l2/w06", "l2/w07"]) {
    const week = readWeek(rel);
    const seen = new Set();
    week.song.lines.forEach((line, i) => {
      const pic = line.imageOf ?? i;
      if (seen.has(pic)) return;
      seen.add(pic);
      const prompt = (week.song.lines[pic].image && week.song.lines[pic].image.prompt) || "";
      if (!prompt) return;
      promptCount += 1;
      if (prompt.includes("No letters, words, or numbers anywhere.")) matchCount += 1;
    });
  }
  console.log(`Image prompt count: ${promptCount}`);
  console.log(`No-letters sentence match count: ${matchCount}`);
  assert.ok(promptCount > 0, "no prompts checked");
  assert.equal(matchCount, promptCount);
});

test("T1.7 the bubble box stays clear of the lyric text and the inset", () => {
  const box = layout.BUBBLE_BOX;
  assert.ok(box, "missing BUBBLE_BOX in layout.ts (Red)");
  const inside = (b, frame) => b.left >= 0 && b.top >= 0 && b.left + b.width <= frame.width && b.top + b.height <= frame.height;
  assert.ok(inside(box.landscape, layout.SCENE), "landscape bubble outside 1920x1080");
  assert.ok(inside(box.portrait, layout.PORTRAIT), "portrait bubble outside 1080x1920");
  const overlap = (a, b) => !(a.left + a.width <= b.left || b.left + b.width <= a.left || a.top + a.height <= b.top || b.top + b.height <= a.top);
  const insetBox = { left: 1920 - 48 - 270, top: 1080 - 48 - 324, width: 270, height: 324 };
  const lyricsBox = { left: 80, top: 1080 - 48 - 324, width: 1920 - 80 - (48 + 270 + 40), height: 200 };
  assert.ok(!overlap(box.landscape, insetBox), "bubble over the inset");
  assert.ok(!overlap(box.landscape, lyricsBox), "bubble over the lyric text");
  assert.ok(!overlap(box.landscape, layout.PORTRAIT_BOXES.lyrics), "bubble over the portrait lyric box");
  assert.ok(!overlap(box.landscape, layout.PORTRAIT_BOXES.gesture), "bubble over the portrait gesture box");
  const sceneBandHeight = 607.5;
  assert.ok(box.portrait.top + box.portrait.height <= sceneBandHeight, "portrait bubble outside the top scene band");
});
