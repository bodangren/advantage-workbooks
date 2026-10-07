# Cover kit

The layers that every Primary Advantage cover shares (track `book_covers_20261007`). The cover
script puts the book art under these layers and sets the text on top.

| File | What | Source |
|---|---|---|
| `front-frame.png` | Level bar with "LV", PA logo, empty title banner | Canva export, page 8 (Origins 3.2 front) |
| `back-overlay.png` | Paper panel (84% opacity), RA logo, CEFR steps, QR code, wooden sign (85% opacity) | Canva export, page 9 (Origins 3.2 back) |
| `badge-a1.png` | CEFR badge A1 (levels 1–6) | Canva export, page 9 |
| `badge-a2.png` | CEFR badge A2 (levels 7–9: GSE 30–42), at the A1 place and size | Reading Advantage export, `Level 4 Back.svg` |
| `kit.json` | Source files with SHA-256; page size; layer files | made by the script |
| `refs/heroes.png` | The boy and the girl, cut from the Quest 4 front art | reference picture for Muse |
| `refs/fox.png` | The fox, cut from the Origins 3.2 front art | reference picture for Muse |

- **Size:** each layer is RGBA, 2480 × 3366 px (210 × 285 mm at 300 ppi). Canva drew the layer
  pictures at about 128 ppi, so the layers are not sharper than the Canva covers.
- **Export:** `Primary ADVANTAGE (210 x 285 mm) (210 x 285 mm).zip`, Canva SVG, 2026-10-07 (Daniel).
  The A2 badge comes from `Reading Advantage (210 x 285 mm).zip` (same date).
- **To make the kit again** (after a new Canva export):

  ```
  cd dashboard
  npx tsx scripts/covers/extract-kit.ts --front 8.svg --back 9.svg --badge "A2=Level 4 Back.svg"
  ```

  The script removes every other element from the page and renders the rest in Chrome with a
  transparent background, so the masks, clips, and opacities stay as Canva drew them.
