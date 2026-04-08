# Track: Cloud Migration & Multi-User Collaboration

## Overview

The dashboard currently stores all project and lesson data as JSON files on the local filesystem, accessed through `dashboard/lib/filesystem.ts`. This architecture means the tool can only be used by one person on one machine, and there is no shared state between content team members.

This track migrates persistence to **Supabase** — using Supabase Postgres for structured project/lesson metadata and Supabase Storage for lesson JSON blobs and workbook images. It also introduces session-based authentication (Supabase Auth with email+password) so each team member has an account, and implements real-time collaborative awareness (presence indicators) using Supabase Realtime channels so editors can see who else has a project open.

The migration must be backward-compatible in shape: the Zod schema in `workbook-schema.ts` does not change. All existing JSON lesson files must be importable via a one-time migration script.

## Functional Requirements

### 1. Supabase Project Setup
- Add `@supabase/supabase-js` and `@supabase/ssr` as dependencies to `dashboard/package.json`.
- Store `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for server-side admin ops) in `.env.local` (template in `.env.local.example`, never committed).
- Create `dashboard/lib/supabase/client.ts` (browser Supabase client using `@supabase/ssr`) and `dashboard/lib/supabase/server.ts` (server Supabase client for API routes and Server Components).

### 2. Database Schema (Supabase Postgres)
- Table `projects`: `id uuid PK`, `name text`, `series_name text`, `level_number text`, `cefr_level text`, `type text CHECK(type IN ('primary','secondary'))`, `owner_id uuid FK auth.users`, `created_at timestamptz`, `updated_at timestamptz`.
- Table `lessons`: `id uuid PK`, `project_id uuid FK projects`, `name text`, `cefr_level text`, `storage_path text`, `created_at timestamptz`, `updated_at timestamptz`.
- Row-Level Security: all rows are readable/writable only by authenticated users (`auth.uid() IS NOT NULL`). This keeps it simple for the internal team; no per-row ownership enforcement beyond requiring a session.
- Provide SQL migration files in `dashboard/supabase/migrations/` with sequential numbering (`001_init.sql`).

### 3. Supabase Storage
- Bucket `lesson-json`: stores the full `WorkbookLesson` JSON for each lesson at path `{project_id}/{lesson_id}.json`. Access policy: authenticated users only.
- Bucket `workbook-images`: stores generated lesson images at path `{project_id}/{lesson_id}/{filename}`. Access policy: authenticated users only.
- Update `dashboard/lib/image-handler.ts` to upload images to the `workbook-images` bucket and return a Supabase Storage public URL.

### 4. Data Access Layer Refactor
- Create `dashboard/lib/db/projects.ts` exporting: `listProjects()`, `getProject(id)`, `createProject(opts)`, `deleteProject(id)`.
- Create `dashboard/lib/db/lessons.ts` exporting: `listLessons(projectId)`, `getLesson(projectId, lessonId)`, `saveLesson(projectId, lessonId, lesson)`, `deleteLesson(projectId, lessonId)`.
- These modules replace the direct `filesystem.ts` calls in all API routes and Server Components. `filesystem.ts` remains but is used only by the one-time migration script.
- All reads/writes use the server Supabase client.

### 5. Authentication
- Add a `/login` page (`dashboard/app/login/page.tsx`) with email + password fields using existing Tailwind and Radix UI primitives (no new UI library).
- Use Supabase Auth's `signInWithPassword`. On success, redirect to `/`.
- Protect all project/lesson pages and API routes with a middleware check (`dashboard/middleware.ts`): redirect unauthenticated requests to `/login`.
- Show the logged-in user's email in the dashboard header with a "Sign Out" button.

### 6. Real-Time Collaborative Presence
- When a user opens a project page, subscribe to a Supabase Realtime channel named `project:{projectId}`.
- Broadcast `{ user_email, opened_at }` as presence on join; untrack on page unmount.
- Render a small "who's here" indicator bar below the project title listing the email avatars (first letter of email in a colored circle) of all users currently viewing the same project.
- This is presence-only — no conflict resolution or operational transforms. If two users edit the same lesson simultaneously, the last save wins (as it does today with file writes).

### 7. One-Time Migration Script
- Create `dashboard/scripts/migrate-to-cloud.ts` (run with `npx tsx`).
- For each existing project directory found by `filesystem.ts`, insert a row into `projects`, then for each lesson JSON file, upload to Supabase Storage and insert a row into `lessons`.
- Log progress to stdout. On error, print the project/lesson path and continue (do not abort the entire run).
- The script is idempotent: if a lesson with the same `storage_path` already exists, skip it.

## Non-Functional Requirements

- **No Downtime Migration:** The migration script can be run against a running dashboard. Existing local files are not deleted by the script; that is a manual step after verifying cloud data.
- **Environment Isolation:** The Supabase client reads from env vars. Tests mock the client using Vitest `vi.mock()` — no real Supabase calls in the test suite.
- **Latency:** All Supabase reads for the project list and lesson list must complete within 500ms under normal network conditions. Use Supabase's built-in connection pooling.
- **TypeScript Strict:** All new modules must pass `npx tsc --noEmit` with zero errors.
- **Test Coverage:** >80% coverage on all new `lib/db/*.ts` modules (mocked Supabase client).

## Acceptance Criteria

- [ ] `npm install` in `dashboard/` succeeds after adding `@supabase/supabase-js` and `@supabase/ssr`.
- [ ] A fresh Supabase project provisioned with `001_init.sql` has the correct `projects` and `lessons` tables with RLS enabled.
- [ ] Visiting the dashboard without a session redirects to `/login`.
- [ ] Logging in with valid credentials shows the dashboard with projects loaded from Supabase Postgres.
- [ ] Creating a project inserts a row into `projects` and is immediately visible on reload.
- [ ] Saving a lesson uploads JSON to `lesson-json` bucket and upserts the `lessons` row.
- [ ] Two browser tabs on the same project page both show each other's presence indicator within 2 seconds.
- [ ] The migration script imports all local projects and lessons into Supabase without errors on a clean test dataset.
- [ ] All unit tests mock Supabase and pass with `npm run test:run`.
- [ ] `npm run build` succeeds with zero errors.
- [ ] `npm run lint` and `npx tsc --noEmit` pass with zero errors.

## Out of Scope

- OAuth or SSO login (email+password only in this track).
- Fine-grained per-project permission roles (editor vs. viewer). All authenticated users have full access.
- Operational transform or CRDT-based conflict resolution for simultaneous lesson edits.
- Supabase Edge Functions — all server logic remains in Next.js API routes.
- Automated Supabase migration CI pipeline — migrations are applied manually via the Supabase dashboard or CLI.
