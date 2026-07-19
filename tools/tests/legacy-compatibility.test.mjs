import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(script, args = []) {
  return spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

for (const script of ['tools/audit-vault.mjs', 'tools/deep-audit-vault.mjs']) {
  test(`${script} remains a thin, successful compatibility wrapper`, () => {
    const result = run(script);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stderr, /DEPRECATED: .*compatibility wrapper around checkVault/);
    assert.match(result.stdout, /Vault check passed:/);
  });
}

test('retired Chinese heading normalizer delegates read-only validation to the schema', () => {
  const result = run('tools/normalize-zh-heading-architecture.mjs');
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /DEPRECATED: .*read-only compatibility check/);
  assert.match(result.stdout, /Chinese layout compatibility check passed: \d+ pages across \d+ schema-defined variants/);
});

test('retired Chinese heading normalizer rejects its legacy write mode', () => {
  const result = run('tools/normalize-zh-heading-architecture.mjs', ['--write']);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /retired --write migration is disabled/);
  assert.doesNotMatch(result.stdout, /compatibility check passed/);
});
