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
 *   a complete entry that names the same package and advisory, whose
 *   severity matches, and whose re-check date is today or later.
 * - A re-check date must be a real calendar date in YYYY-MM-DD form. An
 *   impossible date (for example 2026-02-31) fails validation.
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
 * Check that a value is a plain record (not null, not an array).
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True for a plain record.
 */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check that a string is a real calendar date in YYYY-MM-DD form. The
 * shape check alone accepts impossible dates such as 2026-02-31, so the
 * date must round-trip through the UTC calendar.
 *
 * @param {string} s - The candidate date string.
 * @returns {boolean} True for a real calendar date.
 */
function isCalendarDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

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
  } else if (!isCalendarDate(recheck)) {
    errors.push(`ALLOWLIST entry '${key}' holds a re-check date that is not a real calendar date ('${recheck}')`);
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
 * Find the complete entry that covers one advisory. An entry covers an
 * advisory only when it names both the same advisory id and the same
 * package: entry.id equals the advisory id and entry.package equals the
 * advisory package name. The key type does not relax this rule: the key
 * holds either the advisory id or `pkg:<name>` for the advisory package.
 *
 * @param {{name: string, severity: string, id: string}} advisory - One advisory.
 * @param {Record<string, unknown>} allowlist - The allowlist to read.
 * @returns {{key: string, entry: Record<string, string>} | null} The covering key and entry, or null.
 */
function coveringEntry(advisory, allowlist) {
  const byId = allowlist[advisory.id];
  if (isRecord(byId) && byId.id === advisory.id && byId.package === advisory.name) {
    return { key: advisory.id, entry: /** @type {Record<string, string>} */ (byId) };
  }
  const pkgKey = `pkg:${advisory.name}`;
  const byPkg = allowlist[pkgKey];
  if (isRecord(byPkg) && byPkg.id === advisory.id && byPkg.package === advisory.name) {
    return { key: pkgKey, entry: /** @type {Record<string, string>} */ (byPkg) };
  }
  return null;
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
      const hit = coveringEntry(a, allowlist);
      failures.push(
        hit
          ? `FAIL ${a.name} ${a.id} (${a.severity}) - a critical advisory may not stay, allowlisted or not`
          : `FAIL ${a.name} ${a.id} (${a.severity}) - ${a.title}`,
      );
      continue;
    }
    const hit = coveringEntry(a, allowlist);
    if (
      hit &&
      checkEntry(hit.key, hit.entry, today).length === 0 &&
      hit.entry.severity === a.severity
    ) {
      allowed.push(`ALLOWED ${a.name} ${a.id} (${a.severity}) - ${hit.entry.reason}`);
    } else {
      failures.push(`FAIL ${a.name} ${a.id} (${a.severity}) - ${a.title}`);
    }
  }
  return { failures, allowed, entryErrors };
}

/**
 * Convert one parsed npm audit document into unique advisory records.
 *
 * @param {unknown} audit - The parsed npm audit document.
 * @returns {Array<{name: string, severity: string, id: string, title: string}>} Unique advisory records.
 */
function advisoriesFromAudit(audit) {
  if (!isRecord(audit)) throw new Error('npm audit JSON is not an object');
  if (audit.error) throw new Error(`npm audit failed: ${audit.error.code || audit.error}`);
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

/**
 * Parse npm audit output and extract its advisory records.
 *
 * @param {string} raw - The raw npm audit output.
 * @param {string} cwd - The project folder that npm audited.
 * @returns {Array<{name: string, severity: string, id: string, title: string}>} Unique advisory records.
 */
function parseAuditOutput(raw, cwd) {
  let audit;
  try {
    audit = JSON.parse(raw);
  } catch {
    throw new Error(`npm audit printed no JSON in ${cwd}`);
  }
  try {
    return advisoriesFromAudit(audit);
  } catch (error) {
    throw new Error(`${error.message} in ${cwd}`);
  }
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

  // Severity values are exact npm enum strings.
  const upperSev = { id: 'GHSA-high-1', package: 'ws', severity: 'High', reason: 'no upstream fix', recheck: future };
  r = decide([high], 'high', { 'GHSA-high-1': upperSev }, today);
  check('high with a severity case mismatch fails', r.failures.length >= 1 && r.allowed.length === 0);

  // An empty allowlist never covers a gated advisory.
  r = decide([high], 'high', {}, today);
  check('high with an empty allowlist fails', r.failures.length === 1 && r.allowed.length === 0);

  // The re-check date remains valid on the exact current UTC date.
  const todayEntry = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'no upstream fix', recheck: today };
  r = decide([high], 'high', { 'GHSA-high-1': todayEntry }, today);
  check('high with a re-check date equal to today passes', r.failures.length === 0 && r.allowed.length === 1);

  // npm audit lists dependency-name strings along a transitive chain and the
  // final package entry carries the advisory object.
  const transitive = advisoriesFromAudit({
    vulnerabilities: {
      app: { via: ['middle'] },
      middle: { via: ['leaf'] },
      leaf: { via: [{ name: 'leaf', severity: 'high', url: 'https://example.invalid/GHSA-leaf-1', title: 'transitive hole' }] },
    },
  });
  check('transitive via string chain keeps the leaf advisory', transitive.length === 1 && transitive[0].id === 'GHSA-leaf-1');

  // Invalid npm output must fail instead of becoming an empty audit.
  let malformedFailed = false;
  try {
    parseAuditOutput('{', '/tmp/npm-audit-fixture');
  } catch (error) {
    malformedFailed = error.message.includes('npm audit printed no JSON');
  }
  check('malformed npm audit JSON fails closed', malformedFailed);

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

  // An id-keyed entry that names another package does not cover the advisory.
  const wrongPkg = { id: 'GHSA-high-1', package: 'other-pkg', severity: 'high', reason: 'no upstream fix', recheck: future };
  r = decide([high], 'high', { 'GHSA-high-1': wrongPkg }, today);
  check('high with an id-keyed entry for another package fails', r.failures.length >= 1 && r.allowed.length === 0);

  // A pkg-keyed entry for another package does not cover the advisory.
  const otherPkgEntry = { id: 'GHSA-high-1', package: 'tar-fs', severity: 'high', reason: 'no upstream fix', recheck: future };
  r = decide([high], 'high', { 'pkg:tar-fs': otherPkgEntry }, today);
  check('high with a pkg-keyed entry for another package fails', r.failures.length >= 1 && r.allowed.length === 0);

  // A pkg-keyed entry that names another advisory id of the same package
  // does not cover the advisory.
  const sharpY = { name: 'sharp', severity: 'high', id: 'GHSA-yyyy-yyyy-yyyy', title: 'other sharp hole' };
  const pkgWrongId = { id: 'GHSA-high-1', package: 'sharp', severity: 'high', reason: 'no upstream fix', recheck: future };
  r = decide([sharpY], 'high', { 'pkg:sharp': pkgWrongId }, today);
  check('high with a pkg-keyed entry for another advisory id fails', r.failures.length >= 1 && r.allowed.length === 0);

  // A future impossible date fails the calendar check, not the past-date rule.
  const impossibleDate = { id: 'GHSA-high-1', package: 'ws', severity: 'high', reason: 'no upstream fix', recheck: '2027-02-30' };
  const dateErrors = checkEntry('GHSA-high-1', impossibleDate, today);
  r = decide([high], 'high', { 'GHSA-high-1': impossibleDate }, today);
  check('high with a future impossible re-check date fails the calendar check',
    r.failures.length >= 1 && r.allowed.length === 0 &&
    dateErrors.some((e) => e.includes('not a real calendar date')));

  if (failed > 0) {
    console.log(`self-test: FAIL, ${failed} rule checks failed`);
    return 1;
  }
    console.log('self-test: pass (19 rule checks)');
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
  const advisories = parseAuditOutput(raw, cwd);
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
