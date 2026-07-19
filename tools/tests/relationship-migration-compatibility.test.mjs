import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wrapper = path.join(root, 'tools/migrate-relationship-types.mjs');

test('retired relationship migration is a thin delegate to the canonical structured migration', () => {
  const source = fs.readFileSync(wrapper, 'utf8');
  assert.match(source, /migrate-structured-relationships\.mjs/);
  assert.doesNotMatch(source, /function\s+(?:walk|frontmatter|resolve)\s*\(/);
  assert.doesNotMatch(source, /knowledgeTypes|new Set\(\['strategy'/);

  const result = spawnSync(process.execPath, [wrapper], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  assert.match(result.stderr, /DEPRECATED/);
  assert.match(result.stdout, /structured relationships/);
});

test('parent-navigation migration derives folder owners from the canonical schema', () => {
  const migration = path.join(root, 'tools/migrate-parent-navigation.mjs');
  const source = fs.readFileSync(migration, 'utf8');
  assert.match(source, /schema\.navigation_contracts\?\.leaf_inventory_owners/);
  assert.doesNotMatch(source, /mapByFolder\s*=\s*new Map\(\s*\[/);
  assert.doesNotMatch(source, /domainLabels\s*=\s*new Map/);

  const result = spawnSync(process.execPath, [migration], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
  assert.match(result.stdout, /Would update 0 knowledge pages with canonical parent_map metadata/);
});
