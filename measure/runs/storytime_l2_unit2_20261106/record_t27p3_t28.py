"""Task 2.7 part 3 and the close of Task 2.8 (track storytime_l2_unit2_20261106).

It checks the Forge folder look1 with PICTURE_CHECK_U2, makes the union of the 4 Forge folders (the
look1 job of a row replaces its older job), records Daniel's pass of the T-shirt redo in
approval.images of the staged w10, runs STAGE_CHECKS, and adds 5 lines to the plan. It prints names,
counts, and status values only, never the text of a week file.
"""
import hashlib, json, os, re, shlex, subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_l2_unit2_20261106/"
PLAN_REL = "measure/tracks/storytime_l2_unit2_20261106/plan.md"
PLAN = REPO + "/" + PLAN_REL
W10_REL = "content/storytime/drafts/l2/w10.json"
W10 = REPO + "/" + W10_REL
HEAVY = "/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh"
TMP = "/tmp/opencode/t27p3/"
THAI = re.compile("[\\u0e00-\\u0e7f]")
LOOK1 = "/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1"
LOOK1_SHA = "6ae4e14f0f37914eb542596a5d756c5a41a2de6abfc728f176bbd0d09aa6c077"
TSHIRT = "l2-w10-story-page-put-on-your-t-shirt"
HATPIP = "l2-w10-story-page-put-on-your-hat-pip"
EXPECT = {TSHIRT + "-v1.png": "8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2",
          TSHIRT + "-line-v1.png": "675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7",
          HATPIP + "-v1.png": "6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff",
          HATPIP + "-line-v1.png": "1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1"}
CAPS = {"main": RUNS + "picture-check-u2-main.txt", "retry1": RUNS + "picture-check-u2-retry1.txt",
        "repair1": RUNS + "picture-check-u2-repair1.txt", "look1": RUNS + "picture-check-u2-look1.txt"}
OUTS = [CAPS["look1"], RUNS + "picture-check-u2-part3.txt", RUNS + "picture-check-u2-part3-summary.json", RUNS + "approval-images-w10-stage-checks.txt"]
WORDS = "\"Hat-pip image passes, but the w10 put on your t shirt image doesn't pass.\" (2026-11-11 06:27 ICT); \"Ok\" (2026-11-11, the T-shirt redo)"
SOURCE = ("Daniel, Google Tasks, 2026-11-11 06:27 ICT, reply to the look note 'Look: Storytime Level 2 unit 2 pictures, 228 of 229 ready', and Tasks bjBWYkQ5 "
          "under YUZvREFs, 2026-11-11, his look at the T-shirt redo; relayed by the PM session on 2026-11-11. Look package "
          "~/Desktop/handoff/storytime-l2u2-picture-look-2026-11-11/, MANIFEST.txt SHA-256 2da72ee1e528133a057e9e45a49456e2542ccca20a9471bd4b90c3e6f516d94b: "
          "the week 10 rows of rows.tsv (SHA-256 a62a67d88f78d85d3cfbcf571e01bf58efee2822f09a5b84fa1f3ab250e671f6), the color file and the line file of each row, "
          "except l2-w10-story-page-put-on-your-t-shirt. That row and l2-w10-story-page-put-on-your-hat-pip are the 2 pairs of "
          "~/Desktop/handoff/storytime-l2u2-book-pictures-look1/ (MANIFEST.txt SHA-256 " + LOOK1_SHA + "): the T-shirt redo, color "
          + EXPECT[TSHIRT + "-v1.png"] + " and line " + EXPECT[TSHIRT + "-line-v1.png"] + " (they replace 9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4 "
          "and 71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e); the hat-pip pair, color " + EXPECT[HATPIP + "-v1.png"] + " (m3) and line "
          + EXPECT[HATPIP + "-line-v1.png"] + " (line try 3). The unit 1 pictures that this week uses again keep their unit 1 approval.")
NEW = {"status": "approved", "date": "2026-11-11", "words": WORDS, "source": SOURCE}
PM_H7 = ("""  - PM HAND-OFF 7, 2026-11-11, word for word: "PM → Workbooks: HAND-OFF 7 (unit 2 pictures, look1). Folder ~/Desktop/handoff/storytime-l2u2-book-pictures-look1/, MANIFEST.txt sha256 6ae4e14f0f37914eb542596a5d756c5a41a2de6abfc728f176bbd0d09aa6c077 (8 OK by PM sha256sum -c). It holds 2 picture pairs: 1. l2-w10-story-page-put-on-your-hat-pip (color + line): Daniel's look PASS (his words "Hat-pip image passes", already in approval.images). 2. l2-w10-story-page-put-on-your-t-shirt (color + line): the redo; new files under the same -v1 names (color 8e1baee1…, line 675a7ef4…; they replace 9e207c3c… and 71e2ba05…). Status: waiting for Daniel's look (Tasks YUZvREFs, sent now). Order (one light role when your queue allows; after readers r2b, no heavy run of its own): place both pairs in the unit 2 books by the README hashes, record the T-shirt as "owner look pending" in approval.images, and send me the receipt. When Daniel answers, I send you his words. Task 2.8 stays [~] until then." Evidence: peer-report.""")
PM_ACC = ("""  - PM decision 2026-11-11, word for word: "PM → Workbooks: HAND-OFF 7 receipt and HOLD seen. Your 3 defaults: ACCEPTED (1: PICTURE_CHECK_U2 on look1 + the union, copy into content/ stays with Task 4.3; 2: w10 approval.images stays draft with the look1 MANIFEST, 4 hashes, and 'owner look pending'; 3: Task 2.7 closes at 229 of 229, Task 2.8 stays [~] until Daniel's words). The all-clear follows when memory is back." Daniel's "Ok" came before this role ran, so the w10 record goes straight to approved. Evidence: peer-report.""")
PM_OK = ("""  - PM relay 2026-11-11, word for word: "PM → Workbooks: Daniel's look on the T-shirt redo (Tasks bjBWYkQ5 under YUZvREFs, 2026-11-11): "Ok" = PASS. Record his word in w10 approval.images for l2-w10-story-page-put-on-your-t-shirt (color 8e1baee1…, line 675a7ef4…, look1 MANIFEST 6ae4e14f), replacing 'owner look pending'. With that, 229 of 229 unit 2 pictures carry Daniel's pass. Task 2.8 can close in the same light record role as Task 2.7 part 3 (after readers r2b). Send me the receipt." Evidence: peer-report.""")


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def heavy(cmd, limit):
    env = dict(os.environ, HEAVY_PRIORITY="p1", HEAVY_MIN_AVAIL_MB="1500", HEAVY_PREFLIGHT_WAIT_S="5400", HEAVY_RUN_TIMEOUT_S=str(limit))
    attempts = 0
    while True:
        attempts += 1
        p = subprocess.run(["bash", HEAVY, "-c", cmd], env=env, capture_output=True, text=True)
        if p.returncode != 75 or attempts == 2:
            break
    raw = (p.stdout + "\n" + p.stderr).splitlines()
    kept = [x for x in raw if not THAI.search(x)]
    return p.returncode, attempts, raw, kept


def block(rec):
    body = ",\n".join("      %s: %s" % (json.dumps(k), json.dumps(v, ensure_ascii=False)) for k, v in rec.items())
    return '\n    "images": {\n' + body + "\n    },\n"


st = subprocess.run(["git", "-C", REPO, "status", "--porcelain", "--", PLAN_REL, W10_REL], capture_output=True, text=True)
assert st.returncode == 0 and st.stdout == "", "the plan or w10 has an uncommitted change"
for path in OUTS:
    assert not os.path.exists(path), "the output exists: " + path
assert sha(LOOK1 + "/MANIFEST.txt") == LOOK1_SHA, "the look1 MANIFEST hash differs"
for name, h in EXPECT.items():
    assert sha(LOOK1 + "/" + name) == h, "a look1 file differs: " + name
plan_old = open(PLAN, encoding="utf-8").read()
w10_old = open(W10, encoding="utf-8").read()
os.makedirs(TMP, exist_ok=True)
try:
    i = plan_old.index("`PICTURE_CHECK_U2` (Phase 2) is the stage 1 check")
    check = plan_old[i:].split("```bash\n", 1)[1].split("\n```", 1)[0]
    assert 'check-storytime-pictures.ts --batch "$FORGE_FOLDER"' in check, "the check block differs"
    open(TMP + "check.sh", "w", encoding="utf-8").write(check + "\n")
    rc, att, raw, kept = heavy("cd %s && FORGE_FOLDER=%s bash %scheck.sh" % (REPO, LOOK1, TMP), 300)
    open(CAPS["look1"], "w", encoding="utf-8").write("\n".join(kept) + "\nTHAI_LINES_DROPPED=%d\nEXIT=%d\n" % (len(raw) - len(kept), rc))
    rows = [r["id"] for r in json.load(open(REPO + "/content/storytime/drafts/l2/print/pictures-u2.json", encoding="utf-8"))]
    passed, other, summary_line = {}, {}, {}
    for key, path in CAPS.items():
        passed[key], other[key] = set(), {}
        for line in open(path, encoding="utf-8").read().splitlines():
            if line.startswith("pass  "):
                passed[key].add(line[6:].strip())
            elif line.startswith("fail  ") and "the manifest holds no job" not in line:
                rid, _, why = line[6:].partition(": ")
                other[key][rid.strip()] = why.strip()
            elif "rows pass stage 1" in line:
                summary_line[key] = line.strip()
    assert passed["look1"] == {TSHIRT, HATPIP}, "look1 does not pass exactly the 2 rows: %s" % sorted(passed["look1"])
    assert not other["look1"], "look1 has a fail for another reason: %s" % other["look1"]
    older = ["repair1", "retry1", "main"]
    multi = sorted(r for r in rows if sum(1 for k in older if r in passed[k]) > 1)
    assert not multi, "a row passes in 2 older folders: %s" % multi
    source = {}
    for r in rows:
        src = [k for k in ["look1"] + older if r in passed[k]]
        if src:
            source[r] = src[0]
    open_rows = sorted(set(rows) - set(source))
    counts = {k: sum(1 for v in source.values() if v == k) for k in ["look1"] + older}
    assert len(source) == 229 and not open_rows, "the union does not give 229 of 229: open %s" % open_rows
    assert TSHIRT in passed["main"] and source[TSHIRT] == "look1", "the T-shirt row does not take its look1 job"
    json.dump({"look1": {"manifest_sha256": LOOK1_SHA, "exit": rc, "attempts": att, "summary_line": summary_line.get("look1"),
                         "pass_ids": sorted(passed["look1"]), "fail_other": other["look1"], "thai_lines_dropped": len(raw) - len(kept)},
               "union": {"rows": len(rows), "with_job": len(source), "open_rows": open_rows, "source_counts": counts,
                         "replaced": {TSHIRT: "main -> look1"}}},
              open(OUTS[2], "w", encoding="utf-8"), indent=1)
    part3_text = ["# Task 2.7 part 3: stage 1 of the Forge folder look1 (PICTURE_CHECK_U2) and the union of the 4 folders", "",
                  "- look1 MANIFEST.txt SHA-256 %s; 4 picture hashes equal; check exit %d, attempts %d; %s" % (LOOK1_SHA, rc, att, summary_line.get("look1")),
                  "- look1 pass rows: %s; fail for another reason: 0" % ", ".join(sorted(passed["look1"])),
                  "- union: %d of %d rows have a delivery job; source counts %s; the T-shirt row takes its look1 job (main -> look1); open rows 0" % (len(source), len(rows), counts),
                  "- Thai lines dropped %d" % (len(raw) - len(kept))]
    open(OUTS[1], "w", encoding="utf-8").write("\n".join(part3_text) + "\n")
    print("\n".join(part3_text))

    old_rec = json.loads(w10_old)["approval"]["images"]
    assert old_rec.get("status") == "draft" and old_rec.get("date") == "2026-11-11", "the old w10 images part differs"
    old_block = block(old_rec)
    assert w10_old.count(old_block) == 1, "the old w10 images block is not found once"
    w10_new = w10_old.replace(old_block, block(NEW), 1)
    a, b = json.loads(w10_old), json.loads(w10_new)
    assert b["approval"]["images"] == NEW, "the new w10 images part differs"
    b["approval"]["images"] = a["approval"]["images"]
    assert a == b, "a change outside approval.images in w10"
    assert not THAI.search(block(NEW)), "Thai text in the new record"
    open(W10, "w", encoding="utf-8").write(w10_new)
    print("w10.json: approval.images status approved, date 2026-11-11")

    stage = [x for x in plan_old.split("\n") if x.startswith("STAGE_CHECKS='")]
    assert len(stage) == 1, "the STAGE_CHECKS line is not found once"
    cmd = shlex.split(stage[0].split("=", 1)[1], comments=True)
    assert len(cmd) == 1 and cmd[0].startswith("cd dashboard || exit 1;"), "the STAGE_CHECKS value differs"
    open(TMP + "stage.sh", "w", encoding="utf-8").write(cmd[0] + "\n")
    rc2, att2, raw2, kept2 = heavy("cd %s && bash %sstage.sh" % (REPO, TMP), 600)
    key, fail_rows, missing = None, [], 0
    for x in kept2:
        if x.startswith("st2/"):
            key = x.split()[0]
        if "  FAIL " in x:
            fail_rows.append((key, x.split()[1], x.strip()))
        if re.match(r"^  WARN +print-missing", x) and key in ["st2/%d" % w for w in range(9, 16)]:
            missing += 1
    packages = sum(1 for x in kept2 if x.startswith("st2/"))
    warns = sum(1 for x in kept2 if "  WARN " in x)
    summary = [x.strip() for x in kept2 if x.startswith("Summary:")]
    with open(OUTS[3], "w", encoding="utf-8") as fh:
        fh.write("# Task 2.8 close: STAGE_CHECKS after the w10 approval.images record (storytime_l2_unit2_20261106)\n")
        fh.write("\n".join(kept2) + "\nPACKAGES=%d\nFAIL_LINES=%d\nWARN_LINES=%d\nPRINT_MISSING_9_15=%d\nATTEMPTS=%d\nTHAI_LINES_DROPPED=%d\nEXIT=%d\n" % (packages, len(fail_rows), warns, missing, att2, len(raw2) - len(kept2), rc2))
    exception = [r for r in fail_rows if r[0] == "st2/12" and r[1] == "song-frame" and r[2].endswith("7 times")]
    print("STAGE_CHECKS exit %d, packages %d, FAIL rows %s, print-missing %d, %s" % (rc2, packages, [r[:2] for r in fail_rows], missing, summary))
    assert len(summary) == 1 and re.match(r"^Summary: 16 package\(s\), 1 failed check\(s\), \d+ warning\(s\)\.$", summary[0]), "the Summary line differs: %s" % summary
    assert rc2 == 1 and packages == 16 and len(fail_rows) == 1 and len(exception) == 1 and missing == 0, "not only the recorded st2/12 song-frame exception"

    PART3 = ("  - Part 3, 2026-11-11 (Jr Green, model minimax-cn-coding-plan/MiniMax-M3.1-Flash, role_base_sha 27726708; script "
             "`measure/runs/storytime_l2_unit2_20261106/record_t27p3_t28.py`): `PICTURE_CHECK_U2` ran on `~/Desktop/handoff/storytime-l2u2-book-pictures-look1/` "
             "(MANIFEST.txt SHA-256 `%s`, the 4 picture hashes equal) in one heavy-run with a 300 s limit: exit %d, %s; the 2 rows `%s` and `%s` pass, and no row fails "
             "for another reason (capture `picture-check-u2-look1.txt`). The union of the 4 Forge folders gives %d of %d rows with a delivery job, and 0 open rows; "
             "the T-shirt row takes its look1 job in place of its main job; the source counts are %s (`picture-check-u2-part3.txt`, `picture-check-u2-part3-summary.json`). "
             "Every requested row passes, the card rows included, so Task 2.7 closes. No picture is copied into `content/storytime/`; Task 4.3 makes the copy. "
             "Evidence: automated.") % (LOOK1_SHA, rc, summary_line.get("look1"), HATPIP, TSHIRT, len(source), len(rows), counts)
    REC2 = ("  - Record 2, 2026-11-11 (Jr Green, model minimax-cn-coding-plan/MiniMax-M3.1-Flash, role_base_sha 27726708; same script): Daniel's \"Ok\" on the T-shirt "
            "redo (Tasks bjBWYkQ5 under YUZvREFs, PM relay) is in `approval.images` of the staged w10, with his 06:27 words: status approved, date 2026-11-11, and a "
            "source with the look package, the look1 MANIFEST, and the 4 hashes of the 2 look1 pairs. A JSON compare proves that only `approval.images` changed. "
            "The 8 staged files now hold the status approved: 229 of 229 unit 2 pictures carry Daniel's pass. `STAGE_CHECKS` in one heavy-run with a 600 s limit: "
            "exit %d, %d packages, 1 failed check, %d warnings, and 0 print-missing warnings of st2/9 to st2/15; the only FAIL row is song-frame of st2/12, the recorded "
            "week 12 exception (PM decision 2026-11-09; its code is Phase 4 Tasks 4.1 and 4.2) (report `approval-images-w10-stage-checks.txt`). Task 2.8 closes. "
            "Evidence: owner-approved.") % (rc2, packages, warns)
    L = plan_old.split("\n")
    a7 = [j for j, x in enumerate(L) if x.startswith("  - Daniel's word on hat-pip, 2026-11-11 (Task 2.8)")]
    assert len(a7) == 1 and L[a7[0] + 1].startswith("- [~] Task 2.8 (Owner gate)"), "the Task 2.7 anchor differs"
    L[a7[0] + 1:a7[0] + 1] = [PM_H7, PM_ACC, PART3]
    a8 = [j for j, x in enumerate(L) if x.startswith("  - Record, 2026-11-11 (Jr Green")]
    assert len(a8) == 1 and L[a8[0] + 1].startswith("- [ ] Task 2.9: Measure - User Manual Verification"), "the Task 2.8 anchor differs"
    L[a8[0] + 1:a8[0] + 1] = [PM_OK, REC2]
    text = "\n".join(L)
    assert not THAI.search(text), "Thai text in the plan"
    open(PLAN, "w", encoding="utf-8").write(text)
    print("plan: 5 lines inserted; Tasks 2.7 and 2.8 stay [~] until commit 2")
except BaseException:
    open(W10, "w", encoding="utf-8").write(w10_old)
    open(PLAN, "w", encoding="utf-8").write(plan_old)
    print("RESTORED: w10 and the plan hold their old text")
    raise
