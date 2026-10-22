// Renders the song video files of one Storytime week into its media folder:
//   song.mp4         1920x1080, 30 fps, H.264/AAC: the start screen, the song with vocals, the end screen
//   song-phone.mp4   1280x720, H.264 CRF 28, AAC 96k (the QR page plays this file)
//   song-poster.jpg  1280x720, the start screen at 1.5 s (the title card)
//   song-karaoke.mp4 the same picture over song-instrumental.mp3, only when that file is in the media folder
// Every mp4 has -movflags +faststart. Run it under the heavy-job lock:
//   flock ~/Desktop/primary-parity-progress/heavy.lock node scripts/render.mjs l2/w01 [--concurrency 2]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CONTENT, PROJECT, prepare } from "./prepare.mjs";

import { JINGLE_AT, START_SECONDS } from "../src/screens-config.ts";

const rel = process.argv[2];
if (!/^l\d\/w\d\d$/.test(rel ?? "")) {
  console.error("Usage: node scripts/render.mjs l2/w01 [--concurrency 2]");
  process.exit(2);
}
const at = process.argv.indexOf("--concurrency");
const concurrency = at > 0 ? process.argv[at + 1] : "2";
const [level, week] = rel.split("/");
const media = path.join(CONTENT, level, "media", week);
const work = path.join(PROJECT, "out", rel);
fs.mkdirSync(work, { recursive: true });

const run = (cmd, args) =>
  execFileSync(cmd, args, { stdio: "inherit", cwd: PROJECT });
const ffmpeg = (...args) => run("ffmpeg", ["-v", "error", "-y", ...args]);
const out = (name) => path.join(media, name);

const spec = JSON.parse(fs.readFileSync(prepare(rel), "utf8"));
const raw = path.join(work, "raw.mp4");
run("npx", [
  "remotion",
  "render",
  "StorytimeSong",
  raw,
  `--props=${JSON.stringify({ week: rel, spec: null })}`,
  `--concurrency=${concurrency}`,
  "--codec=h264",
  "--crf=20",
  "--browser-executable=/usr/bin/google-chrome",
  "--log=error",
]);

ffmpeg("-i", raw, "-c", "copy", "-movflags", "+faststart", out("song.mp4"));
// The phone copy for the QR page.
ffmpeg(
  ...["-i", out("song.mp4"), "-vf", "scale=1280:720"],
  ...[
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
  ],
  ...[
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-movflags",
    "+faststart",
    out("song-phone.mp4"),
  ],
);
// The poster: the title card of the start screen.
ffmpeg(
  ...["-ss", "1.5", "-i", out("song.mp4"), "-frames:v", "1"],
  ...["-vf", "scale=1280:720", "-q:v", "3", out("song-poster.jpg")],
);
// The karaoke cut: the same picture; the audio is silence, the instrumental, then the jingle of the end screen.
const instrumental = out("song-instrumental.mp3");
if (fs.existsSync(instrumental)) {
  const jingle = path.join(
    PROJECT,
    "public/brand/jingle-reading-advantage.mp3",
  );
  const jingleMs = Math.round(
    (START_SECONDS + spec.duration + JINGLE_AT) * 1000,
  );
  ffmpeg(
    ...["-i", out("song.mp4"), "-i", instrumental, "-i", jingle],
    "-filter_complex",
    `[1:a]adelay=${START_SECONDS * 1000}:all=1[i];[2:a]adelay=${jingleMs}:all=1[j];[i][j]amix=inputs=2:normalize=0:duration=longest[a]`,
    ...[
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
    ],
    ...["-shortest", "-movflags", "+faststart", out("song-karaoke.mp4")],
  );
}
for (const name of [
  "song.mp4",
  "song-phone.mp4",
  "song-poster.jpg",
  "song-karaoke.mp4",
]) {
  if (fs.existsSync(out(name)))
    console.log(
      `${name}\t${(fs.statSync(out(name)).size / 1e6).toFixed(1)} MB`,
    );
}
