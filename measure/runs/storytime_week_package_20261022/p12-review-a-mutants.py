"""Review A, Phase 12: the 13 mutants M1 to M13 of the Green 1 Done-when (deviation D-P12-G1).

Run inside ONE heavy-run wrapper from the repository root:
    python3 -I -B measure/runs/storytime_week_package_20261022/p12-review-a-mutants.py [--verify]

For each mutant the script (a) saves the file bytes, (b) applies the mutant, (c) runs the RED test
file, (d) restores the bytes, and (e) proves the restore with cmp. A baseline run comes first.
--verify only checks that each anchor matches once and changes no file.
"""
import os
import re
import shutil
import subprocess
import sys

ROOT = os.getcwd()
CAPTURE = os.path.join(ROOT, "measure/runs/storytime_week_package_20261022/p12-review-a-mutants.txt")
SCRATCH = "/tmp/review-a-p12-mutants"
TEST = "cd dashboard && CI=true npx vitest run __tests__/storytime-package-practice-clips.test.ts --maxWorkers=1"

WC = "dashboard/lib/storytime/word-clips.ts"
SC = "dashboard/lib/storytime/sentence-clips.ts"
MK = "dashboard/scripts/storytime/make-sentence-clips.ts"
SW = "dashboard/scripts/storytime/set-word-clips.ts"
CW = "dashboard/scripts/storytime/check-weeks.ts"

M7_ANCHOR = (
    "        const { accepted, spent } = makeSentenceTakes(item, voice, chars, maxChars, folder, synthesize, recognize);\n"
    "        chars += spent;\n"
)
M7_CUT = M7_ANCHOR + (
    "        const cutBook = (week.books ?? [])[item.book] as { audio?: { file?: string } } | undefined;\n"
    "        const cutRun = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(options.contentRoot, String(cutBook?.audio?.file)), '-f', 's16le', '-ac', '1', '-ar', String(RATE), '-'], { maxBuffer: 1 << 28 });\n"
    "        if (cutRun.status !== 0) throw new Error('sentence clips: M7 no book audio');\n"
    "        const cutStart = 4000;\n"
    "        const cutLength = Math.max(0, Math.min(accepted.samples.length, Math.floor(cutRun.stdout.length / 2) - cutStart));\n"
    "        const cutSamples = new Int16Array(cutLength);\n"
    "        for (let at = 0; at < cutLength; at += 1) cutSamples[at] = cutRun.stdout.readInt16LE(2 * (cutStart + at));\n"
    "        accepted.samples = cutSamples;\n"
)

M5_ANCHOR = (
    "    for (const slot of slots) {\n"
    "        const fault = bankFaultOf(slot.key, rows, options.bankFolder);\n"
    "        if (fault !== 'ok') throw"
)
M5_COPY_FIRST = (
    "    for (const file of files) {\n"
    "        const early = path.join(options.contentRoot, file);\n"
    "        const earlyBank = path.join(options.bankFolder, path.basename(file));\n"
    "        if (fs.existsSync(earlyBank)) { fs.mkdirSync(path.dirname(early), { recursive: true }); fs.copyFileSync(earlyBank, early); }\n"
    "    }\n"
) + M5_ANCHOR

# Each mutant: id, description, file, region start marker (or None), old text, new text.
MUTANTS = [
    ("M1", "the opening rule drops the 'What is the word?' form (D2)", WC, None,
     "const OPENING_WORD_FORM = /(?:Listen: |What is the word\\? )([A-Za-z]+)[.!]/g;",
     "const OPENING_WORD_FORM = /(?:Listen: )([A-Za-z]+)[.!]/g;"),
    ("M2", "practiceWordKeys skips the tricky list (D3)", WC, None,
     "    for (const word of week?.focus?.trickyWords ?? []) add(tricky, word);\n",
     ""),
    ("M3", "the mapper copies only the gap words (D5)", SW, None,
     "    for (const file of files) {\n        const target = path.join(options.contentRoot, file);",
     "    for (const file of practice.files.filter((gap) => !plan.files.includes(gap))) {\n        const target = path.join(options.contentRoot, file);"),
    ("M4", "the mapper removes a practice clip as stale (D5)", SW, None,
     "            if (files.includes(relative)) continue;",
     "            if (plan.files.includes(relative)) continue;"),
    ("M5", "the mapper copies a clip before its bank check (D6)", SW, None,
     M5_ANCHOR, M5_COPY_FIRST),
    ("M6", "checkPracticeClips skips the SHA-256 compare (D7)", CW, "export function checkPracticeClips(",
     "            if (sha256File(bank) !== sha256File(clip)) differs.push(value);\n",
     ""),
    ("M7", "the sentence maker cuts a window of the book mp3 (D9 and D11)", MK, None,
     M7_ANCHOR, M7_CUT),
    ("M8", "sentenceHeardPasses passes every text (D10)", SC, None,
     "    return heardMatches(sentence, words);",
     "    void words;\n    return true;"),
    ("M9", "the peak target is 32767 (D10)", MK, None,
     "const PEAK_SAMPLE = 23197;",
     "const PEAK_SAMPLE = 32767;"),
    ("M10", "checkSentenceClips skips the text compare (D12)", CW, "export function checkSentenceClips(",
     "            if (typeof clip?.sentence !== 'string' || clip.sentence !== sentences[at]?.sentence) {",
     "            if (false) {"),
    ("M11", "planSentenceClips includes the read-along books (D8)", SC, None,
     "        if (book?.kind !== 'decodable') return;\n",
     ""),
    ("M12", "looksLikeCut always gives false (D11)", SC, None,
     "    if (rate <= 0) throw new Error(`sentence clip: bad sample rate: ${rate}`);\n",
     "    return false;\n    if (rate <= 0) throw new Error(`sentence clip: bad sample rate: ${rate}`);\n"),
    ("M13", "the sentence maker ignores --max-chars (D10)", MK, None,
     "    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;",
     "    const maxChars = DEFAULT_MAX_CHARS;"),
]

ANSI = re.compile(r"\x1b\[[0-9;]*m")


def mutate(text, region, old, new):
    """Returns the mutated text; the old text must occur once in the region."""
    start = 0
    if region is not None:
        start = text.index(region)
        end = text.find("\nexport function ", start + len(region))
        end = len(text) if end < 0 else end
    else:
        end = len(text)
    part = text[start:end]
    count = part.count(old)
    if count != 1:
        raise SystemExit(f"anchor count {count}, expected 1: {old[:60]!r}")
    return text[:start] + part.replace(old, new, 1) + text[end:]


def run_test():
    env = dict(os.environ, NO_COLOR="1", FORCE_COLOR="0")
    proc = subprocess.run(["bash", "-c", TEST], cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
    out = ANSI.sub("", proc.stdout + proc.stderr)
    tests = [line.strip() for line in out.splitlines() if re.match(r"^\s*Tests\s", line)]
    failed = [ANSI.sub("", line).strip() for line in out.splitlines() if line.lstrip().startswith(("FAIL ", "× "))]
    return proc.returncode, (tests[-1] if tests else "Tests: no summary"), failed


def porcelain():
    return subprocess.run(["git", "status", "--porcelain", "dashboard/"], cwd=ROOT, capture_output=True, text=True).stdout


def main():
    verify = "--verify" in sys.argv
    for mid, _, file, region, old, new in MUTANTS:
        with open(os.path.join(ROOT, file), encoding="utf8") as handle:
            mutate(handle.read(), region, old, new)
    if verify:
        print(f"anchors: {len(MUTANTS)} of 13 match once")
        return 0

    # Guard: a mutant left in place by a machine stop shows as a changed code file. Stop before any run.
    code_files = sorted({m[2] for m in MUTANTS})
    left = subprocess.run(["git", "status", "--porcelain", "--", *code_files], cwd=ROOT, capture_output=True, text=True).stdout
    if left.strip():
        print("GUARD: a mutated code file is changed before the first mutant (a mutant left by a stop?):")
        print(left.rstrip())
        return 2

    os.makedirs(SCRATCH, exist_ok=True)
    out = []
    say = out.append
    before = porcelain()
    code_before = subprocess.run(["git", "status", "--porcelain", "--", *code_files], cwd=ROOT, capture_output=True, text=True).stdout
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    say(f"CAPTURE of Review A P12 mutants (deviation D-P12-G1), audited head fb5a4dbf, run at HEAD {head}")
    say(f"guard: the {len(code_files)} mutated code files show no change before the first mutant")
    say(f"COMMAND per mutant: save bytes, apply, `{TEST}`, restore bytes, cmp")
    say("git status --porcelain dashboard/ BEFORE:")
    say(before.rstrip() or "(empty)")
    code, tests, failed = run_test()
    say(f"BASELINE exit {code} {tests}")
    caught = 0
    cmp_ok = True
    for mid, desc, file, region, old, new in MUTANTS:
        full = os.path.join(ROOT, file)
        saved = os.path.join(SCRATCH, mid + ".orig")
        shutil.copyfile(full, saved)
        try:
            with open(full, encoding="utf8") as handle:
                text = handle.read()
            with open(full, "w", encoding="utf8") as handle:
                handle.write(mutate(text, region, old, new))
            code, tests, failed = run_test()
        finally:
            shutil.copyfile(saved, full)
        same = subprocess.run(["cmp", saved, full], capture_output=True).returncode == 0
        cmp_ok = cmp_ok and same
        hit = code != 0 and "failed" in tests
        caught += 1 if hit else 0
        say(f"{mid} {desc} | file {file} | exit {code} | {tests} | {'CAUGHT' if hit else 'SURVIVED'} | restore cmp {'equal' if same else 'DIFFERS'}")
        for line in failed[:12]:
            say(f"    {line}")
    after = porcelain()
    say("git status --porcelain dashboard/ AFTER:")
    say(after.rstrip() or "(empty)")
    say(f"porcelain of dashboard/ before and after: {'equal' if before == after else 'DIFFER'}")
    say("NOTE: the Red F10 role of track storytime_cover_options works in dashboard/__tests__/quest-cover-*; a difference there comes from that role, not from a mutant. The restore is judged by cmp and by the porcelain of the 5 Phase 12 code files below.")
    code_after = subprocess.run(["git", "status", "--porcelain", "--", *code_files], cwd=ROOT, capture_output=True, text=True).stdout
    say(f"porcelain of the 5 mutated code files before: {code_before.strip() or '(empty)'} | after: {code_after.strip() or '(empty)'} | {'equal' if code_before == code_after else 'DIFFER'}")
    shutil.rmtree(SCRATCH, ignore_errors=True)
    say(f"scratch removed: {not os.path.exists(SCRATCH)}")
    say(f"mutants: {len(MUTANTS)}, caught: {caught}")
    say(f"restore cmp: {'all equal' if cmp_ok else 'NOT all equal'}")
    with open(CAPTURE, "w", encoding="utf8") as handle:
        handle.write("\n".join(out) + "\n")
    print("\n".join(out))
    return 0 if cmp_ok else 1


if __name__ == "__main__":
    sys.exit(main())
