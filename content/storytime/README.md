# Storytime Advantage content

One file per week of the kindergarten to P2 phonics program (track `storytime_week_package_20261022`).

- `l<level>/w<nn>.json`: the week package, schema `dashboard/lib/storytime/schema.ts` (`meta.program = "storytime"`, `meta.shape = "storytime-week"`). Level 1 = Anuban 2, Level 2 = Anuban 3, Level 3 = P1, Level 4 = P2.
- `l<level>/media/w<nn>/`: the pictures, the book and song audio, and the videos of the week.
- URL key `st<level>/<week>`; the public QR page is `/th/st/<level>/<week>`. Injector key: (program, level, week).
- Production rule exception (Storytime, 2026-10-22): a week before the first vowel (only Level 2 week 1, n) cannot have a decodable text. Its decodable is a sound book, `soundBook: true`: one picture word on each page ("A nest."), the tricky words of the week, and a names twist on the last page. Every later week keeps the 90 percent decodability rule.
- Song: `song.lyricSheet` is the lyric exactly as the music model gets it (`[intro]`, `[verse]`, `[chorus]`, `[outro]` on their own lines); `song.lines` are its sung lines in order, each with a gesture and a picture.
- Checks: `dashboard/lib/storytime/checks.ts`; `npx tsx scripts/storytime/check-weeks.ts --level <n>` (in `dashboard/`). Teacher's book PDF: `npx tsx scripts/storytime/make-manual-pdf.ts --level <n>` (in `dashboard/`, under the heavy-job lock).

The design is the Storytime track in the monorepo (`measure/tracks/storytime_advantage_program_20261021/design.md`). The Storytime session sends the sequence rows and reviews each week; Daniel checks all Thai. Forge delivers the cast renders to `~/Desktop/advantage-forge/out/chibi-sprouts/r1/`; copy what a week uses into its media folder.
