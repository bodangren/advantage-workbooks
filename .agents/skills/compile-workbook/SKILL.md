---
name: compile-workbook
description: Compile a workbook project into a preview-ready HTML document
disable-model-invocation: true
---

# Compile Workbook

Compile a workbook project into a full HTML document with title page, table of contents, and all lessons.

## What to do

1. Identify the project. If the user names none, ask. Each project is a folder in `primary/` or `secondary/` at the repo root. List them:
   ```bash
   ls primary secondary
   ```

2. Check that the dashboard runs:
   ```bash
   curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Running" || echo "Not running"
   ```
   If it does not run, start it from the repo root and wait a few seconds:
   ```bash
   (cd dashboard && npm run dev &)
   ```

3. Compile through the API:
   ```bash
   curl -s "http://localhost:3000/api/projects/<PROJECT_ID>/compile" -o compiled_output.html
   ```

4. Report to the user:
   - Whether compilation succeeded
   - How many lessons were compiled
   - The output file location
   - To open the file in Chrome and use Print → Save as PDF with "Background graphics" enabled

## Notes
- The endpoint returns a full HTML document with Paged.js for print layout.
- A project ID is the folder name under `primary/` or `secondary/`.
- Open the compiled HTML in Chrome or Edge to make the PDF.
