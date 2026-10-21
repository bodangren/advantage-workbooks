# Storytime Advantage content

One file per week of the kindergarten to P2 phonics program (track `storytime_week_package_20261022`).

- `l<level>/w<nn>.json`: the week package, schema `dashboard/lib/storytime/schema.ts` (`meta.program = "storytime"`, `meta.shape = "storytime-week"`). Level 1 = Anuban 2, Level 2 = Anuban 3, Level 3 = P1, Level 4 = P2.
- `l<level>/media/w<nn>/`: the pictures, the book and song audio, and the videos of the week.
- URL key `st<level>/<week>`; the public QR page is `/th/st/<level>/<week>`. The package keeps the path only (`home.songUrl`, `home.readAlongUrl`); the printed QR code adds the host `https://primary.reading-advantage.com` (the live Primary app, as the printed `/b/` codes; Monorepo, 2026-10-22). Daniel confirms the host before the first print run. Injector key: (program, level, week).
- Production rule exception (Storytime, 2026-10-22): a week before the first vowel (only Level 2 week 1, n) cannot have a decodable text. Its decodable is a sound book, `soundBook: true`: one picture word on each page ("A nest."), the tricky words of the week, and a names twist on the last page. Every later week keeps the 90 percent decodability rule.
- Song: `song.lyricSheet` is the lyric exactly as the music model gets it (`[intro]`, `[verse]`, `[chorus]`, `[outro]` on their own lines); `song.lines` are its sung lines in order, each with a gesture and a picture. A generated song can sing other lines than the sheet (week 1: one sheet line is not sung, and the chorus repeats a line). Then `song.lines` and `song.times` follow the audio, and the `song-sheet` check gives a warning that names the first difference.
- English with Thai (`{ "en": ..., "th": ... }`): the step titles and notes, the prep lines, the song notes, the home card, and the three focus texts `focus.element.action`, `focus.paSkill`, and `focus.family.name`. An empty `th` prints the English.
- Checks: `dashboard/lib/storytime/checks.ts`; `npx tsx scripts/storytime/check-weeks.ts --level <n>` (in `dashboard/`). Teacher's book PDF: `npx tsx scripts/storytime/make-manual-pdf.ts --level <n>` (in `dashboard/`, under the heavy-job lock).

The design is the Storytime track in the monorepo (`measure/tracks/storytime_advantage_program_20261021/design.md`). The Storytime session sends the sequence rows and reviews each week; Daniel checks all Thai. Forge delivers the cast renders to `~/Desktop/advantage-forge/out/chibi-sprouts/r1/`; copy what a week uses into its media folder.
