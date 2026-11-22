import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const dashboard = path.resolve('dashboard');
const require = createRequire(path.join(dashboard, 'package.json'));
const { ESLint } = require('eslint');
process.chdir(dashboard);
const eslint = new ESLint();
const directories = ['app', 'lib', 'components', '__tests__'];
const results = await eslint.lintFiles(directories);
for (const directory of directories) {
  const count = results.filter(result => path.relative(dashboard, result.filePath).startsWith(`${directory}/`)).length;
  assert.ok(count > 0, `${directory} must contain linted files.`);
  console.log(`${directory}: ${count} existing files linted`);
}
assert.equal(results.reduce((sum, result) => sum + result.errorCount, 0), 0);
console.log(`existing errors=0 warnings=${results.reduce((sum, result) => sum + result.warningCount, 0)}`);
const temporaryFiles = [];
const temporaryFolder = fs.mkdtempSync(path.join(dashboard, 'measure-adversarial-'));
try {
  for (const directory of directories) {
    const folder = path.join(temporaryFolder, directory);
    fs.mkdirSync(folder);
    const file = path.join(folder, 'probe.ts');
    temporaryFiles.push(file);
    fs.writeFileSync(file, 'export type MeasureAdversarialProbe = {};\n', { flag: 'wx' });
    assert.equal(await eslint.isPathIgnored(file), false);
    const [result] = await eslint.lintFiles([file]);
    assert.ok(result.messages.some(message => message.ruleId === '@typescript-eslint/no-empty-object-type' && message.severity === 2));
    assert.ok(result.errorCount >= 1);
    console.log(`${directory}: known-bad temporary file rejected by @typescript-eslint/no-empty-object-type`);
  }
  const cli = spawnSync('npm', ['run', 'lint', '--', '--format', 'json'], {
    cwd: dashboard, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.ifError(cli.error);
  assert.equal(cli.status, 1, cli.stderr);
  const start = cli.stdout.indexOf('[{');
  assert.ok(start >= 0);
  const cliResults = JSON.parse(cli.stdout.slice(start));
  for (const file of temporaryFiles) {
    const result = cliResults.find(item => item.filePath === file);
    assert.ok(result?.messages.some(message => message.ruleId === '@typescript-eslint/no-empty-object-type' && message.severity === 2));
  }
  console.log('npm run lint: exit 1; the real command rejected all four temporary files');
} finally {
  fs.rmSync(temporaryFolder, { recursive: true, force: true });
}
console.log('temporary folder removed; the four source folders were not changed');
