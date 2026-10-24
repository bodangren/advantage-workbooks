"""Writes the book audio into a Storytime week file (scripts/storytime/book-audio.ts).

Usage: python3 set-book-audio.py <week.json> < audio.json

stdin: a JSON object from the 0-based book index to its `audio` value. The week file is written in
its own format (two-space indent, UTF-8 text), so that only the audio values change.
"""
import json
import sys


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    audio = json.load(sys.stdin)
    with open(argv[1], encoding="utf-8") as f:
        week = json.load(f)
    for index, value in audio.items():
        week["books"][int(index)]["audio"] = value
    with open(argv[1], "w", encoding="utf-8") as f:
        f.write(json.dumps(week, indent=2, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
