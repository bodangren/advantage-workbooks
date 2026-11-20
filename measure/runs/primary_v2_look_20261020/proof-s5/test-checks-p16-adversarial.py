"""Adversarial probes for checks.py check_p16 (S5 round 2).

Every fixture holds Latin text only. Nothing reads a proof PDF, a proof HTML
file, or a Thai string. The probes attack the 7.95 pt boundary, an empty
Ghostscript XML result, and the italic-face guard.
"""

import importlib.util
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC = importlib.util.spec_from_file_location('s5_checks', os.path.join(HERE, 'checks.py'))
checks = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checks)

RESULTS = []


def record(name, ok, detail):
    """Keep one labelled pass or fail line."""
    RESULTS.append((name, ok, detail))


def boundary_probe():
    """Measure four Latin-only PDFs at exact point sizes (no monkeypatch)."""
    record('contract', checks.P16_MIN_PT == 8.0 and checks.P16_TOL_PT == 0.05,
           f'min {checks.P16_MIN_PT} tol {checks.P16_TOL_PT}')
    if not shutil.which('gs'):
        record('gs-present', False, 'gs not on PATH')
        return
    folder = tempfile.mkdtemp(prefix='p16-adv-', dir='/tmp/opencode')
    try:
        for size, want_under in [(7.94, 1), (7.95, 0), (7.96, 0), (8.0, 0)]:
            path = os.path.join(folder, f'p{size:g}.pdf')
            checks.write_sized_pdf(path, size)
            sizes = checks.p16_span_sizes(path)
            under = sum(1 for value in sizes if value < checks.P16_MIN_PT - checks.P16_TOL_PT)
            record(f'boundary-{size:g}', bool(sizes) and sizes[0] == size and under == want_under,
                   f'measured {sizes} under {under} want_under {want_under}')
    finally:
        shutil.rmtree(folder, ignore_errors=True)


class FakeRun:
    """Replace checks.subprocess.run for one probe, then restore it."""

    def __init__(self, xml, font_line):
        self.xml = xml
        self.font_line = font_line
        self.original = None

    def __enter__(self):
        self.original = checks.subprocess.run
        checks.subprocess.run = self.run
        return self

    def __exit__(self, *_args):
        checks.subprocess.run = self.original

    def run(self, args, **_kwargs):
        if args and args[0] == 'gs':
            target = next(item.split('=', 1)[1] for item in args if item.startswith('-sOutputFile='))
            with open(target, 'w', encoding='utf-8') as handle:
                handle.write(self.xml)
            return subprocess.CompletedProcess(args, 0, '', '')
        if args and args[0] == 'pdffonts':
            output = 'name id emb type enc\n----------------------\n' + self.font_line + '\n'
            return subprocess.CompletedProcess(args, 0, output, '')
        return self.original(args, **_kwargs)


def empty_xml_probe():
    """An empty Ghostscript result must not count as a passing span list."""
    with FakeRun('', 'Latin-Regular Type1 yes yes\n'):
        sizes = checks.p16_span_sizes('/tmp/opencode/p16-adv-not-read.pdf')
        record('empty-xml-sizes', sizes == [], f'sizes {sizes}')
        folder = tempfile.mkdtemp(prefix='p16-adv-empty-', dir='/tmp/opencode')
        old_folder = checks.FOLDER
        checks.FOLDER = folder
        try:
            ok, _lines = checks.check_p16()
            record('empty-xml-check', ok is False, f'check_p16 ok {ok}')
        finally:
            checks.FOLDER = old_folder
            shutil.rmtree(folder, ignore_errors=True)


def italic_probe():
    """An oblique face name must fail; a plain Latin name must pass."""
    xml = '<text><span size="11.0000">Latin fixture span</span></text>'
    folder = tempfile.mkdtemp(prefix='p16-adv-italic-', dir='/tmp/opencode')
    old_folder = checks.FOLDER
    checks.FOLDER = folder
    try:
        with FakeRun(xml, 'Latin-Oblique Type1 yes yes'):
            ok, lines = checks.check_p16()
            record('italic-detected', ok is False and any('italic face' in line for line in lines),
                   f'ok {ok} lines {lines}')
        with FakeRun(xml, 'Latin-Regular Type1 yes yes'):
            ok, lines = checks.check_p16()
            record('italic-control', ok is True, f'ok {ok} lines {lines}')
    finally:
        checks.FOLDER = old_folder
        shutil.rmtree(folder, ignore_errors=True)


def main():
    """Run every probe and print an English summary."""
    boundary_probe()
    empty_xml_probe()
    italic_probe()
    for name, ok, detail in RESULTS:
        print(f'{name}: {"PASS" if ok else "FAIL"} {detail}')
    failed = sum(1 for _name, ok, _detail in RESULTS if not ok)
    print(f'PROBES {len(RESULTS)} FAILURES {failed}')
    print('RESULT: PASS' if failed == 0 else 'RESULT: FAIL')
    if failed == 0:
        thai = sum(1 for _name, _ok, detail in RESULTS if any(0x0E00 <= ord(c) <= 0x0E7F for c in detail))
        print(f'THAI_IN_OUTPUT {thai}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
