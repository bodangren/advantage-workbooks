#!/usr/bin/env node
/**
 * Audit gate of Measure track `deps_refresh_20261121`.
 *
 * Runs `npm audit --json` in a project folder and exits non-zero while any
 * advisory at or above the minimum severity is not on the allowlist with a
 * complete entry. The gate is the Red test of Phases D1 to D3: it fails on
 * the before state and passes after Green.
 *
 * Usage:
 *   node measure/tracks/deps_refresh_20261121/audit-gate.mjs [--min <severity>] <project> [<project>...]
 *   node measure/tracks/deps_refresh_20261121/audit-gate.mjs --self-test
 *
 * Projects: `dashboard`, `video`, or `both`. The default minimum severity is
 * `high`, so critical and high advisories gate. Phase D3 uses `--min moderate`.
 *
 * Allowlist rules (spec-review F3):
 * - Each `ALLOWLIST` entry holds all five fields: advisory id, package,
 *   severity, reason, and re-check date (YYYY-MM-DD).
 * - The gate fails on an entry that lacks a field or holds a past re-check
 *   date. A reason with no re-check date never expires, so it cannot pass.
 * - The gate fails on any critical advisory, allowlisted or not. A critical
 *   advisory may not stay.
 * - A high advisory (or any gated advisory below critical) passes only with
 *   a complete entry whose severity matches and whose re-check date is today
 *   or later.
 *
 * The gate writes the audit JSON it read to a dated snapshot file in
 * `measure/runs/deps_refresh_20261121/`, so a result is reproducible.
 *
 * `--self-test` checks the allowlist rules against fixed fake audit data
 * with no network, so the rules are tested without npm.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RANK = { info: 0, unknown: 0, low: 1, moderate: 2, high: 3, critical: 4 };

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const RUNS_DIR = path.join(root, 'measure', 'runs', 'deps_refresh_20261121');
const PROJECTS = {
  dashboard: path.join(root, 'dashboard'),
  video: path.join(root, 'video', 'storytime-song'),
};

// Advisory id (or `pkg:<name>`) -> full entry. Add an entry only with all
// five fields: id, package, severity, reason, recheck (YYYY-MM-DD).
// Example:
//   'GHSA-xxxx-yyyy-zzzz': {
//     id: 'GHSA-xxxx-yyyy-zzzz',
//     package: 'some-pkg',
//     severity: 'high',
//     reason: 'no upstream fix',
//     recheck: '2026-12-15',
//   },
const ALLOWLIST = {
  // sharp 0.35.5 moves the module entry point and the shipped JPEG provenance.
  // Three print tests pin sharp 0.34.5. They are test code and stay unchanged.
  // Re-check on 2026-12-15 after those tests move to the new sharp contract.
  'GHSA-f88m-g3jw-g9cj': {
    id: 'GHSA-f88m-g3jw-g9cj',
    package: 'sharp',
    severity: 'high',
    reason: 'sharp 0.35.5 breaks three pinned print tests; deferred to the sharp 0.35 follow-up',
    recheck: '2026-12-15',
  },
  'GHSA-rgj7-g3m4-5g8c': {
    id: 'GHSA-rgj7-g3m4-5g8c',
    package: 'sharp',
    severity: 'high',
    reason: 'sharp 0.35.5 breaks three pinned print tests; deferred to the sharp 0.35 follow-up',
    recheck: '2026-12-15',
  },
  'GHSA-wq5f-xc86-pv6w': {
    id: 'GHSA-wq5f-xc86-pv6w',
    package: 'sharp',
    severity: 'high',
    reason: 'sharp 0.35.5 breaks three pinned print tests; deferred to the sharp 0.35 follow-up',
    recheck: '2026-12-15',
  },
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Read the UTC date of today as `YYYY-MM-DD`.
 *
 * @returns {string} Today in UTC.
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check one allowlist entry for all five fields and a valid re-check date.
 *
 * @param {string} key - The allowlist key (advisory id or `pkg:<name>`).
 * @param {unknown} entry - The entry value to check.
 * @param {string} today - Today as `YYYY-MM-DD`.
 * @returns {string[]} Error lines, empty when the entry is complete.
 */
function checkEntry(key, entry, today) {
  const errors = [];
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return [`ALLOWLIST entry '${key}' is not an object with all five fields`];
  }
  const e = /** @type {Record<string, unknown>} */ (entry);
  for (const field of ['id', 'package', 'severity', 'reason', 'recheck']) {
    if (typeof e[field] !== 'string' || e[field].trim() === '') {
      errors.push(`ALLOWLIST entry '${key}' lacks field '${field}'`);
    }
  }
  if (errors.length > 0) return errors;
  if (!RANK[e.severity]) {
    errors.push(`ALLOWLIST entry '${key}' holds unknown severity '${e.severity}'`);
  }
  const recheck = /** @type {string} */ (e.recheck);
  if (!DATE_RE.test(recheck)) {
    errors.push(`ALLOWLIST entry '${key}' holds a re-check date without YYYY-MM-DD form`);
  } else if (recheck < today) {
    errors.push(`ALLOWLIST entry '${key}' holds a past re-check date '${recheck}'`);
  }
  const wantKey = key.startsWith('pkg:') ? `pkg:${e.package}` : e.id;
  if (key !== wantKey) {
    errors.push(`ALLOWLIST entry '${key}' does not match its id or package`);
  }
  return errors;
}

/**
 * Check every allowlist entry.
 *
 * @param {Record<string, unknown>} allowlist - The allowlist to check.
 * @param {string} today - Today as `YYYY-MM-DD`.
 * @returns {string[]} Error lines, empty when every entry is complete.
 */
function checkAllowlist(allowlist, today) {
  const errors = [];
  for (const [key, entry] of Object.entries(allowlist)) {
    errors.push(...checkEntry(key, entry, today));
  }
  return errors;
}

/**
 * Find the complete entry that covers one advisory.
 *
 * @param {{name: string, severity: string, id: string}} advisory - One advisory.
 * @param {Record<string, unknown>} allowlist - The allowlist to read.
 * @returns {Record<string, string> | null} The covering entry or null.
 */
function coveringEntry(advisory, allowlist) {
  const raw = allowlist[advisory.id] || allowlist[`pkg:${advisory.name}`];
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return /** @type {Record<string, string>} */ (raw);
}

/**
 * Decide the gate result for fixed advisory data. Pure: no npm, no files.
 *
 * @param {Array<{name: string, severity: string, id: string, title: string}>} advisories - The advisories.
 * @param {string} min - The minimum gated severity.
 * @param {Record<string, unknown>} allowlist - The allowlist to read.
 * @param {string} today - Today as `YYYY-MM-DD`.
 * @returns {{failures: string[], allowed: string[], entryErrors: string[]}} The decision.
 */
function decide(advisories, min, allowlist, today) {
  const entryErrors = checkAllowlist(allowlist, today);
  const failures = [...entryErrors];
  const allowed = [];
  const gated = advisories.filter((a) => (RANK[a.severity] || 0) >= RANK[min]);
  for (const a of gated) {
    if (a.severity === 'critical') {
      const entry = coveringEntry(a, allowlist);
      failures.push(
        entry
          ? `FAIL ${a.name} ${a.id} (${a.severity}) - a critical advisory may not stay, allowlisted or not`
          : `FAIL ${a.name} ${a.id} (${a.severity}) - ${a.title}`,
      );
      continue;
    }
    const entry = coveringEntry(a, allowlist);
    if (
      entry &&
      checkEntry(allowlist[a.id] ? a.id : `pkg:${a.name}`, entry, today).length === 0 &&
      entry.severity === a.severity
    ) {
      allowed.push(`ALLOWED ${a.name} ${a.id} (${a.severity}) - ${entry.reason}`);
    } else {
      failures.push(`FAIL ${a.name} ${a.id} (${a.severity}) - ${a.title}`);
    }
  }
  return { failures, allowed, entryErrors };
}

/**
 * Run the self-test: fixed fake audit data, no network.
 *
 * @returns {number} 0 when every rule check holds, else 1.
 */
function selfTest() {
  const today = todayUTC();
  const past = '2000-01-01';
  const future = '2099-12-31';
  let failed = 0;
  const check = (name, cond) => {
    if (cond) {
      console.log(`self-test PASS: ${name}`);
    } else {
      failed += 1;
      console.log(`self-test FAIL: ${name}`);
    }
  };

  const crit = { name: 'next', severity: 'critical', id: 'GHSA-crit-1', title: 'critical hole' };
  const high = { name: 'ws', severity: 'high', id: 'GHSA-high-1', title: 'high hole' };
  const full = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'no upstream fix', recheck: future };

  // A critical advisory fails with no entry.
  let r = decide([crit], 'high', {}, today);
  check('critical without an entry fails', r.failures.length === 1);

  // A critical advisory fails even with a complete entry.
  r = decide([crit], 'high', { 'GHSA-crit-1': { id: 'GHSA-crit-1', package: 'next', severity: 'critical', reason: 'no upstream fix', recheck: future } }, today);
  check('critical with a complete entry still fails', r.failures.length === 1);

  // A high advisory passes with a complete entry.
  r = decide([high], 'high', { 'GHSA-high-1': full }, today);
  check('high with a complete entry passes', r.failures.length === 0 && r.allowed.length === 1);

  // A high advisory fails when the entry lacks a field.
  const noReason = { id: 'GHSA-high-1', package: 'ws', severity: 'high', recheck: future };
  r = decide([high], 'high', { 'GHSA-high-1': noReason }, today);
  check('high with an entry without a reason fails', r.failures.length >= 1);

  // A high advisory fails when the re-check date is past.
  const pastEntry = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'no upstream fix', recheck: past };
  r = decide([high], 'high', { 'GHSA-high-1': pastEntry }, today);
  check('high with a past re-check date fails', r.failures.length >= 1);

  // A high advisory fails when the re-check date lacks the YYYY-MM-DD form.
  const badDate = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'no upstream fix', recheck: '15 Dec 2026' };
  r = decide([high], 'high', { 'GHSA-high-1': badDate }, today);
  check('high with a bad re-check date form fails', r.failures.length >= 1);

  // A high advisory fails when the entry severity does not match.
  const wrongSev = { id: 'GHSA-high-1', package: 'ws', severity: 'moderate', reason: 'no upstream fix', recheck: future };
  r = decide([high], 'high', { 'GHSA-high-1': wrongSev }, today);
  check('high with a severity-mismatched entry fails', r.failures.length >= 1);

  // A package-keyed entry covers the advisory of that package.
  const pkgEntry = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'breaking major deferred', recheck: future };
  r = decide([high], 'high', { 'pkg:ws': pkgEntry }, today);
  check('high with a complete pkg: entry passes', r.failures.length === 0 && r.allowed.length === 1);

  // A moderate advisory below the minimum does not gate.
  const mod = { name: 'tar-fs', severity: 'moderate', id: 'GHSA-mod-1', title: 'moderate hole' };
  r = decide([mod], 'high', {}, today);
  check('moderate below the high minimum passes', r.failures.length === 0);

  // A moderate advisory gates at --min moderate without an entry.
  r = decide([mod], 'moderate', {}, today);
  check('moderate at the moderate minimum fails without an entry', r.failures.length === 1);

  if (failed > 0) {
    console.log(`self-test: FAIL, ${failed} rule checks failed`);
    return 1;
  }
  console.log('self-test: pass (10 rule checks)');
  return 0;
}

const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--self-test')) {
  process.exit(selfTest());
}

const args = rawArgs;
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
 * Run `npm audit --json` in one project folder and keep the raw JSON.
 *
 * @param {string} cwd - The project folder that npm audits.
 * @returns {{raw: string, advisories: Array<{name: string, severity: string, id: string, title: string}>}} The raw JSON and the advisories.
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
  const raw = run.stdout || '';
  let audit;
  try {
    audit = JSON.parse(raw);
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
  const advisories = found.filter((a) => {
    const key = `${a.name}@${a.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { raw, advisories };
}

const today = todayUTC();
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
fs.mkdirSync(RUNS_DIR, { recursive: true });

let failures = 0;
let allowed = 0;
for (const p of projects) {
  const { raw, advisories } = collectAdvisories(PROJECTS[p]);
  const snapshot = path.join(RUNS_DIR, `audit-snapshot-${p}-${stamp}.json`);
  fs.writeFileSync(snapshot, raw);
  console.log(`${p}: snapshot ${snapshot}`);
  const decision = decide(advisories, min, ALLOWLIST, today);
  const gatedCount = advisories.filter((a) => (RANK[a.severity] || 0) >= RANK[min]).length;
  console.log(`${p}: ${gatedCount} advisories at ${min} or above (${advisories.length} advisory hits total)`);
  for (const line of decision.allowed) {
    allowed += 1;
    console.log(`  ${line}`);
  }
  for (const line of decision.failures) {
    failures += 1;
    console.log(`  ${line}`);
  }
}

if (failures > 0) {
  console.error(`audit gate: FAIL, ${failures} advisories without a complete allowlist entry`);
  process.exit(1);
}
console.log(`audit gate: pass (${allowed} allowed with complete entries)`);
