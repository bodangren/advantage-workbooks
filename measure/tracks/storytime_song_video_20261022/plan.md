# Plan: storytime_song_video_20261022

## Phase 1: Compositor with placeholder art

- [x] Task: the schema keys `song.videoPhone` and `song.poster`, and the gate check `song-media` (abf36ff; mutation: a missing poster fails). commit abf36ff
- [x] Task: the Remotion project `video/storytime-song/` (Remotion 4.0.537, own package.json, the video files out of git) and the prepare script (week package to the line spec: segments for sung repeats, scene from the named place or the week setting, actors from `image.characters`, animal-sound bubbles). Tests: 4 (node --test). commit b1b00e7
- [~] Task: the composition: scenes (hard cut only at a scene change), actors with slide motion (only when the cast changes), the gesture inset (24 gestures, mirrored, moving gestures swap key frames on the beat, hop/sway/turn move the sprite), the lyric text in Andika lit word by word. Tests: 4 for the timeline; 2 mutants caught. Open: the animals and props, and the speech bubbles on screen (needed from week 2). Still open on 2026-11-19: animals, props, and bubbles stay unbuilt for weeks 2 to 7.
- [~] Task: the render script (1080p, phone, poster, karaoke when the instrumental exists, faststart) under the heavy lock at concurrency 2 (Monorepo: memory), and the package keys (merge step `song_media`). Still open on 2026-11-19: karaoke waits for the instrumental; T20 renders classroom and phone cuts.
- [x] Task: the week 1 placeholder proof to Storytime (Daniel's look check, section Y) and to Monorepo (page test passed on disk, b1b00e7). commit b1b00e7

- [x] Task: the start screen (3 s, silent: the product logo, the song title, level, week, theme) and the end screen (4 s: the Storytime Advantage logo pops in, "Reading Advantage" sung from the company jingle, the contact line), Daniel's addition to check Y1 (Y1 to Y6 passed). The package times stay song-relative; the compositor shifts the song by 3 s. The poster is the title card at 1.5 s. Logo: PR `assets/logos/vector/horizontal/storytime-advantage.svg` (approved 2026-10-08); jingle cut 1.55 to 3.60 s of `assets/reading-advantage-jingle.mp3` (whisper: "Reading" at 1.92 s, the next word at 3.66 s), the same loudness as the song (-12.6 and -11.9 LUFS). commit 88c5b7c

Hold (Daniel, 2026-10-22 18:10): the animals, props, and bubbles of weeks 2 to 7, and all read-along video work, wait until the week 1 test with Forge art passes Daniel's look check.

## Phase 2: Forge art

- [x] Task: the manifest reader for the Forge renders (`scripts/forge.mjs`, `prepare.mjs --forge`; 3 tests). Week 1 set of 2026-10-23 copied and rendered for Daniel's look check. commit 7213f4e
- [x] Task: the portrait phone cut (Daniel, 2026-10-23, F8 failed on the landscape phone copy): the composition `StorytimeSongPortrait` (`src/SongPortrait.tsx`, `src/layout.ts`), `render.mjs --cut`, the key `song.posterPhone` (Monorepo chose it: each poster has the shape of its video). Confirmed with Storytime, Monorepo, and chibi-sprouts first. The classroom cut is pixel-identical after the refactor (frames 753 and 1652). Tests: 4 for the layout; 4 mutants caught. 3 test frames on Daniel's page (F8). Done: commit 242c19d5; week 1 content commit 8e6df79; Daniel approved the week 1 classroom and phone videos 2026-11-04 (advantage-pr storytime-release-1 README line 36).
- [x] Task: the Forge scene video input (S27 option C, Daniel 2026-10-23): `spec.sceneVideo`, `SceneLayer` in both cuts, `prepare.mjs --scene` with the contract check (1 test; 4 mutants caught), placeholder test (24 fps test pattern). The motion sample (option A) is dropped. Next: Forge's week 1 test cut (target 2026-10-25), then the render for Daniel's look check. Done: commit a6d3c726; week 1 content commit 8e6df79; Daniel approved the week 1 classroom and phone videos 2026-11-04 (advantage-pr storytime-release-1 README line 36).
- [~] Task: weeks 1 to 7 with Forge art by 2026-11-25; the karaoke cuts when the instrumentals come. (Green T20 renders weeks 2 to 7 on 2026-11-19; week 1 stays approved.) Render pass of 2026-11-19, commit 5d38868e: 6 weeks, the classroom and the phone cut plus 2 posters each, every render exit 0; the Forge scene sits in w02, w03, w05, w06; w04 and w07 use the placeholder art; the gesture inset keeps the placeholder sprite in all 6 weeks. Evidence: `measure/runs/storytime_song_video_20261022/green-p2-t20-renders.txt` (ffprobe and sha256 of each output, 24 frames at 10 s and 40 s) and `green-p2-t20-f36e3720.log`. Open for Forge: the scenes of w04 and w07, and the cast cut-outs (Pat in w02 and w03, Sam in w05, Mia in w06, Lily in w04, May in w07). The karaoke cut waits for the instrumentals.

## Phase 3: Hand-off

- [ ] Task: tech-debt and lessons-learned.
