# Spec Review: storytime_print_r1_20261025

## Author record: print audit gate and r6-v2 fix batch (2026-11-14)

Author model: claude-code/claude-sonnet-5-5#high (Build session, 2026-11-14)

Scope: the section "Addendum 2026-11-14: print audit gate, code tests, and the r6-v2 fix batch" of [spec.md](./spec.md), the five tasks after the release proof task of Phase 9 in [plan.md](./plan.md), and [print-audit-code-tests.md](./print-audit-code-tests.md), at commit 4c7584d8.

This file had no earlier section. The earlier phases of this track recorded their review rounds in `plan.md`. The independent review of this addendum is the plan task "Spec review, r6-v2 fix batch". Its result goes into the section `## Amendment: print audit gate and r6-v2 fix batch (2026-11-14)` of this file, with the line `Reviewer model: <route>`. That section does not exist yet.

## Amendment: print audit gate and r6-v2 fix batch (2026-11-14)

Author model: claude-code/claude-sonnet-5-5#high (Build session, commits 4c7584d8 and 7415de92)

Reviewer model: opencode-go/deepseek-v4.1-flash (a substitution: the planned route `kimi-code-plan-cn/kimi-for-coding#high` was on WAIT, and `ra-quota` skipped the Go route for a missing 5-hour window. The Go plan was at 11.5 % of its weekly limit.) The review ran in two sessions because of a step limit.

Scope: the section "Addendum 2026-11-14: print audit gate, code tests, and the r6-v2 fix batch" of [spec.md](./spec.md) (P9-A1 to P9-A11, Q9-1 to Q9-5), the five new Phase 9 tasks of [plan.md](./plan.md) (lines 1385 to 1403), and [print-audit-code-tests.md](./print-audit-code-tests.md), at the audited head bac87517.

Status: pass (0 Blockers; the gate PASS on the audited head bac87517; answers in this commit)

The reviewer reproduced the four P9-A5 fills (areas 157420, 187021, 186107, 214243; the boxes are equal) and all six SHA-256 values. The CSS facts of P9-A6 to P9-A8 match the files. The orchestrator role gate printed "PASS: spec-review gate passed". The review found 0 Blockers, 0 Majors, and 3 Nits.

### F1 [Nit]: the tick offset of P9-A7 has no reason and no pin

FIX: the reason is centering. The old border of 0.4 mm was centered on the perforation line by `left: -0.2mm`. The new border of 2 px (0.53 mm) is centered by about `-0.265mm`, so the offset `-0.25mm` stays. Answer: P9-A7 of [spec.md](./spec.md) now states this reason and the split of 0.25 mm left and 0.28 mm right. The case X6 of the Red task in [plan.md](./plan.md) now pins the offset `-0.25mm`. This is the only change to the plan text.

### F2 [Nit]: 11 rows under a count of 10 minors

FIX: name the 10 minors of the audit summary, and say that E22 makes 11 rows. Answer: the request line of the addendum now reads "10 minors in the audit summary (A6, B1, B3, B4, C2, D1, D2, D5, D7, F3)" and says that the J1 re-check table also marks E22 as a minor, so 11 rows need a decision from Daniel. The line in the file at the audited head already named 10 ids and no E22 (the reviewer quoted it with E22). The count and the E22 note are now exact.

### F3 [Nit]: the header of the code-test list names the v0.1 SHA-256

FIX: use `3ba657f39bcfc781da581bff93df6a7245f674df4deac023576f5d52ad0aba81` (PR package version 0.2, receipt sent 12:45 ICT; the PM accepted this fix). Answer: the header of [print-audit-code-tests.md](./print-audit-code-tests.md) now holds this value. The request line of the addendum in [spec.md](./spec.md) held the same v0.1 value, so it holds the v0.2 value and the receipt time 12:45 ICT now.

Result file: `measure/runs/storytime_print_r1_20261025/spec-review-p9a-bac87517.json` (log: `spec-review-p9a-bac87517.log`).

Transcribed 2026-11-14 by the orchestrator build session, because the review role cannot write track files.

## Amendment: C2, F3, and the week 8 review pages (2026-11-14)

Author model: claude-code/claude-sonnet-5-5#high

Reviewer model: kimi-code-plan-cn/kimi-for-coding#high

Scope: the section "Addendum 2026-11-14 (2): C2, F3, the week 8 review pages, and the cast sheet" of [spec.md](./spec.md) (P9-B1 to P9-B19, Q9-6 to Q9-11), the plan lines 1410 to 1415 of [plan.md](./plan.md), and the gate commands `RED_TEST_COMMAND_P9B` and `GREEN_TEST_COMMAND_P9B`.

Audited head: 15ea495d36d69c177e7dda481a782fcebac9589a

Status: pass at da3abcb6 (re-check of the reviewer; F1 to F4 withdrawn; F1 closed by PM decision P9-B20).

Re-check result files: measure/runs/storytime_print_r1_20261025/spec-review-p9b-da3abcb6.json and .log (commit 5f8f333).

PM correction (PM stamp 23:10 ICT, exact words): "Correction first: "read the words and match them to pictures" was MY brief, not Daniel's words. Daniel said only "Add review pages". So these are PM decisions, and no question goes to Daniel". The reviewer quoted the brief as the order of Daniel. The brief is a PM text, so the finding and the answers below follow the PM correction.

Checks that passed: the C2 ink measure of all 32 values (each at or above 0.02 em; the old c 0.0043 em and the old S 0.0163 em fail); the F3 list; the 20 picture rows and texts; the 4 sentences (E2-style check; "Pip" passes as a reader name); the page arithmetic; the pin grep (11 hits: 8 real, 3 false positives); the roles; the F3 commit gate. The review found 0 Blockers, 1 Major, and 3 Nits. The retry recommendation of the reviewer is escalate_human.

### F1 [Major]: the review pages match short decodable sentences, not single words

Finding: the 16 match pairs are short decodable sentences. The PM brief says "read the words and match them to pictures". The repo holds single-word object pictures for ant, pot, and mop only, and the brief forbids new generation. The pupil task differs from the briefed task, so a decision is needed.

FIX: add an explicit decision to [spec.md](./spec.md). Answer: closed by PM decision P9-B20. Row P9-B20 and the default of Q9-9 now state: "PM decision (2026-11-14, PM stamp 23:10 ICT): option A, short decodable sentences matched to existing story pictures. No paid generation and no cut script. The words 'read the words and match them to pictures' came from the PM brief; Daniel's words were only 'Add review pages'." The PM words are quoted in P9-B20. The options B and C and the Red retry path are removed, and no question goes to Daniel.

### F2 [Nit]: day 5 omits weeks 1 and 6

Finding: day 5 takes its items from weeks 2, 3, 4, 5, and 7. The reason for week 1 is recorded. The reason for week 6 is not.

FIX, PM decision: add one line to P9-B10. Answer: P9-B10 of [spec.md](./spec.md) now holds: "Day 5 has no week 6 item, because day 3 already reviews weeks 5 and 6, and 4 pairs and 1 sentence cover 5 of the 6 weeks with decodable text (weeks 2 to 7)." PM decision (2026-11-14, PM stamp 23:10 ICT): day 5 without weeks 1 and 6 is accepted. It is not a Daniel choice.

### F3 [Nit]: a table-relative C2-book case cannot catch the left-middle mutant

Finding: the left-middle mutant (x 0.1, y 0.25) sits on glyph ink for c and d (0.039 em and 0.042 em). C2-ink catches the combined mutant only through s. A C2-book case that compares a dot with the table that placed it cannot catch a partial mutant of c or d.

FIX: state absolute positions in P9-B5 and in the C2-book case. Answer: P9-B5 of [spec.md](./spec.md) (the decision row and the case text) now holds: "C2-book asserts the absolute dot positions of spec fact 2 (car, kite, drum, can, see, saw) within 0.3 mm, not only the agreement with the table."

### F4 [Nit]: RM-decodable needs the reader names and no ratio for each text

Finding: the decodable check excepts the names of the source reader ("Pip" for week 6). A text such as "Pip sat on the mat!" alone is 4 of 5 decodable (0.8). A ratio assertion for each text fails the own data of the page. The E2 check computes the ratio over the whole book.

FIX: state the names and drop the ratio in P9-B13. Answer: P9-B13 of [spec.md](./spec.md) now holds: "RM-decodable passes the names of the source reader to the decodable check and asserts 0 untaught words for each text; it asserts no ratio for each text."

Result file: `measure/runs/storytime_print_r1_20261025/spec-review-p9b-15ea495d.json` (log: `spec-review-p9b-15ea495d.log`, commit f86763d3).

Transcribed 2026-11-14 by the orchestrator build session, because the review role cannot write track files. The task in [plan.md](./plan.md) stays open until the re-check of the reviewer confirms the final status. The correction of PM stamp 23:10 ICT was added in a second commit.
