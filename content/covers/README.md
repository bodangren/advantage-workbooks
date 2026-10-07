# Cover data

One file per Primary Advantage book (`<book>.json`) and the series text (`series.json`), for the
cover script (track `book_covers_20261007`):

```
cd dashboard
npx tsx scripts/covers/make-cover.ts <book> --front --back
```

- **Schema:** `dashboard/lib/covers/schema.ts`. `art` names the front and back pictures (repo paths;
  `align.front`/`align.back` = `top` or `center`, default `center`) or one `wide` picture that the
  script cuts (back left, front right). `back.book` is the "About this book" paragraph; `back.canDo`
  has 2–4 points (the script adds "พร้อมก้าวสู่ {next} …").
- **No book names in the text.** Write `{book}`, `{series}`, `{next}`, and `{lessons}`; the script
  fills them from the book order. The copy check fails on a written name ("Origins 2"), on another
  series, and on "ก้าวแรก" after Origins 1.
- **Markup:** `**bold**`; `\n` for a forced line break. Lines break only at spaces; a `|` inside a
  long Thai run marks one more break point (it is not printed).
- **Fit:** the script fails when the text is longer than the paper panel or a run is wider than the
  box. `--draft` writes the PNG anyway, to see where the lines wrap.
- **Fonts:** Latin letters are League Spartan Bold, Thai is Noto Sans Thai (as in the Canva covers).
- Daniel checks every Thai line before a cover goes to print.
