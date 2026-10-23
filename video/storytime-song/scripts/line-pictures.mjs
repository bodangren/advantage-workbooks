// Makes the pictures of the song lines for the QR page (Daniel, 2026-10-23: "actions have no contextual image"):
// one square picture for each gesture of the song, the Adventurer of the week's Forge set in the gesture, from the
// head to below the belt on amber 100, mirrored as in the gesture inset of the video (the child copies it as in a
// mirror). The page shows each picture at 64 x 64 px beside its line.
//   content/storytime/l<level>/media/w<nn>/song-lines/<gesture>.jpg   256 x 256
// Usage: node scripts/line-pictures.mjs l2/w01. The script prints the file of each gesture; the package names it
// in song.lines[i].image.file (a repeated line keeps its imageOf).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alphaBox, slug } from "./forge.mjs";
import { CONTENT } from "./prepare.mjs";

/** The side of a picture in pixels: four times the 64 px of the page, for sharp phone screens. */
export const SIDE = 256;

/** The background of a picture: amber 100, the page colour of the phone cut. */
const PAGE = "0xFEF3C7";

/**
 * The frame of a gesture that shows it best: the last frame (the beat frame: clap together, wave right, nod down).
 * @param {any} manifest The parsed manifest.json of the Forge set.
 * @param {string} gesture The gesture of the package, as "point to self".
 * @returns {string} The frame file, relative to the set folder.
 */
export function beatFrame(manifest, gesture) {
  const list = manifest.gestures?.adventurer?.[slug(gesture)];
  if (!list?.length)
    throw new Error(`The Forge set has no frames of the gesture ${gesture}`);
  return list[list.length - 1];
}

/**
 * The square crop of the pictures: one crop for all gestures, so the figure has the same size and place in each.
 * The square is 85% of the figure height (the head to below the belt, with every hand) and is centred on the figure.
 * @param {{x1: number, x2: number, y1: number, y2: number}[]} boxes The alpha boxes of the frames.
 * @param {[number, number]} canvas The width and height of the frames.
 * @returns {{x: number, y: number, side: number}} The crop in canvas pixels.
 */
export function pictureCrop(boxes, canvas) {
  const x1 = Math.min(...boxes.map((b) => b.x1));
  const x2 = Math.max(...boxes.map((b) => b.x2));
  const y1 = Math.min(...boxes.map((b) => b.y1));
  const y2 = Math.max(...boxes.map((b) => b.y2));
  const side = Math.max(Math.round(0.85 * (y2 - y1)), x2 - x1);
  const x = Math.round((x1 + x2 - side) / 2);
  const y = y1 - Math.round(0.05 * side);
  if (x < 0 || y < 0 || x + side > canvas[0] || y + side > canvas[1])
    throw new Error("The picture crop is outside the frame");
  return { x, y, side };
}

/**
 * Makes the pictures of the song gestures of one week.
 * @param {string} rel The week, as "l2/w01".
 * @returns {Record<string, string>} The picture of each gesture, relative to content/storytime.
 */
export function linePictures(rel) {
  const [level, week] = rel.split("/");
  const pkg = JSON.parse(
    fs.readFileSync(path.join(CONTENT, `${rel}.json`), "utf8"),
  );
  const set = path.join(CONTENT, level, "media", week, "forge");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(set, "manifest.json"), "utf8"),
  );
  const gestures = [...new Set(pkg.song.lines.map((l) => l.gesture))];
  const frames = gestures.map((g) => beatFrame(manifest, g));
  const crop = pictureCrop(
    frames.map((f) => alphaBox(path.join(set, f))),
    manifest.canvas,
  );
  const dir = path.join(level, "media", week, "song-lines");
  fs.mkdirSync(path.join(CONTENT, dir), { recursive: true });
  const out = {};
  gestures.forEach((g, i) => {
    const file = path.join(dir, `${slug(g)}.jpg`);
    execFileSync("ffmpeg", [
      ...["-v", "error", "-y"],
      ...["-f", "lavfi", "-i", `color=c=${PAGE}:s=${crop.side}x${crop.side}`],
      ...["-i", path.join(set, frames[i])],
      "-filter_complex",
      `[1:v]crop=${crop.side}:${crop.side}:${crop.x}:${crop.y},hflip[f];[0:v][f]overlay=0:0,scale=${SIDE}:${SIDE}:flags=lanczos`,
      ...["-frames:v", "1", "-q:v", "3", path.join(CONTENT, file)],
    ]);
    out[g] = file;
  });
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rel = process.argv[2];
  if (!/^l\d\/w\d\d$/.test(rel ?? "")) {
    console.error("Usage: node scripts/line-pictures.mjs l2/w01");
    process.exit(2);
  }
  for (const [g, file] of Object.entries(linePictures(rel)))
    console.log(`${g}\t${file}`);
}
