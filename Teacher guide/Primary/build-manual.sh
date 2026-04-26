#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$SCRIPT_DIR"

cat \
  title-page.md \
  preface.md \
  quick-reference.md \
  complete-plan.md \
  step-1.md \
  step-2.md \
  step-3.md \
  step-4.md \
  step-5.md \
  step-6.md \
  step-7.md \
  step-8.md \
  step-9.md \
  step-10.md \
  step-11.md \
  step-12.md \
  step-13.md \
  trainers-guide.md \
  > teachers-manual-compiled.md

if command -v pandoc >/dev/null 2>&1; then
  pandoc teachers-manual-compiled.md \
    -o teachers-manual-content.html \
    --standalone \
    --css="$ROOT_DIR/Teacher guide/print-style.css" \
    --metadata title="Reading Advantage Primary Teacher's Manual" \
    --self-contained
fi
