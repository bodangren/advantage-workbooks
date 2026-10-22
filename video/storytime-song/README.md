# Storytime song video

The song videos of the Storytime weeks (Remotion), from the week package and the Forge renders. Track: `measure/tracks/storytime_song_video_20261022/`.

- `scripts/prepare.mjs l2/w01` writes `public/l2/w01/spec.json` (the line spec: line times, word times, the picture, the scene, the actors, the gesture) and copies the song audio.
- `scripts/render.mjs l2/w01` renders `song.mp4` (1920x1080), `song-phone.mp4` (1280x720), `song-poster.jpg`, and, when `song-instrumental.mp3` is in the media folder, `song-karaoke.mp4` into `content/storytime/l2/media/w01/`. Run it under the heavy-job lock with `--concurrency 2` (memory: Postgres of the Primary app shares this machine).
- `npx remotion studio` shows the composition `StorytimeSong`.

- `scripts/prepare.mjs l2/w01 --forge <Forge set folder>` first copies the Forge files that the week uses, and the manifest, into `content/storytime/l2/media/w01/forge/` (Forge never writes into this repo). When that folder has a `manifest.json`, every prepare run puts the Forge art in the spec (`spec.forge`, `scripts/forge.mjs`): the scene render as the background, each actor as its front cut-out with the foot point on the ground line (800), and the Adventurer gesture frames in the inset (mirrored; two frames swap on each beat; the idle frame between lines). One scale for every cut-out: `SCREEN_PPM` 556 px per metre, from the rug of `classroom.png` (1.96 m, 1090 px wide). A cast member or a gesture of the song with no cut-out stops the prepare step.

A week without a Forge folder draws the placeholder art (flat shapes, `src/art/`). Week 1 has the Forge set of 2026-10-23 (`advantage-forge/out/chibi-sprouts/r1/week1`). The video files are not in git: render them again from the package.

Install: `npm i`. If the rspack binding is missing (an npm optional-dependency issue), `npm i --force @rspack/binding-linux-x64-gnu@1.7.11`.
