# Week 15 lyric rewrite r2 (D17)

- Week: 15, key `st2/15`, Level 2 Unit 2
- Title: Look, Look, Look!
- BPM: 104
- Rule: spec D17 (the PM decision of 2026-11-09) and the song text rule of the series plan
- Role: text only, a non-Claude route. No audio and no paid call.
- Status of the present take: `l2-w15-song-c2.mp3` is the fallback. It is staged with week 14. The week file changes only after Daniel picks one of the new takes.
- Revision: r2 with the chorus hook and README fixes from the orchestrator review.

## Lyric sheet

[Verse 1]
Look, a bus! Beep, beep, beep!
Look, a train! Choo, choo, choo!
Look, a car! Drive, drive, drive!
Look, a bike! Ride, ride, ride!

[Chorus]
Look, look, look around!
Look, look, look with me!

[Verse 2]
Look, a boat! Row, row, row!
Look, a truck! Big, big, big!
Look, a plane! Fly, fly, fly!
Look, a helicopter! Up, up, up!

[Chorus]
Look, look, look around!
Look, look, look with me!

[Ending]
Wave goodbye! Time to go home!

## Style brief

Bouncy travel song, 104 bpm, A major, the melody between E4 and E5, one warm clear female lead with an American accent sings each "Look" line, every word slowly and clearly sung, a small group of singers sings the three short words after it, ukulele, hand claps, glockenspiel, soft upright bass, dry and uncluttered. The song has two melodies. The verse melody walks up on each "Look, a" line and lands three times on the action words. The chorus melody sings one short hook, "Look, look, look", two times: the first line ends on "around" and the second line ends on "with me". The last line slows and settles on the home note, so the ending is clear. The singing starts after a short instrumental intro. The song is about 70 seconds long.

## Line plan

Line numbers are the new sung lines, from 1. "Kept: present line N" means the line keeps the picture of line N of the present week file. `imageOf` uses the new line number and the index of the week file is that number minus 1.

| # | Sung line | Part | Gesture | Picture |
|---|---|---|---|---|
| 1 | Look, a bus! Beep, beep, beep! | Verse 1 | point forward | kept: present line 1 (bus, Sam) |
| 2 | Look, a train! Choo, choo, choo! | Verse 1 | march | kept: present line 2 (train, May) |
| 3 | Look, a car! Drive, drive, drive! | Verse 1 | reach | kept: present line 3 (car, Ben) |
| 4 | Look, a bike! Ride, ride, ride! | Verse 1 | hop | kept: present line 4 (bike, Mia) |
| 5 | Look, look, look around! | Chorus | look | imageOf new line 1 (bus picture, present line 1) |
| 6 | Look, look, look with me! | Chorus | point to self | imageOf new line 1 (bus picture, present line 1) |
| 7 | Look, a boat! Row, row, row! | Verse 2 | sway | kept: present line 7 (boat, Pat) |
| 8 | Look, a truck! Big, big, big! | Verse 2 | hands out | kept: present line 8 (truck, Lily) |
| 9 | Look, a plane! Fly, fly, fly! | Verse 2 | point up | kept: present line 11 (plane, Nan) |
| 10 | Look, a helicopter! Up, up, up! | Verse 2 | stretch up | kept: present line 12 (helicopter, the cast) |
| 11 | Look, look, look around! | Chorus | look | imageOf new line 1 (bus picture, present line 1) |
| 12 | Look, look, look with me! | Chorus | point to self | imageOf new line 1 (bus picture, present line 1) |
| 13 | Wave goodbye! Time to go home! | Ending | wave | imageOf new line 10 (helicopter picture, present line 12) |

## Checks B1 to B7

B1 PASS: the chorus has one short hook, "Look, look, look". It sings 2 times in each chorus (4 times in the song). The first line ends on "around" and the second line ends on "with me", so the two lines differ. The two choruses hold the same 2 lines, word for word.

B2 PASS: 8 family words, and each one sings in a "Look, a ___!" line with its own picture line: bus, train, car, bike, boat, truck, plane, helicopter. The frame "Look, a ___!" is on 8 sung lines (8 or more). The hook line has no frame, so the count is exactly 8.

B3 PASS: no new picture. The 8 word lines keep their present picture, and each row names it (present lines 1, 2, 3, 4, 7, 8, 11, 12). The 5 other lines (5, 6, 11, 12, 13) take `imageOf` of an earlier line with a picture: lines 5, 6, 11 and 12 point to line 1; line 13 points to line 10. No line points forward.

B4 PASS: each sung line has one gesture of the 24 names of `GESTURES`, and the gesture fits the line. The 8 word lines keep the gesture of the present line, because the picture shows that action. The hook uses look on "Look, look, look around!" and point to self on "Look, look, look with me!", and the ending uses wave on "Wave goodbye!".

B5 PASS: 13 sung lines and 72 sung words. The present take sings 12 lines of 6 words in 72.9 s. The estimate is about 71 s at 104 bpm: the 8 word lines run as they do now, and the 4 chorus lines and the ending line are short. That is near the 70 s target and the length of the present take.

B6 PASS: no sung letter name and no sung onset. The words are simple words for Level 2, and the spelling is American. The ending line "Wave goodbye! Time to go home!" says goodbye and stops the trip, so it closes the song.

B7 PASS: the style brief keeps 104 bpm, the key A major, the range E4 to E5, the solo female voice, and the instruments (ukulele, hand claps, glockenspiel, soft upright bass). It replaces the one-melody sentence with the two melodies and the clear ending. It has no "for a kindergarten English class", it says "singers" and not "young singers", it holds no "children" and no "five-year-olds", and it keeps "about 70 seconds long".
