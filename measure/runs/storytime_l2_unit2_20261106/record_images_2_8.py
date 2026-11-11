"""Records Daniel's picture look of unit 2 in approval.images of the 8 staged week files.

Task 2.8 of track storytime_l2_unit2_20261106. The script marks Task 2.8 [~], replaces the draft
images block of each staged week file as text, proves by a JSON compare that only approval.images
changed, runs STAGE_CHECKS in one heavy-run, and adds 3 lines to the plan. On a failure it writes
back the old text of every file that it changed. It prints names, counts, and status values only,
never the text of a week file.
"""
import json, os, re, shlex, subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
DRAFTS = REPO + "/content/storytime/drafts/l2/"
PLAN_REL = "measure/tracks/storytime_l2_unit2_20261106/plan.md"
PLAN = REPO + "/" + PLAN_REL
REPORT = REPO + "/measure/runs/storytime_l2_unit2_20261106/approval-images-stage-checks.txt"
HEAVY = "/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh"
TMP = "/tmp/opencode/t28r/"
THAI = re.compile("[฀-๿]")
WEEKS = range(9, 17)
WORDS = "Hat-pip image passes, but the w10 put on your t shirt image doesn't pass."
DATE = "2026-11-11"
LOOK = ("Daniel, Google Tasks, 2026-11-11 06:27 ICT, reply to the look note 'Look: Storytime Level 2 unit 2 pictures, 228 of 229 ready', "
        "relayed by the PM session on 2026-11-11. Look package ~/Desktop/handoff/storytime-l2u2-picture-look-2026-11-11/, "
        "MANIFEST.txt SHA-256 2da72ee1e528133a057e9e45a49456e2542ccca20a9471bd4b90c3e6f516d94b. The pictures of this record are the "
        "week %d rows of rows.tsv (SHA-256 a62a67d88f78d85d3cfbcf571e01bf58efee2822f09a5b84fa1f3ab250e671f6): the color file and the line file of each row.")
PASS = " PM reading: Daniel named no row of week %d, so every row of the week passes."
W10 = (" PM reading: every row of week 10 passes except l2-w10-story-page-put-on-your-t-shirt. The row l2-w10-story-page-put-on-your-hat-pip "
       "passes as the color m3 (SHA-256 6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff) and the line try 3 "
       "(SHA-256 1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1) of hat-pip.jpg, and Forge makes its delivery job. "
       "Forge redoes the T-shirt story page in ~/Desktop/handoff/storytime-l2u2-book-pictures-look1/ (HAND-OFF 7), and the redo goes to "
       "Daniel's look again. This part stays draft until his word on the redo.")
REUSE = " The unit 1 pictures that this week uses again keep their unit 1 approval."
OLD = '\n    "images": {\n      "status": "draft"\n    },\n'
PM = ("""  - PM relay 2026-11-11, word for word: "PM (Daniel look, Task 2.8): Daniel's exact words, Tasks 2026-11-11 06:27 ICT (reply to the look note "Look: Storytime Level 2 unit 2 pictures, 228 of 229 ready"): "Hat-pip image passes, but the w10 put on your t shirt image doesn't pass." Record them in approval.images now (all rows pass except l2-w10-story-page-put-on-your-t-shirt; hat-pip passes as color m3 + line try 3; he raised no other row, so egg and ruler pass). Forge has the order now: a hat-pip delivery job (0 USD) and a redo of the T-shirt story page (stop 0.10 USD), in a new folder storytime-l2u2-book-pictures-look1; the PM passes it to you as HAND-OFF 7, and the redo goes to Daniel's look again. Task 2.8 stays [~] until his word on the redo. Receipt line, please." The PM accepted the orchestrator defaults on 2026-11-11: week 10 keeps the status draft with the words and the source, and Task 2.7 stays [~] until the look1 check gives 229 of 229 rows. Evidence: peer-report.""")
T27 = ("  - Daniel's word on hat-pip, 2026-11-11 (Task 2.8): the row `l2-w10-story-page-put-on-your-hat-pip` passes as the color m3 and the line try 3. "
       "Forge makes its delivery job (0 USD) and a redo of `l2-w10-story-page-put-on-your-t-shirt` in the new folder `~/Desktop/handoff/storytime-l2u2-book-pictures-look1/` (HAND-OFF 7). "
       "Part 3 runs `PICTURE_CHECK_U2` on that folder. In the union, the look1 job of the T-shirt row replaces its main job. "
       "Task 2.7 stays open until the union gives 229 of 229 rows. Evidence: owner-approved.")


def record(n):
    source = LOOK % n
    if n == 10:
        return {"status": "draft", "date": DATE, "words": WORDS, "source": source + W10 + REUSE}
    return {"status": "approved", "date": DATE, "words": WORDS, "source": source + PASS % n + (REUSE if n == 16 else "")}


def block(rec):
    body = ",\n".join("      %s: %s" % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in rec.items())
    return '\n    "images": {\n' + body + "\n    },\n"


paths = [DRAFTS + "w%02d.json" % n for n in WEEKS]
st = subprocess.run(["git", "-C", REPO, "status", "--porcelain", "--", PLAN_REL] + [p[len(REPO) + 1:] for p in paths], capture_output=True, text=True)
assert st.returncode == 0 and st.stdout == "", "the plan or a staged file has an uncommitted change"
assert not os.path.exists(REPORT), "the report exists"
plan_old = open(PLAN, encoding="utf-8").read()
stage = [x for x in plan_old.split("\n") if x.startswith("STAGE_CHECKS='")]
assert len(stage) == 1, "the STAGE_CHECKS line is not found once"
cmd = shlex.split(stage[0].split("=", 1)[1], comments=True)
assert len(cmd) == 1 and cmd[0].startswith("cd dashboard || exit 1;"), "the STAGE_CHECKS value differs"

old_text, lines = {}, []
try:
    L = plan_old.split("\n")
    k = [i for i, x in enumerate(L) if x.startswith("- [ ] Task 2.8 (Owner gate)")]
    assert len(k) == 1, "the Task 2.8 line is not found once"
    L[k[0]] = "- [~]" + L[k[0]][5:]
    open(PLAN, "w", encoding="utf-8").write("\n".join(L))
    print("plan: Task 2.8 set to [~]")

    for n, path in zip(WEEKS, paths):
        text = open(path, encoding="utf-8").read()
        assert text.count(OLD) == 1, "the draft images block is not found once in w%02d" % n
        rec = record(n)
        new = text.replace(OLD, block(rec), 1)
        a, b = json.loads(text), json.loads(new)
        assert a["approval"]["images"] == {"status": "draft"}, "the old images part of w%02d is not draft" % n
        assert b["approval"]["images"] == rec, "the new images part of w%02d differs" % n
        b["approval"]["images"] = a["approval"]["images"]
        assert a == b, "a change outside approval.images in w%02d" % n
        assert not THAI.search(block(rec)), "Thai text in the record of w%02d" % n
        old_text[path] = text
        open(path, "w", encoding="utf-8").write(new)
        lines.append("w%02d.json: approval.images status %s, date %s" % (n, rec["status"], DATE))
        print(lines[-1])

    os.makedirs(TMP, exist_ok=True)
    open(TMP + "stage.sh", "w", encoding="utf-8").write(cmd[0] + "\n")
    env = dict(os.environ, HEAVY_PRIORITY="p1", HEAVY_MIN_AVAIL_MB="1500", HEAVY_PREFLIGHT_WAIT_S="5400")
    attempts = 0
    while True:
        attempts += 1
        p = subprocess.run(["bash", HEAVY, "-c", "cd %s && bash %sstage.sh" % (REPO, TMP)], env=env, capture_output=True, text=True)
        if p.returncode != 75 or attempts == 2:
            break
    raw = (p.stdout + "\n" + p.stderr).splitlines()
    kept = [x for x in raw if not THAI.search(x)]
    fails = sum(1 for x in kept if "  FAIL " in x)
    warns = sum(1 for x in kept if "  WARN " in x)
    packages = sum(1 for x in kept if x.startswith("st2/"))
    summary = [x.strip() for x in kept if x.startswith("Summary:")]
    with open(REPORT, "w", encoding="utf-8") as fh:
        fh.write("# Task 2.8 record: STAGE_CHECKS after the approval.images record of w09 to w16 (storytime_l2_unit2_20261106)\n")
        fh.write("\n".join(lines) + "\n\n" + "\n".join(kept) + "\n")
        fh.write("PACKAGES=%d\nFAIL_LINES=%d\nWARN_LINES=%d\nATTEMPTS=%d\nTHAI_LINES_DROPPED=%d\nEXIT=%d\n" % (packages, fails, warns, attempts, len(raw) - len(kept), p.returncode))
    print("STAGE_CHECKS exit %d, attempts %d, packages %d, FAIL lines %d, WARN lines %d, Thai lines dropped %d, %s" % (p.returncode, attempts, packages, fails, warns, len(raw) - len(kept), summary))
    key, fail_rows, missing = None, [], 0
    for x in kept:
        if x.startswith("st2/"):
            key = x.split()[0]
        if "  FAIL " in x:
            fail_rows.append((key, x.split()[1], x.strip()))
        if re.match(r"^  WARN +print-missing", x) and key in ["st2/%d" % w for w in range(9, 16)]:
            missing += 1
    exception = [r for r in fail_rows if r[0] == "st2/12" and r[1] == "song-frame" and r[2].endswith("7 times")]
    print("FAIL rows %s; print-missing warnings of st2/9 to st2/15: %d" % ([r[:2] for r in fail_rows], missing))
    assert len(summary) == 1 and re.match(r"^Summary: 16 package\(s\), 1 failed check\(s\), \d+ warning\(s\)\.$", summary[0]), "the Summary line differs: %s" % summary
    assert p.returncode == 1 and packages == 16 and len(fail_rows) == 1 and len(exception) == 1 and missing == 0, "STAGE_CHECKS exit %d, FAIL rows %s, print-missing %d: not only the recorded st2/12 song-frame exception" % (p.returncode, [r[:2] for r in fail_rows], missing)

    rec_line = ("  - Record, 2026-11-11 (Jr Green, model minimax-cn-coding-plan/MiniMax-M3.1-Flash, role_base_sha 21c73835; script "
                "`measure/runs/storytime_l2_unit2_20261106/record_images_2_8.py`): Daniel's exact words \"%s\" (Google Tasks, 2026-11-11 06:27 ICT, PM relay) "
                "are in `approval.images` of the 8 staged files. Weeks 9 and 11 to 16 have the status approved, the date 2026-11-11, the words, and a source "
                "with the look package MANIFEST SHA-256 `2da72ee1e528133a057e9e45a49456e2542ccca20a9471bd4b90c3e6f516d94b` and the `rows.tsv` SHA-256 "
                "`a62a67d88f78d85d3cfbcf571e01bf58efee2822f09a5b84fa1f3ab250e671f6`. Week 10 keeps the status draft with the same date and words, because the "
                "T-shirt story page does not pass. Its source names the hat-pip files and the redo of HAND-OFF 7. A JSON compare proves that only "
                "`approval.images` changed in each file. `STAGE_CHECKS` in one heavy-run: exit %d, %d packages, %d failed check, %d warnings, and 0 print-missing "
                "warnings of st2/9 to st2/15 (report `measure/runs/storytime_l2_unit2_20261106/approval-images-stage-checks.txt`). The only FAIL row is song-frame of "
                "st2/12, the recorded week 12 exception (take c2, 7 frame lines; PM decision 2026-11-09); its code is Phase 4 Tasks 4.1 and 4.2. The first run of "
                "this record gave the same rows (`approval-images-stage-checks-try1.txt`), and a run on the clean tree at 21c73835 gave the same FAIL row (log commit "
                "`de0ff43e`). Task 2.8 stays [~] until Daniel's word on the redo. Evidence: owner-approved.") % (WORDS, p.returncode, packages, fails, warns)
    L = open(PLAN, encoding="utf-8").read().split("\n")
    k = [i for i, x in enumerate(L) if x.startswith("- [~] Task 2.8 (Owner gate)")]
    assert len(k) == 1, "the [~] Task 2.8 line is not found once"
    i = k[0]
    assert L[i - 1].startswith("  - Part 2, 2026-11-11 (Jr Green"), "the line before Task 2.8 differs"
    assert L[i + 2].startswith("  - Prep, 2026-11-11 (Jr Green"), "the prep line of Task 2.8 differs"
    assert L[i + 3].startswith("- [ ] Task 2.9: Measure - User Manual Verification"), "the line after the prep line differs"
    L[i + 3:i + 3] = [PM, rec_line]
    L[i:i] = [T27]
    open(PLAN, "w", encoding="utf-8").write("\n".join(L))
    assert not THAI.search(open(PLAN, encoding="utf-8").read()), "Thai text in the plan"
    print("plan: 3 lines inserted, Task 2.8 [~]")
except BaseException:
    for path, text in old_text.items():
        open(path, "w", encoding="utf-8").write(text)
    open(PLAN, "w", encoding="utf-8").write(plan_old)
    print("RESTORED: the plan and the changed staged files hold their old text")
    raise
