import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const cache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache/opencode');
const source = fs.readFileSync(path.join(here, 'audit-gate.mjs'), 'utf8');
const allowlistPattern = /const ALLOWLIST = \{[\s\S]*?\n\};/;
assert.equal([...source.matchAll(/const ALLOWLIST = \{/g)].length, 1);

const id = 'GHSA-adversarial-new-high';
const entry = {
  id, package: 'probe', severity: 'high',
  reason: 'No upstream fix exists.', recheck: '2099-12-31',
};

function audit(severity = 'high', title = 'Do not ignore this banned-term probe.') {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      probe: {
        name: 'probe', severity, via: [{
          name: 'probe', severity, url: `https://example.invalid/${id}`, title,
        }],
      },
    },
  };
}

function runGate(document, allowlist = {}, args = ['both', '--min', 'moderate']) {
  const temp = fs.mkdtempSync(path.join(cache, 'deps-d3-gate-'));
  try {
    const track = path.join(temp, 'measure/tracks/deps_refresh_20261121');
    for (const folder of [track, path.join(temp, 'bin'), path.join(temp, 'dashboard'), path.join(temp, 'video/storytime-song')]) {
      fs.mkdirSync(folder, { recursive: true });
    }
    const gate = path.join(track, 'audit-gate.mjs');
    fs.writeFileSync(gate, source.replace(allowlistPattern, `const ALLOWLIST = ${JSON.stringify(allowlist)};`));
    const fixture = path.join(temp, 'audit.json');
    fs.writeFileSync(fixture, typeof document === 'string' ? document : JSON.stringify(document));
    const invocations = path.join(temp, 'invocations.jsonl');
    fs.writeFileSync(path.join(temp, 'bin/npm'), `#!${process.execPath}
const fs = require('node:fs');
fs.appendFileSync(process.env.PROBE_INVOCATIONS, JSON.stringify({argv:process.argv.slice(2),cwd:process.cwd()})+'\\n');
process.stdout.write(fs.readFileSync(process.env.PROBE_AUDIT));
process.exit(Number(process.env.PROBE_STATUS || 1));
`, { mode: 0o700 });
    const result = spawnSync(process.execPath, [gate, ...args], {
      encoding: 'utf8', timeout: 30000,
      env: {
        ...process.env, PATH: `${path.join(temp, 'bin')}:${process.env.PATH}`,
        PROBE_AUDIT: fixture, PROBE_INVOCATIONS: invocations,
      },
    });
    assert.ifError(result.error);
    const calls = fs.readFileSync(invocations, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(calls.length, 2, 'The real gate must invoke npm for both projects.');
    assert.deepEqual(calls.map(c => c.argv), [['audit', '--json'], ['audit', '--json']]);
    assert.deepEqual(calls.map(c => path.relative(temp, c.cwd)), ['dashboard', 'video/storytime-song']);
    const snapshots = fs.readdirSync(path.join(temp, 'measure/runs/deps_refresh_20261121'));
    assert.equal(snapshots.length, 2);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

test('the real CLI rejects a new high advisory with an empty allowlist', () => {
  const result = runGate(audit());
  assert.equal(result.status, 1);
  assert.match(result.output, new RegExp(`FAIL probe ${id} \\(high\\)`));
  assert.match(result.output, /audit gate: FAIL, 2 advisories/);
});

test('filter words in the advisory title preserve a real hit', () => {
  const result = runGate(audit('high', 'Never hide this banned-term hit; do not filter it.'));
  assert.equal(result.status, 1);
  assert.match(result.output, /FAIL probe .*Never hide this banned-term hit; do not filter it\./);
});

test('the moderate threshold rejects a moderate advisory', () => {
  assert.equal(runGate(audit('moderate')).status, 1);
});

test('a complete high entry passes but cannot cover another advisory', () => {
  const allowlist = { [id]: entry };
  assert.equal(runGate(audit(), allowlist).status, 0);
  const other = audit();
  other.vulnerabilities.probe.via[0].url += '-other';
  assert.equal(runGate(other, allowlist).status, 1);
});

test('a stale entry fails even when the audit has no advisories', () => {
  const result = runGate({ vulnerabilities: {} }, { [id]: { ...entry, recheck: '2000-01-01' } });
  assert.equal(result.status, 1);
  assert.match(result.output, /past re-check date/);
});

test('each missing field fails even when the audit has no advisories', () => {
  for (const field of Object.keys(entry)) {
    const malformed = { ...entry };
    delete malformed[field];
    const result = runGate({ vulnerabilities: {} }, { [id]: malformed });
    assert.equal(result.status, 1, field);
    assert.match(result.output, new RegExp(`lacks field '${field}'`));
  }
});

test('a future impossible calendar date fails without a live advisory', () => {
  const result = runGate({ vulnerabilities: {} }, { [id]: { ...entry, recheck: '2099-02-30' } });
  assert.equal(result.status, 1);
  assert.match(result.output, /not a real calendar date/);
});

test('a critical advisory fails despite a complete entry', () => {
  const result = runGate(audit('critical'), { [id]: { ...entry, severity: 'critical' } });
  assert.equal(result.status, 1);
  assert.match(result.output, /a critical advisory may not stay/);
});

test('an empty audit passes with the empty allowlist', () => {
  assert.equal(runGate({ auditReportVersion: 2, vulnerabilities: {} }).status, 0);
});

test('dotenv 18 preserves the caller options without loading real credentials', () => {
  const temp = fs.mkdtempSync(path.join(cache, 'deps-d3-dotenv-'));
  try {
    fs.mkdirSync(path.join(temp, 'dashboard'));
    fs.writeFileSync(path.join(temp, 'dashboard/.env.local'), [
      'OPENROUTER_API_KEY=synthetic-file-value',
      'GEMINI_API_KEY=synthetic-fallback',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(temp, '.env'), [
      'GOOGLE_GENERATIVE_AI_API_KEY=synthetic-google',
      'GEMINI_API_KEY=synthetic-gemini',
      '',
    ].join('\n'));
    const module = path.join(root, 'dashboard/node_modules/dotenv/dist/index.cjs');
    const preload = path.join(root, 'dashboard/node_modules/dotenv/dist/config.cjs');
    const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      !key.startsWith('DOTENV') && !['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY'].includes(key)));
    const explicit = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import dotenv from ${JSON.stringify(module)};
      import path from 'node:path';
      assert.equal(typeof dotenv.config, 'function');
      const result = dotenv.config({path:path.join(process.cwd(),'dashboard','.env.local'),quiet:true});
      assert.equal(result.error, undefined);
      assert.equal(process.env.OPENROUTER_API_KEY, 'synthetic-shell-value');
      assert.equal(process.env.GEMINI_API_KEY, 'synthetic-fallback');
    `], { cwd: temp, env: { ...cleanEnv, OPENROUTER_API_KEY: 'synthetic-shell-value' }, encoding: 'utf8' });
    assert.equal(explicit.status, 0, explicit.stderr);
    assert.equal(explicit.stdout, '', 'quiet:true must suppress dotenv output.');
    const implicit = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import ${JSON.stringify(preload)};
      import assert from 'node:assert/strict';
      assert.equal(process.env.GOOGLE_GENERATIVE_AI_API_KEY, 'synthetic-google');
      assert.equal(process.env.GEMINI_API_KEY, 'synthetic-gemini');
    `], { cwd: temp, env: cleanEnv, encoding: 'utf8' });
    assert.equal(implicit.status, 0, implicit.stderr);
    const legacy = spawnSync(process.execPath, ['-r', preload, '-e', `
      require('node:assert/strict').equal(process.env.OPENROUTER_API_KEY, 'synthetic-file-value');
    `], {
      cwd: temp,
      env: { ...cleanEnv, DOTENV_CONFIG_PATH: path.join(temp, 'dashboard/.env.local') },
      encoding: 'utf8',
    });
    assert.equal(legacy.status, 0, legacy.stderr);
    assert.equal(legacy.stdout, '');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('the dashboard ESLint version satisfies every installed required plugin peer', () => {
  const dashboard = path.join(root, 'dashboard');
  const require = createRequire(path.join(dashboard, 'package.json'));
  const semver = require('semver');
  const eslintVersion = require('eslint/package.json').version;
  const lock = JSON.parse(fs.readFileSync(path.join(dashboard, 'package-lock.json'), 'utf8'));
  const failures = [];
  let checked = 0;
  for (const [relative, record] of Object.entries(lock.packages)) {
    if (!relative || !record.peerDependencies?.eslint) continue;
    const metadata = path.join(dashboard, relative, 'package.json');
    if (!fs.existsSync(metadata)) continue;
    const pkg = JSON.parse(fs.readFileSync(metadata, 'utf8'));
    const range = pkg.peerDependencies?.eslint;
    if (!range || pkg.peerDependenciesMeta?.eslint?.optional) continue;
    checked += 1;
    if (!semver.satisfies(eslintVersion, range)) {
      failures.push(`${relative}: ${pkg.name}@${pkg.version} requires eslint ${range}; installed ${eslintVersion}`);
    }
  }
  assert.ok(checked >= 4, 'The check must inspect actual required plugin peers.');
  assert.deepEqual(failures, [], failures.join('\n'));
});
