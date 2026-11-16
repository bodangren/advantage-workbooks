#!/usr/bin/env python3
"""Phase 13 acceptance step 2: the memory rows and lessons, exact-line python edits.

tech-debt.md (50 lines before, 50 after):
  - row 47 (the Phase 12 row) item (2) gains the skip-rule sentence,
  - row 47 item (3) becomes the Phases 11, 12 and 13 builder row (merged),
  - the two 2026-11-16 loops rows merge into one row (room for the new row),
  - one new heard-check row is appended (p13-sentences-heard.txt holds a
    `heard differs` line, so the row is required).
lessons-learned.md (50 lines before, 50 after):
  - the 2 lessons of the task line merge into line 36, the nearest existing
    lesson of this track, as (3) and (4).
The script asserts the line counts, asserts 0 Thai characters in every line it
writes, and prints no Thai line.
"""

import re
import sys

BASE = "/home/daniebo/Desktop/Workbooks"
TD = BASE + "/measure/tech-debt.md"
LL = BASE + "/measure/lessons-learned.md"
HEARD = BASE + ("/measure/runs/storytime_week_package_20261022/"
                "p13-sentences-heard.txt")
THAI = re.compile("[฀-๿]")


def read_body(path):
    """The lines of a file without the trailing empty element."""
    lines = open(path, encoding="utf-8").read().split("\n")
    assert lines[-1] == "", path
    return lines[:-1]


def write_body(path, body):
    """Writes the lines back with one trailing newline."""
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(body) + "\n")


def must_replace(text, old, new, label):
    """Replaces one exact substring and fails when it is missing."""
    assert text.count(old) == 1, "%s: %d hits for %r" % (
        label, text.count(old), old[:60])
    return text.replace(old, new, 1)


def main():
    # --- the precondition of the third row: a `heard differs` line exists
    heard = open(HEARD, encoding="utf-8").read()
    differs = [l for l in heard.split("\n") if "heard differs" in l]
    assert differs, "no heard differs line"

    # --- tech-debt.md
    body = read_body(TD)
    assert len(body) == 50, "tech-debt before: %d" % len(body)
    already = "heard check of the makers runs on the raw take WAV" in body[-1]
    if already:
        print("tech-debt.md: already applied, 50 lines")
    else:
        # row 47: item (2) gains the skip-rule sentence, item (3) becomes the
        # merged Phases 11, 12 and 13 builder row.
        row = body[46]
        assert row.startswith(
            "| 2026-11-13 | storytime_week_package_20261022 |")
        row = must_replace(
            row,
            "because the check `sentence-clips` compares the text and no bank "
            "holds them.",
            "because the check `sentence-clips` compares the text and no bank "
            "holds them; the skip rule makes only the changed sentences.",
            "td item2")
        row = must_replace(
            row,
            "(3) The package builder is a script under `measure/runs/` and has "
            "no unit test.",
            "(3) The package builder scripts of Phases 11, 12 and 13 under "
            "`measure/runs/` have no unit test.",
            "td item3")
        body[46] = row

        # merge the two 2026-11-16 loops rows into one row (Medium is the
        # higher severity of the two).
        left, right = body[48], body[49]
        assert left.startswith(
            "| 2026-11-16 | storytime_teaching_loops_20261103 |")
        assert right.startswith(
            "| 2026-11-16 | storytime_teaching_loops_20261103 |")
        pl, pr = left.split(" | "), right.split(" | ")
        assert len(pl) == 6 and len(pr) == 6, (len(pl), len(pr))
        item_r = pr[2]
        item_r = must_replace(
            item_r,
            "Two carried test gaps of the final acceptance (FA-3 and FA-4). ",
            "", "td merge prefix")
        item_r = must_replace(item_r, "(1) ", "(3) FA-3: ", "td merge n1")
        item_r = must_replace(item_r, "(2) ", "(4) FA-4: ", "td merge n2")
        assert pr[5].endswith(" |") and pl[5].endswith(" |"), "cell shape"
        notes_r = pr[5][:-2]
        notes_l = pl[5][:-2]
        notes_r = must_replace(notes_r, "(1) ", "(3) ", "td merge note1")
        notes_r = must_replace(notes_r, "(2) ", "(4) ", "td merge note2")
        merged_item = must_replace(
            pl[2], "Two items.",
            "Four items, merged on 2026-11-16 to keep this file at 50 lines.",
            "td merge head")
        merged = ("%s | %s | %s %s | Medium | Open | %s %s |" % (
            pl[0], pl[1], merged_item, item_r, notes_l, notes_r))
        assert not THAI.search(merged), "Thai in merged row"
        body[48:50] = [merged]

        # the new heard-check row
        new_row = (
            "| 2026-11-16 | storytime_week_package_20261022 | The heard check "
            "of the makers runs on the raw take WAV and not on the shipped mp3, "
            "so it cannot catch a difference that the mp3 adds (Phase 13: the "
            "shipped w01 `l2/media/w01/sentences/b0-s02.mp3` was heard as "
            "\"Hello, I am Mae.\" for \"Hello, I am May.\"). | Low | Open | "
            "Run the heard check on the shipped mp3 before a package ships, or "
            "accept a homophone difference with a note on the listen list (the "
            "Phase 13 Clips task heard all 72 read-along clips on the shipped "
            "mp3). |")
        assert not THAI.search(new_row), "Thai in new row"
        body.append(new_row)
        assert len(body) == 50, "tech-debt after: %d" % len(body)
        text = "\n".join(body) + "\n"
        assert not THAI.search(text), "Thai in tech-debt.md"
        write_body(TD, body)
        print("tech-debt.md: row 47 items 2 and 3 updated, 2 loops rows merged "
              "into 1, 1 heard-check row added, 50 lines")

    # --- lessons-learned.md
    lbody = read_body(LL)
    assert len(lbody) == 50, "lessons before: %d" % len(lbody)
    lesson = lbody[35]
    assert lesson.startswith(
        "- (2026-11-13, storytime_week_package_20261022) Two lessons"), lesson[:60]
    lesson = must_replace(
        lesson,
        "- (2026-11-13, storytime_week_package_20261022) Two lessons, merged on "
        "2026-11-16 to keep this file at 50 lines.",
        "- (2026-11-13 and 2026-11-16, storytime_week_package_20261022) Four "
        "lessons, merged on 2026-11-16 to keep this file at 50 lines.",
        "ll head")
    lesson = must_replace(
        lesson,
        "the sentence maker reads only the week JSON and writes under "
        "`l2/media/w0<n>/sentences/`.",
        "the sentence maker reads only the week JSON and writes under "
        "`l2/media/w0<n>/sentences/`. (3) A paid maker logs each call before "
        "the call starts, so that a failed call and a stopped run still show "
        "the characters sent (Phase 13, 2026-11-16). (4) A new scope of a "
        "shipped list is an opt-in with the old default, plus a skip rule, so "
        "that the older tests stay true and a rerun cannot change a shipped "
        "clip (Phase 13, 2026-11-16).",
        "ll items")
    assert not THAI.search(lesson), "Thai in merged lesson"
    lbody[35] = lesson
    # the file holds 3 pre-existing Thai lines (15, 28, 43); this role adds none
    thai_lines = [i + 1 for i, l in enumerate(lbody) if THAI.search(l)]
    assert thai_lines == [15, 28, 43], "Thai line set changed: %s" % thai_lines
    assert len(lbody) == 50, "lessons after: %d" % len(lbody)
    write_body(LL, lbody)
    print("lessons-learned.md: 2 lessons merged into the 2026-11-13 lesson line "
          "as (3) and (4), 50 lines, thai lines unchanged: %s" % thai_lines)
    print("tech-debt.md lines: 50")
    print("lessons-learned.md lines: 50")
    return 0


if __name__ == "__main__":
    sys.exit(main())
