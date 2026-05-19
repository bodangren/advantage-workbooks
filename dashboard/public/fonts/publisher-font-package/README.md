# Reading Advantage Publisher Font Package

Generated: 2026-05-06

This package contains redistributable font files used by the dashboard workbook compilation output.

## Included

- `OpenSans/OpenSans.ttf` - Open Sans variable font, used for headings, metadata, page numbers, workbook utility sections, and teacher manuals.
- `OpenSans/OpenSans-Italic.ttf` - Open Sans italic variable font, included for style fallback coverage.
- `Merriweather/Merriweather.ttf` - Merriweather variable font, used for primary/secondary lesson body text and cover/title typography.
- `Merriweather/Merriweather-Italic.ttf` - Merriweather italic variable font, used by italic body text.
- `Merriweather/MerriweatherLight18pt-Italic.ttf` - static Merriweather Light Italic instance at optical size 18pt, generated from `Merriweather-Italic.ttf` for publisher/preflight tools that do not resolve this named instance from the variable font.
- `Caveat/Caveat.ttf` - Caveat variable font, imported by the workbook templates at weight 500. Current source search found it imported but not explicitly applied by `font-family`.
- `Comic Sans MS.zip` - Comic Sans MS fallback font archive present in this package.
- `Chalkboard SE.zip` - Chalkboard SE fallback font archive present in this package.

Each included family directory contains its SIL Open Font License file from the official Google Fonts repository.

## Fallback Font Notes

- Comic Sans MS is referenced only as the first spelling-practice trace-text font.
- Chalkboard SE is referenced only as the second spelling-practice trace-text fallback.
- These fallback font archives are included as package files. Confirm licensing/permission before sending them externally.

For publisher preflight, the essential workbook fonts are Open Sans and Merriweather. Caveat is included because the templates import it.

## Publisher Preflight Notes

- The `MerriweatherLight18pt-Italic.ttf` static file has internal names `Merriweather Light 18pt Italic` and PostScript `MerriweatherItalic-Light18ptItalic`. It corresponds to the variable font coordinates `wght=300`, `wdth=100`, `opsz=18`.
