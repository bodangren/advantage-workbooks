# Implementation Plan: Cloud Migration & Multi-User Collaboration

## Phase 1: Supabase Client Setup & Database Schema

- [ ] Task: Add `@supabase/supabase-js` and `@supabase/ssr` to `dashboard/package.json` dependencies. Run `npm install`. Verify `npm run build` still passes.
- [ ] Task: Create `.env.local.example` in `dashboard/` with placeholder keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Add `.env.local` to `.gitignore` if not already present.
- [ ] Task: Create `dashboard/lib/supabase/client.ts` (browser client using `createBrowserClient` from `@supabase/ssr`) and `dashboard/lib/supabase/server.ts` (server client using `createServerClient`). Write Vitest unit tests that mock the Supabase factory and assert the clients are constructed with the correct env var values. Confirm tests fail (Red), then implement, confirm pass (Green).
- [ ] Task: Create `dashboard/supabase/migrations/001_init.sql` with `CREATE TABLE projects (...)` and `CREATE TABLE lessons (...)` DDL, RLS policies (`ENABLE ROW LEVEL SECURITY`, `USING (auth.uid() IS NOT NULL)` for all operations), and `CREATE INDEX` on `lessons(project_id)`.
- [ ] Task: Run `npx tsc --noEmit` and `npm run lint` in `dashboard/`. Fix all errors.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Supabase Client Setup & Database Schema' (Protocol in workflow.md)

## Phase 2: Data Access Layer (`lib/db/`)

- [ ] Task: Write failing Vitest tests for `dashboard/lib/db/projects.ts`. Mock the server Supabase client. Cover: `listProjects()` returns mapped `WorkbookProject[]`; `createProject(opts)` calls `.insert()` with correct payload; `deleteProject(id)` calls `.delete().eq('id', id)`; `getProject(id)` returns null when not found. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/db/projects.ts` with the four exported functions. Use the server Supabase client from `lib/supabase/server.ts`. Map Postgres rows to the existing `WorkbookProject` interface from `lib/filesystem.ts`. Confirm tests pass (Green).
- [ ] Task: Write failing Vitest tests for `dashboard/lib/db/lessons.ts`. Mock Supabase client and Storage. Cover: `listLessons(projectId)` selects correct rows; `getLesson` downloads from Storage and parses JSON; `saveLesson` uploads JSON blob and upserts the lessons row; `deleteLesson` removes Storage object and deletes the row. Confirm tests fail (Red).
- [ ] Task: Implement `dashboard/lib/db/lessons.ts`. Use `supabase.storage.from('lesson-json')` for blob operations. JSON is serialized with `JSON.stringify` and deserialized with `JSON.parse`. Validate with `WorkbookLessonSchema.safeParse()` on read. Confirm tests pass (Green).
- [ ] Task: Update `dashboard/lib/image-handler.ts` to upload to `supabase.storage.from('workbook-images')` and return the public URL. Write a unit test that mocks Storage and asserts the returned URL matches `{supabase_url}/storage/v1/object/public/workbook-images/{path}`.
- [ ] Task: Run `npm run test:run`. Verify >80% coverage on `lib/db/projects.ts`, `lib/db/lessons.ts`, and `lib/supabase/*.ts`. Fix coverage gaps.
- [ ] Task: Measure — User Manual Verification 'Phase 2: Data Access Layer' (Protocol in workflow.md)

## Phase 3: API Route Refactor

- [ ] Task: Update all API routes under `dashboard/app/api/projects/` to replace `filesystem.ts` calls with imports from `lib/db/projects.ts` and `lib/db/lessons.ts`. Change one route at a time and run tests after each change.
- [ ] Task: Update the compile route (`dashboard/app/api/projects/[projectId]/compile/`) to load lesson JSON from `lib/db/lessons.ts` (Supabase Storage) instead of the local file system.
- [ ] Task: Update `dashboard/app/api/projects/[projectId]/lessons/[lessonId]/image/route.ts` (or equivalent) to use `lib/db/lessons.ts` and the updated `image-handler.ts`.
- [ ] Task: Run `npm run test:run` and `npm run lint`. Fix all failures and lint errors.
- [ ] Task: Measure — User Manual Verification 'Phase 3: API Route Refactor' (Protocol in workflow.md)

## Phase 4: Authentication

- [ ] Task: Create `dashboard/middleware.ts` using `@supabase/ssr`'s `createServerClient`. Redirect requests to all routes except `/login` and `/api/auth/*` to `/login` if no valid session is present. Write a Vitest test mocking `createServerClient` to assert the redirect behavior.
- [ ] Task: Create `dashboard/app/login/page.tsx` with email + password form using existing Tailwind classes and Radix UI primitives. On submit, call `supabase.auth.signInWithPassword()` from the browser client. On success, `router.push('/')`. Display error message on failure.
- [ ] Task: Create `dashboard/app/api/auth/signout/route.ts` (POST). Call `supabase.auth.signOut()` via the server client and redirect to `/login`.
- [ ] Task: Add the logged-in user's email and a "Sign Out" button to the dashboard header component. Fetch the user via `supabase.auth.getUser()` in the Server Component layout.
- [ ] Task: Write a component test for the login page asserting: form renders, submit with empty fields shows validation, successful mock sign-in triggers `router.push('/')`.
- [ ] Task: Run `npm run test:run`, `npm run lint`, and `npx tsc --noEmit`. Fix all errors.
- [ ] Task: Measure — User Manual Verification 'Phase 4: Authentication' (Protocol in workflow.md)

## Phase 5: Real-Time Presence & Migration Script

- [ ] Task: Create `dashboard/components/ProjectPresence.tsx` — a Client Component that subscribes to Supabase Realtime channel `project:{projectId}` using `supabase.channel()`. Renders colored letter-avatar circles for each present user. Unsubscribes on unmount. Write a unit test mocking the Realtime channel and asserting avatars render for presence entries.
- [ ] Task: Add `<ProjectPresence projectId={...} />` to the project page (`projects/[projectId]/page.tsx`) below the project title.
- [ ] Task: Create `dashboard/scripts/migrate-to-cloud.ts`. Use `filesystem.ts` to enumerate local projects and lessons. For each lesson JSON file, upload to Supabase Storage (`lesson-json` bucket) and upsert `projects` + `lessons` rows. Log success/failure per item. Support `--dry-run` flag that prints what would be migrated without writing anything.
- [ ] Task: Run `npm run build` in `dashboard/`. Confirm zero build errors.
- [ ] Task: Update `measure/tech-debt.md` and `measure/lessons-learned.md` (prune to <=50 lines). Document the Supabase SSR pattern for Next.js Server Components and the RLS "authenticated users only" policy approach.
- [ ] Task: Measure — User Manual Verification 'Phase 5: Real-Time Presence & Migration Script' (Protocol in workflow.md)
