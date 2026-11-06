#!/usr/bin/env bash
# Prints the 15 mockup HTML files to PDF at print size (Chrome) and makes 150 ppi PNGs (pdftoppm).
# Track storytime_cover_options_20261106. Run it only through heavy-run:
#   HEAVY_MIN_AVAIL_MB=1500 HEAVY_PREFLIGHT_WAIT_S=5400 bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash render.sh <hand-off folder>'
set -euo pipefail
out="${1:?usage: render.sh <hand-off folder>}"
here="$(cd "$(dirname "$0")" && pwd)"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT
mkdir -p "$out/pdf" "$out/png"
for html in "$here"/mockups/option-*.html; do
  name="$(basename "$html" .html)"
  google-chrome --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
    --user-data-dir="$profile" --no-pdf-header-footer --virtual-time-budget=8000 \
    --print-to-pdf="$out/pdf/$name.pdf" "file://$html" 2>/dev/null
  pdftoppm -r 150 -png -singlefile "$out/pdf/$name.pdf" "$out/png/$name"
  echo "$name"
done
