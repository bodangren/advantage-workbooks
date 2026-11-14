#!/usr/bin/env python3
"""Phase 14 change list: apply, apply check, and form check (spec FR14-4, AC14-2, AC14-3).

Usage, from the repository root:
  python3 -I <this script> apply   text edits of the changed lines of w01 to w08, and the media rows
  python3 -I <this script> check   AC14-2: apply each row to the parse of the old file at ddc70618,
                                   and compare the result with the parse of the new file
  python3 -I <this script> form    AC14-3: whitespace-only changes and numstat of each week file

The script prints no Thai text. A row that it cannot apply as written stops the script with the row id.
"""
import filecmp
import json
import os
import re
import shutil
import subprocess
import sys

SOURCE = 'ddc70618'
CHANGE_LIST = 'measure/tracks/storytime_week_package_20261022/p14-change-list.md'
WEEK_FILE = 'content/storytime/l2/w{:02d}.json'
DELETE = '(delete the item)'
APPEND = '(append) '


class Stop(Exception):
    """A row that the script cannot apply as written."""


def cells(line):
    parts = re.split(r'(?<!\\)\|', line.strip())[1:-1]
    return [p.strip().replace('\\|', '|') for p in parts]


def unquote(cell):
    """The value of a cell: the text in backticks, or the bare marker."""
    if cell.startswith('`') and cell.endswith('`') and len(cell) >= 2:
        return cell[1:-1]
    return cell


def read_rows():
    """The field rows and the media rows of the change list."""
    fields, media = [], []
    for line in open(CHANGE_LIST, encoding='utf-8'):
        if re.match(r'^\| C\d\d-\d\d \|', line):
            c = cells(line)
            path = re.match(r'^`([^`]+)`', c[2]).group(1)
            fields.append({'id': c[0], 'week': int(c[1][1:]), 'path': path,
                           'old_en': unquote(c[3]), 'new_en': unquote(c[4]),
                           'old_th': unquote(c[5]), 'new_th': unquote(c[6])})
        elif re.match(r'^\| F\d\d-\d\d \|', line):
            c = cells(line)
            target = unquote(c[2])
            m = re.match(r'^copy of `([^`]+)`$', c[4])
            media.append({'id': c[0], 'file': target, 'copy': m.group(1) if m else None})
    return fields, media


def data_value(text):
    """A cell of a data row: JSON for an object or an array, else the plain string."""
    if text.startswith('{') or text.startswith('['):
        return json.loads(text)
    return text


def edits_of(row):
    """The single edits of a row: (row id, kind, path parts, old, new)."""
    path = re.sub(r' \(new, appended\)$', '', row['path'])
    out = []
    if '{en,th}' in path:
        head, tail = path.split('.{en,th}.')
        pairs = [(f'{head}.en.{tail}', row['old_en'], row['new_en']), (f'{head}.th.{tail}', row['old_th'], row['new_th'])]
    elif row['old_th'] != '-' or row['new_th'] != '-':
        pairs = [(f'{path}.en', row['old_en'], row['new_en']), (f'{path}.th', row['old_th'], row['new_th'])]
    else:
        pairs = [(path, row['old_en'], row['new_en'])]
    for p, old, new in pairs:
        parts = [int(x) if x.isdigit() else x for x in p.split('.')]
        if new == DELETE:
            out.append((row['id'], 'delete', parts, data_value(old), None))
        elif old in ('(no item)',) and new.startswith(APPEND):
            out.append((row['id'], 'append', parts[:-1], None, new[len(APPEND):]))
        elif old == '(none)':
            out.append((row['id'], 'insert', parts, None, data_value(new)))
        else:
            out.append((row['id'], 'replace', parts, data_value(old), data_value(new)))
    return out


def ordered(edits):
    """Value changes first, then deletions from the highest index, then appends (change list rules)."""
    first = [e for e in edits if e[1] in ('replace', 'insert')]
    deletes = sorted([e for e in edits if e[1] == 'delete'], key=lambda e: (str(e[2][:-1]), -e[2][-1]))
    appends = [e for e in edits if e[1] == 'append']
    return first + deletes + appends


# ---- the apply on the parse (AC14-2) ----

def get(node, parts):
    for p in parts:
        node = node[p]
    return node


def apply_parse(doc, edit):
    rid, kind, parts, old, new = edit
    if kind == 'insert':
        parent = get(doc, parts[:-1])
        if parts[-1] in parent:
            raise Stop(rid)
        items = list(parent.items())
        at = [k for k, _ in items].index('paSkill') + 1 if 'paSkill' in parent else len(items)
        items.insert(at, (parts[-1], new))
        parent.clear()
        parent.update(items)
        return
    if kind == 'append':
        get(doc, parts).append(new)
        return
    parent = get(doc, parts[:-1])
    if parent[parts[-1]] != old:
        raise Stop(rid)
    if kind == 'delete':
        del parent[parts[-1]]
    else:
        parent[parts[-1]] = new


# ---- the text edit (K4) ----

class Spans:
    """The character spans of each value of a JSON text: path tuple to (start, end)."""

    def __init__(self, text):
        self.text = text
        self.spans = {}
        self.i = 0
        self.value(())

    def ws(self):
        while self.text[self.i] in ' \t\r\n':
            self.i += 1

    def value(self, path):
        self.ws()
        start = self.i
        ch = self.text[self.i]
        if ch == '{':
            self.i += 1
            self.ws()
            if self.text[self.i] == '}':
                self.i += 1
            else:
                while True:
                    self.ws()
                    key, self.i = json.decoder.scanstring(self.text, self.i + 1)
                    self.ws()
                    self.i += 1  # the colon
                    self.value(path + (key,))
                    self.ws()
                    if self.text[self.i] == ',':
                        self.i += 1
                        continue
                    self.i += 1
                    break
        elif ch == '[':
            self.i += 1
            self.ws()
            if self.text[self.i] == ']':
                self.i += 1
            else:
                n = 0
                while True:
                    self.value(path + (n,))
                    n += 1
                    self.ws()
                    if self.text[self.i] == ',':
                        self.i += 1
                        continue
                    self.i += 1
                    break
        elif ch == '"':
            _, self.i = json.decoder.scanstring(self.text, self.i + 1)
        else:
            m = re.compile(r'-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null').match(self.text, self.i)
            self.i = m.end()
        self.spans[path] = (start, self.i)


def line_start(text, at):
    return text.rfind('\n', 0, at) + 1


def indent_at(text, at):
    """The leading spaces of the line that holds the offset."""
    return re.match(r' *', text[line_start(text, at):]).group(0)


def render(value, indent):
    out = json.dumps(value, ensure_ascii=False, indent=2)
    return out.replace('\n', '\n' + indent)


def apply_text(text, edit):
    rid, kind, parts, old, new = edit
    sp = Spans(text)
    key = tuple(parts)
    if kind == 'insert':
        anchor = sp.spans.get(key[:-1] + ('paSkill',))
        if anchor is None or key in sp.spans:
            raise Stop(rid)
        s, e = anchor
        if text[e] != ',' or text[e + 1] != '\n':
            raise Stop(rid)
        indent = indent_at(text, line_start(text, s))
        line = f'{indent}{json.dumps(key[-1])}: {render(new, indent)},\n'
        return text[:e + 2] + line + text[e + 2:]
    if kind == 'append':
        n = 0
        while key + (n,) in sp.spans:
            n += 1
        if n == 0:
            raise Stop(rid)
        s, e = sp.spans[key + (n - 1,)]
        indent = indent_at(text, s)
        return text[:e] + ',\n' + indent + render(new, indent) + text[e:]
    if key not in sp.spans:
        raise Stop(rid)
    s, e = sp.spans[key]
    if json.loads(text[s:e]) != old:
        raise Stop(rid)
    if kind == 'replace':
        return text[:s] + render(new, indent_at(text, line_start(text, s))) + text[e:]
    # delete an array item
    idx = key[-1]
    nxt = sp.spans.get(key[:-1] + (idx + 1,))
    if nxt is not None:
        return text[:line_start(text, s)] + text[line_start(text, nxt[0]):]
    if idx == 0:
        raise Stop(rid)
    prev = sp.spans[key[:-1] + (idx - 1,)]
    return text[:prev[1]] + text[e:]


def by_week(fields):
    weeks = {}
    for row in fields:
        weeks.setdefault(row['week'], []).extend(edits_of(row))
    return weeks


def main(mode):
    fields, media = read_rows()
    weeks = by_week(fields)
    if mode == 'apply':
        for week, edits in sorted(weeks.items()):
            path = WEEK_FILE.format(week)
            text = open(path, encoding='utf-8').read()
            for edit in ordered(edits):
                text = apply_text(text, edit)
            json.loads(text)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f'w{week:02d}: edits {len(edits)}')
        for row in media:
            if row['copy']:
                if os.path.exists(row['file']):
                    raise Stop(row['id'])
                shutil.copyfile(row['copy'], row['file'])
            else:
                if not os.path.exists(row['file']):
                    raise Stop(row['id'])
                os.remove(row['file'])
        print(f'field rows: {len(fields)}, media rows: {len(media)}')
        return 0
    if mode == 'check':
        applied = set()
        equal = 0
        for week, edits in sorted(weeks.items()):
            path = WEEK_FILE.format(week)
            old = json.loads(subprocess.run(['git', 'show', f'{SOURCE}:{path}'], check=True, capture_output=True).stdout.decode('utf-8'))
            for edit in ordered(edits):
                apply_parse(old, edit)
                applied.add(edit[0])
            new = json.loads(open(path, encoding='utf-8').read())
            same = old == new and json.dumps(old, ensure_ascii=False) == json.dumps(new, ensure_ascii=False)
            equal += same
            print(f'w{week:02d}: rows {len({e[0] for e in edits})}, equal {"yes" if same else "no"}')
        copies = [r for r in media if r['copy']]
        removals = [r for r in media if not r['copy']]
        cmp_equal = sum(1 for r in copies if os.path.exists(r['file']) and filecmp.cmp(r['copy'], r['file'], shallow=False))
        removed = sum(1 for r in removals if not os.path.exists(r['file']))
        print(f'rows applied {len(applied)}')
        print(f'weeks equal {equal} of {len(weeks)}')
        print(f'copies cmp equal {cmp_equal} of {len(copies)}')
        print(f'removed {removed} of {len(removals)}')
        ok = len(applied) == 114 and equal == len(weeks) == 8 and cmp_equal == len(copies) == 5 and removed == len(removals) == 5
        return 0 if ok else 1
    if mode == 'form':
        total = 0
        for week in sorted(weeks):
            path = WEEK_FILE.format(week)
            diff = subprocess.run(['git', 'diff', '-U0', SOURCE, '--', path], check=True, capture_output=True).stdout.decode('utf-8')
            count = 0
            removed, added = [], []

            def close():
                nonlocal count
                stripped = {re.sub(r'\s', '', r) for r in removed}
                count += sum(1 for a in added if re.sub(r'\s', '', a) in stripped)

            for line in diff.split('\n'):
                if line.startswith('@@'):
                    close()
                    removed, added = [], []
                elif line.startswith('-') and not line.startswith('---'):
                    removed.append(line[1:])
                elif line.startswith('+') and not line.startswith('+++'):
                    added.append(line[1:])
            close()
            numstat = subprocess.run(['git', 'diff', '--numstat', SOURCE, '--', path], check=True, capture_output=True).stdout.decode('utf-8').strip()
            total += count
            print(f'w{week:02d}: whitespace-only changes {count}; numstat {numstat}')
        return 0 if total == 0 else 1
    print(__doc__)
    return 2


if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else ''))
    except Stop as stop:
        print(f'blocked: row {stop.args[0]} cannot be applied as written')
        sys.exit(3)
