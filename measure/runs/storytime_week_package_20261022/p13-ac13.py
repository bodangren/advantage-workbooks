#!/usr/bin/env python3
"""Phase 13 (spec AC13-1 to AC13-8): the acceptance checks of the Clips task.

Usage: p13-ac13.py <runs-folder> <content-root> <sha-w01> ... <sha-w07>
"""
import hashlib
import json
import os
import re
import subprocess
import sys

RUNS = sys.argv[1]
ROOT = sys.argv[2]
SHAS = sys.argv[3:]


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, check=False).stdout


def read(*parts):
    return open(os.path.join(*parts), encoding="utf-8").read()


print("=== AC13-1: the read-along books and the one-take characters ===")
books = []
for n in range(1, 8):
    week = json.load(open(os.path.join(ROOT, "l2/w%02d.json" % n), encoding="utf-8"))
    for index, book in enumerate(week["books"]):
        if book.get("kind") != "readalong":
            continue
        sentences = book["audio"]["sentences"]
        books.append((n, index, len(sentences), sum(len(s["sentence"]) for s in sentences)))
print("books: %s" % (books,))
print("sentences: %d, one-take characters: %d" % (sum(b[2] for b in books), sum(b[3] for b in books)))
print("AC13-1 holds: %s" % (sum(b[2] for b in books) == 72 and sum(b[3] for b in books) == 927))

print("=== AC13-2: the clip files and their format ===")
b0 = sorted(run("find", ROOT + "/l2/media", "-path", "*/sentences/b0-s*.mp3").split())
allb = sorted(run("find", ROOT + "/l2/media", "-path", "*/sentences/b*-s*.mp3").split())
print("b0 clips: %d, all sentence clips: %d" % (len(b0), len(allb)))
per_week = [len([f for f in b0 if "/w%02d/" % n in f]) for n in range(1, 8)]
print("b0 per week: %s" % (per_week,))
formats = set()
for file in b0:
    out = run("ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
               "stream=sample_rate,channels,bit_rate", "-of", "csv=p=0", file).strip()
    formats.add(out)
print("formats: %s" % (sorted(formats),))
print("AC13-2 holds: %s" % (len(b0) == 72 and len(allb) == 128 and per_week == [8, 16, 8, 8, 8, 8, 16]
                            and formats == {"32000,1,128000"}))

print("=== AC13-3: the week files and the provenance rows ===")
script = (
    "import json,hashlib;R=lambda p:json.load(open(p,encoding='utf-8'));"
    "H=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest();T='%s/';"
    "books=[(n,i,b,{x['file']:x for x in R(T+'l2/media/w0%%d/sentences/manifest.json'%%n)['items']}) "
    "for n in range(1,8) for i,b in enumerate(R(T+'l2/w0%%d.json'%%n)['books'])];"
    "F=lambda n,i,k:'l2/media/w0%%d/sentences/b%%d-s%%02d.mp3'%%(n,i,k+1);"
    "g=lambda n,i,b,pv:(lambda s,c:c is not None and len(c)==len(s) and all(x['file']==F(n,i,k) "
    "and x['sentence']==s[k]['sentence'] and F(n,i,k) in pv and pv[F(n,i,k)]['text']==x['sentence'] "
    "and H(T+F(n,i,k))==pv[F(n,i,k)]['sha256'] for k,x in enumerate(c)))(b['audio']['sentences'],"
    "b['audio'].get('sentenceClips'));ok=sum(1 for a in books if g(*a));"
    "print('books ok',ok,'bad',len(books)-ok,'items',sum(len(b['audio'].get('sentenceClips') or []) "
    "for _,_,b,_ in books))" % ROOT
)
print(run("python3", "-I", "-B", "-c", script).strip())

print("=== AC13-4: the Phase 12 items stay and the new items are sorted ===")
script4 = (
    "import json,subprocess;P=lambda n:'%s/l2/media/w0%%d/sentences/manifest.json'%%n;"
    "old=lambda n:json.loads(subprocess.run(['git','show','fa47ca23:'+P(n)],capture_output=True,text=True,"
    "check=True).stdout);new=lambda n:json.load(open(P(n)));r=range(1,8);"
    "bad=sum([i for i in new(n)['items'] if i['book']==1]!=old(n)['items'] or "
    "[new(n)[k] for k in ('voice','speed','model')]!=[old(n)[k] for k in ('voice','speed','model')] for n in r);"
    "n0=sum(len([i for i in new(n)['items'] if i['book']==0]) for n in r);"
    "od=sum([(i['book'],i['n']) for i in new(n)['items']]!=sorted((i['book'],i['n']) for i in new(n)['items']) "
    "for n in r);print('phase 12 items changed',bad,'read-along items',n0,'order bad',od)" % ROOT
)
print(run("python3", "-I", "-B", "-c", script4).strip())
old_clips = run("git", "diff", "--stat", "fa47ca23", "HEAD", "--", ROOT + "/l2/media/*/sentences/b1-*.mp3").strip()
print("the 56 Phase 12 mp3 files against fa47ca23: %s" % (old_clips if old_clips else "no change"))

print("=== AC13-5: the proofs of M10 ===")
cut = read(RUNS, "p13-cut-proof.txt")
print([l for l in cut.splitlines() if l.startswith("clips: ")])
print([l for l in cut.splitlines() if l.startswith("positive controls: ")])
heard = [l for l in read(RUNS, "p13-sentences-heard.txt").splitlines() if re.match(r"^w\d\d \S+ take \d+ heard ", l)]
differs = [l for l in heard if "heard differs" in l]
takes3 = [l for l in heard if " take 3 " in l]
print("heard lines: %d, heard differs: %d, take 3: %d" % (len(heard), len(differs), len(takes3)))
for line in differs:
    print("listen: %s" % line)

print("=== AC13-6: the check rows of check-weeks ===")
f9 = read(RUNS, "p13-clips-checks-e8549b2e.txt")
blocks = re.split(r"^(?=st2/\d+ )", f9, flags=re.M)
for block in blocks:
    head = block.splitlines()[0] if block.strip() else ""
    if not head.startswith("st2/"):
        continue
    week = head.split(" ")[0]
    dec = "PASS    sentence-clips" in block
    read_ = "PASS    readalong-sentence-clips" in block
    print("%s sentence-clips pass: %s, readalong-sentence-clips pass: %s" % (week, dec, read_))
print("FAIL rows other than published: %s" % [l for l in f9.splitlines() if l.startswith("FAIL rows other than published")])

print("=== AC13-7: the mapper repeat and the dry runs after the content commits ===")
for n in range(1, 8):
    week = "w%02d" % n
    repeat = read(RUNS, "p13-setsent-%s-repeat.txt" % week)
    print("%s mapper repeat: %s" % (week, [l for l in repeat.splitlines() if l.startswith("diff lines")]))
dry = read(RUNS, "p13-ac13-dry.txt")
kept = [l for l in dry.splitlines() if l.startswith("kept")]
chars = [l for l in dry.splitlines() if l.startswith("chars:")]
calls = [l for l in dry.splitlines() if l.startswith("call ") or l.startswith("sent:")]
print("dry runs after the content commits: kept lines %d, chars lines %d, all chars 0: %s, call or sent lines: %d"
      % (len(kept), len(chars), all(l == "chars: 0" for l in chars), len(calls)))
print("read-along kept lines: %d, decodable kept lines: %d"
      % (len([l for l in kept if "/sentences/b0-" in l]), len([l for l in kept if "/sentences/b1-" in l])))

print("=== AC13-8: the week file change of each content commit ===")
expected = [35, 67, 35, 35, 35, 35, 67]
for index, sha in enumerate(SHAS):
    out = run("git", "show", "--numstat", "--format=", sha, "--", "content/storytime/l2/w%02d.json" % (index + 1)).strip()
    parts = out.split()
    insertions = int(parts[0]) if parts else 0
    deletions = int(parts[1]) if parts else 0
    print("w%02d %s insertions %d deletions %d, expected %d and 1, holds: %s"
          % (index + 1, sha[:8], insertions, deletions, expected[index],
             insertions == expected[index] and deletions == 1))
