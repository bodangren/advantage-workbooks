#!/usr/bin/env python3
"""Build the 12 song line times of week 9 from the local faster-whisper transcript.

Reads the 12 song.lines texts of the filtered week 9 copy, aligns them with the
recognized words of the chosen take, and writes one entry per line in the form of
song.times of week 7. A word that the recognizer did not hear gets an estimated
time between its neighbors. Exit 1 when a line's food word is not found.
"""
import json
import re
import sys

WEEK = "/tmp/opencode/t61/in/w09.json"
TRANS = "measure/runs/storytime_l2_unit2_20261106/songs-transcripts/w09-c2.json"
OUT = "measure/runs/storytime_l2_unit2_20261106/t61-w09-song-times.json"

FOODS = ["rice", "milk", "eggs", "bread", "rice", "milk", "juice", "cake", "rice", "milk", "bananas", "lunch"]
DURATION = 69.8
EST_WINDOW = 0.30
MIN_WINDOW = 0.10


def norm(word):
    """The comparable form of a token: lowercase letters only (punctuation dropped)."""
    return re.sub(r"[^a-z]", "", word.lower())


def load_tokens():
    """The recognized tokens of the transcript in order, with zero-length tokens dropped."""
    data = json.load(open(TRANS, encoding="utf-8"))
    tokens = []
    for seg in data["segments"]:
        for w in seg["words"]:
            start = round(float(w["start"]), 2)
            end = round(float(w["end"]), 2)
            if end <= start:
                continue
            tokens.append({"word": w["word"], "start": start, "end": end})
    return tokens, data


def find_food(tokens, like_index, food):
    """The index of the food word: the first token after 'like' whose letters are the food."""
    for index in range(like_index + 1, min(like_index + 3, len(tokens))):
        if norm(tokens[index]["word"]) == food:
            return index
    return None


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
        items[index]["estimated"] = True


def main():
    week = json.load(open(WEEK, encoding="utf-8"))
    lines = [line["text"] for line in week["song"]["lines"]]
    tokens, transcript = load_tokens()

    ok = True

    def check(name, condition, detail=""):
        nonlocal ok
        print("CHECK %s: %s%s" % (name, "PASS" if condition else "FAIL", "" if condition else " (%s)" % detail))
        ok = ok and condition
        return condition

    check("lines=12", len(lines) == 12, "%d lines" % len(lines))
    text_bad = [(i, line) for i, (line, food) in enumerate(zip(lines, FOODS)) if line != "I like %s! Yum, yum, yum!" % food]
    check("line_text", not text_bad, repr(text_bad[:3]))

    entries = []
    estimated = []
    cursor = 0
    for index, (line, food) in enumerate(zip(lines, FOODS)):
        like_index = None
        for probe in range(cursor, len(tokens)):
            if norm(tokens[probe]["word"]) == "like":
                like_index = probe
                break
        if like_index is None:
            print("CHECK food[%d]=%s: FAIL (no 'like' found)" % (index + 1, food))
            return 1
        food_index = find_food(tokens, like_index, food)
        if food_index is None:
            print("CHECK food[%d]=%s: FAIL (the food word is not found after 'like')" % (index + 1, food))
            return 1

        next_like = None
        for probe in range(like_index + 1, len(tokens)):
            if norm(tokens[probe]["word"]) == "like":
                next_like = probe
                break
        boundary = len(tokens) if next_like is None else next_like
        yums = [(probe, tokens[probe]) for probe in range(food_index + 1, boundary) if norm(tokens[probe]["word"]) == "yum"]

        i_index = like_index - 1 if like_index > 0 and norm(tokens[like_index - 1]["word"]) == "i" else None
        matched = [i_index, like_index, food_index] + [probe for probe, _ in yums[:3]]
        words = line.split(" ")
        resolved = []
        for slot, word in enumerate(words):
            probe = matched[slot] if slot < len(matched) else None
            if probe is None:
                resolved.append({"word": word, "start": None, "end": None, "estimated": True})
            else:
                resolved.append({"word": word, "start": tokens[probe]["start"], "end": tokens[probe]["end"], "estimated": False})

        last_index = None
        for probe in matched:
            if probe is not None:
                last_index = probe

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
            next_start = DURATION
            for ahead in range(run[-1] + 1, len(resolved)):
                if not resolved[ahead]["estimated"]:
                    next_start = resolved[ahead]["start"]
                    break
            else:
                if last_index is not None and last_index + 1 < len(tokens):
                    next_start = tokens[last_index + 1]["start"]
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
            "LINE %2d %-8s %6.2f-%6.2f  yums_heard=%d  estimated=%s"
            % (index + 1, food, entries[-1]["startTime"], entries[-1]["endTime"], len(yums), [w["word"] for w in resolved if w["estimated"]] or "none")
        )
        cursor = like_index + 1

    check("lines=12", len(entries) == 12, "%d entries" % len(entries))
    bad_line = [i + 1 for i, e in enumerate(entries) if not e["startTime"] < e["endTime"]]
    bad_word = [(i + 1, w["word"]) for i, e in enumerate(entries) for w in e["words"] if not w["start"] < w["end"]]
    check("start<end", not bad_line and not bad_word, "lines %s, words %s" % (bad_line, bad_word[:5]))
    rising = all(entries[i]["startTime"] > entries[i - 1]["startTime"] for i in range(1, len(entries)))
    check("times_increase", rising, "line starts must rise")
    all_times = [e["startTime"] for e in entries] + [e["endTime"] for e in entries] + [w["start"] for e in entries for w in e["words"]] + [w["end"] for e in entries for w in e["words"]]
    check("range_0_69.8", min(all_times) >= 0 and max(all_times) <= DURATION, "min %.2f max %.2f" % (min(all_times), max(all_times)))
    check("transcript_coverage", float(transcript.get("coverage", 0)) == 1.0, "coverage %s" % transcript.get("coverage"))

    print("ESTIMATED_WORDS=%d" % len(estimated))
    for line_no, word, start, end in estimated:
        print("  estimated line %d %r %.2f-%.2f" % (line_no, word, start, end))

    if ok:
        with open(OUT, "w", encoding="utf-8") as handle:
            handle.write(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
        print("WROTE %s" % OUT)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
