# Test Media — Origins 2 (A0) Semester Test

**Generated:** 2026-09-14 · mmx (MiniMax) image + speech · English voice: `English_Graceful_Lady` (0.85–0.9 speed) · Thai voice: `Thai_male_1_sample8`

---

## 1. Story Image (textless)

| File | Use |
|------|-----|
| **`park-story-v2_002.jpg`** | ✅ FINAL — print on the Reading part (Part C) page. Exactly 4 children (Lily, Ben, Mia, Tom), brown puppy, tree + green bird, sun, bench. No text. |
| `park-story-v2_001.jpg` | Alternate (bird is loose, not in tree) |
| `park-story_001/002.jpg` | v1 rejects — only 3 children (wrong count vs. Q16) |

Image is textless by design: students must read the article, not read a caption. It supports Q14 (bird in tree) and Q16 (count children) without giving away answers — both are verifiable from the image AND the text.

## 2. Audio Files (teacher presses play, does not read aloud)

Play in this order. File numbers match the test-day script (`../semester-test-teacher-script.md`).

| Order | File | Duration | When |
|-------|------|----------|------|
| 1 | `00-opening.mp3` | 0:34 | Students seated, before anything |
| 2 | `01-part-a.mp3` | 0:19 | Start of Part A |
| 3 | `02a-part-b-close.mp3` | 0:21 | **Students close papers** before listening |
| 4 | `02b-part-b1-passage.mp3` | 2:59 | "Pip at the Farm" — read **twice** with 2s sentence pauses, 5s gap between readings. Keep papers closed. |
| 5 | `02c-part-b-questions.mp3` | 0:14 | Students open papers, do B1 Q1–5 |
| 6 | `02d-part-b2-intro.mp3` | 0:15 | Before the 3 judge items |
| 7 | `02e-part-b2-items.mp3` | 0:17 | B2 items 6–8: sentence, 5s silence, sentence, 5s silence, sentence. Read **once** each. |
| 8 | `04-part-c.mp3` | 0:30 | Start of Part C (silent reading — audio is instructions only) |
| 9 | `05-part-d.mp3` | 0:42 | Start of Part D |
| 10 | `06-part-e.mp3` | 0:32 | Start of Part E |
| 11 | `07-part-f.mp3` | 0:19 | Start of Part F + collection |

(No 03 file: Part B's audio blocks are numbered 02a–02e to keep them grouped.)

**Every file is bilingual:** English narration first, 1.2s pause, Thai translation second — matching the bilingual paper decision.

**Total listening-section audio:** ~4:06. Whole-playback run: ~7 minutes of the 60-minute test.

## 3. Teacher fallback

If a file will not play, read the fallback text in `../semester-test-teacher-script.md` aloud — it is word-for-word the same script used to generate the audio (English lines and the listening passage). The Thai lines are printed in the script for reference.

## 4. Technical

- MP3, 32 kHz mono source → 128 kbps CBR concat, max volume −1.8 dB (no clipping), `ffmpeg` for silence/concat.
- Raw sentence clips kept in `audio/_work/` for re-editing (e.g., if you change pause lengths, rebuild `02b`/`02e` from `_work/farm_*.wav` and `_work/b2_*.wav`).
- Rebuild everything: `bash /tmp/opencode/build-test-audio.sh` (copy the script into the repo if you want it versioned).

---

**Copyright/IP note:** all images and audio here are generated for this test from our own lesson content (Learning Advantage/Reading Advantage in-house material). No third-party content.
