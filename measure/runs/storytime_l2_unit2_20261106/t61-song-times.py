#!/usr/bin/env python3
"""Build the song line times of one week from its local faster-whisper transcript.

Usage: t61-song-times.py <week> <candidate> [options]
       e.g. t61-song-times.py w10 c2

The week is the prefix of the filtered week copy and of the transcript name.
Each line is anchored on its key word (the item, the thing, or `Pip`: the word
after `your`, after `like`, or after `the`). The words before the key and after
it are matched in order against the recognized words after the previous line,
with a lookahead of two tokens for an extra heard word. The key word must be
heard. A word that the recognizer did not hear gets an estimated time between
its neighbors. Exit 1 on any failed check.

Options (the default run keeps the week 9 to 11 behavior):
  --lookahead N           tokens the matcher may skip for one target word (default 2)
  --key-after WORD        an extra key marker; the key word is the word after it
  --min-token SEC         drop a recognized token shorter than SEC (default 0.0)
  --drop-lines LIST       song lines to leave out, 1-based, comma separated
  --extend-line-end       a line ends at the last sung repeat of its last word
  --coverage-min FLOAT    the lowest transcript coverage that still passes (default 1.0)
  --out PATH              the output file (default measure/runs/.../t61-<week>-song-times.json)
  --print-words           print every word with its times
"""
import argparse
import json
import re
import sys

FILTERED = "/tmp/opencode/t61/in/%s.json"
TRANS = "measure/runs/storytime_l2_unit2_20261106/songs-transcripts/%s-%s.json"
OUT = "measure/runs/storytime_l2_unit2_20261106/t61-%s-song-times.json"

LOOKAHEAD = 2
EST_WINDOW = 0.30
MIN_WINDOW = 0.10
MARKERS = ("like", "your", "the", "is")
MIN_TOKEN_WINDOW = 0.05
REPEAT_GAP = 2.0


def norm(word):
    """The comparable form of a token: lowercase letters only (punctuation dropped)."""
    return re.sub(r"[^a-z]", "", word.lower())


def load_tokens(candidate, min_window=0.0):
    """The recognized tokens in order. Zero-length tokens are dropped; a token with a
    leading hyphen (`-shirt,` after `t`) joins the token before it. A token shorter
    than `min_window` seconds is dropped after the join."""
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
    if min_window:
        tokens = [t for t in tokens if t["end"] - t["start"] >= min_window]
    return tokens, data


def key_index(target, markers):
    """The key word of a line: the word after the first key marker (fourth word when none)."""
    for marker in markers:
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


def align(target, tokens, floor, lookahead):
    """Map the line tokens to recognized token indexes, anchored on the key word.

    Returns the mapping (target index to token index) and the key slot. The key
    word is the first matching token at or after `floor`; the words before it
    and after it are matched in order with a lookahead of `lookahead` tokens.
    """
    slot = key_index(target, MARKERS)
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
        for extra in range(1, lookahead + 1):
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
        for extra in range(1, lookahead + 1):
            if probe + extra < len(tokens) and tokens[probe + extra]["norm"] == target[index]:
                skipped = extra
                break
        if skipped is not None:
            probe += skipped
            continue
        index += 1

    return mapping, slot


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("week")
    parser.add_argument("candidate")
    parser.add_argument("--lookahead", type=int, default=LOOKAHEAD)
    parser.add_argument("--key-after", action="append", default=[])
    parser.add_argument("--min-token", type=float, default=0.0)
    parser.add_argument("--drop-lines", default="")
    parser.add_argument("--extend-line-end", action="store_true")
    parser.add_argument("--coverage-min", type=float, default=1.0)
    parser.add_argument("--out", default=None)
    parser.add_argument("--print-words", action="store_true")
    args = parser.parse_args()

    global MARKERS
    MARKERS = tuple(args.key_after) + MARKERS
    drop = set()
    if args.drop_lines:
        drop = {int(part) for part in args.drop_lines.split(",") if part.strip()}

    week, cand = args.week, args.candidate
    week_data = json.load(open(FILTERED % week, encoding="utf-8"))
    all_lines = [line["text"] for line in week_data["song"]["lines"]]
    kept_indexes = [i for i in range(1, len(all_lines) + 1) if i not in drop]
    lines = [all_lines[i - 1] for i in kept_indexes]
    tokens, transcript = load_tokens(TRANS % (week, cand), args.min_token)
    duration = float(transcript["duration_s"])

    ok = True

    def check(name, condition, detail=""):
        nonlocal ok
        print("CHECK %s: %s%s" % (name, "PASS" if condition else "FAIL", "" if condition else " (%s)" % detail))
        ok = ok and condition
        return condition

    if drop:
        print("DROP_LINES=%s (kept %d of %d)" % (",".join(str(i) for i in sorted(drop)), len(lines), len(all_lines)))
    expected = len(lines)
    check("lines=%d" % expected, len(lines) == expected, "%d lines" % len(lines))

    entries = []
    estimated = []
    key_missing = []
    mapped_windows = []
    order_bad = []
    cursor = 0
    for index, line in enumerate(lines):
        words = line.split(" ")
        target = [norm(word) for word in words]
        mapping, key_slot = align(target, tokens, cursor, args.lookahead)

        slots = sorted(mapping)
        if [mapping[s] for s in slots] != sorted(mapping[s] for s in slots):
            order_bad.append(index + 1)
        for slot in slots:
            mapped_windows.append(tokens[mapping[slot]]["end"] - tokens[mapping[slot]]["start"])

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
        extended_end = None
        if args.extend_line_end and mapping and (len(target) - 1) in mapping:
            probe = last_probe
            while (
                probe + 1 < len(tokens)
                and tokens[probe + 1]["norm"] == target[-1]
                and tokens[probe + 1]["start"] - tokens[probe]["end"] <= REPEAT_GAP
            ):
                probe += 1
            if probe != last_probe:
                extended_end = tokens[probe]["end"]
                last_probe = probe

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

        end_time = resolved[-1]["end"]
        if extended_end is not None:
            end_time = max(end_time, extended_end)
        entries.append(
            {
                "sentence": line,
                "startTime": resolved[0]["start"],
                "endTime": end_time,
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
        if args.print_words:
            for w in resolved:
                print("    %-10s %6.2f-%6.2f%s" % (w["word"], w["start"], w["end"], "  ESTIMATED" if w["estimated"] else ""))
        cursor = last_probe + 1 if last_probe is not None else cursor

    check("key_words_heard", not key_missing, repr(key_missing))
    check("lines=%d" % expected, len(entries) == expected, "%d entries" % len(entries))
    bad_line = [i + 1 for i, e in enumerate(entries) if not e["startTime"] < e["endTime"]]
    bad_word = [(i + 1, w["word"]) for i, e in enumerate(entries) for w in e["words"] if not w["start"] < w["end"]]
    check("start<end", not bad_line and not bad_word, "lines %s, words %s" % (bad_line, bad_word[:5]))
    check("words_in_order", not order_bad, "lines %s" % order_bad)
    min_mapped = min(mapped_windows) if mapped_windows else 0.0
    check("word_tokens_min_%.2f" % MIN_TOKEN_WINDOW, min_mapped >= MIN_TOKEN_WINDOW, "min %.2f s" % min_mapped)
    rising = all(entries[i]["startTime"] > entries[i - 1]["startTime"] for i in range(1, len(entries)))
    check("times_increase", rising, "line starts must rise")
    ends_ok = all(entries[i - 1]["endTime"] <= entries[i]["startTime"] + 1e-9 for i in range(1, len(entries)))
    check("line_ends_before_next", ends_ok, [(i, entries[i - 1]["endTime"], entries[i]["startTime"]) for i in range(1, len(entries)) if entries[i - 1]["endTime"] > entries[i]["startTime"] + 1e-9][:3])
    all_times = [e["startTime"] for e in entries] + [e["endTime"] for e in entries] + [w["start"] for e in entries for w in e["words"]] + [w["end"] for e in entries for w in e["words"]]
    check("range_0_duration", min(all_times) >= 0 and max(all_times) <= duration, "min %.2f max %.2f duration %.2f" % (min(all_times), max(all_times), duration))
    coverage = float(transcript.get("coverage", 0))
    check("transcript_coverage", coverage >= args.coverage_min, "coverage %s (min %.3f)" % (transcript.get("coverage"), args.coverage_min))

    print("ESTIMATED_WORDS=%d" % len(estimated))
    for line_no, word, start, end in estimated:
        print("  estimated line %d %r %.2f-%.2f" % (line_no, word, start, end))

    if ok:
        out = args.out or OUT % week
        with open(out, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
        print("WROTE %s" % out)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
