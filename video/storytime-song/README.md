# Storytime song video

The song videos of the Storytime weeks (Remotion), from the week package and the Forge renders. Track: `measure/tracks/storytime_song_video_20261022/`.

- `scripts/prepare.mjs l2/w01` writes `public/l2/w01/spec.json` (the line spec: line times, word times, the picture, the scene, the actors, the gesture) and copies the song audio.
- `scripts/render.mjs l2/w01` renders the classroom cut `song.mp4` (1920x1080) with `song-poster.jpg` (1280x720) and, when `song-instrumental.mp3` is in the media folder, `song-karaoke.mp4`; and the phone cut `song-phone.mp4` (portrait, 720x1280) with `song-phone-poster.jpg` (720x1280), into `content/storytime/l2/media/w01/`. `--cut classroom` or `--cut phone` renders one cut only. Run it under the heavy-job lock with `--concurrency 2` (memory: Postgres of the Primary app shares this machine).
- The phone cut (Daniel, 2026-10-23: a phone video is portrait) is the composition `StorytimeSongPortrait` (1080x1920, `src/SongPortrait.tsx`, the boxes in `src/layout.ts`). From the top: the classroom scene at full width at 16:9 (no crop) with the actor row centred on the rug, the line text in a dark box (2 to 2.5 times the classroom size on a phone), and the gesture card with the Adventurer about 810 px tall. The start and end screens are the same components; in a portrait frame the theme and the contact line go on lines of their own. The QR page plays it in a 9:16 box with `song.posterPhone` (Monorepo, 2026-10-23).
- `npx remotion studio` shows the compositions `StorytimeSong` and `StorytimeSongPortrait`.

- `scripts/prepare.mjs l2/w01 --forge <Forge set folder>` first copies the Forge files that the week uses, and the manifest, into `content/storytime/l2/media/w01/forge/` (Forge never writes into this repo). When that folder has a `manifest.json`, every prepare run puts the Forge art in the spec (`spec.forge`, `scripts/forge.mjs`): the scene render as the background, each actor as its front cut-out with the foot point on the ground line (800), and the Adventurer gesture frames in the inset (mirrored; two frames swap on each beat; the idle frame between lines). One scale for every cut-out: `SCREEN_PPM` 556 px per metre, from the rug of `classroom.png` (1.96 m, 1090 px wide). A cast member or a gesture of the song with no cut-out stops the prepare step.

A week without a Forge folder draws the placeholder art (flat shapes, `src/art/`). Week 1 has the Forge set of 2026-10-23 (`advantage-forge/out/chibi-sprouts/r1/week1`). The video files are not in git: render them again from the package.

Install: `npm i`. If the rspack binding is missing (an npm optional-dependency issue), `npm i --force @rspack/binding-linux-x64-gnu@1.7.11`.
