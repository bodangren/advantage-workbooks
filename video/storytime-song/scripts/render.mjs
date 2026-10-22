// Renders the song video files of one Storytime week into its media folder:
//   song.mp4         1920x1080, 30 fps, H.264/AAC, the song with vocals
//   song-phone.mp4   1280x720, H.264 CRF 28, AAC 96k (the QR page plays this file)
//   song-poster.jpg  1280x720, the first frame
//   song-karaoke.mp4 the same picture over song-instrumental.mp3, only when that file is in the media folder
// Every mp4 has -movflags +faststart. Run it under the heavy-job lock:
//   flock ~/Desktop/primary-parity-progress/heavy.lock node scripts/render.mjs l2/w01 [--concurrency 2]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT, PROJECT, prepare } from './prepare.mjs';

const rel = process.argv[2];
if (!/^l\d\/w\d\d$/.test(rel ?? '')) {
    console.error('Usage: node scripts/render.mjs l2/w01 [--concurrency 2]');
    process.exit(2);
}
const at = process.argv.indexOf('--concurrency');
const concurrency = at > 0 ? process.argv[at + 1] : '2';
const [level, week] = rel.split('/');
const media = path.join(CONTENT, level, 'media', week);
const work = path.join(PROJECT, 'out', rel);
fs.mkdirSync(work, { recursive: true });

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', cwd: PROJECT });
const ffmpeg = (...args) => run('ffmpeg', ['-v', 'error', '-y', ...args]);

prepare(rel);
const raw = path.join(work, 'raw.mp4');
run('npx', ['remotion', 'render', 'StorytimeSong', raw, `--props=${JSON.stringify({ week: rel, spec: null })}`,
    `--concurrency=${concurrency}`, '--codec=h264', '--crf=20', '--browser-executable=/usr/bin/google-chrome', '--log=error']);

const out = (name) => path.join(media, name);
ffmpeg('-i', raw, '-c', 'copy', '-movflags', '+faststart', out('song.mp4'));
ffmpeg('-i', out('song.mp4'), '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out('song-phone.mp4'));
ffmpeg('-i', out('song.mp4'), '-frames:v', '1', '-vf', 'scale=1280:720', '-q:v', '3', out('song-poster.jpg'));
const instrumental = out('song-instrumental.mp3');
if (fs.existsSync(instrumental)) {
    ffmpeg('-i', out('song.mp4'), '-i', instrumental, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', '-movflags', '+faststart', out('song-karaoke.mp4'));
}
for (const name of ['song.mp4', 'song-phone.mp4', 'song-poster.jpg', 'song-karaoke.mp4']) {
    if (fs.existsSync(out(name))) console.log(`${name}\t${(fs.statSync(out(name)).size / 1e6).toFixed(1)} MB`);
}
