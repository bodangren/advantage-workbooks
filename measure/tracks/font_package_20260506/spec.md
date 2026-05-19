# Publisher Font Package

## Goal

Package the fonts used by the dashboard workbook compilation process into `dashboard/public/fonts/` so the publisher can inspect or install them.

## Scope

- Include redistributable font files used by compiled workbook and teacher manual output.
- Create a zip archive in `dashboard/public/fonts/`.
- Document any fonts that cannot be bundled because they are proprietary or unavailable locally.

## Acceptance Criteria

- `dashboard/public/fonts/` contains the packaged font assets.
- A zip archive exists under `dashboard/public/fonts/`.
- The package contents are documented.
