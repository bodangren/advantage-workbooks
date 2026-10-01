# Plan: Review page

Track: `review_page_20261001`

## Phase 1: Contract

- [ ] API request and response types from the package schema; the approval-part enum

## Phase 2: Tests

- [ ] Route tests: GET, PUT valid, PUT invalid (400 with the issues), approve, path guard

## Phase 3: Implement

- [ ] Route handlers (read and write under `content/primary/`)
- [ ] `/review` list page
- [ ] `/review/[book]/[lesson]` page with the sections and the keys
- [ ] `/review/cast` page

## Phase 4: Verify

- [ ] Run the dashboard; approve the E12 pilot end to end; send Daniel a screenshot and the local URL
- [ ] Update `measure/tech-debt.md` and `measure/lessons-learned.md`
