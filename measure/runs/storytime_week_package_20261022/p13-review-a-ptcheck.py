import glob
import re

ROOT = '/home/daniebo/Desktop/Workbooks'
RUNS = ROOT + '/measure/runs/storytime_week_package_20261022'

# The PROJECT_TESTS expansion at HEAD (file lists only; the command is read from plan.md).
expected = sorted(
    glob.glob(ROOT + '/dashboard/__tests__/storytime-*.test.ts')
    + glob.glob(ROOT + '/dashboard/__tests__/covers-*.test.ts')
    + glob.glob(ROOT + '/dashboard/__tests__/print-pdfx.test.ts'),
)
expected = [p.split('dashboard/')[1] for p in expected]

parts = {}
for name in ['a', 'b1', 'b2', 'b3']:
    with open('%s/p13-green1-project-%s.txt' % (RUNS, name), encoding='utf-8') as fh:
        plain = re.sub(r'\x1b\[[0-9;]*m', '', fh.read())
    parts[name] = sorted(set(re.findall(r'__tests__/[a-z0-9-]+\.test\.ts', plain)))

union = sorted(set().union(*parts.values()))
all_names = [n for name in ['a', 'b1', 'b2', 'b3'] for n in parts[name]]
dupes = sorted({n for n in all_names if all_names.count(n) > 1})

print('PROJECT_TESTS expansion (glob at HEAD): %d files' % len(expected))
for name in ['a', 'b1', 'b2', 'b3']:
    print('part %s: %d files' % (name, len(parts[name])))
print('union of parts: %d files' % len(union))
print('files in no part: %s' % sorted(set(expected) - set(union)))
print('files in parts but not in the glob: %s' % sorted(set(union) - set(expected)))
print('files in more than one part: %s' % dupes)
print('MATCH: %s' % (set(expected) == set(union) and not dupes))
