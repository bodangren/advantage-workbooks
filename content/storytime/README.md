# Storytime Advantage content

One file per week of the kindergarten to P2 phonics program (track `storytime_week_package_20261022`).

- `l<level>/w<nn>.json`: the week package, schema `dashboard/lib/storytime/schema.ts` (`meta.program = "storytime"`, `meta.shape = "storytime-week"`). Level 1 = Anuban 2, Level 2 = Anuban 3, Level 3 = P1, Level 4 = P2.
- `l<level>/media/w<nn>/`: the pictures, the book and song audio, and the videos of the week.
- URL key `st<level>/<week>`; the public QR page is `/th/st/<level>/<week>`. Injector key: (program, level, week).
- Checks: `dashboard/lib/storytime/checks.ts`. Teacher's book PDF: `npx tsx scripts/storytime/make-manual-pdf.ts --level <n>` (in `dashboard/`, under the heavy-job lock).

The design is the Storytime track in the monorepo (`measure/tracks/storytime_advantage_program_20261021/design.md`). The Storytime session sends the sequence rows and reviews each week; Daniel checks all Thai. Forge delivers the cast renders to `~/Desktop/advantage-forge/out/chibi-sprouts/r1/`; copy what a week uses into its media folder.
