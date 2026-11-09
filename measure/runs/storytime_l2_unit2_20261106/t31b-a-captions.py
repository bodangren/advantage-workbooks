#!/usr/bin/env python3
"""Task 3.1b part (a): the English share captions of storytime L2 unit 2 weeks 9 to 16.

The script holds the 40 caption rows. It writes:
- share-captions-en.md: the draft, one row for each script.
- share-english-pack.md: the review pack, with the FR-14 and D19 rules.
- t31b-a-rules.txt: the check of the 40 rows against the rules of FR-14.

It reads the week files through the same Thai filter as the extract script.
"""

import importlib.util
import json
import pathlib
import re

RUN = pathlib.Path(__file__).resolve().parent
ROOT = RUN.parents[2]

spec = importlib.util.spec_from_file_location("extract", RUN / "jr-green-t31b-extract-en.py")
extract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract)

MEDIA_EXTENSION = re.compile(
    r"\.(mp3|wav|m4a|aac|ogg|opus|mp4|m4v|webm|mov|jpg|jpeg|png|webp|gif|svg|pdf)$",
    re.IGNORECASE,
)

MOMENT_TABLE = {
    1: [("A3", "video")],
    2: [("B5", "video")],
    3: [("C4", "video")],
    4: [("D4", "photo"), ("D5", "video")],
    5: [("D6", "video")],
}
REVIEW_MOMENT_TABLE = {
    1: [("A2", "video")],
    2: [("B1", "video")],
    3: [("C1", "video")],
    4: [("D1", "video")],
    5: [("E3", "video")],
}

# week, day, script id, caption
ROWS = [
    (9, 1, "A", "The sound of the week is d. Your child says /d/, says dog, and writes the letter d."),
    (9, 2, "B", "Your child acts the story Yum! and says I like rice, Yum! at the front of the class."),
    (9, 3, "C", "One child reads one page of the book Dad and the Mop aloud to the class."),
    (9, 4, "D", "The photo shows the sentence I like cake, Yum! in your child's hand. The video shows your child reading it to the class."),
    (9, 5, "E", "The class sings Yum, Yum, Yum! at the song show, and your child does the actions."),
    (10, 1, "A", "Your child writes the letter a, then the endings -an and -ad, and says the formation words."),
    (10, 2, "B", "Your child acts the story Dress Up! and says Put on your hat at the front of the class."),
    (10, 3, "C", "One child reads one page of the book The Tan Man aloud to the class."),
    (10, 4, "D", "The photo shows the sentence Put on your hat in your child's hand. The video shows your child reading it to the class."),
    (10, 5, "E", "The class sings Put On Your Hat! at the song show, and your child does the actions."),
    (11, 1, "A", "The sound of the week is e. Your child says /e/, says egg, and writes the letter e."),
    (11, 2, "B", "Your child acts the story Where Is Pip? and asks and answers Where is the teddy?"),
    (11, 3, "C", "One child reads one page of the book The Den aloud to the class."),
    (11, 4, "D", "The photo shows the question Where is the cat in your child's hand. The video shows your child reading it to the class."),
    (11, 5, "E", "The class sings Where Is the Ball? at the song show, and your child does the actions."),
    (12, 1, "A", "The sound of the week is h. Your child says /h/, says hat, and writes the letter h."),
    (12, 2, "B", "Your child acts the story Open Your Book! and says Open your book and Close your book."),
    (12, 3, "C", "One child reads one page of the book The Hen and the Hat aloud to the class."),
    (12, 4, "D", "The photo shows the sentence Open your book in your child's hand. The video shows your child reading it to the class."),
    (12, 5, "E", "The class sings Open Your Book and Read! at the song show, and your child does the actions."),
    (13, 1, "A", "Your child writes the letter o, then the endings -ot and -op, and says the formation words."),
    (13, 2, "B", "Your child acts the story Look at Me! and says I can jump with an action."),
    (13, 3, "C", "One child reads one page of the book Hop on Top! aloud to the class."),
    (13, 4, "D", "The photo shows the sentence I can jump in your child's hand. The video shows your child reading it to the class."),
    (13, 5, "E", "The class sings I Can Run and Jump! at the song show, and your child does the actions."),
    (14, 1, "A", "The sound of the week is f. Your child says /f/, says fish, and writes the letter f."),
    (14, 2, "B", "Your child acts the story Hot and Cold and says It is sunny with an action."),
    (14, 3, "C", "One child reads one page of the book On Goes the Fan! aloud to the class."),
    (14, 4, "D", "The photo shows the sentence It is hot in your child's hand. The video shows your child reading it to the class."),
    (14, 5, "E", "The class sings It Is Sunny! at the song show, and your child does the actions."),
    (15, 1, "A", "The sound of the week is g. Your child says /g/, says goat, and writes the letter g."),
    (15, 2, "B", "Your child acts the story Look, a Bus! and says Look, a bus with a point."),
    (15, 3, "C", "One child reads one page of the book The Tag aloud to the class."),
    (15, 4, "D", "The photo shows the sentence Look, a bus in your child's hand. The video shows your child reading it to the class."),
    (15, 5, "E", "The class sings Look, Look, Look! at the song show, and your child does the actions."),
    (16, 1, "A", "Your child reads Yum! and Dress Up! with a partner at the big book center."),
    (16, 2, "B", "Your child reads Where Is Pip? and Open Your Book! with a partner at the big book center."),
    (16, 3, "C", "Your child reads Look at Me! and Hot and Cold with a partner at the big book center."),
    (16, 4, "D", "Your child reads Look, a Bus! and one more book from this unit with a partner at the big book center."),
    (16, 5, "E", "The class votes for a unit 2 song, sings it at the song show, and your child gets the unit 2 sticker."),
]


def weeks():
    data = {}
    for week in range(9, 17):
        data[week] = extract.clean(json.loads(extract.week_path(week).read_text(encoding="utf-8")))
    return data


def words(text):
    return len([p for p in re.split(r"\s+", text.strip()) if p])


def row_id(week, day):
    return "SC-w%02d-d%d" % (week, day)


def shots_for(week, day):
    table = MOMENT_TABLE if week < 16 else REVIEW_MOMENT_TABLE
    return table[day]


def expected_steps(week, day, data):
    """The step ids and titles of the moment table, as (code, title, media) triples."""
    week_data = data[week]
    script = next(s for s in week_data["scripts"] if s["day"] == day)
    steps = {s["id"]: extract.text_of(s.get("title")) for s in script["steps"]}
    before = next((s for s in week_data["scripts"] if s["day"] == day - 1), None)
    if before:
        for s in before["steps"]:
            if s.get("moved") == "next-opening":
                steps[s["id"]] = extract.text_of(s.get("title"))
    return [(code, steps.get(code, "?"), media) for code, media in shots_for(week, day)]


def check_rows(data):
    errors = []
    if len(ROWS) != 40:
        errors.append("row count is %d, not 40" % len(ROWS))
    ids = [row_id(w, d) for w, d, _, _ in ROWS]
    if len(set(ids)) != len(ids):
        errors.append("duplicate row id")
    for week, day, script_id, caption in ROWS:
        rid = row_id(week, day)
        week_data = data[week]
        kind = week_data["meta"]["kind"]
        script = next((s for s in week_data["scripts"] if s["day"] == day), None)
        if script is None or script["id"] != script_id:
            errors.append(rid + ": script id mismatch")
            continue
        own = {s["id"] for s in script["steps"]}
        before = next((s for s in week_data["scripts"] if s["day"] == day - 1), None)
        moved_before = {s["id"] for s in (before or {}).get("steps", []) if s.get("moved") == "next-opening"}
        period = {s["id"] for s in script["steps"] if not s.get("moved")} | moved_before
        shots = shots_for(week, day)
        if not 1 <= len(shots) <= 2:
            errors.append(rid + ": shot count is not 1 or 2")
        expected = MOMENT_TABLE if week < 16 else REVIEW_MOMENT_TABLE
        if shots != expected[day]:
            errors.append(rid + ": shots differ from the moment table")
        for code, media in shots:
            if code not in own and code not in moved_before:
                errors.append(rid + ": " + code + " is not a step of the script or a moved step of the day before")
            if media not in ("photo", "video"):
                errors.append(rid + ": media is " + media)
            if code == ("E5" if kind == "teach" else "A1"):
                errors.append(rid + ": " + code + " is an assessment step")
        if not any(code in period for code, _ in shots):
            errors.append(rid + ": no shot in the period of the day")
        if len({code for code, _ in shots}) != len(shots):
            errors.append(rid + ": two shots name the same step")
        count = words(caption)
        if not 1 <= count <= 40:
            errors.append(rid + ": caption has %d words" % count)
        if MEDIA_EXTENSION.search(caption.strip()):
            errors.append(rid + ": caption ends in a media file extension")
        if re.search(r"[\u0e00-\u0e7f]", caption):
            errors.append(rid + ": caption holds Thai text")
    return errors


REVIEW_ANSWERS = """
## Review answers

Source of the findings: `share-english-review.md` (part b, audited head 1484e9a6). The step text is from
`t31b-english-extract.txt`.

| finding | rows | result | reason | new caption |
|---|---|---|---|---|
| E1 | SC-w10-d1 | FIX | The A3 step writes the letter a, then the letter n (an) and the letter d (ad), and the class says the formation words. The step does not read man or dad, so the old caption was wrong on the two words. The finding is wrong on one point: the element of week 10 is the two word families -an and -ad, not the single sound a (plan element; A1 of the week says "no new letter"). | Your child writes the letter a, then the endings -an and -ad, and says the formation words. |
| E1 | SC-w13-d1 | FIX | The A3 step writes the letter o, then the letter t (ot) and the letter p (op), and the class says the formation words. The step reads no word. The element of week 13 is the two word families -ot and -op, not the single sound o. | Your child writes the letter o, then the endings -ot and -op, and says the formation words. |
| E2 | SC-w14-d1 | FIX | The caption now writes the sound as /f/, as the other sound rows do. | The sound of the week is f. Your child says /f/, says fish, and writes the letter f. |
| E3 | SC-w09-d3, SC-w10-d3, SC-w11-d3, SC-w12-d3, SC-w13-d3, SC-w14-d3, SC-w15-d3 | ANSWER | The moment table of FR-14 films one child who reads one page of the C4 book aloud for 10 to 20 seconds. The step C4 is "read together", and the shot shows one child of the class, not every child. The shipped captions of w01 to w08 use the same words, for example w01 day 3: "One child reads one page of Nan Can Nod aloud to the class for ten seconds." D19 forbids a name, so the caption cannot say which child. The parent sees one child of the class, and the teacher knows the child. | no change |
| E4 | SC-w16-d4 | FIX | The D1 step reads Look, a Bus! and the read-along of the weakest week at the centers. The caption now names the big book center and the second book. | Your child reads Look, a Bus! and one more book from this unit with a partner at the big book center. |
| E5 | SC-w09-d4 | FIX | The D4 trace is "I like cake. Yum!" The caption now uses the shape of the other six day 4 rows, and the comma form of SC-w09-d2. | The photo shows the sentence I like cake, Yum! in your child's hand. The video shows your child reading it to the class. |

A fix changes the draft row and the pack row. The other 33 rows are unchanged.
"""


def write_draft():
    lines = ["# Share captions, English draft: Storytime L2 unit 2 weeks 9 to 16", ""]
    lines.append("Task 3.1b part (a). Source of the steps: the staged weeks 9 to 16.")
    lines.append("Rules: FR-14 and D19 of `storytime_teaching_loops_20261103`. The review of part (b) reads the pack.")
    lines.append("The answers to the review are in the last section.")
    lines.append("")
    lines.append("| id | script | shots | English caption | words |")
    lines.append("|---|---|---|---|---|")
    for week, day, script_id, caption in ROWS:
        shots = "; ".join("%s %s" % (code, media) for code, media in shots_for(week, day))
        lines.append("| %s | %s | %s | %s | %d |" % (row_id(week, day), script_id, shots, caption, words(caption)))
    lines.append("")
    lines.append(REVIEW_ANSWERS)
    (RUN / "share-captions-en.md").write_text("\n".join(lines), encoding="utf-8")


RULES = """## The rules (quoted from `storytime_teaching_loops_20261103`, FR-14 and D19)

The check `share-moment` reports one problem line for each broken rule:

1. Each script has `share`.
2. Each shot `step` names a step of the same script, or a step with `moved: 'next-opening'` of the script of the day before.
3. At least one shot of the day names a step in the period of the day (see Terms).
4. The two shots of one day name two different steps.
5. No shot names an assessment step (see Terms). A photo or a video of a check shows the check items and a child under test.
6. `caption.en` has 1 to 40 words. The word count: trim `caption.en`, split it on runs of white space, and count the non-empty parts. `caption.th` is not empty after trim. The check does not test the Thai text in other ways.
7. No caption string ends in a media file extension.

Terms: the period of the day is the own steps without `moved`, plus the moved steps of the day before. The
assessment step is E5 (Check) of a teach week and A1 (Benchmark: paper part) of a review week.

D19: Each caption is for its week. It names the English of the moment: the sound and a word, the frame
sentence, the book title, or the song title. A caption names no child. The teacher posts the caption with no change.

The moment table of FR-14 for these weeks: teach weeks use A3 (Form it), B5 (Frame practice), C4 (read
together), D4 (Write it) with a photo and D5 (Share) with a video, and D6 (Sing it: song show). Week 16 uses
A2 (Centers) on day 1, B1, C1, and D1 (Centers, rotation 1) on days 2 to 4, and E3 (Song show and unit sticker)
on day 5.
"""


def write_pack(data):
    lines = ["# Share moments, English pack: Storytime L2 unit 2 weeks 9 to 16", ""]
    lines.append("For the English review of Task 3.1b part (b). This pack is the full input of that review.")
    lines.append("")
    lines.append(RULES)
    lines.append("## The 40 moments")
    lines.append("")
    lines.append("| id | script | steps and media | English caption | words |")
    lines.append("|---|---|---|---|---|")
    for week, day, script_id, caption in ROWS:
        shots = "; ".join(
            "%s %s (%s)" % (code, title, media) for code, title, media in expected_steps(week, day, data)
        )
        lines.append("| %s | %s | %s | %s | %d |" % (
            row_id(week, day), script_id, shots, caption, words(caption)))
    lines.append("")
    (RUN / "share-english-pack.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    data = weeks()
    errors = check_rows(data)
    write_draft()
    write_pack(data)
    lines = ["Task 3.1b part (a) rules check", "",
             "rows: %d" % len(ROWS),
             "errors: %d" % len(errors)]
    lines.extend("ERROR " + e for e in errors)
    (RUN / "t31b-a-rules.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (RUN / "t31b-a-rules-r2.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("rows", len(ROWS), "errors", len(errors))
    for e in errors:
        print("ERROR", e)


if __name__ == "__main__":
    main()
