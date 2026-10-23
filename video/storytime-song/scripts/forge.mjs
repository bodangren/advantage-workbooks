// The Forge render set of a week (Chibi Sprouts r1: cast cut-outs, Adventurer gesture frames, scene renders) in
// the line spec. The set is copied from advantage-forge into content/storytime/l<level>/media/w<nn>/forge/.
import { spawnSync } from "node:child_process";

/**
 * Screen pixels for one metre at the feet of the actors: in classroom.png the rug, 1.96 m wide (rug.png: 880 px at
 * 450 px/m), is 1090 px wide around the row of the feet (GROUND).
 */
export const SCREEN_PPM = 556;

/** The gesture key of the manifest for a gesture of the package: "point to self" is "point-to-self". */
export const slug = (gesture) => gesture.trim().toLowerCase().replace(/\s+/g, "-");

/**
 * Builds the Forge part of a line spec from the manifest.
 * @param {any} manifest The parsed manifest.json of the set.
 * @param {{actors: string[], gestures: string[], scenes: string[]}} use The actors, gestures, and scenes of the song.
 * @param {(file: string) => {x1: number, x2: number, y1: number, y2: number}} box The alpha box of a gesture frame.
 * @param {string} base The folder of the copied set under public/, as "l2/w01/forge".
 * @returns {{forge: any, files: string[]}} The spec part, and the set files that the video uses (to copy).
 */
export function forgeSpec(manifest, use, box, base) {
  const files = new Set();
  const take = (file) => {
    files.add(file);
    return `${base}/${file}`;
  };
  const cast = {};
  for (const name of use.actors) {
    const front = manifest.cast?.[name.toLowerCase()]?.front;
    if (!front) throw new Error(`The Forge set has no cut-out of ${name}`);
    cast[name] = take(front);
  }
  const frames = manifest.gestures?.adventurer ?? {};
  const gestures = {};
  const used = [];
  for (const g of use.gestures) {
    const list = frames[slug(g)];
    if (!list?.length) throw new Error(`The Forge set has no frames of the gesture ${g}`);
    gestures[g] = list.map(take);
    used.push(...list);
  }
  const idle = (frames.idle ?? []).map(take);
  used.push(...(frames.idle ?? []));
  const scenes = {};
  for (const id of use.scenes) {
    const scene = manifest.scenes?.[id];
    if (scene?.file && scene.size?.[0] === 1920 && scene.size?.[1] === 1080)
      scenes[id] = take(scene.file);
  }
  const boxes = used.map(box);
  const x = Math.min(...boxes.map((b) => b.x1));
  const y = Math.min(...boxes.map((b) => b.y1));
  return {
    forge: {
      scale: SCREEN_PPM / manifest.ppm,
      canvas: manifest.canvas,
      foot: manifest.footPoint,
      cast,
      gestures,
      idle,
      gestureBox: {
        x,
        y,
        w: Math.max(...boxes.map((b) => b.x2)) - x,
        h: Math.max(...boxes.map((b) => b.y2)) - y,
      },
      scenes,
    },
    files: [...files],
  };
}

/**
 * The box of the visible pixels of a cut-out (alpha 8 or more), by ffmpeg.
 * @param {string} file The PNG file.
 * @returns {{x1: number, x2: number, y1: number, y2: number}} The box in canvas pixels.
 */
export function alphaBox(file) {
  // ffmpeg writes the box to stderr.
  const run = spawnSync(
    "ffmpeg",
    ["-v", "info", "-i", file, "-vf", "alphaextract,bbox=min_val=8", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  return alphaBoxOf(run.stderr);
}

/** Reads the last box of the ffmpeg bbox log. */
function alphaBoxOf(log) {
  const all = [...log.matchAll(/x1:(\d+) x2:(\d+) y1:(\d+) y2:(\d+)/g)];
  if (!all.length) throw new Error("ffmpeg gave no alpha box");
  const [, x1, x2, y1, y2] = all[all.length - 1].map(Number);
  return { x1, x2, y1, y2 };
}
