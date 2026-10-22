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
6. Outputs in `content/storytime/l<level>/media/w<nn>/`: `song.mp4` (1080p, the song with vocals), `song-phone.mp4` (1280x720, CRF about 28, AAC 96k), `song-poster.jpg` (1280x720, the first frame), and `song-karaoke.mp4` (the same picture over `song-instrumental.mp3`, only when Storytime sends that file). The package gets `song.video`, `song.videoPhone`, `song.poster`, and `song.karaoke` (schema abf36ff).
7. The project is `video/storytime-song/` with its own package.json, outside the dashboard; it does not change the dashboard lockfile.

## Out of scope

Animation clips from Forge; Thai text in the video; the vocal separation (Storytime, hosted Demucs).
