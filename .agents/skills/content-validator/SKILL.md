---
name: content-validator
description: Validate workbook content JSON files against the Zod schema and report issues
---

# Content Validator

Validate workbook lesson JSON files against the project's Zod schema.

## What to do

1. Read the schema in `dashboard/lib/workbook-schema.ts`.
2. Find the target files:
   - If the user names files, validate those.
   - Otherwise, validate the lesson files of each project folder in `primary/` and `secondary/`. A lesson file name starts with `content_` or ends with `_workbook.json`.
3. Read and parse each file.
4. Validate each lesson with `WorkbookLessonSchema`.
5. Report the result:
   - List the files that pass.
   - For each failing file, show the validation errors with field paths (for example `activities.vocabulary[2].definition: Required`).
6. Suggest fixes for common issues: missing required fields, wrong types, empty arrays.

## Validation approach

The schema is TypeScript. Run it with `tsx` from the `dashboard` folder:

```bash
cd dashboard
npx tsx -e "
import { WorkbookLessonSchema } from './lib/workbook-schema';
import fs from 'fs';
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const result = WorkbookLessonSchema.safeParse(data);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
  process.exit(1);
}
console.log('Valid');
" <file-path>
```

Give `<file-path>` relative to `dashboard`, or as an absolute path.
