# Cover option mockups (Phase 1)

The mockup sources of track `storytime_cover_options_20261106`. The pictures, the PDFs, and the PNGs are large binary files, so they live only in the hand-off folder `~/Desktop/handoff/storytime-cover-options-2026-11-06/` (`H` below). No file here changes code under `dashboard/`.

| File | Purpose |
|---|---|
| `prompts.json` | The cast lines, the three styles, and the 12 picture prompts (text only) |
| `gen_art.py` | One paid `mmx image generate` call: the 1500-character limit, at most 3 attempts, the 1.00 USD limit, one row in `H/spend-log.md` |
| `selection.json` | The picture of each mockup, its zoom, and the faults of each attempt |
| `clean_art.py` | Removes the made-up text marks of two pictures into `-clean.jpg` copies (local, free) |
| `build.py` | Writes `mockups/*.html` (15 pages) and `approved-text.json`, and cuts `H/assets/line-qr.png` |
| `render.sh` | Chrome prints the PDFs at print size; `pdftoppm` makes the 150 ppi PNGs |
| `check.py` | Page sizes, the approved text, no new word, no forbidden word, and the Thai bytes |
| `qr_check.mjs` | The cut QR against the encoder of the cover module, module by module |
| `contact.py` | `H/contact-sheet.png`, one row per option |
| `options.json` | The name and the plain-words line of each option |
| `manifest.py` | `H/MANIFEST.txt` (SHA-256, size, name); `--check` compares it with the files |

Run order (in this folder):

```sh
H=~/Desktop/handoff/storytime-cover-options-2026-11-06
python3 -I -B clean_art.py $H
python3 -I -B build.py $H
HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c "bash $PWD/render.sh $H"
python3 -I -B check.py $H && node qr_check.mjs $H && python3 -I -B contact.py $H
python3 -I -B manifest.py $H && python3 -I -B manifest.py $H --check
```
