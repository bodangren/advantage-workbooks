#!/usr/bin/env python3
"""Writes p14-accept-ac2-diff.txt: the AC14-2 diagnosis (deviation D-P14-ACC1).

The capture holds the apply-check output at the audited head, the count of the
change-list field paths that differ between a318b199 and HEAD (must be 0), the
differing paths grouped by top-level key with the later commits that own them,
and the last line `exit: 0` only when no change-list path moved. No line of the
output holds a Thai character.
"""

import importlib.util
import json
import re
import subprocess
import sys

REPO = "/home/daniebo/Desktop/Workbooks"
RUNS = REPO + "/measure/runs/storytime_week_package_20261022/"
OUT = RUNS + "p14-accept-ac2-diff.txt"
GREEN = "a318b199"
HEAD = "ceb17679bfca528f28b0fefe7ed85abbe6676a5d"
THAI = re.compile("[฀-๿]")


def sh(args):
    """Runs one command and returns its standard output."""
    return subprocess.run(args, capture_output=True, text=True, cwd=REPO, check=True).stdout


def flat(node, prefix=""):
    """Every leaf of a JSON document as path -> value."""
    out = {}
    if isinstance(node, dict):
        for key, value in node.items():
            out.update(flat(value, (prefix + "." + str(key)) if prefix else str(key)))
    elif isinstance(node, list):
        for i, value in enumerate(node):
            out.update(flat(value, prefix + "[" + str(i) + "]"))
    else:
        out[prefix] = node
    return out


def parts_text(parts):
    """The edit path parts of the apply check as a flat path string."""
    text = ""
    for part in parts:
        if isinstance(part, int):
            text += "[" + str(part) + "]"
        else:
            text += ("." + part) if text else str(part)
    return text


def belongs(docpath, clpath):
    """True when a document path sits under a change-list path."""
    if docpath == clpath:
        return True
    return docpath.startswith(clpath + ".") or docpath.startswith(clpath + "[")


def topkey(docpath):
    """The first key or index segment of a document path."""
    return re.split(r"[.\[]", docpath)[0]


def main():
    """Writes the diagnosis capture and returns 0 when no row moved."""
    lines = []
    spec = importlib.util.spec_from_file_location("ac", RUNS + "p14-apply-check.py")
    ac = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ac)
    fields, media = ac.read_rows()
    weeks = ac.by_week(fields)

    run = subprocess.run([sys.executable, "-I", "-B", RUNS + "p14-apply-check.py", "check"],
                         capture_output=True, text=True, cwd=REPO)
    lines.append("# p14-accept-ac2-diff: AC14-2 diagnosis, deviation D-P14-ACC1")
    lines.append("# audited head " + HEAD)
    lines.append("COMMAND: python3 -I -B measure/runs/storytime_week_package_20261022/p14-apply-check.py check")
    for row in run.stdout.splitlines():
        lines.append("APPLY " + row)
    lines.append("apply check exit: %d" % run.returncode)

    cl_paths = set()
    for week in sorted(weeks):
        for edit in ac.ordered(weeks[week]):
            cl_paths.add(parts_text(edit[2]))
    lines.append("change-list field rows: %d" % len(fields))
    lines.append("change-list unique path strings: %d" %
                 len(set(r["path"] for r in fields)))
    lines.append("change-list field paths (rows expanded to edit paths): %d" % len(cl_paths))

    final = {}
    moved = set()
    instances = 0
    per_week = []
    for week in sorted(weeks):
        path = ac.WEEK_FILE.format(week)
        green = json.loads(sh(["git", "show", GREEN + ":" + path]))
        head = json.loads(sh(["git", "show", HEAD + ":" + path]))
        a, b = flat(green), flat(head)
        diff = sorted((set(a) ^ set(b)) | {k for k in set(a) & set(b) if a[k] != b[k]})
        instances += len(diff)
        per_week.append("w%02d: %d" % (week, len(diff)))
        for item in diff:
            final[item] = "w%02d" % week
            for cl in cl_paths:
                if belongs(item, cl):
                    moved.add(item)
    lines.append("differing path instances per week between %s and HEAD: %d (%s)"
                 % (GREEN, instances, ", ".join(per_week)))
    lines.append("unique differing paths between %s and HEAD: %d" % (GREEN, len(final)))
    lines.append("change-list paths that differ between %s and HEAD: %d" % (GREEN, len(moved)))
    for item in sorted(moved):
        lines.append("    MOVED " + item)

    owners = {}
    for week in sorted(weeks):
        path = ac.WEEK_FILE.format(week)
        log = sh(["git", "log", "--reverse", "--format=%H%x09%s", GREEN + "..HEAD", "--", path])
        prev = json.loads(sh(["git", "show", GREEN + ":" + path]))
        for row in log.splitlines():
            if not row.strip():
                continue
            sha, subject = row.split("\t", 1)
            cur = json.loads(sh(["git", "show", sha + ":" + path]))
            a, b = flat(prev), flat(cur)
            for item in sorted((set(a) ^ set(b)) | {k for k in set(a) & set(b) if a[k] != b[k]}):
                owners.setdefault(sha[:8] + " " + subject, set()).add(item)
            prev = cur

    groups = {}
    for item in final:
        groups.setdefault(topkey(item), set()).add(item)
    lines.append("")
    lines.append("differing paths grouped by top-level key, with the later commits that own them:")
    inst_by_key = {}
    for item, week in final.items():
        inst_by_key.setdefault(topkey(item), 0)
    for key in sorted(groups):
        found = sorted(sha for sha, items in owners.items()
                       if any(topkey(i) == key for i in items))
        lines.append("  %s: %d unique paths" % (key, len(groups[key])))
        for sha in found:
            lines.append("      owner " + sha)

    text = "\n".join(lines) + "\n"
    if THAI.search(text):
        lines = [ln for ln in lines if not THAI.search(ln)]
        text = "\n".join(lines) + "\n"
    text += "THAI CHARS IN OUTPUT: %d\n" % (1 if THAI.search("\n".join(lines)) else 0)
    code = 0 if not moved else 1
    text += "exit: %d\n" % code
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print("CAPTURE_FILE " + OUT)
    print("change-list field rows: %d" % len(fields))
    print("change-list unique path strings: %d" % len(set(r["path"] for r in fields)))
    print("change-list field paths: %d" % len(cl_paths))
    print("change-list paths that differ: %d" % len(moved))
    print("differing path instances: %d" % instances)
    print("unique differing paths: %d" % len(final))
    print("exit: %d" % code)
    return code


if __name__ == "__main__":
    sys.exit(main())
