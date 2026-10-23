// Turns one Storytime week package into the line spec of the song video (public/<level>/<week>/spec.json)
// and copies the song audio next to it. Usage: node scripts/prepare.mjs l2/w01 [--forge <set>] [--scene <video>]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alphaBox, forgeSpec } from "./forge.mjs";

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
 * The actors, gestures, and scenes that the song of a spec shows.
 * @param {any} spec The line spec.
 * @returns {{actors: string[], gestures: string[], scenes: string[]}} Each one once, in order of use.
 */
export function usedArt(spec) {
  const once = (list) => [...new Set(list)];
  return {
    actors: once(spec.lines.flatMap((l) => l.actors)),
    gestures: once(spec.lines.map((l) => l.gesture).filter(Boolean)),
    scenes: once(spec.lines.map((l) => l.scene)),
  };
}

/** The largest difference in seconds between the Forge scene video and the song audio (one frame at 24 fps, and slack). */
export const SCENE_SLACK = 0.1;

/**
 * The stream facts of a media file, by ffprobe.
 * @param {string} file The file.
 * @returns {{duration: number, width?: number, height?: number, audio: boolean}} The length in seconds, the size of
 *   the first video stream, and whether the file has a sound stream.
 */
function probe(file) {
  const info = JSON.parse(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", file]).toString(),
  );
  const video = info.streams.find((s) => s.codec_type === "video");
  return {
    duration: Number(info.format.duration),
    width: video?.width,
    height: video?.height,
    audio: info.streams.some((s) => s.codec_type === "audio"),
  };
}

/**
 * The problems of a Forge scene video (S27 option C contract: 1920 x 1080, no sound, t = 0 at the song start, the
 * length of the song).
 * @param {{duration: number, width?: number, height?: number, audio: boolean}} info The stream facts of the video.
 * @param {number} duration The length of the song audio in seconds.
 * @returns {string[]} The problems (none for a good video).
 */
export function sceneVideoProblems(info, duration) {
  const problems = [];
  if (info.width !== 1920 || info.height !== 1080) problems.push(`the size is ${info.width}x${info.height}, not 1920x1080`);
  if (info.audio) problems.push("the video has a sound stream");
  if (!(Math.abs(info.duration - duration) <= SCENE_SLACK))
    problems.push(`the video is ${info.duration} s long; the song is ${duration} s`);
  return problems;
}

/**
 * Copies a Forge scene video into the Forge folder of the week as scene.mp4, and writes scene.json beside it (the
 * source, the SHA-256, and the stream facts). Forge never writes into this repo; scene.mp4 is not in git.
 * @param {string} rel The week, as "l2/w01".
 * @param {string} file The Forge video, as advantage-forge/out/.../song.mp4.
 * @returns {string} The copy.
 */
export function copySceneVideo(rel, file) {
  const dir = forgeDir(rel);
  fs.mkdirSync(dir, { recursive: true });
  const copy = path.join(dir, "scene.mp4");
  fs.copyFileSync(file, copy);
  const sha256 = createHash("sha256").update(fs.readFileSync(copy)).digest("hex");
  const record = { source: path.resolve(file), sha256, bytes: fs.statSync(copy).size, ...probe(copy) };
  fs.writeFileSync(path.join(dir, "scene.json"), JSON.stringify(record, null, 2) + "\n");
  return copy;
}

/**
 * Copies the Forge files that a week uses, and the manifest, from a Forge set into the media folder of the week
 * (content/storytime/l<level>/media/w<nn>/forge/). Forge never writes into this repo.
 * @param {string} rel The week, as "l2/w01".
 * @param {string} setDir The Forge set folder, as advantage-forge/out/chibi-sprouts/r1/week1.
 * @returns {string[]} The copied files.
 */
export function copyForge(rel, setDir) {
  const week = JSON.parse(fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(setDir, "manifest.json"), "utf8"));
  const { files } = forgeSpec(manifest, usedArt(buildSpec(week, 0)), (f) => alphaBox(path.join(setDir, f)), "");
  const dir = forgeDir(rel);
  for (const f of [...files, "manifest.json"]) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.copyFileSync(path.join(setDir, f), path.join(dir, f));
  }
  return files;
}

/** The Forge folder of a week: content/storytime/l2/media/w01/forge for "l2/w01". */
const forgeDir = (rel) => path.join(CONTENT, rel.replace(/\/(w\d\d)$/, "/media/$1"), "forge");

/**
 * Writes public/<rel>/spec.json and public/<rel>/song.mp3 for a week, and the Forge art of the week when its
 * media folder has a forge/manifest.json (else the video draws the placeholder art).
 * @param {string} rel The week, as "l2/w01".
 * @returns {string} The spec file.
 */
export function prepare(rel) {
  const week = JSON.parse(
    fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"),
  );
  const audio = path.join(CONTENT, week.song.audio);
  const duration = probe(audio).duration;
  const spec = buildSpec(week, duration);
  const out = path.join(PROJECT, "public", rel);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(audio, path.join(out, "song.mp3"));
  spec.audio = `${rel}/song.mp3`;
  const art = forgeDir(rel);
  fs.rmSync(path.join(out, "forge"), { recursive: true, force: true });
  if (fs.existsSync(path.join(art, "manifest.json"))) {
    const manifest = JSON.parse(fs.readFileSync(path.join(art, "manifest.json"), "utf8"));
    const { forge, files } = forgeSpec(manifest, usedArt(spec), (f) => alphaBox(path.join(art, f)), `${rel}/forge`);
    for (const f of files) {
      fs.mkdirSync(path.dirname(path.join(out, "forge", f)), { recursive: true });
      fs.copyFileSync(path.join(art, f), path.join(out, "forge", f));
    }
    spec.art = "forge";
    spec.forge = forge;
  }
  // The Forge scene video (S27 option C), when the week has one: it replaces the scene and the actors.
  const scene = path.join(art, "scene.mp4");
  fs.rmSync(path.join(out, "scene.mp4"), { force: true });
  if (fs.existsSync(scene)) {
    const problems = sceneVideoProblems(probe(scene), duration);
    if (problems.length) throw new Error(`The scene video of ${rel}: ${problems.join("; ")}`);
    fs.copyFileSync(scene, path.join(out, "scene.mp4"));
    spec.sceneVideo = `${rel}/scene.mp4`;
  }
  const file = path.join(out, "spec.json");
  fs.writeFileSync(file, JSON.stringify(spec, null, 1) + "\n");
  return file;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rel = process.argv[2];
  const at = process.argv.indexOf("--forge");
  const sceneAt = process.argv.indexOf("--scene");
  if (
    !/^l\d\/w\d\d$/.test(rel ?? "") ||
    (at > 0 && !process.argv[at + 1]) ||
    (sceneAt > 0 && !process.argv[sceneAt + 1])
  ) {
    console.error("Usage: node scripts/prepare.mjs l2/w01 [--forge <Forge set folder>] [--scene <Forge scene video>]");
    process.exit(2);
  }
  if (at > 0) console.log("forge", copyForge(rel, process.argv[at + 1]).length, "files");
  if (sceneAt > 0) console.log("scene", copySceneVideo(rel, process.argv[sceneAt + 1]));
  console.log("spec", prepare(rel));
}
