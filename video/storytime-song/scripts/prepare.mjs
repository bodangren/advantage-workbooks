// Turns one Storytime week package into the line spec of the song video (public/<level>/<week>/spec.json)
// and copies the song audio next to it. Usage: node scripts/prepare.mjs l2/w01 [--forge <set>] [--scene <video>]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCREEN_PPM, alphaBox, forgeSpec, slug } from "./forge.mjs";

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

/** The weeks whose art set fixes the scene; w07 has no stage file and uses the classroom render. */
const SCENE_FORCE = { "st2/7": "classroom" };

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

/** Thai letters never reach the video: the range and the JSON "th" key are dropped before a spec is built. */
const THAI = /[\u0E00-\u0E7F]/;

/**
 * Drops the Thai translations of a week package before the spec is built.
 * @param {any} value The parsed week package or one of its parts.
 * @returns {any} The same data with "th" keys and Thai strings removed.
 */
function stripThai(value) {
  if (Array.isArray(value)) return value.map(stripThai);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (key === "th" || THAI.test(key)) continue;
      out[key] = stripThai(val);
    }
    return out;
  }
  if (typeof value === "string") return THAI.test(value) ? "" : value;
  return value;
}

/** The flat placeholders of the animal sounds (w06, w02) and the toy props (w07). */
const PLACEHOLDERS = [
  ["cat", "Cat"],
  ["dog", "Dog"],
  ["bird", "Bird"],
  ["fish", "Fish"],
  ["frog", "Frog"],
  ["duck", "Duck"],
  ["box", "ToyBox"],
  ["ball", "Ball"],
  ["doll", "Doll"],
  ["car", "ToyCar"],
  ["kite", "Kite"],
  ["drum", "Drum"],
  ["train", "ToyTrain"],
  ["top", "SpinningTop"],
];

/**
 * The flat placeholder of an animal or a prop named in a picture prompt. Every hit is returned so a picture with
 * more than one object keeps them all; an unmapped prompt gives no placeholder.
 * @param {string} prompt The image prompt of a picture.
 * @returns {string} The placeholder labels joined by " + ", or "" when the prompt names no animal or prop.
 */
export function placeholderOf(prompt) {
  const text = String(prompt ?? "").toLowerCase();
  return PLACEHOLDERS.filter(([word]) => text.includes(word))
    .map(([, label]) => label)
    .join(" + ");
}

/**
 * The bounce of an animal or a prop: zero on a beat, eight pixels at the middle of a beat.
 * @param {number} beat The position in beats (a whole number on a beat).
 * @param {number} bpm The tempo of the song (kept in the signature for callers that pass seconds).
 * @returns {number} The upward offset in pixels.
 */
export function bounceY(beat, bpm) {
  const phase = beat - Math.floor(beat);
  void bpm;
  return Math.round(Math.sin(Math.PI * phase) * 8);
}

/**
 * The art of one actor: a cut-out when the Forge set has one, else a flat placeholder. A missing cast entry must
 * never reach staticFile, so Lily, Ben, and the w04 family still render with Forge art on.
 * @param {string} name The actor name from the package.
 * @param {any} forge The Forge art of the spec (or null for the placeholder art).
 * @returns {{kind: "forge"|"placeholder", file?: string, label?: string}} The art kind and its source.
 */
export function resolveActorArt(name, forge) {
  const key = String(name).toLowerCase();
  const file = forge?.cast?.[name] ?? forge?.cast?.[key];
  return file ? { kind: "forge", file } : { kind: "placeholder", label: name };
}

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
  // w07 has no stage file: its cut-out set uses the classroom render, so its lines keep the default scene.
  if (SCENE_FORCE[key]) return SCENE_FORCE[key];
  for (const [re, scene] of PLACES) if (re.test(prompt)) return scene;
  return WEEK_SCENE[key] ?? "classroom";
}

/**
 * Builds the line spec of a week.
 * @param {any} week The week package.
 * @param {number} duration The length of the song audio in seconds.
 * @returns {any} The spec that the composition reads.
 */
export function buildSpec(source, duration) {
  const week = stripThai(source);
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
    let actors = image.characters.length
      ? image.characters
      : /\bclass of children\b/i.test(image.prompt)
        ? CLASS
        : [];
    if (!actors.length) {
      const placeholder = placeholderOf(image.prompt);
      if (placeholder) actors = [placeholder];
    }
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

/** The read-only Storytime handoff of Forge cut-outs and scene sets. */
const HANDOFF = "/home/daniebo/Desktop/handoff/storytime-song-art";

/**
 * Reads the manifest of the read-only handoff (one row per ready file).
 * @param {string} handoffDir The handoff folder.
 * @returns {{file: string, who: string, commit: string, sha: string}[]} The rows of the TSV.
 */
function readManifestRows(handoffDir) {
  const tsv = fs.readFileSync(path.join(handoffDir, "MANIFEST.tsv"), "utf8");
  return tsv.trim().split("\n").slice(1).map((line) => {
    const [file, who, commit, sha] = line.split("\t");
    return { file, who, commit, sha };
  });
}

/** The folder that receives handoff copies under public/, as a project-relative path. */
const FORGE_BASE = "forge";

/**
 * The handoff path of a Forge path under public/.
 * @param {string} file A Forge path, as "forge/cutouts/pat/listen.png".
 * @returns {string} The manifest-relative path in the handoff.
 */
const manifestRel = (file) =>
  file.startsWith(`${FORGE_BASE}/`) ? file.slice(FORGE_BASE.length + 1) : file;

/**
 * Maps the handoff TSV into the ForgeArt shape of src/types.ts. Every path is relative to public/; no path names
 * the handoff. The scene manifest of w04 sets the scale, the canvas, and the foot point. The "listen" cut-out of
 * each classmate is its front. Lily has no rows, so she stays a placeholder.
 * @param {string} handoffDir The handoff folder.
 * @returns {any} The Forge art: scale, canvas, foot, cast, gestures, idle, gestureBox, and scenes.
 */
export function manifestToForgeInput(handoffDir) {
  const sceneManifest = JSON.parse(
    fs.readFileSync(path.join(handoffDir, "scenes/w04/manifest.json"), "utf8"),
  );
  const cast = {};
  const frames = {};
  for (const { file, who } of readManifestRows(handoffDir)) {
    const found = file.match(/^cutouts\/([^/]+)\/([^/]+)\.png$/);
    if (!found) continue;
    const [, name, gesture] = found;
    const publicFile = `${FORGE_BASE}/${file}`;
    if (!frames[gesture]) frames[gesture] = [];
    frames[gesture].push(publicFile);
    if (gesture === "listen" && name.toLowerCase() !== "lily" && who !== "lily")
      cast[name.toLowerCase()] = publicFile;
  }
  const gestures = {};
  for (const [slug, list] of Object.entries(frames))
    gestures[slug.replace(/-/g, " ")] = list;
  const canvas = sceneManifest.canvas ?? [1024, 600];
  return {
    scale: SCREEN_PPM / sceneManifest.ppm,
    canvas,
    foot: sceneManifest.footPoint,
    cast,
    gestures,
    idle: [...(frames.listen ?? [])],
    gestureBox: { x: 0, y: 0, w: canvas[0], h: canvas[1] },
    scenes: { classroom: `${FORGE_BASE}/scenes/w04/classroom.png` },
  };
}

/**
 * Copies a named subset of manifest files out of the handoff. The handoff is read-only; every path is relative
 * and holds no "..", so no copy can write into it.
 * @param {string} handoffDir The handoff folder.
 * @param {string} destDir The folder that receives the copy.
 * @param {string[]} files The manifest-relative paths to copy.
 * @returns {string[]} The project-relative paths that were copied.
 */
export function copyManifestSubset(handoffDir, destDir, files) {
  for (const rel of files) {
    if (path.isAbsolute(rel) || rel.split("/").includes(".."))
      throw new Error(`unsafe manifest path ${rel}`);
    const src = path.join(handoffDir, rel);
    const dst = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  return [...files];
}

/**
 * Prepares a week with the Forge cut-outs of the handoff. The classmates with cut-outs use them; a classmate
 * without a row (Lily, Ben) keeps the placeholder. Only the files a week uses are copied into the project.
 * @param {string} rel The week, as "l2/w04".
 * @param {string} handoffDir The handoff folder.
 * @returns {string} The spec file.
 */
export function prepareWithManifest(rel, handoffDir = HANDOFF) {
  const week = JSON.parse(fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"));
  const audio = path.join(CONTENT, week.song.audio);
  const spec = buildSpec(week, probe(audio).duration);
  const adapter = manifestToForgeInput(handoffDir);
  const use = usedArt(spec);
  const files = new Set();
  const add = (publicFile) => {
    if (!publicFile) return null;
    files.add(manifestRel(publicFile));
    return `${rel}/${publicFile}`;
  };
  const cast = {};
  for (const name of use.actors) {
    const art = resolveActorArt(name, adapter);
    if (art.kind === "forge") cast[name] = add(art.file);
  }
  const gestures = {};
  for (const name of use.gestures) {
    const list = adapter.gestures[name] ?? adapter.gestures[slug(name)];
    if (list?.length) gestures[name] = list.map(add);
  }
  const idle = (adapter.idle ?? []).slice(0, 2).map(add);
  const scenes = {};
  for (const id of use.scenes) {
    const file = adapter.scenes[id] ?? adapter.scenes.classroom;
    if (file) scenes[id] = add(file);
  }
  const dest = path.join(PROJECT, "public", rel, FORGE_BASE);
  fs.rmSync(dest, { recursive: true, force: true });
  copyManifestSubset(handoffDir, dest, [...files]);
  spec.art = Object.keys(cast).length ? "forge" : "placeholder";
  spec.forge = {
    scale: adapter.scale,
    canvas: adapter.canvas,
    foot: adapter.foot,
    cast,
    gestures,
    idle,
    gestureBox: adapter.gestureBox,
    scenes,
  };
  const out = path.join(PROJECT, "public", rel);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(audio, path.join(out, "song.mp3"));
  spec.audio = `${rel}/song.mp3`;
  const file = path.join(out, "spec.json");
  fs.writeFileSync(file, JSON.stringify(spec, null, 1) + "\n");
  return file;
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
  // The handoff manifest is the first art source on the render path. A week with no cut-out rows keeps the art it
  // had; week 1 has no rows, so its approved spec is built exactly as before.
  const adapter = manifestToForgeInput(HANDOFF);
  const covered = usedArt(spec).actors.filter(
    (name) => resolveActorArt(name, adapter).kind === "forge",
  );
  if (covered.length) {
    prepareWithManifest(rel, HANDOFF);
    const withForge = JSON.parse(fs.readFileSync(path.join(out, "spec.json"), "utf8"));
    spec.art = withForge.art;
    spec.forge = withForge.forge;
  } else if (fs.existsSync(path.join(art, "manifest.json"))) {
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
