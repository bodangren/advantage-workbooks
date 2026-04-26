# Implementation Plan: Refactor & Cleanup

## Step 1: Fix ESLint Warnings (Tests)
- `dashboard/__tests__/e2e-integration.test.ts`: Remove unused `error` variable.
- `dashboard/__tests__/image-upload-component.test.tsx`: Remove unused `clearButton` variable.
- `dashboard/__tests__/image-upload.test.ts`: Remove unused `error` variable.
- `dashboard/__tests__/preface-loader.test.ts`: Remove unused `PrefaceData`.

## Step 2: Fix ESLint Warnings (App Code)
- `dashboard/app/api/render/route.ts`: Remove unused `WorkbookLesson`.
- `dashboard/app/projects/[projectId]/lessons/[lessonId]/page.tsx`: Fix missing dependency in `useCallback` or `useEffect`, remove unused variables (`useMemo`, `data`).
- `dashboard/components/project-settings-dialog.tsx`: Add missing dependency `loadMetadata` to `useEffect`.
- `dashboard/lib/ai-augmentor.ts`: Remove unused Zod schemas and parameters.

## Step 3: UI & Next.js Best Practices
- `dashboard/components/image-upload.tsx`: Replace `<img>` with `<Image />` or `next/img` if appropriate, or suppress warnings if `next/image` is not ideal for user-uploaded preview blobs (which it often isn't). Actually, for local object URLs, it might be better to suppress the warning or use standard `<img>`. Let's check Next.js docs or use `unoptimized` flag.

## Step 4: Security Review & Duplicate Code Pass
- Check for security vulnerabilities using the security scanner (`scan_vulnerable_dependencies`).
- Run the code review agent to look for duplications in recent tracks.
- Ensure automated tests run properly.

## Step 5: Wrap up
- Commit all changes.
- Archive the track.
- Update `tech-debt.md` and `lessons-learned.md`.