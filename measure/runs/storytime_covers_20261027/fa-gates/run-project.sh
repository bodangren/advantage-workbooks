#!/usr/bin/env bash
set -u
cd /home/daniebo/Desktop/Workbooks
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && CI=true npx vitest run __tests__/storytime-*.test.ts __tests__/covers-*.test.ts __tests__/print-pdfx.test.ts'
echo "COMMAND_EXIT_CODE=$?"
