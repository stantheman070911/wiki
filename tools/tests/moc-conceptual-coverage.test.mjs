import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MOC_SPECS, mocCoverage, validateMocCoverage } from '../lib/moc-coverage.mjs';
import { loadVault } from '../lib/vault.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const vault = loadVault(root);

assert.deepEqual(vault.parseErrors, [], 'Vault frontmatter must parse before MOC coverage can be checked');

for (const spec of MOC_SPECS) {
  test(`${path.posix.basename(spec.rel, '.md')} has complete static conceptual-group coverage`, (t) => {
    const coverage = mocCoverage(vault, spec);
    assert.deepEqual(coverage.errors, []);
    assert.equal(coverage.groups.length, spec.groups);
    assert.deepEqual(coverage.missing, []);
    t.diagnostic(`${coverage.linked.size}/${coverage.pages.length} active folder knowledge pages covered`);
  });
}

test('the exact nine-MOC contract covers every qualifying page', (t) => {
  const result = validateMocCoverage(vault);
  assert.equal(result.maps, 9);
  assert.deepEqual(result.errors, []);
  assert.equal(result.covered, result.pages);
  t.diagnostic(`${result.covered}/${result.pages} qualifying pages covered across nine MOCs`);
});
