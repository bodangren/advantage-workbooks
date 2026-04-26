---
name: compile-workbook
description: Compile a workbook project into a preview-ready HTML document
disable-model-invocation: true
---

# Compile Workbook

Compile a workbook project into a full HTML document with title page, table of contents, and all lessons.

## What to do

1. **Identify the project**: Ask which project to compile if not specified. List available projects:
   ```bash
   ls /home/daniel-bo/Desktop/Workbooks/dashboard/projects/
   ```

2. **Ensure the dashboard is running**: Check if the dev server is up:
   ```bash
   curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Running" || echo "Not running"
   ```
   If not running, start it:
   ```bash
   cd /home/daniel-bo/Desktop/Workbooks/dashboard && npm run dev &
   ```
   Wait a few seconds for it to be ready.

3. **Compile via the API**: Hit the compile endpoint:
   ```bash
   curl -s "http://localhost:3000/api/projects/<PROJECT_ID>/compile" -o compiled_output.html
   ```

4. **Report the result**: Tell the user:
   - Whether compilation succeeded
   - How many lessons were compiled
   - The output file location
   - Remind them to open in Chrome and use Print → Save as PDF with "Background graphics" enabled

## Notes
- The compile endpoint returns a full HTML document with Paged.js for print layout
- Project IDs match the folder names under `dashboard/projects/`
- For PDF generation, the user should open the compiled HTML in Chrome/Edge
