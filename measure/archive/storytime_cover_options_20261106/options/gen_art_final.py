"""One paid art call for the final quest covers (track storytime_cover_options_20261106, task 2.8).

Usage: python3 -I gen_art_final.py <log file> <art folder> <picture id> <attempt 1-3> [--dry-run]

This script is a changed copy of gen_art.py. The changes:
- the prompt source is prompts-final.json, and the only allowed ids are Q-front and Q-teacher.
- every cost is an integer in units of 0.0001 USD. One call costs 35 units. The script reads the
  cost column of a log row with decimal.Decimal and converts it to an exact integer. It never
  sums floats.
- the Phase 2 limit is 9335 units, counted from the rows of the Phase 2 log only.
- the track limit is 10000 units: the carry-over of the option round (665 units) plus the
  Phase 2 units. The script derives the track limit from the carry-over and the Phase 2
  limit, so the two limits always agree.
- the log keeps its header and its two total lines. The script adds one row for every paid
  call, also for a failed call, and it rewrites the two total lines.
- `mmx image generate` runs with a text prompt only: never --subject-ref, never a picture
  path, never -i.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
PROMPTS_FILE = os.path.join(HERE, 'prompts-final.json')
ALLOWED_IDS = ('Q-front', 'Q-teacher')
UNITS_PER_CENT = 10000          # 1 unit is 0.0001 USD
PRICE_UNITS = 35                # one call costs 35 units (0.0035 USD)
PHASE2_LIMIT_UNITS = 9335       # 0.9335 USD for Phase 2
TRACK_CARRY_UNITS = 665         # 0.0665 USD of the option round
TRACK_LIMIT_UNITS = TRACK_CARRY_UNITS + PHASE2_LIMIT_UNITS   # 10000 units (1.00 USD)
MAX_ATTEMPTS = 3
MAX_PROMPT_CHARS = 1500
WIDTH = 1448
HEIGHT = 2048
COST_TEXT = '0.0035'
ROW = re.compile(r'^\|\s*(\d+)\s*\|\s*([^|]*?)\s*\|\s*mmx image-01\s*\|\s*(\S+)\s*\|\s*(\d+)\s*\|'
                 r'\s*([^|]+?)\s*\|\s*([0-9.]+)\s*\|')


def refuse(message):
    """Stop before any call. The message names the rule that stops the call."""
    print('REFUSED: ' + message)
    sys.exit(2)


def stop(message):
    """Stop before any call. The money limit is reached."""
    print('STOP: ' + message)
    sys.exit(1)


def compose(spec, pic):
    """Join the style, the scene and the no-text line, then fill the cast slots."""
    text = f"{spec['styles'][pic['option']]} {pic['scene']} {spec['noText']}"
    for key, value in spec['cast'].items():
        text = text.replace('{' + key + '}', value)
    return text


def units_of(cost_text):
    """Convert a cost in USD into an exact integer number of units of 0.0001 USD."""
    scaled = Decimal(cost_text) * UNITS_PER_CENT
    if scaled != scaled.to_integral_value():
        raise ValueError(f'cost {cost_text} is not a whole number of units')
    return int(scaled)


def usd_text(units):
    """Format a number of units of 0.0001 USD as USD with four decimals."""
    return f'{Decimal(str(units)) / UNITS_PER_CENT:.4f}'


def log_rows(log_path):
    """Read every paid-call row of the Phase 2 log."""
    if not os.path.exists(log_path):
        return []
    rows = []
    with open(log_path, encoding='utf-8') as handle:
        for line in handle:
            match = ROW.match(line)
            if match:
                rows.append({'n': int(match.group(1)), 'time': match.group(2),
                             'id': match.group(3), 'attempt': int(match.group(4)),
                             'seed': match.group(5), 'units': units_of(match.group(6))})
    return rows


def detail_of(run):
    """Make the message of a failed call one line, so that the log row stays one line."""
    text = (run.stderr or run.stdout).strip()[-120:]
    text = text.replace('\\n', ' ').replace('\\r', ' ')
    text = text.replace('|', '/')
    return re.sub(r'\s+', ' ', text).strip()


def write_row_and_totals(log_path, row_line, phase2_units, track_units):
    """Add one row and rewrite the two total lines at the end of the log."""
    with open(log_path, encoding='utf-8') as handle:
        lines = handle.read().split('\n')
    while lines and (not lines[-1].strip() or lines[-1].startswith('Phase 2 total:')
                     or lines[-1].startswith('Track total:')):
        lines.pop()
    lines.append(row_line)
    lines.append('')
    lines.append(f'Phase 2 total: {usd_text(phase2_units)} USD ({phase2_units} units)')
    lines.append(f'Track total: {usd_text(track_units)} USD ({track_units} units), '
                 'option round 0.0665 USD plus Phase 2')
    with open(log_path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')


def money_state(rows):
    """Return the Phase 2 units and the track units of the log, or stop before any call."""
    phase2_units = sum(row['units'] for row in rows)
    if phase2_units + PRICE_UNITS > PHASE2_LIMIT_UNITS:
        stop(f'the Phase 2 total {phase2_units} units plus one call of {PRICE_UNITS} units '
             f'is over the limit {PHASE2_LIMIT_UNITS} units')
    track_units = TRACK_CARRY_UNITS + phase2_units
    if track_units + PRICE_UNITS > TRACK_LIMIT_UNITS:
        stop(f'the track total {track_units} units plus one call of {PRICE_UNITS} units '
             f'is over the limit {TRACK_LIMIT_UNITS} units')
    return phase2_units, track_units


def main(argv):
    if len(argv) < 4:
        sys.exit(__doc__)
    log_path = os.path.abspath(argv[0])
    art_dir = os.path.abspath(argv[1])
    pid = argv[2]
    attempt = int(argv[3])
    dry = '--dry-run' in argv

    if pid not in ALLOWED_IDS:
        refuse(f'picture id {pid} is not one of {", ".join(ALLOWED_IDS)}')
    if not 1 <= attempt <= MAX_ATTEMPTS:
        refuse(f'{pid}: attempt {attempt} is outside 1 to {MAX_ATTEMPTS}')

    with open(PROMPTS_FILE, encoding='utf-8') as handle:
        spec = json.load(handle)
    pic = next((p for p in spec['pictures'] if p['id'] == pid), None)
    if pic is None:
        refuse(f'prompts-final.json has no picture id {pid}')
    prompt = compose(spec, pic)
    if len(prompt) > MAX_PROMPT_CHARS:
        refuse(f'{pid}: the prompt has {len(prompt)} characters (limit {MAX_PROMPT_CHARS})')

    rows = log_rows(log_path)
    phase2_units, track_units = money_state(rows)
    if any(row['id'] == pid and row['attempt'] == attempt for row in rows):
        refuse(f'{pid}: attempt {attempt} is already in the log')

    out_file = os.path.join(art_dir, f'{pid}-a{attempt}.jpg')
    cmd = ['mmx', 'image', 'generate', '--non-interactive', '--quiet', '--prompt', prompt,
           '--width', str(WIDTH), '--height', str(HEIGHT), '--seed', str(100 + attempt),
           '--response-format', 'base64', '--out', out_file]
    print(f'{pid} attempt {attempt}: {len(prompt)} characters, seed {100 + attempt}, '
          f'{WIDTH} x {HEIGHT}, cost {PRICE_UNITS} units, the log holds Phase 2 '
          f'{phase2_units} units and track {track_units} units')
    if dry:
        print(prompt)
        print(' '.join(cmd))
        return

    os.makedirs(art_dir, exist_ok=True)
    with open(os.path.join(art_dir, f'{pid}-a{attempt}.prompt.txt'), 'w', encoding='utf-8') as handle:
        handle.write(prompt + '\n')
    when = datetime.now(ZoneInfo('Asia/Bangkok')).strftime('%Y-%m-%d %H:%M ICT')
    run = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    ok = run.returncode == 0 and os.path.exists(out_file)
    result = 'saved' if ok else f'failed (exit {run.returncode}: {detail_of(run)})'

    root = os.path.dirname(art_dir)
    rel = os.path.relpath(out_file, root)
    row_line = (f'| {len(rows) + 1} | {when} | mmx image-01 | {pid} | {attempt} | '
                f'{100 + attempt} | {COST_TEXT} | {rel if ok else "-"} | {result} |')
    phase2_units += PRICE_UNITS
    write_row_and_totals(log_path, row_line, phase2_units, TRACK_CARRY_UNITS + phase2_units)
    print(result)
    if not ok:
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1:])
