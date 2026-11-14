# Spec Review: storytime_week_package_20261022

## Amendment: Phase 10 (2026-11-07)

Author model: claude-code/claude-opus-5-5[1m]

Scope: the section "Addendum 2026-11-07: family-word pictures for the app (Phase 10)" of [spec.md](./spec.md), the amendment line under E5, and the section "Phase 10: Family-word pictures for the app (2026-11-07 to 2026-11-12)" of [plan.md](./plan.md).

Status: pass (2026-11-07; answers in commit 7f587966)

F1: FIX, every Phase 10 gate that runs PROJECT_TESTS adds the loops R3 exclude `--exclude "**/storytime-loops-share-content.test.ts"` while that window is open; the verification task runs with no exclude after the loops switch commit, or names the exclude (spec H14, plan rule R3 paragraph and verification task).
F2: FIX, H12 now states the real w01 r2 form (line 68: an empty `old-sha256:` value for a new file) and uses that empty form for the new revisions, also an empty `new-sha256:` for a removed file.
F3: FIX, the package build gate loops over weeks 01 to 07 with each folder name and family count, and prints nothing when all counts match.
F4: FIX, H9 names the row label exactly: `The family-word pictures named in the package exist`.
F5: FIX, H8 says that the PM gives Forge the H3 file-name pattern and the H8 MANIFEST form (sent to the PM on 2026-11-07); the Forge delivery task records the PM's confirmation or the names that Forge used.

## Amendment: Phase 11 (2026-11-07)

Author model: claude-code/claude-opus-5-5[1m]

Reviewer model: deepseek/deepseek-flash#high

Scope: the section "Addendum 2026-11-07, Phase 11: word clips and the song video lead-in (2026-11-07 to 2026-11-14)" of [spec.md](./spec.md) and the section "Phase 11: Word clips and the song video lead-in (2026-11-07 to 2026-11-14)" of [plan.md](./plan.md), at commit 5d80aae7, HEAD 84a90f60.

### What this track proposes

Phase 11 gives each word of the 14 read-along and decodable books of Level 2 weeks 1 to 7 its own recorded clip, so a tap on a word plays that clip and no cut of the sentence audio (Daniel, 2026-11-07). The phase adds `books[].audio.wordClips` to each book and `song.videoLeadInSeconds` where a song video ships. 62 of the 101 distinct book words already have a bank row, and the other 39 get a new clip from the bank voice and settings. The bank grows from 98 rows to 137, and a new pure module pins the key rule, the path rule, the map, the heard check, and the lead-in math. Three new scripts make the clips, write the maps, and measure the lead-in, and two new check rows report a missing clip and a missing lead-in. The mapper copies each bank mp3 into the week folder, so the seven weeks ship 163 clip files. The phase delivers `w01-storytime-app-package-r4` by 2026-11-10 and `w02` to `w07` `-r3` by 2026-11-14, and w08 gets no field and no revision.

### How the current system works, per this spec

The bank at `content/storytime/words/` holds 98 WAV and mp3 files with a Python `indent=1` manifest, and each row holds the SHA-256 of the WAV file only. `BookAudioSchema` and `SongSchema` are not strict, so a parse today drops an unknown key such as `wordClips`. `check-weeks.ts` has no row that reads a word clip, and the Monorepo receiver is `passthrough` for both objects. w01 has `song.mp4` and `song-phone.mp4` outside git, weeks 2 to 7 have `song.mp3` only, and w08 has no book and no song.

### Zoom-out

Both PM requests are met: the clip takes the K3 path with the K2 key rule and a fixed citation text for two function words, and the lead-in comes from a silencedetect measure on the w01 videos. Daniel words rule out a slice of the sentence audio, so the plan reuses the 62 bank words and makes only the 39 missing words.
 The K17 contract gives the receiver the object shape, the key rule, the relative path, and the meaning of an absent field, so the Monorepo needs no new guess. The dates hold: w01 r4 by 11-10 and the six r3 folders by 11-14, provided the run order holds and Review A closes before the r3 build.

### Risks

- `schema.ts` is shared with the loops track, and 41 test files parse week files through `StorytimeWeekSchema`; K15 names the two files that must change, and the clean `git status` rule before the edit covers the rest.
- The bank manifest edit must keep the Python `indent=1` form, and K6 pins the test command that prints `True`.
- The bank maker needs the faster-whisper venv at `~/.local/share/storytime-word-audio-venv`, which lives outside the repositories (tech-debt row).
- The 4 w01 song files are outside git (`.gitignore` lines 26 to 30), so the lead-in measure reads the work tree after the SHA-256 check against the r3 MANIFEST.

### Findings

- F1 [Major] spec K12 and FR 6 (`checkWordClips`): the text pins the signature `checkWordClips(week, contentRoot)` and the K3 path `l{level}/media/w{nn}/words/wa-{stem}.mp3`, but it never names the source of the level and week number, and the signature receives neither. Rationale: the implementer must choose that source, and `week.meta.level` with `week.meta.week` (StorytimeMetaSchema) is the only source that the parsed week holds. Fix: state that the check reads `week.meta.level` and `week.meta.week`, and that a week with no `meta` gets no row.
- F2 [Nit] spec K12 (the `differs from bank` detail): K12 compares the clip with the SHA-256 of the bank mp3 of the row, while every row `sha256` value is the WAV hash. Rationale: an implementer could compare with the row value and fail every clip, so the text must say that the check hashes the bank mp3 file at run time and that the 98 rows do not change. Fix: add that sentence to K12.
- F3 [Nit] K8 and FR 3: the maker uses the first written form in the books of its --week; a key with no form there keeps its bank row text. Rationale: K8 gives the first written form over the whole level, but the maker of FR 3 reads one week.
- F4 [Nit] plan Phase 11: an absent faster-whisper venv stops the bank maker with exit 2 and a named message. Rationale: K9 sets the default to plain python3, which has no faster_whisper module, and no text names the failure.
- F5 [Nit] FR 4: keys counts key slots per book with repeats (w01 23); files counts distinct clip paths (w01 22). Rationale: the plan expects keys: 23 and files: 22, and no text defines either count.

Status: pass

Transcribed 2026-11-07 by the plan author session from spec-review-p11-5d80aae7.json, because the review role cannot write track files (orchestrator deviation).

## Amendment: Phase 13 (2026-11-14)

Author model: claude-code/claude-sonnet-5-5#high

Reviewer model: coding-plan/glm-5.3-flash#high (family GLM, not Anthropic)

Scope: the section "Addendum 2026-11-14, Phase 13: read-along sentence clips (2026-11-14)" of [spec.md](./spec.md) and the section "Phase 13: Read-along sentence clips and the log of the makers (2026-11-14 to 2026-11-16)" of [plan.md](./plan.md), at the audited head c42918df.

Route note: the plan default route deepseek/deepseek-flash#high is pay per token and in WAIT, so the orchestrator chose coding-plan/glm-5.3-flash#high. GLM is not the Anthropic family, so decision M1 and rule L15 hold for this role.

### What this track proposes

Phase 13 gives each sentence of the 7 read-along books of w01 to w07 its own clip: 72 clips, 927 characters for one take of each, and 2,800 characters sent at most. It writes `books[].audio.sentenceClips` into the 7 week files and builds the folders r6 (w01) and r5 (w02 to w07). It also closes the Phase 12 Review A findings F1, F2, F6, and F7. The first paid run waits for the MiniMax reset on 2026-11-15 23:00 ICT.

### Findings

- F1 [Major] spec M3 (line 849): the text said a run with `kinds` "never reads" a provenance item of the other kind, and M4 merges the whole provenance file. FIX: M3 now says "never changes or removes" an item of the other kind. It names the one read that M4 needs: the parse of the whole `sentences/manifest.json`, with the items of the other kind, which stay unchanged.
- F2 [Major] spec M6 (the kept line): the line named no separator. FIX: M6 pins the exact bytes: the word `kept`, one tab character, the relative file path, and a newline (the tab rule of the call line). The same form is now in Red N3, Red N5 (new bullet), AC13-7 (both dry runs), and the plan Green 1 live proof (`--kind decodable` dry run).
- F3 [Major] plan Thai rule: `dashboard/__tests__/storytime-package-practice-clips.test.ts` line 1533 holds 10 Thai characters in a fixture string. FIX: the plan Thai rule and spec M16 name the file and the line. A non-Claude role reads this file, and any failure capture of it, only through a filter that masks Thai. A direct read is not allowed.
- F4 [Nit] plan Spend paragraph: the quota read was given to "the Green role". FIX: the text now says "the role that runs the command", because the Clips task runs the real mmx runs.

Status: pass (0 Blockers; the gate PASS at 23:48 on the audited head c42918df; answers in the commit that holds this section)

Result file: `measure/runs/storytime_week_package_20261022/spec-review-p13-c42918df.json` (the log: `spec-review-p13-c42918df.log`).

Transcribed 2026-11-14 by the orchestrator build session, because the review role cannot write track files.

## Amendment: Phase 14 (2026-11-14)

Author model: claude-code/claude-opus-5-5[1m]#high (Build session, 2026-11-14)
