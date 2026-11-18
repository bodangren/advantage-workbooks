"""One paid art call for the Storytime cover options (track storytime_cover_options_20261106).

Usage: python3 -I gen_art.py <hand-off folder> <picture id> <attempt 1-3> [--seed N] [--dry-run]

The script composes the prompt from prompts.json (style + scene + cast + no-text line), refuses a
prompt over 1500 characters, a 4th attempt, and a call that takes the total over the limit. It runs
`mmx image generate` with a text prompt only (never --subject-ref), and it adds one row to
spend-log.md in the hand-off folder for every paid call, also for a failed call.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
PRICE_USD = 0.0035  # image-01, MiniMax pay-as-you-go price page, read 2026-11-06
LIMIT_USD = 1.00
MAX_ATTEMPTS = 3
ROW = re.compile(r'^\| (\d+) \| [^|]+ \| mmx image-01 \| (\S+) \| (\d) \| [^|]+ \| ([0-9.]+) \|')


def compose(spec, pic):
    text = f"{spec['styles'][pic['option']]} {pic['scene']} {spec['noText']}"
    for key, value in spec['cast'].items():
        text = text.replace('{' + key + '}', value)
    return text


def log_rows(log):
    if not os.path.exists(log):
        return []
    return [m.groups() for m in map(ROW.match, open(log, encoding='utf-8')) if m]


def main(argv):
    if len(argv) < 3:
        sys.exit(__doc__)
    out_dir, pid, attempt = argv[0], argv[1], int(argv[2])
    seed = int(argv[argv.index('--seed') + 1]) if '--seed' in argv else 100 + attempt
    dry = '--dry-run' in argv
    spec = json.load(open(os.path.join(HERE, 'prompts.json'), encoding='utf-8'))
    pic = next((p for p in spec['pictures'] if p['id'] == pid), None)
    if pic is None:
        sys.exit(f'unknown picture id {pid}')
    prompt = compose(spec, pic)
    if len(prompt) > 1500:
        sys.exit(f'{pid}: the prompt has {len(prompt)} characters (limit 1500)')
    if not 1 <= attempt <= MAX_ATTEMPTS:
        sys.exit(f'{pid}: attempt {attempt} is outside 1 to {MAX_ATTEMPTS}')
    log = os.path.join(out_dir, 'spend-log.md')
    rows = log_rows(log)
    if any(r[1] == pid and int(r[2]) == attempt for r in rows):
        sys.exit(f'{pid}: attempt {attempt} is already in the log')
    spent = sum(float(r[3]) for r in rows)
    if spent + PRICE_USD > LIMIT_USD + 1e-9:
        sys.exit(f'STOP: the total {spent:.4f} USD plus one call is over the limit {LIMIT_USD:.2f} USD')
    width, height = pic['size']
    # mmx returns JPEG data for every --out name, so the file gets the .jpg name.
    rel = f'art/{pid}-a{attempt}.jpg'
    cmd = ['mmx', 'image', 'generate', '--non-interactive', '--quiet', '--prompt', prompt,
           '--width', str(width), '--height', str(height), '--seed', str(seed),
           '--response-format', 'base64', '--out', os.path.join(out_dir, rel)]
    print(f'{pid} attempt {attempt}: {len(prompt)} characters, seed {seed}, {width} x {height}')
    if dry:
        print(prompt)
        return
    os.makedirs(os.path.join(out_dir, 'art'), exist_ok=True)
    with open(os.path.join(out_dir, f'art/{pid}-a{attempt}.prompt.txt'), 'w', encoding='utf-8') as f:
        f.write(prompt + '\n')
    when = datetime.now(ZoneInfo('Asia/Bangkok')).strftime('%Y-%m-%d %H:%M ICT')
    run = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    ok = run.returncode == 0 and os.path.exists(os.path.join(out_dir, rel))
    result = 'saved' if ok else f'failed (exit {run.returncode}: {(run.stderr or run.stdout).strip()[-120:]})'
    n = len(rows) + 1
    with open(log, 'a', encoding='utf-8') as f:
        f.write(f'| {n} | {when} | mmx image-01 | {pid} | {attempt} | {seed} | {PRICE_USD:.4f} | {rel if ok else "-"} | {result.replace("|", "/")} |\n')
    print(result)
    if not ok:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
