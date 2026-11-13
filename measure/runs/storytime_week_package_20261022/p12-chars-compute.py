import re, sys
RUNS = "measure/runs/storytime_week_package_20261022"
texts = {}
for n in range(1, 8):
    with open(f"{RUNS}/p12-sentences-w{n:02d}.txt", encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r"^(l2/media/w\d\d/sentences/b\d-s\d\d\.mp3)\t(.+)$", line.rstrip("\n"))
            if m:
                texts[m.group(1)] = m.group(2)
takes = {}
with open(f"{RUNS}/p12-listen.txt", encoding="utf-8") as fh:
    for line in fh:
        m = re.match(r"^listen: (w\d\d) b\d (b\d-s\d\d\.mp3) take (\d+)", line)
        if m:
            takes[f"{m.group(1)}/{m.group(2)}"] = int(m.group(3))
one_take = 0
sent = 0
per_week = {}
for path, text in sorted(texts.items()):
    week = path.split("/")[2]
    t = takes.get(f"{week}/{path.split('/')[-1]}", 1)
    one_take += len(text)
    sent += len(text) * t
    per_week.setdefault(week, [0, 0])
    per_week[week][0] += len(text)
    per_week[week][1] += len(text) * t
failed = len("A nest.") + len("A nose.")
sent += failed
words = 47
print(f"clips parsed: {len(texts)} takes parsed: {len(takes)}")
for wk in sorted(per_week):
    print(f"{wk}: one-take {per_week[wk][0]} sent {per_week[wk][1]}")
print(f"word chars: {words}")
print(f"sentence one-take sum: {one_take}")
print(f"sentence sent sum (with failed calls {failed}): {sent}")
print(f"total chars: {words + sent}")
