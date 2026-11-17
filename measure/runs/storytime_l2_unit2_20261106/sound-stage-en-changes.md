# The day-1 lines of unit 2, weeks 9 to 16 (Task 3.6)

The English of `opening.pa[0]` before and after the Green edit. Before is the state at commit 541c5851. After is the state at commit b14d15ee. The table shows the changes of commit b14d15ee.

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

Commit b14d15ee replaced the approved `opening.pa[0]` English, Thai, and audio of 7 weeks (w09, w11 to w16) with copies. The commit set `focus.paStage` to stage 2 with the positions `first` and `last` on the 8 files. The commit added `english.phonics.pa.final-sound.identify` to the week 9 `tags.taught` list. The PM audit of 2026-11-17 found this wrong. A correction commit restored the 7 entries to their 541c5851 values. No English line changes again before Daniel answers the before and after list in the 11-28 batch.
