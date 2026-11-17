#!/usr/bin/env bash
cd dashboard || exit 1
T=$(mktemp -d) && test -d "$T" || exit 1
mkdir -p "$T/content" && cp -rs "$(cd .. && pwd)/content/storytime" "$T/content/" || { rm -rf "$T"; exit 1; }
for f in ../content/storytime/drafts/l2/w*.json; do [ -e "$f" ] || continue; cp --remove-destination "$f" "$T/content/storytime/l2/" || { rm -rf "$T"; exit 1; }; done
out=$(WORKBOOKS_ROOT="$T" MASTERY_PHONICS_GRAPH="$(cd ../.. && pwd)/mastery-advantage/english/phonics/phonics-knowledge-space.json" npx tsx scripts/storytime/check-weeks.ts --level 2 2>&1)
rc=$?
rm -rf "$T"
printf "%s\n" "$out"
exit $rc
