import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledger = fs.readFileSync(path.join(root, '_meta/Architecture Task Completion - 2026-07-19.md'), 'utf8');

test('the dated architecture closeout marks every task from 1 through 103 done exactly once', () => {
  const rows = [...ledger.matchAll(/^\| (\d+) \| Done(?: — governed branch selected)? \|/gm)].map((match) => Number(match[1]));
  assert.deepEqual(rows, Array.from({ length: 103 }, (_, index) => index + 1));
  assert.match(ledger, /^snapshot_on: "2026-07-19"$/m);
  assert.match(ledger, /^status: "historical"$/m);
});
