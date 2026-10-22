import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildSpec, CONTENT, sceneOf, segments } from "../scripts/prepare.mjs";

const w = (word, start, end) => ({ word, start, end });

test("a sung repeat in parentheses is its own segment, with no parentheses", () => {
  const parts = segments({
    sentence: "Hello, I am Pip (Hello, I am Pip!)",
    words: [
      w("Hello,", 1, 2),
      w("I", 2, 3),
      w("am", 3, 4),
      w("Pip", 4, 5),
      w("Hello,", 6, 7),
      w("I", 7, 8),
      w("am", 8, 9),
      w("Pip!", 9, 10),
    ],
  });
  assert.equal(parts.length, 2);
  assert.deepEqual(
    parts[1].words.map((x) => x.text),
    ["Hello,", "I", "am", "Pip!"],
  );
  assert.deepEqual([parts[1].start, parts[1].end], [6, 10]);
});

test("a line whose word count differs from its tokens is refused", () => {
  assert.throws(() =>
    segments({ sentence: "One two three", words: [w("One", 0, 1)] }),
  );
});

test("the scene is the named place, else the setting of the week", () => {
  assert.equal(sceneOf("Two kites high in a blue sky.", "st2/2"), "sky");
  assert.equal(
    sceneOf("A white duck walks on the grass by a pond.", "st2/6"),
    "meadow",
  );
  assert.equal(sceneOf("Pip claps his paws.", "st2/1"), "classroom");
  assert.equal(sceneOf("A dog runs on green grass.", "st2/6"), "meadow");
});

test("week 1: every line has its picture, actors, and the times of the package", () => {
  const week = JSON.parse(
    fs.readFileSync(path.join(CONTENT, "l2/w01.json"), "utf8"),
  );
  const spec = buildSpec(week, 78.4);
  assert.equal(spec.lines.length, week.song.lines.length);
  assert.equal(spec.lines[7].picture, 6);
  assert.deepEqual(spec.lines[7].actors, spec.lines[6].actors);
  assert.deepEqual(spec.lines[2].actors, ["Pat", "May", "Sam", "Mia", "Ben"]);
  assert.equal(spec.lines[0].start, week.song.times[0].startTime);
});
