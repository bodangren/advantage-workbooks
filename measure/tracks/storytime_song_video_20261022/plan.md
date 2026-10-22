# Plan: storytime_song_video_20261022

## Phase 1: Compositor with placeholder art

- [x] Task: the schema keys `song.videoPhone` and `song.poster`, and the gate check `song-media` (abf36ff; mutation: a missing poster fails).
- [x] Task: the Remotion project `video/storytime-song/` (Remotion 4.0.537, own package.json, the video files out of git) and the prepare script (week package to the line spec: segments for sung repeats, scene from the named place or the week setting, actors from `image.characters`, animal-sound bubbles). Tests: 4 (node --test).
- [~] Task: the composition: scenes (hard cut only at a scene change), actors with slide motion (only when the cast changes), the gesture inset (24 gestures, mirrored, moving gestures swap key frames on the beat, hop/sway/turn move the sprite), the lyric text in Andika lit word by word. Tests: 4 for the timeline; 2 mutants caught. Open: the animals and props, and the speech bubbles on screen (needed from week 2).
- [~] Task: the render script (1080p, phone, poster, karaoke when the instrumental exists, faststart) under the heavy lock at concurrency 2 (Monorepo: memory), and the package keys (merge step `song_media`).
- [x] Task: the week 1 placeholder proof to Storytime (Daniel's look check, section Y) and to Monorepo (page test passed on disk, b1b00e7).

- [x] Task: the start screen (3 s, silent: the product logo, the song title, level, week, theme) and the end screen (4 s: the Storytime Advantage logo pops in, "Reading Advantage" sung from the company jingle, the contact line), Daniel's addition to check Y1 (Y1 to Y6 passed). The package times stay song-relative; the compositor shifts the song by 3 s. The poster is the title card at 1.5 s. Logo: PR `assets/logos/vector/horizontal/storytime-advantage.svg` (approved 2026-10-08); jingle cut 1.55 to 3.60 s of `assets/reading-advantage-jingle.mp3` (whisper: "Reading" at 1.92 s, the next word at 3.66 s), the same loudness as the song (-12.6 and -11.9 LUFS).

Hold (Daniel, 2026-10-22 18:10): the animals, props, and bubbles of weeks 2 to 7, and all read-along video work, wait until the week 1 test with Forge art passes Daniel's look check.

## Phase 2: Forge art

- [ ] Task: the manifest reader for the Forge renders (paths and names from Storytime).
- [ ] Task: weeks 1 to 7 with Forge art by 2026-11-25; the karaoke cuts when the instrumentals come.

## Phase 3: Hand-off

- [ ] Task: tech-debt and lessons-learned.
