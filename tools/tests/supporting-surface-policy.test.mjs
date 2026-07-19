import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  directedReachability,
  loadVault,
  recordEdges,
  recordsInScope,
  typeSet,
  validateRecordContract,
} from '../lib/vault.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const vault = loadVault(root);

function scopePaths(name) {
  return new Set(recordsInScope(vault, name).map((record) => record.rel));
}

test('supporting page classes bind to the supporting lifecycle and satisfy their contracts', () => {
  const supportingStates = new Set(vault.schema.lifecycle.supporting.states);
  const supportingClasses = new Set([
    'navigation',
    'generated-navigation',
    'governance',
    'generated-governance',
  ]);
  const supportingTypes = Object.entries(vault.schema.page_types)
    .filter(([, contract]) => supportingClasses.has(contract.class));

  for (const [type, contract] of supportingTypes) {
    assert.ok(contract.allowed_statuses?.length, `${type} must declare allowed_statuses`);
    for (const status of contract.allowed_statuses) {
      assert.ok(supportingStates.has(status), `${type} uses non-supporting status ${status}`);
    }
  }

  const supportingRecords = vault.records
    .filter((record) => supportingClasses.has(vault.schema.page_types[record.type]?.class));
  const errors = supportingRecords.flatMap((record) => validateRecordContract(record, vault.schema));
  assert.deepEqual(errors, []);

  for (const record of supportingRecords) {
    if (record.status === 'generated') {
      assert.match(String(record.data.generated_on || ''), /^\d{4}-\d{2}-\d{2}$/, `${record.rel} generated_on`);
    }
    if (record.status === 'historical') {
      assert.match(String(record.data.snapshot_on || ''), /^\d{4}-\d{2}-\d{2}$/, `${record.rel} snapshot_on`);
    }
  }
});

test('supporting surfaces participate only in their declared operational scopes', () => {
  const audit = scopePaths('audit');
  const reader = scopePaths('reader');
  const curated = scopePaths('curated_reader');
  const search = scopePaths('knowledge_search');
  const graph = scopePaths('default_graph');
  const trace = scopePaths('source_traceability_graph');

  assert.ok(!audit.has('README.md'));
  assert.ok(!vault.records.some((record) => record.rel.startsWith('tools/tests/fixtures/')));

  for (const home of ['Home.md', 'Home-ZH.md']) {
    assert.ok(audit.has(home));
    assert.ok(reader.has(home));
    assert.ok(curated.has(home));
    assert.ok(search.has(home));
    assert.ok(graph.has(home));
    assert.ok(!trace.has(home));
  }

  for (const governance of ['Vault Conventions.md', '_meta/Editorial Governance.md', '_meta/Process-Inbox.md']) {
    assert.ok(audit.has(governance));
    assert.ok(!reader.has(governance));
    assert.ok(!search.has(governance));
    assert.ok(!graph.has(governance));
    assert.ok(!trace.has(governance));
  }

  const template = '00-Templates/Strategy-Template.md';
  assert.ok(audit.has(template));
  assert.ok(!reader.has(template));
  assert.ok(!search.has(template));
  assert.ok(!graph.has(template));
  assert.ok(!trace.has(template));

  const sourceIndex = '06-Source-Library/Source Library Index.md';
  assert.ok(audit.has(sourceIndex));
  assert.ok(!reader.has(sourceIndex));
  assert.ok(!search.has(sourceIndex));
  assert.ok(!graph.has(sourceIndex));
  assert.ok(trace.has(sourceIndex));

  for (const generated of ['_meta/Tags.md', '_meta/Topic-Index.md', '_meta/Editorial Dashboard.md']) {
    assert.ok(audit.has(generated));
    assert.ok(!reader.has(generated));
    assert.ok(!curated.has(generated));
    assert.ok(!search.has(generated));
    assert.ok(!graph.has(generated));
    assert.ok(!trace.has(generated));
  }
});

test('Reports follow one reader, search, and graph policy', () => {
  const audit = scopePaths('audit');
  const reader = scopePaths('reader');
  const curated = scopePaths('curated_reader');
  const search = scopePaths('knowledge_search');
  const graph = scopePaths('default_graph');
  const trace = scopePaths('source_traceability_graph');
  const reports = vault.records.filter((record) => record.type === 'report');

  assert.ok(reports.length > 0);
  for (const report of reports) {
    assert.ok(audit.has(report.rel));
    assert.ok(reader.has(report.rel));
    assert.ok(curated.has(report.rel));
    assert.ok(search.has(report.rel));
    assert.ok(graph.has(report.rel));
    assert.ok(trace.has(report.rel));
  }

  const reportIndex = 'Reports/Reports Index.md';
  assert.ok(audit.has(reportIndex));
  assert.ok(reader.has(reportIndex));
  assert.ok(!curated.has(reportIndex), 'generated report index cannot receive curated-reader credit');
  assert.ok(search.has(reportIndex));
  assert.ok(graph.has(reportIndex));
  assert.ok(trace.has(reportIndex));
});

test('generated outputs cannot substitute for curated reader navigation', () => {
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const activeKnowledge = new Set(vault.schema.lifecycle.knowledge.active_states);
  const activeReports = new Set(vault.schema.lifecycle.report.active_states);
  const traversal = recordsInScope(vault, 'curated_reader').filter((record) => {
    if (knowledgeTypes.has(record.type)) return activeKnowledge.has(record.status);
    if (record.type === 'report') return activeReports.has(record.status);
    return true;
  });
  const edges = recordEdges(vault);

  for (const home of vault.records.filter((record) => record.type === 'vault-home')) {
    const reachable = directedReachability(home.rel, traversal, edges, {
      excludedFrom: vault.generatedArtifacts,
    });
    const missing = traversal
      .filter((record) => !reachable.visited.has(record.rel))
      .map((record) => record.rel);
    assert.deepEqual(missing, [], `${home.rel} depends on generated outgoing navigation`);
  }
});
