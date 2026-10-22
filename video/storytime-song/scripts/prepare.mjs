// Turns one Storytime week package into the line spec of the song video (public/<level>/<week>/spec.json)
// and copies the song audio next to it. Usage: node scripts/prepare.mjs l2/w01
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT = path.resolve(HERE, "..");
export const CONTENT = path.resolve(PROJECT, "../../content/storytime");

/** The setting of a week when a song picture names no place (the place of the week's read-along). */
const WEEK_SCENE = {
  "st2/1": "classroom",
  "st2/2": "park",
  "st2/3": "classroom",
  "st2/4": "living-room",
  "st2/5": "classroom",
  "st2/6": "meadow",
  "st2/7": "playroom",
};

/** A place named in a picture prompt, in the order of the test (the first match wins). */
const PLACES = [
  [/\bblue sky\b|\bin the sky\b|\bhigh in\b/i, "sky"],
  [/\bliving room\b/i, "living-room"],
  [/\bplayroom\b/i, "playroom"],
  [/\bmeadow\b|\bpond\b|\blily pad\b/i, "meadow"],
  [/\bpark\b/i, "park"],
  [/\bclassroom\b|\brug\b/i, "classroom"],
];

/** The five classmates draw "a class of children" until Forge has a class render. */
const CLASS = ["Pat", "May", "Sam", "Mia", "Ben"];

/** Animal sounds: a sung sound word gets a speech bubble on the animal of the picture. */
const SOUNDS = new Set([
  "meow",
  "woof",
  "tweet",
  "quack",
  "moo",
  "baa",
  "oink",
  "ribbit",
  "croak",
  "neigh",
  "hiss",
  "buzz",
]);

const clean = (w) => w.replace(/[()]/g, "");
const bare = (w) => w.toLowerCase().replace(/[^a-z']/g, "");

/**
 * Splits a sung line into its parts: the line, then each repeat in parentheses.
 * @param {{sentence: string, words: {word: string, start: number, end: number}[]}} time The line and word times.
 * @returns {{start: number, end: number, words: {text: string, start: number, end: number}[]}[]} The parts.
 */
export function segments(time) {
  const tokens = time.sentence.split(" ");
  if (tokens.length !== time.words.length)
    throw new Error(`token and word counts differ: "${time.sentence}"`);
  const parts = [];
  tokens.forEach((tok, i) => {
    if (i === 0 || tok.startsWith("(")) parts.push([]);
    parts[parts.length - 1].push({
      text: clean(tok),
      start: time.words[i].start,
      end: time.words[i].end,
    });
  });
  return parts.map((words) => ({
    start: words[0].start,
    end: words[words.length - 1].end,
    words,
  }));
}

/**
 * The scene of a picture: the place that the prompt names, else the setting of the week.
 * @param {string} prompt The picture prompt.
 * @param {string} key The week key ("st2/1").
 * @returns {string} The scene id.
 */
export function sceneOf(prompt, key) {
  for (const [re, scene] of PLACES) if (re.test(prompt)) return scene;
  return WEEK_SCENE[key] ?? "classroom";
}

/**
 * Builds the line spec of a week.
 * @param {any} week The week package.
 * @param {number} duration The length of the song audio in seconds.
 * @returns {any} The spec that the composition reads.
 */
export function buildSpec(week, duration) {
  const song = week.song;
  if (!song.audio || song.times.length !== song.lines.length)
    throw new Error(
      `${week.meta.key}: the song has no audio or no times for every line`,
    );
  const lines = song.lines.map((line, i) => {
    const time = song.times[i];
    if (time.sentence !== line.text)
      throw new Error(
        `${week.meta.key} line ${i + 1}: the time sentence is not the line text`,
      );
    const picture = line.imageOf ?? i;
    const image = song.lines[picture].image ?? { prompt: "", characters: [] };
    const actors = image.characters.length
      ? image.characters
      : /\bclass of children\b/i.test(image.prompt)
        ? CLASS
        : [];
    const bubbles = [];
    for (const part of segments(time)) {
      const sound = part.words.filter((w) => SOUNDS.has(bare(w.text)));
      if (sound.length)
        bubbles.push({
          text: sound.map((w) => w.text).join(" "),
          start: sound[0].start,
          end: part.end,
        });
    }
    return {
      text: line.text,
      gesture: line.gesture,
      start: time.startTime,
      end: time.endTime,
      picture,
      scene: sceneOf(image.prompt, week.meta.key),
      actors,
      bubbles,
      segments: segments(time),
    };
  });
  const theme = week.focus?.family?.name?.en ?? "";
  return {
    key: week.meta.key,
    level: week.meta.level,
    week: week.meta.week,
    theme,
    title: song.title,
    bpm: song.bpm ?? 100,
    duration,
    audio: "",
    art: "placeholder",
    lines,
  };
}

/**
 * Writes public/<rel>/spec.json and public/<rel>/song.mp3 for a week.
 * @param {string} rel The week, as "l2/w01".
 * @returns {string} The spec file.
 */
export function prepare(rel) {
  const week = JSON.parse(
    fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"),
  );
  const audio = path.join(CONTENT, week.song.audio);
  const duration = Number(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      audio,
    ])
      .toString()
      .trim(),
  );
  const spec = buildSpec(week, duration);
  const out = path.join(PROJECT, "public", rel);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(audio, path.join(out, "song.mp3"));
  spec.audio = `${rel}/song.mp3`;
  const file = path.join(out, "spec.json");
  fs.writeFileSync(file, JSON.stringify(spec, null, 1) + "\n");
  return file;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rel = process.argv[2];
  if (!/^l\d\/w\d\d$/.test(rel ?? "")) {
    console.error("Usage: node scripts/prepare.mjs l2/w01");
    process.exit(2);
  }
  console.log("spec", prepare(rel));
}
