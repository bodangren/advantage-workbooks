"""The spend log check of Task 2.8 (track storytime_cover_options_20261106, FR-8.6).

Usage: python3 -I spend_check.py

It runs every spend log check of plan Task 2.8 and prints one labelled line with integers.
Exit 0 when every check passes. The id check allows one recorded exception: row 4, id `probe`,
the 512 x 512 probe call made outside the guard after the network error of row 1 (PM rule
2026-11-09).
"""
import os
import re
import sys
from decimal import Decimal

LOG = os.path.expanduser('~/Desktop/print-ready/storytime/covers-quest-v1/spend-log.md')
ROOT = os.path.expanduser('~/Desktop/print-ready/storytime')
PHASE2_LIMIT_UNITS = 9335
TRACK_CARRY_UNITS = 665
TRACK_LIMIT_UNITS = 10000
MAX_ATTEMPTS = 3
ALLOWED_IDS = ('Q-front', 'Q-teacher')
PROBE_EXCEPTION = {'n': 4, 'id': 'probe'}

ROW = re.compile(r'^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*mmx image-01\s*\|\s*(\S+)\s*\|\s*(\d+)\s*\|'
                 r'\s*([^|]+?)\s*\|\s*([0-9.]+)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$')


def units_of(cost_text):
    scaled = Decimal(cost_text) * 10000
    if scaled != scaled.to_integral_value():
        raise ValueError(f'cost {cost_text} is not a whole number of units')
    return int(scaled)


def main():
    failures = []
    with open(LOG, encoding='utf-8') as handle:
        text = handle.read()

    rows = []
    for line in text.split('\n'):
        match = ROW.match(line)
        if match:
            rows.append({'n': int(match.group(1)), 'time': match.group(2), 'tool': 'mmx image-01',
                         'id': match.group(3), 'attempt': int(match.group(4)),
                         'seed': match.group(5), 'cost': Decimal(match.group(6)),
                         'units': units_of(match.group(6)), 'file': match.group(7),
                         'result': match.group(8)})

    def report(label, ok, detail):
        if not ok:
            failures.append(label)
        print(f'{"PASS" if ok else "FAIL"} {label}: {detail}')

    # 1. Six fields per row: time, tool, prompt id, attempt, cost, result file.
    missing = [row['n'] for row in rows
               if not (row['time'] and row['tool'] and row['id'] and row['attempt']
                       and row['cost'] is not None and row['file'])]
    report('six_fields_ok', not missing,
           f'rows={len(rows)}, rows_with_a_missing_field={len(missing)}')

    # 2. The stated Phase 2 total equals the sum of the rows in units.
    total_units = sum(row['units'] for row in rows)
    stated = None
    stated_track = None
    for line in text.split('\n'):
        if line.startswith('Phase 2 total:'):
            stated = int(re.search(r'\((\d+) units\)', line).group(1))
        if line.startswith('Track total:'):
            stated_track = int(re.search(r'\((\d+) units\)', line).group(1))
    report('phase2_equals_row_sum', stated == total_units,
           f'rows_units={total_units}, stated_phase2_units={stated}')

    # 3. The Phase 2 total is at most 9335 units.
    report('phase2_at_most_9335', stated is not None and stated <= PHASE2_LIMIT_UNITS,
           f'phase2_units={stated}, limit={PHASE2_LIMIT_UNITS}')

    # 4. The track total is 665 units plus Phase 2 and is at most 10000 units.
    expected_track = TRACK_CARRY_UNITS + (stated or 0)
    report('track_equals_665_plus_phase2', stated_track == expected_track,
           f'track_units={stated_track}, expected={expected_track}')
    report('track_at_most_10000', stated_track is not None and stated_track <= TRACK_LIMIT_UNITS,
           f'track_units={stated_track}, limit={TRACK_LIMIT_UNITS}')

    # 5. The log has at least 2 rows.
    report('at_least_2_rows', len(rows) >= 2, f'rows={len(rows)}')

    # 6. Each id has attempts 1 to 3 only.
    bad_attempts = [row['n'] for row in rows if not 1 <= row['attempt'] <= MAX_ATTEMPTS]
    report('attempts_1_to_3', not bad_attempts,
           f'rows_outside_1_to_3={len(bad_attempts)}')

    # 7. The ids are only Q-front and Q-teacher, with one recorded exception.
    others = [row for row in rows if row['id'] not in ALLOWED_IDS]
    exceptions = [row for row in others
                  if row['n'] == PROBE_EXCEPTION['n'] and row['id'] == PROBE_EXCEPTION['id']]
    unexpected = [row for row in others if row not in exceptions]
    if len(exceptions) == 1 and not unexpected:
        report('id_ok', True, 'id_ok=True (1 recorded exception: row 4 probe)')
    else:
        report('id_ok', False,
               f'ids={sorted(set(row["id"] for row in rows))}, '
               f'unexpected={[row["n"] for row in unexpected]}')

    # 8. Each saved row names a file that exists.
    missing_files = [row['n'] for row in rows
                     if row['result'].startswith('saved')
                     and not os.path.exists(os.path.join(ROOT, row['file']))]
    report('saved_files_exist', not missing_files,
           f'saved_rows_without_a_file={len(missing_files)}')

    print(f'rows={len(rows)} checks=8 failures={len(failures)}')
    if failures:
        print('FAILED: ' + ', '.join(failures))
        return 1
    print('EXIT=0')
    return 0


if __name__ == '__main__':
    sys.exit(main())
