#!/usr/bin/env python3
"""Extract the English text of storytime L2 unit 2 weeks 1-16.

The script removes every key named "th" and every string that holds a
character in the Thai range U+0E00 to U+0E7F. The output holds English only.
"""

import json
import pathlib

ROOT = pathlib.Path("/home/daniebo/Desktop/Workbooks")
OUT = ROOT / "measure/runs/storytime_l2_unit2_20261106/t31b-english-extract.txt"

DROP = object()


def has_thai(text):
    return any("\u0e00" <= ch <= "\u0e7f" for ch in text)


def clean(value):
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if key == "th":
                continue
            item = clean(item)
            if item is not DROP:
                out[key] = item
        return out
    if isinstance(value, list):
        out = []
        for item in value:
            item = clean(item)
            if item is not DROP:
                out.append(item)
        return out
    if isinstance(value, str):
        return DROP if has_thai(value) else value
    return value


def week_path(week):
    name = "w%02d.json" % week
    if week <= 8:
        return ROOT / "content/storytime/l2" / name
    return ROOT / "content/storytime/drafts/l2" / name


def text_of(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(part for part in (text_of(item) for item in value) if part)
    if isinstance(value, dict):
        if "en" in value:
            return text_of(value["en"])
        return " ".join(part for part in (text_of(item) for item in value.values()) if part)
    return ""


def step_line(step):
    body = step.get("en") or {}
    if not isinstance(body, dict):
        body = {}
    parts = ["T: " + text_of(body.get("teacherActions")),
             "S: " + text_of(body.get("studentActions"))]
    line = " | ".join(part for part in parts if part.strip() not in ("T:", "S:"))
    moved = " [moved]" if step.get("moved") else ""
    return "%s%s | %s" % (
        text_of(step.get("title")),
        moved,
        line[:300],
    )


def main():
    lines = []
    for week in range(1, 17):
        data = clean(json.loads(week_path(week).read_text(encoding="utf-8")))
        meta = data.get("meta", {})
        lines.append("")
        lines.append("=" * 70)
        lines.append("WEEK w%02d  unit=%s  title=%s  song=%s" % (
            week, meta.get("unit"), text_of(meta.get("title")), text_of((data.get("song") or {}).get("title"))))
        for script in data.get("scripts", []):
            lines.append("")
            lines.append("-- script %s  day %s  title: %s" % (script.get("id"), script.get("day"), text_of(script.get("title"))))
            for step in script.get("steps", []):
                lines.append("   %-3s %-2sm  %s" % (
                    step.get("id"),
                    step.get("minutes"),
                    step_line(step),
                ))
            share = script.get("share")
            if share:
                lines.append("   SHARE shots: %s" % json.dumps(share.get("shots", []), ensure_ascii=True))
                caption = share.get("caption", {})
                lines.append("   SHARE caption.en: %s" % text_of(caption.get("en")))
    text = "\n".join(lines) + "\n"
    if has_thai(text):
        raise SystemExit("FAIL: Thai characters remain in the extract")
    OUT.write_text(text, encoding="utf-8")
    print("wrote", OUT)
    print("thai_chars", sum(1 for ch in text if "\u0e00" <= ch <= "\u0e7f"))


if __name__ == "__main__":
    main()
