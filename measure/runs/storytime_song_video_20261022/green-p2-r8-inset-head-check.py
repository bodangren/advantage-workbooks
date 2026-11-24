#!/usr/bin/env python3
"""First row of figure pixels inside the inset card: a margin of 0 means the head is clipped."""
import subprocess, sys

def raw(path):
    return subprocess.run(["ffmpeg","-v","error","-i",path,"-f","rawvideo","-pix_fmt","rgb24","-"],
                         capture_output=True, check=True).stdout

def first_ink(path, w, inner):
    x0, y0, x1, y1 = inner
    data = raw(path)
    for y in range(y0, y1):
        row = data[(y * w + x0) * 3 : (y * w + x1) * 3]
        ink = [i for i in range(120, len(row) - 120, 3) if row[i+2] < 215]  # blue channel: cream is 231+
        if ink:
            return y, x0 + ink[0] // 3, x0 + ink[-1] // 3
    return None

for spec in sys.argv[1:]:
    kind, path = spec.split("=", 1)
    if kind == "classroom":
        w, inner = 1920, (1610, 716, 1864, 1024)   # card (1602,708,270,324) minus the 8 px border
    else:
        s = 720 / 1080
        w, inner = 720, (round(128*s), round(1040*s)+1, round(952*s), round(1880*s))
    found = first_ink(path, w, inner)
    if found:
        y, xa, xb = found
        print("%-9s %-40s inner top %d, first figure row %d (margin %d px), x %d..%d"
              % (kind, path.split("/")[-1], inner[1], y, y - inner[1], xa, xb))
    else:
        print("%-9s %-40s inner top %d, NO FIGURE PIXELS" % (kind, path.split("/")[-1], inner[1]))
