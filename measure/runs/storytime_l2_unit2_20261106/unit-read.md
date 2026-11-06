# Unit read of weeks 9 to 16 (Task 1.10)

Date: 2026-11-07. Writer: Claude (this session). The read covers the 8 staged files `content/storytime/drafts/l2/w09.json` to `w16.json`, against the unit 1 files `content/storytime/l2/w01.json` to `w08.json`.

The read found 3 problems and fixed them (U1 and U2 in commit d1822c6, U6 in the next commit). It also records 3 items that need no change. `STAGE_CHECKS` passes after the fixes (`unit-read-stage-checks.txt` in this folder).

## Method

1. A script read all 16 files and listed the week titles, the book titles, the song titles, the last page of each book, the frames, and the new tricky words.
2. A script searched all image prompts of weeks 9 to 15 for cast problems: a wrong age sentence for Tom (8) or a child (5), a member of Tom's family in Nan's home, and Pam without her red dress.
3. The writer read the last two pages and their prompts of each book of weeks 7 and 9 to 13, and of week 2, by hand.
4. The writer took the family-word and vocabulary results from the per-week self-checks (`wNN-self-check.txt`, items 3 and 5).

## Findings and fixes

| # | Finding | Fix |
|---|---|---|
| U1 | The week 9 read-along "Yum!" repeated the twist of week 2 "How Many?". In both books, Pip eats the cake of the people, and the plate is empty. | The page 8 picture of week 9 changed. Pip now sits on a small chair at the lunch table with a napkin and his own puppy cake, and Nan laughs next to him. The page text "Pip likes cake. Yum!" and all script lines stay the same. Only the one `prompt` line of `w09.json` changed. |
| U2 | The recall cards of kind `sound` had no `audio` in all 8 unit 2 files. The unit 1 recall cards carry the audio of the same strip card (schema: "the existing strip card with its kind, text, week, and sound audio"). `set-phoneme-audio.ts` does not set recall cards. | Each recall sound card now has the audio of the strip card with the same letter (66 cards in the 8 files). The file names are the names that `set-phoneme-audio.ts` put on the strip cards, for example `phonemes/daniel/06-d.mp3`. No other bytes of the files changed. |
| U3 | No change. Two decodables of unit 2 end with a thing or a person on a person: "The den is on Dad!" (week 11) and "Pip is on Mom!" (week 13). Unit 1 has the same pattern 4 times (weeks 3, 4, 5, and 7). | Default: keep. Each twist has a different thing and a different person, and the "on" sentence is decodable practice. Daniel decides with the English text (Task 1.12). |
| U4 | No change. Week 11 "Where Is Pip?" (a hide-and-seek game; Pip sits behind Nan) and week 7 "Is It a Ball?" (a guess under a blanket; Pip jumps out) both find Pip. | Default: keep. The stories and the twists are different: in week 11, Pip was behind the seeker all the time. |
| U5 | No change. Most read-alongs show a hint of Pip on page 7 (a tail, an ear, or a nose). | Default: keep. This is the hint device of unit 1: page 7 of weeks 2, 5, 6, and 7 shows a hint of Pip, and page 7 of week 3 shows his paw prints. |
| U6 | Found during Task 2.1, after the first unit read commit. The 7 family pictures of week 13 (run, jump, walk, clap, kick, throw, catch) showed an unnamed child ("One child with short brown hair, a yellow T-shirt, and blue shorts"). That is a new character, and D4 allows the unit 1 cast only. The unit 1 family pictures show cast children (for example Sam in week 5). | Each week 13 family picture now shows one cast child with the age sentence, and its `characters` field names the child: Sam (run), May (jump), Ben (walk), Mia (clap), Pat (kick), Lily (throw), and Tom (catch). Only the 7 family images of `w13.json` changed. |

## Check results

1. Family words. In each teaching week, every family word is on a book page or in a song line (self-check item 5, weeks 9 to 15: "none" missing). Week 16 has the word list of the unit (31 words) and no books, as week 8.
2. Titles. No week title, book title, or song title repeats in weeks 1 to 16. No twist repeats after fix U1.
3. Sight words. Weeks 1 to 15 teach 38 tricky words, and each word is new once. Unit 2 teaches 19: are, has, cannot (9); they, too, were (10); me, of (11); it, said, that (12); do, for, like (13); you, goes (14); his, no, my (15).
4. Cast. The script found no problem with the ages, the homes, or Pam. The hand read of Task 2.1 found U6 (an unnamed child in the week 13 family pictures). Tom has the age sentence "about eight years old", and the class children have "about five years old". Tom and the adults of his family (Mom, Dad, Grandma, Grandpa) are in no picture of Nan's home. Lily is in the class, so she visits Nan's home with the class children in week 11. The look sentences of Nan and Pip come from one helper. Tom's living room has the green sofa, the window, and the small brown rug, as in week 7.
5. Vocabulary share of each read-along (design 6.2 text gate, 90 percent; names and family words are not counted):

| Week | Read-along | Words | Starters share | Not Starters |
|---|---|---|---|---|
| 9 | Yum! | 32 | 65 percent (100 percent with the frame word "Yum", Q-A) | Yum |
| 10 | Dress Up! | 34 | 96 percent | T (of the family word "T-shirt") |
| 11 | Where Is Pip? | 40 | 100 percent | none |
| 12 | Open Your Book! | 32 | 100 percent | none |
| 13 | Look at Me! | 24 | 94 percent | hop |
| 14 | Hot and Cold | 26 | 100 percent | none |
| 15 | Look, a Bus! | 26 | 100 percent | none |

6. `STAGE_CHECKS` after the fixes U1, U2, and U6: exit 0, "Summary: 16 package(s), 0 failed check(s), 2 warning(s)". The warnings are the allowed `print-missing` warnings of st2/8 and st2/16. Each of st2/9 to st2/15 has 38 PASS, and st2/16 has 18 PASS.

## Open items

- The independent English review of each week (FR-2.8) is open. The orchestrator runs it on the English review extract of Task 1.11.
- Daniel's English check (Task 1.12) and Daniel's check of all Thai drafts are open.
