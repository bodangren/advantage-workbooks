# The day-1 lines of unit 2, weeks 9 to 16 (Task 3.6)

The English of `opening.pa[0]` before and after the Green edit. Before is `git show HEAD:`. After is the working tree at the content commit.

| Week | Source week | Before (HEAD) | After | Equal to source |
|---|---|---|---|---|
| w09 | w08 | "Listen: dog. What is the first sound? /d/! Listen: bed. What is the last sound? /d/!" | "Listen: nose. What is the first sound? Nnn! Listen: nnn - /a/ - /p/. What is the word? Nap!" | yes |
| w10 | w10 | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w11 | w10 | "Listen: egg. What is the first sound? /e/! Listen: ten. What is the middle sound? /e/!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w12 | w10 | "Listen: hat. What is the first sound? /h/! Listen: horse. What is the first sound? /h/!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w13 | w10 | "Listen: pot. What is the first sound? /p/! Listen: hot. What is the first sound? /h/! Pot, hot: the end is the same: -ot!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w14 | w10 | "Listen: fish. What is the first sound? Fff! Listen: off. What is the last sound? Fff!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w15 | w10 | "Listen: goat. What is the first sound? /g/! Listen: dog. What is the last sound? /g/!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |
| w16 | w10 | "Listen: duck. What is the first sound? /d/! Listen: /d/ - /o/ - /t/. What is the word? Dot!" | "Listen: man. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/! Man, pan: the end is the same: -an!" | yes |

w10: unchanged, its own line already passes sound-stage-day1. The chain source for w10 is w08, and that line names /a/, which is the new sound of week 10.

The copy is the day-1 line of week 8 for w09, and the day-1 line of week 10 for w11 to w16. `opening.audio[0]`, the 4 day-1 audio files, is copied with the same line.

No `focus.paSkill` text and no `opening.pa` English text was rewritten. Task 3.6 copied 7 day-1 entries, kept the w10 entry, set `focus.paStage` to stage 2 with positions `first` and `last` on the 8 files, and added `english.phonics.pa.final-sound.identify` to the week 9 `tags.taught` list.
