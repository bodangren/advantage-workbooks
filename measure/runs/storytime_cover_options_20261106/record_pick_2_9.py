"""Records Daniel's cover pick, A2 r2 for both books (Task 2.9 part 4, track storytime_cover_options_20261106).

The script checks the cover folder MANIFEST and the TC1 MANIFEST, proves the SHA-256 value of every
r2 file, writes a report, and inserts 3 lines under Task 2.9 of the plan. It reads file bytes only,
never the text of a PDF or a PNG, and it prints names, counts, and hash values only.
"""
import hashlib, os, subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
PLAN_REL = "measure/tracks/storytime_cover_options_20261106/plan.md"
PLAN = REPO + "/" + PLAN_REL
REPORT = REPO + "/measure/runs/storytime_cover_options_20261106/pick-record-2-9.txt"
COVERS = "/home/daniebo/Desktop/print-ready/storytime/covers-quest-v1/"
COVERS_MANIFEST_SHA = "2aa88d4082df1c94bd3f67d2792b1e0065e139375592b6479e9f4faedb96043d"
TC1 = "/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/"
TC1_MANIFEST_SHA = "b63708b128e0b9593005986a18baf57b21b0a83b7715b63564c6be85ad4409a7"
TC1_ART = "c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53"
R2 = {
    "student/Storytime-Advantage-L2-U1-Student-Book-Cover-v4-alt-hlogo-r2_PDFX-1a.pdf": "bc00778ebcc91787b708a5dec353f75aa4559218404e598bcc596ec07daf6663",
    "teacher/Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2-alt-hlogo-r2_PDFX-1a.pdf": "6a50cdb2767c3afe734d96d1d38657d11f48e11289b008753d89c9a955cdeefd",
    "student/front-alt-hlogo-r2.png": "5e96dc4058ba156423d6c274cf6ba5156448bec22f30d5222acdfb536834982e",
    "student/back-alt-hlogo-r2.png": "1adc4e7df4de14ff101f4043b7f80a1a01801f89e2e8086a43ffc055c636f968",
    "student/cover-alt-hlogo-r2.pdf": "af7ca3be5378719fa1aad5659876ba77a9c67177628d315e9567589ec990ea75",
    "student/build-report-alt-hlogo-r2.json": "0987b1fdabb395d89e6cc10b36928131dfa4d6af8f7a7004297e2c63a005c058",
    "teacher/teacher-front-alt-hlogo-r2.png": "c0acc1ad5e99fa4d3002630901b02653e0e3dbbc2c57fdd2e9eb29a392cfb103",
    "teacher/teacher-back-alt-hlogo-r2.png": "ad6c3335e4e92ae43eae1d86e50b2a8c4175bc7cbc9eecb23bc83aeb6e13b0a4",
    "teacher/teacher-cover-alt-hlogo-r2.pdf": "b65dc772126dec22de7745414e53389f7637d7f6ab0b097bc21262ff448df138",
    "teacher/build-report-alt-hlogo-r2.json": "827e257bec52f2106a86607c2fe43aeed9972ce9fe7f530b2da61f86290cfa4d",
    "contact-sheets/student-alt-hlogo-r2.png": "092344f420b18e0d45ec5f1dde056fc994ef3757f213a3a40df872e234a3a846",
    "contact-sheets/teacher-alt-hlogo-r2.png": "8d82be3dd5ae91369668d8acaa9c88cd3f9688be610793dcf42ddc035955e90b",
    "contact-sheets/student-r5-vs-alt-hlogo-r2.png": "7fca6ada5469f9f97179b32ca8d9967fc254c8d9ed39d348be437b1555aa8d34",
    "contact-sheets/teacher-r5-vs-alt-hlogo-r2.png": "2bbd84488b6e5efe1e7f703ca3c05112dea58635467498e3c6deb76e652fb340",
    "README-alt-hlogo-r2.txt": "2c8946028fe89531ad40929076ce947b79644b6a5754a44130386ecbc5fd5893",
}
PICK = ("""  - Daniel's pick, 2026-11-11 (PM relay, word for word): "PM: DANIEL'S COVER PICK (look gate closed). His exact words, Tasks 2026-11-11 06:29 ICT, reply to the note "Two answers still open: cover pick (r5 or r2) and the app preview sign-in (yes or no)": "Yes. R2. Yes, deploy." So the cover is A2 r2 (the horizontal-logo version with the tighter tile, files with the -alt-hlogo-r2 suffix) for BOTH books, student and teacher. Record his words, the date, and the r2 file SHA-256 values in the cover track (Task 2.9 and its owner gate), and take r2 into the release proof with no new build (your default). The r5 and the old -alt-hlogo files stay in the folder for the record. Receipt line, please, with the commit." Evidence: owner-approved.""")
ORDER = ("""  - PM order 2026-11-11, word for word: "PM: receipt received; all your defaults are ACCEPTED. One order on the open part of Task 2.9: after your two record roles, build the readers-a3 and readers-leaf covers with --top hlogo (the r2 tile) in the next free slot, so that every cover of the 11-25 print order is r2. Same gates and MANIFEST rules; the PM looks at the sheets before they go into the release proof." Evidence: peer-report.""")


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


st = subprocess.run(["git", "-C", REPO, "status", "--porcelain", "--", PLAN_REL], capture_output=True, text=True)
assert st.returncode == 0 and st.stdout == "", "the plan has an uncommitted change"
assert not os.path.exists(REPORT), "the report exists"
report = []

assert sha(COVERS + "MANIFEST.txt") == COVERS_MANIFEST_SHA, "the cover MANIFEST.txt hash differs"
listed, ok = {}, 0
for line in open(COVERS + "MANIFEST.txt", encoding="utf-8").read().splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    h, size, name = line.split("  ", 2)
    data = open(COVERS + name, "rb").read()
    assert hashlib.sha256(data).hexdigest() == h and len(data) == int(size), "a cover MANIFEST line does not check: " + name
    listed[name] = h
    ok += 1
assert ok == 48, "the cover MANIFEST does not hold 48 lines"
report.append("covers-quest-v1 MANIFEST.txt SHA-256 %s: %d of %d lines OK (SHA-256 and size)" % (COVERS_MANIFEST_SHA, ok, ok))
for name, h in R2.items():
    assert listed.get(name) == h and sha(COVERS + name) == h, "an r2 file differs: " + name
    report.append("r2 %s  %s" % (h, name))
report.append("r2 files: %d of %d SHA-256 values equal in the MANIFEST and on disk" % (len(R2), len(R2)))

assert sha(TC1 + "MANIFEST.txt") == TC1_MANIFEST_SHA, "the TC1 MANIFEST.txt hash differs"
tc1 = 0
for line in open(TC1 + "MANIFEST.txt", encoding="utf-8").read().splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    h, name = line.split("  ", 1)
    assert sha(TC1 + name.strip()) == h, "a TC1 MANIFEST line does not check: " + name
    if name.strip() == "l2-u1-cover-quest-teacher-front-forge-v1.png":
        assert h == TC1_ART, "the TC1 art hash differs"
    tc1 += 1
report.append("TC1 MANIFEST.txt SHA-256 %s: %d of %d lines OK; the art keeps %s" % (TC1_MANIFEST_SHA, tc1, tc1, TC1_ART))

files = "; ".join("`%s` `%s`" % (name, h) for name, h in R2.items())
part4 = ("  - Part 4 pick record, 2026-11-11 (Jr Green, model deepseek/deepseek-flash#high, role_base_sha fc28638b; script "
         "`measure/runs/storytime_cover_options_20261106/record_pick_2_9.py`, report `measure/runs/storytime_cover_options_20261106/pick-record-2-9.txt`): "
         "Daniel picked A2 r2 for the student book and the teacher book. The release files are the r2 files of Part 3. The folder `MANIFEST.txt` "
         "(SHA-256 `%s`) gives %d of %d lines OK, and it holds the same SHA-256 value as the disk for each of the %d r2 files: %s. "
         "The r5 files and the old `-alt-hlogo` files stay in the folder for the record. The release proof takes the 2 r2 print files, with no new build "
         "of the 2 books. The PM accepted the r2 build on 2026-11-11 with its visible logo fill of 77.3 %% of the tile width as the fill of about 80 %% of "
         "the order (a summary of the PM receipt, not word for word). The TC1 folder `~/Desktop/handoff/storytime-cover-teacher-front-forge/` has a new "
         "`MANIFEST.txt` with the SHA-256 `%s` after the fix of its README title to unit 1; %d of %d lines OK, and the art keeps `%s`. The PM accepted "
         "these defaults on 2026-11-11: Task 2.9 stays [~], because the readers-a3 and readers-leaf files are not in `covers-quest-v1` yet; Task 2.8 "
         "closes in a later role (the Forge teacher front into `content/storytime/l2/print/pictures/` and the look at 100 %%); Task 2.14 stays open for "
         "the 11-16 check. Evidence: automated.") % (COVERS_MANIFEST_SHA, ok, ok, len(R2), files, TC1_MANIFEST_SHA, tc1, tc1, TC1_ART)

L = open(PLAN, encoding="utf-8").read().split("\n")
k = [i for i, x in enumerate(L) if x.startswith("  - Part 3 A2 r2 (2026-11-11")]
assert len(k) == 1, "the Part 3 A2 r2 line is not found once"
i = k[0]
assert L[i + 1].startswith("- [ ] Task 2.10 (Look at every page)"), "the line after Part 3 differs"
assert sum(1 for x in L if x.startswith("- [~] Task 2.9 (Print build)")) == 1, "the Task 2.9 line is not [~] once"
L[i + 1:i + 1] = [PICK, part4, ORDER]
open(PLAN, "w", encoding="utf-8").write("\n".join(L))
report.append("plan: 3 lines inserted after the Part 3 A2 r2 line; Task 2.9 stays [~]")
open(REPORT, "w", encoding="utf-8").write("# Task 2.9 part 4: the record of Daniel's cover pick (A2 r2, both books)\n" + "\n".join(report) + "\n")
print("\n".join(report))
print("plan: 3 lines inserted")
