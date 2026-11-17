# The sound stage residual of unit 2, weeks 9 to 16 (Task 3.6)

Source: `measure/runs/storytime_l2_unit2_20261106/sound-stage-residual.ts`, run with `npx tsx` from `dashboard/`. The script reads the 8 staged files through `soundUnits` and `checkSoundStagePlan` of `dashboard/lib/storytime/sound-stages.ts`.

## The units that ask two or more positions

| Week | Path | Positions | First 60 English characters |
|---|---|---|---|
| w09 | `focus.paSkill` | first+last | the first sound /d/ and the last sound /d/; blend three soun |
| w09 | `opening.pa.1` | first+last | "Listen: duck. What is the first sound? /d/! Listen: sad. Wh |
| w09 | `scripts.0.steps.0` | first+last | When the script says /d/, say the short sound: the tip of th |
| w09 | `scripts.0.steps.3` | first+last | First by ear: keep the picture cards dad, sad, and nod face  |
| w10 | `scripts.0.steps.0` | first+last | This week has no new letter. The class hears and reads two w |
| w11 | `focus.paSkill` | first+middle | the first sound /e/ and the middle sound /e/; blend three so |
| w11 | `opening.pa.1` | first+middle | "Listen: elephant. What is the first sound? /e/! Listen: pen |
| w11 | `scripts.0.steps.0` | first+middle | When the script says /e/, say the short sound, as in "egg":  |
| w11 | `scripts.4.steps.4` | first+middle | Children do the check page: in rows 1 and 2, circle the pict |
| w11 | `check.items` | first+middle |  |
| w13 | `scripts.0.steps.0` | first+last | This week has no new letter. The class hears and reads two w |
| w14 | `focus.paSkill` | first+last | the first sound /f/ and the last sound /f/; blend three soun |
| w14 | `scripts.0.steps.0` | first+last | When the script says fff or /f/, say the long quiet sound: t |
| w14 | `scripts.0.steps.3` | first+middle | First by ear: keep the picture cards fan, fish, and foot fac |
| w15 | `focus.paSkill` | first+last | the first sound /g/ and the last sound /g/; blend three soun |
| w15 | `opening.pa.1` | first+last | "Listen: girl. What is the first sound? /g/! Listen: bag. Wh |
| w15 | `scripts.0.steps.0` | first+last | When the script says /g/, say the short sound: the back of t |
| w15 | `scripts.4.steps.4` | first+last | Children do the check page: in rows 1 and 2, circle the pict |
| w15 | `check.items` | first+last |  |
| w16 | `focus.paSkill` | first+last | the mixed sound game over the seven sounds of unit 2: first  |
| w16 | `scripts.0.steps.0` | first+last | Children open the student book at the Benchmark 2 page. Each |
| w16 | `benchmark.paper.items` | first+last |  |

Total: 22 units. Per week: w09 4, w10 1, w11 5, w12 0, w13 1, w14 3, w15 5, w16 3.

The `sound-stage-mix` row fails for the 7 weeks that hold one of these units: w09, w10, w11, w13, w14, w15, and w16. Week 12 holds none and passes.

## (a) The schema line that pins 5 opening.pa entries

`dashboard/lib/storytime/schema.ts:766: pa: z.array(BiTextSchema).length(5),`

The pin means an opening line cannot become two entries. A split position of D-U2-S3 stays inside one `opening.pa` entry, or it needs a new line in a different field.

## (b) The sound-stage-plan detail of weeks 11 and 14

- w11 (fail): outside stage: focus.paSkill (middle); outside stage: opening.pa.1 (middle); outside stage: scripts.0.steps.0 (middle); outside stage: scripts.0.steps.3 (middle); outside stage: scripts.4.steps.0 (middle); outside stage: scripts.4.steps.3 (middle); outside stage: scripts.4.steps.4 (middle); outside stage: check.items (middle); tag outside stage: english.phonics.pa.medial-vowel.identify
- w14 (fail): outside stage: scripts.0.steps.3 (middle)

`SOUND_STAGE_PLAN` starts `middle` in week 17, so `middle` is outside the stage of these weeks.

## (c) The units that need new English and new Thai from a Claude role

Each unit below must lose its second position in English. A new Thai line goes with each new English line. A non-Claude Green role writes no Thai, and it cannot split an `opening.pa` entry because of the schema pin.

- w09: `focus.paSkill` (first+last), `opening.pa.1` (first+last), `scripts.0.steps.0` (first+last), `scripts.0.steps.3` (first+last)
- w10: `scripts.0.steps.0` (first+last)
- w11: `focus.paSkill` (first+middle), `opening.pa.1` (first+middle), `scripts.0.steps.0` (first+middle), `scripts.4.steps.4` (first+middle), `check.items` (first+middle)
- w13: `scripts.0.steps.0` (first+last)
- w14: `focus.paSkill` (first+last), `scripts.0.steps.0` (first+last), `scripts.0.steps.3` (first+middle)
- w15: `focus.paSkill` (first+last), `opening.pa.1` (first+last), `scripts.0.steps.0` (first+last), `scripts.4.steps.4` (first+last), `check.items` (first+last)
- w16: `focus.paSkill` (first+last), `scripts.0.steps.0` (first+last), `benchmark.paper.items` (first+last)
