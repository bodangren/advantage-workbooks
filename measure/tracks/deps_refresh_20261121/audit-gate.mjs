#!/usr/bin/env node
/**
 * Audit gate of Measure track `deps_refresh_20261121`.
 *
 * Runs `npm audit --json` in a project folder and exits non-zero while any
 * advisory at or above the minimum severity is not on the allowlist with a
 * reason. The gate is the Red test of Phases D1 to D3: it fails on the
 * before state and passes after Green.
 *
 * Usage:
 *   node measure/tracks/deps_refresh_20261121/audit-gate.mjs [--min <severity>] <project> [<project>...]
 *
 * Projects: `dashboard`, `video`, or `both`. The default minimum severity is
 * `high`, so critical and high advisories gate. Phase D3 uses `--min moderate`.
 * An advisory passes when `ALLOWLIST` holds its advisory id, or `pkg:<name>`
 * for its package, together with a reason string.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RANK = { info: 0, unknown: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const PROJECTS = {
  dashboard: path.join(root, 'dashboard'),
  video: path.join(root, 'video', 'storytime-song'),
};

// Advisory id (or `pkg:<name>`) -> reason. Add an entry only with its reason.
// Reasons: 'no upstream fix (<date>)' or 'breaking major deferred (<date>)'.
const ALLOWLIST = {
  // 'GHSA-xxxx-yyyy-zzzz': 'no upstream fix (2026-11-24)',
  // 'pkg:pagedjs-cli': 'breaking major deferred (2026-11-24)',
};

const args = process.argv.slice(2);
let min = 'high';
const requested = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--min') {
    min = args[i + 1];
    i += 1;
  } else {
    requested.push(args[i]);
  }
}
if (!RANK[min]) {
  console.error(`audit gate: unknown severity '${min}'`);
  process.exit(2);
}
const names = requested.length === 0 ? ['both'] : requested;
const projects = [...new Set(names.flatMap((n) => (n === 'both' ? ['dashboard', 'video'] : [n])))];
for (const p of projects) {
  if (!PROJECTS[p]) {
    console.error(`audit gate: unknown project '${p}' (use dashboard, video, or both)`);
    process.exit(2);
  }
}

/**
 * Collect the advisories of one project from `npm audit --json`.
 *
 * @param {string} cwd - The project folder that npm audits.
 * @returns {Array<{name: string, severity: string, id: string, title: string}>} The advisories.
 */
function collectAdvisories(cwd) {
  const run = spawnSync('npm', ['audit', '--json'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.error) {
    throw new Error(`npm audit did not start in ${cwd}: ${run.error.message}`);
  }
  let audit;
  try {
    audit = JSON.parse(run.stdout);
  } catch {
    throw new Error(`npm audit printed no JSON in ${cwd}`);
  }
  if (audit.error) {
    throw new Error(`npm audit failed in ${cwd}: ${audit.error.code || audit.error}`);
  }
  const found = [];
  for (const [entryName, entry] of Object.entries(audit.vulnerabilities || {})) {
    for (const via of entry.via || []) {
      if (typeof via === 'string') continue; // The named package carries the advisory itself.
      found.push({
        name: via.name || entryName,
        severity: via.severity,
        id: ((via.url || '').split('/').pop()) || `source:${via.source}`,
        title: via.title || '',
      });
    }
  }
  const seen = new Set();
  return found.filter((a) => {
    const key = `${a.name}@${a.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

let failures = 0;
let allowed = 0;
for (const p of projects) {
  const all = collectAdvisories(PROJECTS[p]);
  const gated = all.filter((a) => (RANK[a.severity] || 0) >= RANK[min]);
  console.log(`${p}: ${gated.length} advisories at ${min} or above (${all.length} advisory hits total)`);
  for (const a of gated) {
    const reason = ALLOWLIST[a.id] || ALLOWLIST[`pkg:${a.name}`];
    if (reason) {
      allowed += 1;
      console.log(`  ALLOWED ${a.name} ${a.id} (${a.severity}) - ${reason}`);
    } else {
      failures += 1;
      console.log(`  FAIL ${a.name} ${a.id} (${a.severity}) - ${a.title}`);
    }
  }
}

if (failures > 0) {
  console.error(`audit gate: FAIL, ${failures} advisories without an allowlist reason`);
  process.exit(1);
}
console.log(`audit gate: pass (${allowed} allowed with reasons)`);
