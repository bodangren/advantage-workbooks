#!/usr/bin/env python3
"""Source proof for the r3 package build: base SHAs, Red ancestry, and source equality."""
import subprocess

REPO = "/home/daniebo/Desktop/Workbooks"
PHASE_BASE = "5d80aae7bcb5bbe1b85b044e76d21ae16697831a"
SOURCE = "953f798ea309cc10abd5538c202e05ff31a2320d"
PATHS = ["content/storytime/l2/", "content/storytime/words/",
         "content/storytime/l2/media/w02/", "content/storytime/l2/media/w03/",
         "content/storytime/l2/media/w04/", "content/storytime/l2/media/w05/",
         "content/storytime/l2/media/w06/", "content/storytime/l2/media/w07/"]


def run(args):
    return subprocess.run(["git", "-C", REPO] + args, capture_output=True, text=True)


def main():
    head = run(["rev-parse", "HEAD"]).stdout.strip()
    print(f"role_base_sha: {head}")
    print(f"phase_base_sha: {PHASE_BASE}")
    print(f"source_commit: {SOURCE}")
    for sha in ("b27f927f6afc5c3b61770db87a5d848b141fc55a",
                "be92ae9ed54c378aef53824ec2a1d3d9b8f1b52d"):
        r = run(["merge-base", "--is-ancestor", sha, "HEAD"])
        print(f"ancestor of HEAD {sha[:8]}: exit {r.returncode}")
    r = run(["merge-base", "--is-ancestor", PHASE_BASE, "HEAD"])
    print(f"phase base is ancestor of HEAD: exit {r.returncode}")
    r = run(["diff", "--stat", SOURCE, "HEAD", "--"] + PATHS)
    print(f"diff --stat {SOURCE[:8]}..HEAD over the source paths:")
    print(r.stdout.rstrip("\n") if r.stdout.strip() else "(empty: the source paths are equal)")
    print(f"diff exit: {r.returncode}")
    r = run(["status", "--porcelain", "content/storytime/"])
    print("git status --porcelain content/storytime/:")
    print(r.stdout.rstrip("\n") if r.stdout.strip() else "(empty)")
    print(f"status exit: {r.returncode}")


if __name__ == "__main__":
    main()
