#!/usr/bin/env python3
"""Thai filter: PM rule 2026-11-09, spec L15.

Writes filtered copies into /tmp/opencode/p12-accept/ of:
- content/storytime/l2/w01.json .. w08.json (drop every key named "th";
  replace every string containing a Thai character with "TH")
- measure/tracks/storytime_week_package_20261022/plan.md
- measure/tracks/storytime_week_package_20261022/spec.md
- measure/tech-debt.md
- measure/lessons-learned.md
(drop every line with a Thai character)

Prints "THAI_CHARS_IN_OUTPUT: 0" for each output and exits 1 otherwise.
"""
import json
import os
import re
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
OUT = "/tmp/opencode/p12-accept"

THAI = re.compile(r"[\u0e00-\u0e7f]")


def thai_count(obj):
    if isinstance(obj, str):
        return len(THAI.findall(obj))
    if isinstance(obj, dict):
        return sum(thai_count(v) for v in obj.values())
    if isinstance(obj, list):
        return sum(thai_count(v) for v in obj)
    return 0


def strip_keys(obj, key):
    if isinstance(obj, dict):
        return {k: strip_keys(v, key) for k, v in obj.items() if k != key}
    if isinstance(obj, list):
        return [strip_keys(v, key) for v in obj]
    return obj


def clean_strings(obj):
    if isinstance(obj, str):
        return "TH" if THAI.search(obj) else obj
    if isinstance(obj, dict):
        return {k: clean_strings(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_strings(v) for v in obj]
    return obj


def filter_json(src_name, dst_name):
    src = os.path.join(REPO, src_name)
    dst = os.path.join(OUT, dst_name)
    with open(src, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    data = strip_keys(data, "th")
    data = clean_strings(data)
    n = thai_count(data)
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"THAI_CHARS_IN_OUTPUT: {n}")
    return n == 0


def filter_lines(src_name, dst_name):
    src = os.path.join(REPO, src_name)
    dst = os.path.join(OUT, dst_name)
    out_lines = []
    with open(src, "r", encoding="utf-8") as fh:
        for line in fh:
            if not THAI.search(line):
                out_lines.append(line)
    text = "".join(out_lines)
    n = len(THAI.findall(text))
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(f"THAI_CHARS_IN_OUTPUT: {n}")
    return n == 0


def main():
    ok = True
    for i in range(1, 9):
        name = f"w0{i}.json"
        ok = filter_json(f"content/storytime/l2/{name}", name) and ok
    for src, dst in [
        ("measure/tracks/storytime_week_package_20261022/plan.md", "plan.md"),
        ("measure/tracks/storytime_week_package_20261022/spec.md", "spec.md"),
        ("measure/tech-debt.md", "tech-debt.md"),
        ("measure/lessons-learned.md", "lessons-learned.md"),
    ]:
        ok = filter_lines(src, dst) and ok
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
