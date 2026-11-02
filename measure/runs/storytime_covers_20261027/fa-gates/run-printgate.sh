#!/usr/bin/env bash
set -u
cd /home/daniebo/Desktop/Workbooks
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'cd dashboard && npx tsx scripts/print/make-pdfx.ts /home/daniebo/Desktop/print-ready/storytime/print-v3/l2u1/Storytime-Advantage-L2-U1-Student-Book-Cover-v3_PDFX-1a.pdf --check'
echo "COMMAND_EXIT_CODE=$?"
