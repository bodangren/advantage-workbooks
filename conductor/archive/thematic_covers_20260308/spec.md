# Specification: Thematic Cover Pages & Layout Integration

## Objective
Implement dynamic, full-bleed thematic cover pages for compiled workbooks matching the design direction defined in `reading_advantage_workbook_series_plan.md`.

## Requirements
1. The compilation process (`dashboard/lib/workbook-document-wrapper.ts`) should generate a styled cover page using CSS.
2. Apply specific CSS themes based on the series name (Origins, Quest, Adventure, Hero, Legend).
3. Thematically styled backgrounds (e.g., CSS gradients matching the color palettes).
4. Remove the plain HTML title page and replace it with a full-bleed, professional cover.
5. The cover must include: Series Name, Level Number, Tagline, Publisher info, and thematic colors.
6. The layout must be compatible with Paged.js printing margins (e.g., margins set to 0 for the first page).

## Design Mapping
- **Origins**: Forest green, earth brown
- **Quest**: Sky blue, trail gold
- **Adventure**: Deep purple, mountain grey
- **Hero**: Crimson red, bronze
- **Legend**: Royal gold, midnight blue