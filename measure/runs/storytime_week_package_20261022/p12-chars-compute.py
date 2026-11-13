"""The characters of the Phase 12 sentence clips (track storytime_week_package).

Phase 13 decision M8 (Review A F2 of Phase 12): the script reads the one-take texts and the takes
from the 7 provenance files of the Phase 12 source commit, and not from p12-listen.txt. The sent
sum of a clip is its text length times its take. The 2 failed w01 calls stay as a named constant.

Usage: python3 -I -B measure/runs/storytime_week_package_20261022/p12-chars-compute.py
Run it in the repository root.
"""

import json
import subprocess

# The Phase 12 source commit of the 7 provenance files.
SOURCE = "fa47ca23bef49008be2494ea948e8aebb9b638d4"
# The 2 failed w01 calls of Phase 12 ("A nest." and "A nose."): the provider can charge them.
FAILED_CALLS = ("A nest.", "A nose.")
# The characters of the Phase 12 word clips.
WORDS = 47

one_take = 0
sent = 0
takes = 0
per_week = {}
for n in range(1, 8):
    path = f"content/storytime/l2/media/w{n:02d}/sentences/manifest.json"
    text = subprocess.run(["git", "show", f"{SOURCE}:{path}"], capture_output=True, text=True, check=True).stdout
    for item in json.loads(text)["items"]:
        takes += 1
        week = f"w{n:02d}"
        per_week.setdefault(week, [0, 0])
        per_week[week][0] += len(item["text"])
        per_week[week][1] += len(item["text"]) * item["take"]
        one_take += len(item["text"])
        sent += len(item["text"]) * item["take"]
failed = sum(len(text) for text in FAILED_CALLS)
sent += failed
for week in sorted(per_week):
    print(f"{week}: one-take {per_week[week][0]} sent {per_week[week][1]}")
print(f"word chars: {WORDS}")
print(f"takes parsed: {takes}")
print(f"sentence one-take sum: {one_take}")
print(f"sentence sent sum (with failed calls {failed}): {sent}")
print(f"total chars: {WORDS + sent}")
