---
name: content-validator
description: Validate workbook content JSON files against the Zod schema and report issues
---

# Content Validator

Validate workbook lesson JSON files against the project's Zod schema.

## What to do

1. Read the schema from `dashboard/lib/workbook-schema.ts` to understand the current data structure.
2. Identify the target content files:
   - If the user specifies files, validate those.
   - If no files specified, find all `content_*.json` files in the project and all lesson JSON files under `dashboard/projects/*/`.
3. For each file, read and parse the JSON content.
4. Validate against the `WorkbookLessonSchema` (or `LessonContentSchema` for individual lessons).
5. Report results clearly:
   - List passing files.
   - For failing files, show the specific validation errors with field paths (e.g., `activities.vocabulary[2].definition: Required`).
6. Suggest fixes for common issues (missing required fields, wrong types, empty arrays).

## Key schema location

- **Zod schema**: `dashboard/lib/workbook-schema.ts`
- **JSON schema**: `schema.json` (root directory)
- **Template structure**: `template_data_structure.json` (root directory)

## Validation approach

Use `node -e` with the Zod schema to perform validation directly:

```bash
cd /home/daniel-bo/Desktop/Workbooks/dashboard
node -e "
const { WorkbookLessonSchema } = require('./lib/workbook-schema');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const result = WorkbookLessonSchema.safeParse(data);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
  process.exit(1);
}
console.log('Valid');
" <file-path>
```

If the TypeScript import doesn't work directly, use the JSON schema at `schema.json` with a JSON schema validator instead.
