# Plan: storytime_song_video_20261022

## Phase 1: Compositor with placeholder art

- [x] Task: the schema keys `song.videoPhone` and `song.poster`, and the gate check `song-media` (abf36ff; mutation: a missing poster fails).
- [x] Task: the Remotion project `video/storytime-song/` (Remotion 4.0.537, own package.json, the video files out of git) and the prepare script (week package to the line spec: segments for sung repeats, scene from the named place or the week setting, actors from `image.characters`, animal-sound bubbles). Tests: 4 (node --test).
- [~] Task: the composition: scenes (hard cut only at a scene change), actors with slide motion (only when the cast changes), the gesture inset (24 gestures, mirrored, moving gestures swap key frames on the beat, hop/sway/turn move the sprite), the lyric text in Andika lit word by word. Tests: 4 for the timeline; 2 mutants caught. Open: the animals and props, and the speech bubbles on screen (needed from week 2).
- [~] Task: the render script (1080p, phone, poster, karaoke when the instrumental exists, faststart) under the heavy lock at concurrency 2 (Monorepo: memory), and the package keys (merge step `song_media`).
- [ ] Task: the week 1 placeholder proof to Storytime (Daniel's look check) and to Monorepo (page test).

## Phase 2: Forge art

- [ ] Task: the manifest reader for the Forge renders (paths and names from Storytime).
- [ ] Task: weeks 1 to 7 with Forge art by 2026-11-25; the karaoke cuts when the instrumentals come.

## Phase 3: Hand-off

- [ ] Task: tech-debt and lessons-learned.
