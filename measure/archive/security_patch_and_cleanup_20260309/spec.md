# Security Patch and Refactoring Specification

## Overview
This track focuses on addressing security vulnerabilities discovered in `dashboard/lib/filesystem.ts` and refactoring duplicate code as per the daily cleanup mandate.

## Requirements
- Fix Path Traversal (LFI) vulnerabilities in filesystem reading and writing endpoints (`resolveProjectPath`, `readLesson`, `writeLesson`, `readProjectMetadata`).
- Refactor duplicate code or improve test coverage if needed.
- Enhance the `dashboard/app/api/projects/[projectId]/compile/route.ts` API if needed.

## Security Considerations
- Validate `projectId` and `lessonId` parameters to ensure they cannot traverse directories using `..` or `.` sequences.
