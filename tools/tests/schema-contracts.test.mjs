import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

import {
  loadSchema,
  validateLayout,
  validateRecordContract,
} from '../lib/vault.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const schema = loadSchema(root);
const coverage = YAML.parse(fs.readFileSync(path.join(root, 'tools/tests/fixtures/contract-coverage.yaml'), 'utf8'));

function value(field) {
  if (['tags'].includes(field)) return ['topic/fixture'];
  if (field === 'sources') return [{ id: 'SRC-0001', role: 'primary' }];
  if (field === 'relationships') return [{ type: 'related', target: 'Fixture Target' }];
  if (field === 'creators') return [{ name: 'Fixture Creator', role: 'author' }];
  if (['derived_from', 'supersedes'].includes(field)) return ['[[Fixture Target]]'];
  return field === 'reviewed_on' ? '2099-01-01' : `fixture-${field}`;
}

function pathFor(type, contract) {
  if (contract.allowed_exact_paths) return contract.allowed_exact_paths[0];
  if (contract.allowed_prefixes) return `${contract.allowed_prefixes[0]}Fixture ${type}.md`;
  if (contract.allowed_domains) return `${schema.domains[contract.allowed_domains[0]].root}Fixture ${type}.md`;
  return `Fixture ${type}.md`;
}

function recordFor(type, contract) {
  const data = {};
  for (const field of contract.required || []) data[field] = field === 'type' ? type : value(field);
  if (contract.allowed_statuses) data.status = contract.allowed_statuses[0];
  if (contract.allowed_domains) data.domain = contract.allowed_domains[0];
  const rel = pathFor(type, contract);
  const pathContract = contract.path_contracts?.[rel];
  for (const field of pathContract?.required || []) data[field] = value(field);
  const requiredHeadings = [...(contract.required_headings || []), ...(pathContract?.required_headings || [])];
  const body = `# Fixture\n\n${requiredHeadings.map((heading) => `## ${heading}\n\nFixture.`).join('\n\n')}\n`;
  return {
    rel, data, body, type, title: String(data.title || 'Fixture'), domain: String(data.domain || ''),
    lang: String(data.lang || data.note_lang || ''), status: String(data.status || ''), aliases: [], tags: [],
  };
}

test('fixture registry covers every canonical page type and layout variant', () => {
  assert.deepEqual([...coverage.page_types].sort(), Object.keys(schema.page_types).sort());
  assert.deepEqual([...coverage.layout_variants].sort(), Object.keys(schema.layout_variants).sort());
});

test('every page type declares required, optional, and nonempty metadata and accepts its structural fixture', () => {
  for (const type of coverage.page_types) {
    const contract = schema.page_types[type];
    assert.ok(Array.isArray(contract.required), `${type} required`);
    assert.ok(Array.isArray(contract.optional), `${type} optional`);
    assert.ok(Array.isArray(contract.nonempty), `${type} nonempty`);
    assert.deepEqual(validateRecordContract(recordFor(type, contract), schema), [], type);
  }
});

test('every declared layout variant has a passing language-specific fixture', () => {
  for (const layoutName of coverage.layout_variants) {
    const layout = schema.layout_variants[layoutName];
    const match = Object.entries(schema.page_types).find(([, contract]) => contract.layouts?.includes(layoutName));
    assert.ok(match, `${layoutName} is referenced by a page type`);
    const [type] = match;
    const h2 = layout.exact_h2
      || layout.required_headings
      || (layout.required_headings_any ? [layout.required_headings_any[0]] : null)
      || layout.required_concepts.map((concept) => schema.heading_concepts[concept][0]);
    const record = {
      rel: `Fixture ${layoutName}.md`, type, lang: layout.languages[0],
      body: `# Fixture\n\n${h2.map((heading) => `## ${heading}\n\nFixture.`).join('\n\n')}\n`,
    };
    assert.deepEqual(validateLayout(record, schema), [], layoutName);
  }
});
