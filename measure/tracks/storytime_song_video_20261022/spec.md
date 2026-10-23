# Spec: storytime_song_video_20261022

## Goal

Every Storytime week has a song video for the classroom screen and for the QR page. The video is made by a script from the week package and the Forge renders, so a change in the lines, the times, or the art makes a new video with no hand work.

## Sources

- The week package `content/storytime/l<level>/w<nn>.json`: `song.lines` (text, gesture, picture or `imageOf`, `image.characters`), `song.times` (line and word times), `song.bpm`, `song.audio`.
- The Forge renders (PNG, transparent): the cast at age 5, the gesture key frames, the scene backgrounds, and the props and animals. Paths, names, and the manifest come from Storytime when Forge answers. Until then, placeholder art (flat shapes, not for release).
- Storytime's inventory: `measure/tracks/storytime_advantage_program_20261021/forge-inventory.md` (monorepo, primary-parity-integration).

## Requirements

1. Format: 1920x1080, 30 fps, H.264 with AAC; every mp4 with `-movflags +faststart`.
2. Text: every cut shows the line text in English (no Thai), with each word highlighted at its time in `song.times`. A line with a sung repeat in parentheses shows the part that is sung.
3. Pictures: the frame shows the scene background and the actors of the line picture (`imageOf` uses the picture of that line). At `line.startTime` the old actors slide out and the new ones slide in when the scene stays; a hard cut only when the background changes.
4. Gesture inset: lower right, about 30 percent of the frame height, a Sprout doing the gesture of the line, mirrored, held for the line. A moving gesture alternates its two key frames on the beat (`song.bpm`); a whole-body gesture moves the sprite.
5. Animals bounce, and a speech bubble with the sound appears at the word time; the bubble text comes from the line words (no letters inside a render).
6. Outputs in `content/storytime/l<level>/media/w<nn>/`: `song.mp4` (1080p, the song with vocals), `song-poster.jpg` (1280x720, the first frame), `song-karaoke.mp4` (the same picture over `song-instrumental.mp3`, only when Storytime sends that file), and the phone cut for the QR page: `song-phone.mp4` (portrait 720x1280, CRF about 28, AAC 96k) with `song-phone-poster.jpg` (720x1280). The package gets `song.video`, `song.videoPhone`, `song.poster`, `song.posterPhone`, and `song.karaoke` (schema abf36ff; `posterPhone` 2026-10-23).
7. The phone cut is portrait (Daniel, 2026-10-23, look check F8: "This should be portrait for phone, right?"). From the top: the classroom scene at full width at 16:9 with the actors centred on the rug, the line text 2 to 2.5 times the classroom size on a phone, and a large gesture figure (the child copies it). The first phone cut (2026-10-22) was the classroom picture at 1280x720, from Monorepo's request "720p"; the shape was not asked.
8. The scene comes from Forge (S27 option C, Daniel 2026-10-23 15:30: "Full in-scene render"). Forge renders the scene and the actors from `spec.json` and Storytime's `stage.json` into a silent 1920x1080 video at 24 fps, with t = 0 at the song start and the length of the song. `prepare.mjs --scene` copies it to `forge/scene.mp4` (not in git; `forge/scene.json` records the source and the SHA-256) and stops on a wrong size, a sound stream, or a length that differs by more than 0.1 s. Both cuts show it in place of the cut-out scene and actors; Workbooks adds the song audio, the lit text, the gesture inset, and the screens. The phone cut shows the same video in its top band (one Forge render), unless Daniel rejects F9 (then a 1080x1920 Forge cut).
9. The project is `video/storytime-song/` with its own package.json, outside the dashboard; it does not change the dashboard lockfile.

## Out of scope

Animation clips from Forge; Thai text in the video; the vocal separation (Storytime, hosted Demucs).
