# Implementation Plan: Security Patch and Cleanup

## Step 1: Fix Path Traversal Vulnerabilities
- Add security checks in `dashboard/lib/filesystem.ts` to ensure user input cannot traverse beyond the intended directories.
- In `resolveProjectPath`: ensure `candidate` starts with `path.join(getWorkbooksRoot(), subdir)`.
- In `readProjectMetadata`: ensure `metadataPath` starts with `path.join(getWorkbooksRoot(), subdir)`.
- In `readLesson` and `writeLesson`: ensure `lessonPath` starts with `fullPath`.

## Step 2: Implement Refactoring
- Verify there are tests checking for these issues if possible, or ensure the build works successfully.
- Code cleanup across `filesystem.ts` to use a centralized path verification function if appropriate.

## Step 3: Validation
- Run tests (`npm run test`) and build (`npm run build`) in `dashboard` to verify there are no regressions.
