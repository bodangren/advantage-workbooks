# Implementation Plan: Multi-Series Workbook Organization & Primary School Support

## Phase 1: E2E Test Isolation & Root Cleanup [checkpoint: 1769789]

- [x] Task: Fix e2e tests to use os.tmpdir() `000a5a9`
    - [x] Write tests verifying test directories are created under os.tmpdir()
    - [x] Refactor `__tests__/e2e-integration.test.ts` to use `os.tmpdir()` instead of `path.resolve(process.cwd(), '..', 'test-workbooks')`
    - [x] Add vitest globalTeardown script to clean up any leftover test-e2e-* dirs in tmpdir

- [x] Task: Clean up root directory `291bff3`
    - [x] Delete leftover `test-e2e-*` and `test-project-*` directories from WORKBOOKS_ROOT
    - [x] Delete empty directories: `origins-5/`, `primary-advantage/`
    - [x] Add `.gitignore` entries for `test-e2e-*`, `test-project-*`, and `test-workbooks/`

- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) `1769789`

## Phase 2: Directory Restructuring & Filesystem Layer

- [x] Task: Add `type` field to project interfaces and metadata `4dd6f4f`
    - [x] Write unit tests for updated `WorkbookProject` and `ProjectMetadata` interfaces with `type: 'primary' | 'secondary'`
    - [x] Update `ProjectMetadata` interface in `lib/filesystem.ts` to include optional `type` field
    - [x] Update `WorkbookProject` interface to include `type` field

- [x] Task: Implement structured naming convention `4dd6f4f`
    - [x] Write unit tests for `generateProjectId(metadata)` function: input `{seriesName: 'Origins', levelNumber: '3.1', cefrLevel: 'A1'}` → output `origins-3.1-a1`
    - [x] Implement `generateProjectId()` helper in `lib/filesystem.ts`
    - [x] Refactor `createProject()` to accept `type` and metadata fields, generate directory name from metadata, and place project in `primary/` or `secondary/` subdirectory
    - [x] Update `createProject()` tests to verify new signature and directory placement

- [x] Task: Refactor `listProjects()` for two-level directory scanning `4dd6f4f`
    - [x] Write unit tests for `listProjects()` scanning `primary/` and `secondary/` subdirectories and returning `type` on each project
    - [x] Write unit tests for `listProjects()` with optional `type` filter parameter
    - [x] Implement updated `listProjects(type?)` that scans both subdirectories
    - [x] Ensure `listProjects()` ignores non-project directories (dashboard, conductor, .git, etc.)

- [x] Task: Update path resolution in all filesystem functions `4dd6f4f`
    - [x] Write tests verifying `listLessons()`, `readLesson()`, `writeLesson()`, `readProjectMetadata()`, `writeProjectMetadata()` resolve paths correctly under `secondary/{projectId}/` and `primary/{projectId}/`
    - [x] Implement path resolution that includes the type subdirectory (e.g., `WORKBOOKS_ROOT/secondary/origins-3.1-a1/`)
    - [x] Ensure backward compatibility: functions accept either `type/projectId` or use a lookup if type is not provided

- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Migrate Existing Projects

- [~] Task: Create migration script
    - [ ] Write test verifying migration moves `Origins 3.1/` to `secondary/origins-3.1-a1/` with all contents intact
    - [ ] Implement migration: create `secondary/` and `primary/` directories, move and rename existing projects
    - [ ] Update `project.json` in migrated project to include `type: "secondary"`
    - [ ] Verify all lesson files and images are intact after migration

- [ ] Task: Verify post-migration functionality
    - [ ] Run existing test suite to confirm secondary project pipeline works after migration
    - [ ] Manually verify `origins-3.1-a1` is discoverable and compilable from the dashboard

- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Template System for Primary Workbooks

- [ ] Task: Rename and fork the template
    - [ ] Write test verifying template renderer selects `secondary_template.html` for secondary projects and `primary_template.html` for primary projects
    - [ ] Rename `dashboard/templates/workbook_template.html` → `dashboard/templates/secondary_template.html`
    - [ ] Fork to `dashboard/templates/primary_template.html`
    - [ ] Update `getTemplate()` in `lib/template-renderer.ts` to accept a `type` parameter and load the correct template

- [ ] Task: Adapt primary template for younger readers
    - [ ] Increase base font size and line spacing
    - [ ] Simplify vocabulary section layout (fewer fields, more visual space)
    - [ ] Expand illustration/image areas
    - [ ] Simplify question sections (more guided, fewer open-ended)
    - [ ] Apply a brighter, more engaging color scheme

- [ ] Task: Update compile endpoint to use correct template
    - [ ] Write test verifying `/api/projects/[projectId]/compile` resolves the template based on project type
    - [ ] Update compile route to read project type and pass it through to the renderer

- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: API Route Updates

- [ ] Task: Update `GET /api/projects` with type filtering
    - [ ] Write test for `GET /api/projects?type=secondary` returning only secondary projects
    - [ ] Write test for `GET /api/projects?type=primary` returning only primary projects
    - [ ] Write test for `GET /api/projects` (no filter) returning all projects with type field
    - [ ] Implement query parameter parsing and pass-through to `listProjects()`

- [ ] Task: Update `POST /api/projects` with metadata-driven creation
    - [ ] Write test for `POST /api/projects` with `{ type, seriesName, levelNumber, cefrLevel }` body
    - [ ] Write test for validation: missing required fields returns 400
    - [ ] Write test for duplicate project name detection
    - [ ] Implement updated POST handler using new `createProject()` signature

- [ ] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)

## Phase 6: Dashboard UI — Tabbed Projects View

- [ ] Task: Build tabbed projects page
    - [ ] Replace flat project list in `app/projects/page.tsx` with tabbed UI (Secondary | Primary)
    - [ ] Default to Secondary tab
    - [ ] Each tab fetches projects filtered by type via `GET /api/projects?type=...`
    - [ ] Display project type badge on project cards

- [ ] Task: Update Create Project dialog
    - [ ] Add type selector (Primary/Secondary) to `CreateProjectDialog`
    - [ ] Replace free-text name field with structured metadata fields: Series Name, Level Number, CEFR Level
    - [ ] Show auto-generated directory name preview (e.g., "origins-3.1-a1")
    - [ ] Submit to updated `POST /api/projects` with type and metadata

- [ ] Task: Add type indicator to project detail page
    - [ ] Display workbook type badge/header on `app/projects/[projectId]/page.tsx`
    - [ ] Ensure breadcrumbs and navigation reflect the type context

- [ ] Task: Conductor - User Manual Verification 'Phase 6' (Protocol in workflow.md)
