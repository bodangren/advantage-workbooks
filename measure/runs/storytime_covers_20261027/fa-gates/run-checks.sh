#!/usr/bin/env bash
set -u
cd /home/daniebo/Desktop/Workbooks
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && npx tsc --noEmit'
echo "COMMAND_EXIT_CODE=$?"
