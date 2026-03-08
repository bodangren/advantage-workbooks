# Spec: Multi-Series Workbook Organization & Primary School Support

## Overview

Reorganize the workbook project structure to support two distinct workbook series — **Secondary** (Grades 7-12, existing) and **Primary** (Grades 3-6, new) — with clean file separation, dedicated templates, and a tabbed dashboard UI. Additionally, fix e2e test pollution, clean up the root directory, and enforce a structured project naming convention.

## Functional Requirements

### FR-1: Directory Restructuring & Project Naming Convention
- Create two top-level directories under `WORKBOOKS_ROOT`: `secondary/` and `primary/`.
- **Naming convention**: Project directories must follow the pattern `{series}-{level}-{cefr}`, all lowercase and hyphenated. Examples:
  - `origins-3.1-a1`
  - `quest-4.2-a2`
  - `adventure-5.1-b1`
- The `createProject()` function must auto-generate the directory name from the project metadata (`seriesName`, `levelNumber`, `cefrLevel`) rather than from a free-text user input.
- **Migration**: Move existing projects into `secondary/` and rename them to match the convention:
  - `Origins 3.1/` → `secondary/origins-3.1-a1/`
- Remove empty/stale directories from the root (`origins-5/`, `primary-advantage/`).
- Update `WORKBOOKS_ROOT` scanning logic in `lib/filesystem.ts` to discover projects inside `secondary/` and `primary/` subdirectories, tagging each project with its series type.
- The `listProjects()` function must return a `type` field (`"primary"` | `"secondary"`) for each project.
- New project creation must require a type selection, placing the project in the correct subdirectory.

### FR-2: E2E Test Isolation
- Refactor `__tests__/e2e-integration.test.ts` to use `os.tmpdir()` for all temporary test directories instead of paths relative to `WORKBOOKS_ROOT`.
- Remove any `test-e2e-*` and `test-project-*` leftover directories from the root.
- Add `.gitignore` entries to prevent accidental commits of test artifacts.
- Add a global test teardown (vitest `globalTeardown`) as a safety net for cleanup on unexpected failures.

### FR-3: Template System for Primary Workbooks
- Fork `dashboard/templates/workbook_template.html` into `dashboard/templates/secondary_template.html` (rename of existing) and `dashboard/templates/primary_template.html` (new fork).
- Primary template adaptations (initial pass):
  - Larger base font size and line spacing for younger readers.
  - Simplified vocabulary section (fewer fields, more visual space).
  - More illustration/image space in article layouts.
  - Simplified question types (fewer open-ended, more guided).
  - Brighter, more engaging color scheme.
- Update the template renderer (`lib/template-renderer.ts`) to select the correct template based on project type.
- Update the Zod schema (`lib/workbook-schema.ts`) if primary lessons require different/optional fields.

### FR-4: Dashboard UI — Tabbed Projects View
- Replace the flat project list on `/projects` with a tabbed interface: **Secondary** | **Primary**.
- Default tab: Secondary.
- Each tab fetches and displays only projects of its type.
- The "New Project" dialog must include a type selector (Primary/Secondary) and metadata fields (seriesName, levelNumber, cefrLevel) that auto-generate the directory name.
- Project detail pages should visually indicate the workbook type (badge or header).

### FR-5: API Route Updates
- `GET /api/projects` must accept an optional `?type=primary|secondary` query parameter to filter results.
- `POST /api/projects` must accept a `type` field and metadata fields in the request body; the directory name is derived from metadata, not user-supplied.
- Compile endpoints must resolve the correct template based on project type.
- All existing API behavior must remain backward-compatible for secondary projects.

## Non-Functional Requirements

- **No data loss**: Existing content files must be safely migrated, not recreated.
- **Backward compatibility**: The secondary workbook pipeline must continue to work identically after restructuring.
- **Test coverage**: >80% for all new and modified modules.
- **Git-clean root**: After migration, the `WORKBOOKS_ROOT` root should contain only `primary/`, `secondary/`, `dashboard/`, `conductor/`, and config files.

## Acceptance Criteria

1. Running `ls` on `WORKBOOKS_ROOT` shows `primary/`, `secondary/`, `dashboard/`, `conductor/`, and config files — no loose project dirs or test artifacts.
2. `origins-3.1-a1` exists under `secondary/` with all original content intact and renders correctly.
3. E2e tests pass using `os.tmpdir()` and leave no artifacts in the project tree.
4. A new primary project can be created from the dashboard with metadata fields, auto-generates a correct directory name, lands in `primary/`, and compiles using the primary template.
5. A new secondary project similarly auto-generates its directory name and lands in `secondary/`.
6. The `/projects` page shows tabbed navigation between Secondary and Primary projects.
7. The secondary compilation pipeline produces identical output to before the migration.

## Out of Scope

- Detailed primary curriculum content creation (only the template and plumbing).
- Primary-specific preface data (`preface_data.json` for primary) — can use placeholder.
- User authentication or role-based access.
- Deployment or CI/CD changes.
- Schema changes for primary lesson content beyond basic structural adjustments.
