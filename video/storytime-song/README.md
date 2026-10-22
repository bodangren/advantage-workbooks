# Storytime song video

The song videos of the Storytime weeks (Remotion), from the week package and the Forge renders. Track: `measure/tracks/storytime_song_video_20261022/`.

- `scripts/prepare.mjs l2/w01` writes `public/l2/w01/spec.json` (the line spec: line times, word times, the picture, the scene, the actors, the gesture) and copies the song audio.
- `scripts/render.mjs l2/w01` renders `song.mp4` (1920x1080), `song-phone.mp4` (1280x720), `song-poster.jpg`, and, when `song-instrumental.mp3` is in the media folder, `song-karaoke.mp4` into `content/storytime/l2/media/w01/`. Run it under the heavy-job lock with `--concurrency 2` (memory: Postgres of the Primary app shares this machine).
- `npx remotion studio` shows the composition `StorytimeSong`.

The art is placeholder (flat shapes, `src/art/`) until the Forge renders come. The video files are not in git: render them again from the package.

Install: `npm i`. If the rspack binding is missing (an npm optional-dependency issue), `npm i --force @rspack/binding-linux-x64-gnu@1.7.11`.
