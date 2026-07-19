import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderArchitectureReport } from '../generate-architecture-report.mjs';
import { checkVault } from '../check-vault.mjs';
import { loadTaxonomyRegistry } from '../lib/taxonomy-registry.mjs';
import { loadVault } from '../lib/vault.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('architecture report output is independent of every generated artifact body', () => {
  const vault = loadVault(root);
  const target = vault.records.find((record) => !vault.generatedArtifacts.has(record.rel));
  assert.ok(target);

  const date = '2099-01-01';
  const options = {
    date,
    taxonomyRegistry: loadTaxonomyRegistry(root),
    checkResult: checkVault(root, { generated: false, date }),
  };
  const expected = renderArchitectureReport(vault, options);
  const targetLink = target.rel.replace(/\.md$/, '');
  const pollutedVault = {
    ...vault,
    records: vault.records.map((record) => vault.generatedArtifacts.has(record.rel)
      ? {
          ...record,
          body: `${record.body}\n\n[[${targetLink}|Synthetic generated edge]]\n`,
          relationships: [
            ...(record.relationships || []),
            { type: 'related', target: targetLink },
          ],
        }
      : record),
  };

  assert.equal(renderArchitectureReport(pollutedVault, options), expected);
});
