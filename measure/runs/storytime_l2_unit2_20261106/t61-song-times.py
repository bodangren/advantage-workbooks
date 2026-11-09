#!/usr/bin/env python3
"""Build the song line times of one week from its local faster-whisper transcript.

Usage: t61-song-times.py <week> <candidate>   e.g. t61-song-times.py w10 c2

The week is the prefix of the filtered week copy and of the transcript name.
Each line is anchored on its key word (the item, the thing, or `Pip`: the word
after `your`, after `like`, or after `the`). The words before the key and after
it are matched in order against the recognized words after the previous line,
with a lookahead of two tokens for an extra heard word. The key word must be
heard. A word that the recognizer did not hear gets an estimated time between
its neighbors. Exit 1 on any failed check.
"""
import json
import re
import sys

FILTERED = "/tmp/opencode/t61/in/%s.json"
TRANS = "measure/runs/storytime_l2_unit2_20261106/songs-transcripts/%s-%s.json"
OUT = "measure/runs/storytime_l2_unit2_20261106/t61-%s-song-times.json"

LOOKAHEAD = 2
EST_WINDOW = 0.30
MIN_WINDOW = 0.10


def norm(word):
    """The comparable form of a token: lowercase letters only (punctuation dropped)."""
    return re.sub(r"[^a-z]", "", word.lower())


def load_tokens(candidate):
    """The recognized tokens in order. Zero-length tokens are dropped; a token with a
    leading hyphen (`-shirt,` after `t`) joins the token before it."""
    data = json.load(open(candidate, encoding="utf-8"))
    tokens = []
    for seg in data["segments"]:
        for w in seg["words"]:
            start = round(float(w["start"]), 2)
            end = round(float(w["end"]), 2)
            if end <= start:
                continue
            raw = w["word"]
            if tokens and raw.startswith("-"):
                tokens[-1]["word"] = tokens[-1]["word"] + raw
                tokens[-1]["end"] = end
                tokens[-1]["norm"] = norm(tokens[-1]["word"])
                continue
            tokens.append({"word": raw, "start": start, "end": end, "norm": norm(raw)})
    return tokens, data


def key_index(target):
    """The key word of a line: the word after `like`, `your`, or `the` (fourth word when none)."""
    for marker in ("like", "your", "the", "is"):
        if marker in target:
            return target.index(marker) + 1
    return 3


def estimate_run(items, run, prev_end, next_start):
    """Give each missing word of a run an estimated window between its neighbors."""
    count = len(run)
    gap = next_start - prev_end
    for position, index in enumerate(run, start=1):
        if gap <= 0.02:
            start = max(0.0, next_start - MIN_WINDOW)
            end = next_start
        else:
            center = prev_end + gap * position / (count + 1)
            width = min(EST_WINDOW, max(MIN_WINDOW, gap / (count + 1) * 0.6))
            start = center - width / 2
            end = center + width / 2
        start = round(start, 2)
        end = round(end, 2)
        if end <= start:
            end = round(start + 0.05, 2)
        items[index]["start"] = start
        items[index]["end"] = end


def align(target, tokens, floor):
    """Map the line tokens to recognized token indexes, anchored on the key word.

    Returns the mapping (target index to token index) and the key slot. The key
    word is the first matching token at or after `floor`; the words before it
    and after it are matched in order with a lookahead of LOOKAHEAD tokens.
    """
    slot = key_index(target)
    key_pos = None
    for probe in range(floor, len(tokens)):
        if tokens[probe]["norm"] == target[slot]:
            key_pos = probe
            break
    if key_pos is None:
        return {}, slot

    mapping = {slot: key_pos}

    index = slot - 1
    probe = key_pos - 1
    while index >= 0 and probe >= floor:
        if tokens[probe]["norm"] == target[index]:
            mapping[index] = probe
            index -= 1
            probe -= 1
            continue
        skipped = None
        for extra in range(1, LOOKAHEAD + 1):
            if probe - extra >= floor and tokens[probe - extra]["norm"] == target[index]:
                skipped = extra
                break
        if skipped is not None:
            probe -= skipped
            continue
        index -= 1

    index = slot + 1
    probe = key_pos + 1
    while index < len(target) and probe < len(tokens):
        if tokens[probe]["norm"] == target[index]:
            mapping[index] = probe
            index += 1
            probe += 1
            continue
        skipped = None
        for extra in range(1, LOOKAHEAD + 1):
            if probe + extra < len(tokens) and tokens[probe + extra]["norm"] == target[index]:
                skipped = extra
                break
        if skipped is not None:
            probe += skipped
            continue
        index += 1

    return mapping, slot


def main():
    if len(sys.argv) != 3:
        print("usage: t61-song-times.py <week> <candidate>")
        return 2
    week, cand = sys.argv[1], sys.argv[2]
    week_data = json.load(open(FILTERED % week, encoding="utf-8"))
    lines = [line["text"] for line in week_data["song"]["lines"]]
    tokens, transcript = load_tokens(TRANS % (week, cand))
    duration = float(transcript["duration_s"])

    ok = True

    def check(name, condition, detail=""):
        nonlocal ok
        print("CHECK %s: %s%s" % (name, "PASS" if condition else "FAIL", "" if condition else " (%s)" % detail))
        ok = ok and condition
        return condition

    check("lines=12", len(lines) == 12, "%d lines" % len(lines))

    entries = []
    estimated = []
    key_missing = []
    cursor = 0
    for index, line in enumerate(lines):
        words = line.split(" ")
        target = [norm(word) for word in words]
        mapping, key_slot = align(target, tokens, cursor)

        resolved = []
        for slot, word in enumerate(words):
            probe = mapping.get(slot)
            if probe is None:
                resolved.append({"word": word, "start": None, "end": None, "estimated": True})
            else:
                resolved.append({"word": word, "start": tokens[probe]["start"], "end": tokens[probe]["end"], "estimated": False})

        key_word = words[key_slot] if key_slot < len(words) else "(none)"
        key_heard = key_slot in mapping
        if not key_heard:
            key_missing.append((index + 1, key_word))

        last_probe = max(mapping.values()) if mapping else None
        run = []
        for slot, item in enumerate(resolved + [None]):
            if item is not None and item["estimated"]:
                run.append(slot)
                continue
            if not run:
                continue
            prev_end = 0.0
            for back in range(run[0] - 1, -1, -1):
                if not resolved[back]["estimated"]:
                    prev_end = resolved[back]["end"]
                    break
            next_start = duration
            for ahead in range(run[-1] + 1, len(resolved)):
                if not resolved[ahead]["estimated"]:
                    next_start = resolved[ahead]["start"]
                    break
            else:
                if last_probe is not None and last_probe + 1 < len(tokens):
                    next_start = tokens[last_probe + 1]["start"]
            estimate_run(resolved, run, prev_end, next_start)
            run = []

        entries.append(
            {
                "sentence": line,
                "startTime": resolved[0]["start"],
                "endTime": resolved[-1]["end"],
                "words": [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in resolved],
            }
        )
        for slot, w in enumerate(resolved):
            if w["estimated"]:
                estimated.append((index + 1, w["word"], w["start"], w["end"]))
        print(
            "LINE %2d %-9s %6.2f-%6.2f  key=%s heard=%s  estimated=%s"
            % (index + 1, key_word, entries[-1]["startTime"], entries[-1]["endTime"], key_word, key_heard, [w["word"] for w in resolved if w["estimated"]] or "none")
        )
        cursor = last_probe + 1 if last_probe is not None else cursor

    check("key_words_heard", not key_missing, repr(key_missing))
    check("lines=12", len(entries) == 12, "%d entries" % len(entries))
    bad_line = [i + 1 for i, e in enumerate(entries) if not e["startTime"] < e["endTime"]]
    bad_word = [(i + 1, w["word"]) for i, e in enumerate(entries) for w in e["words"] if not w["start"] < w["end"]]
    check("start<end", not bad_line and not bad_word, "lines %s, words %s" % (bad_line, bad_word[:5]))
    rising = all(entries[i]["startTime"] > entries[i - 1]["startTime"] for i in range(1, len(entries)))
    check("times_increase", rising, "line starts must rise")
    all_times = [e["startTime"] for e in entries] + [e["endTime"] for e in entries] + [w["start"] for e in entries for w in e["words"]] + [w["end"] for e in entries for w in e["words"]]
    check("range_0_duration", min(all_times) >= 0 and max(all_times) <= duration, "min %.2f max %.2f duration %.2f" % (min(all_times), max(all_times), duration))
    check("transcript_coverage", float(transcript.get("coverage", 0)) == 1.0, "coverage %s" % transcript.get("coverage"))

    print("ESTIMATED_WORDS=%d" % len(estimated))
    for line_no, word, start, end in estimated:
        print("  estimated line %d %r %.2f-%.2f" % (line_no, word, start, end))

    if ok:
        out = OUT % week
        with open(out, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
        print("WROTE %s" % out)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
