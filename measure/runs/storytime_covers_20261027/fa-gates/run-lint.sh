#!/usr/bin/env bash
set -u
cd /home/daniebo/Desktop/Workbooks
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && npx eslint lib/storytime scripts/storytime __tests__/storytime-print-covers*.test.ts'
echo "COMMAND_EXIT_CODE=$?"
