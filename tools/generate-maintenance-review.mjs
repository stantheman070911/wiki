#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { calculateReviewSchedule } from './lib/navigation.mjs';
import { validateMocCoverage } from './lib/moc-coverage.mjs';
import {
  categorizeInbound,
  generatedOn,
  loadVault,
  recordEdges,
  stableGeneratedText,
  typeSet,
} from './lib/vault.mjs';

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function table(headers, rows) {
  if (!rows.length) return '_None._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
    '',
  ].join('\n');
}

function creatorNames(record) {
  return Array.isArray(record.data.creators)
    ? record.data.creators.map((creator) => creator?.name).filter(Boolean).join('; ')
    : '';
}

export function renderMaintenanceReview(vault, date = generatedOn()) {
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const activeStates = new Set(vault.schema.lifecycle.knowledge.active_states);
  const active = vault.records.filter((record) => knowledgeTypes.has(record.type) && activeStates.has(record.status));
  const schedule = calculateReviewSchedule(vault, date);
  const dueRecurring = schedule.recurringRows.filter((row) => row.reviewDue <= date);
  const folderCounts = new Map();
  for (const record of active) {
    const folder = path.posix.dirname(record.rel);
    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
  }
  const threshold = Number(vault.schema.navigation_contracts.map_threshold);
  const maps = new Set(vault.records.filter((record) => record.type === 'subdomain-index').map((record) => path.posix.dirname(record.rel)));
  const capacityFolders = [...folderCounts].filter(([, count]) => count >= threshold).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const moc = validateMocCoverage(vault);
  const sources = vault.records.filter((record) => ['source', 'source-manifest'].includes(record.type));
  const sourceBytes = sources.reduce((sum, record) => sum + fs.statSync(record.file).size, 0);
  const sourceReviewBytes = Number(vault.schema.filesystem.limits.source_review_bytes);
  const largeSources = sources.filter((record) => fs.statSync(record.file).size > sourceReviewBytes);
  const unprocessed = sources.filter((record) => record.data.processing_status === 'unprocessed');
  const relationshipCounts = new Map();
  for (const record of active) for (const relationship of record.relationships) relationshipCounts.set(relationship.type, (relationshipCounts.get(relationship.type) || 0) + 1);
  const edges = recordEdges(vault);
  const inbound = categorizeInbound(active, edges, vault);
  const zeroOrganic = active.filter((record) => {
    const categories = inbound.get(record.rel);
    return categories.curated.size + categories.semantic.size === 0;
  });
  const reports = vault.records.filter((record) => record.type === 'report');
  const cycleRows = schedule.capacityRows.map((row) => [row.domain, row.cycle, row.scheduled, row.capacity, row.queuedLater]);
  const relationRows = [...relationshipCounts].sort(([a], [b]) => a.localeCompare(b));
  return `---
title: "Maintenance Review"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${date}"
status: "generated"
---

# Maintenance Review

Generated from the canonical schema by \`node tools/generate-maintenance-review.mjs\`. This is a structural snapshot, not a second editorial queue or a substitute for curated navigation. Operational work remains in [[Editorial Dashboard]]; policy remains in [[Editorial Governance]].

## Decision summary

| Review | Generated state | Structural decision |
|---|---:|---|
| Draft lifecycle | ${schedule.draftRows.length} scheduled drafts across ${schedule.capacityRows.length} domain/cycle allocations | Use priority and weekly capacity; there is no universal age cutoff |
| Recurring review | ${schedule.recurringRows.length} scheduled; ${dueRecurring.length} due by ${date} | Use lifecycle intervals from the schema |
| Folder capacity | ${capacityFolders.length} folders at or above ${threshold} active pages | Require MOC-first navigation before another folder level |
| MOC coverage | ${moc.covered}/${moc.pages} qualifying pages across ${moc.maps} maps | Exact conceptual coverage is a blocking contract |
| Source archive | ${sources.length} records; ${(sourceBytes / 1_000_000).toFixed(2)} MB Markdown; ${largeSources.length} above ${sourceReviewBytes} bytes | Apply recorded split decisions and source-ID integrity |
| Relationships | ${relationRows.reduce((sum, [, count]) => sum + count, 0)} structured edges; ${zeroOrganic.length} zero organic inbound | Use typed metadata and do not count generated inventories as organic navigation |
| Reports | ${reports.length} governed snapshots | Keep report lifecycle, derivation, and reader-scope parity |

## Capacity-aware draft schedule

No fixed “30-day stale” rule exists. Draft due dates are assigned from \`date_added\`, explicit/default priority, domain stewardship, and the weekly capacity in [[Editorial Governance]].

${table(['Domain', 'Cycle ending', 'Scheduled', 'Capacity', 'Queued after cycle'], cycleRows)}
## Recurring lifecycle review

${table(['Page', 'Domain', 'Lifecycle', 'Priority', 'Review due'], schedule.recurringRows.map((row) => [`[[${row.record.rel.replace(/\.md$/, '')}|${row.record.title}]]`, row.record.domain, row.record.status, row.priority, row.reviewDue]))}
## Folder-capacity review

${table(['Leaf folder', 'Active pages', 'MOC present', 'Decision'], capacityFolders.map(([folder, count]) => [folder, count, maps.has(folder) ? 'yes' : 'no', maps.has(folder) ? 'Retain MOC-first structure' : 'Create a MOC before another folder level']))}
## Source-archive review

- Unprocessed records: **${unprocessed.length}**.
- Large records above the schema review threshold (${sourceReviewBytes} bytes): **${largeSources.length}**.
- Source identity and bibliography are checked by \`node tools/check-vault.mjs\`.

${table(['Large source', 'Creators', 'Size', 'Split decision'], largeSources.map((record) => [`[[${record.rel.replace(/\.md$/, '')}|${record.title}]]`, creatorNames(record), `${(fs.statSync(record.file).size / 1_000_000).toFixed(2)} MB`, record.data.split_decision || 'missing']))}
## Relationship review

${table(['Relationship type', 'Active edges'], relationRows)}
Generated indexes and dashboards are reported separately by the validator. They never satisfy forward-reachability or organic-inbound gates.

## Next review triggers

- A scheduled draft or recurring review becomes due under the capacity-aware policy.
- A leaf folder reaches ${threshold} active pages without an adequate conceptual MOC.
- A source exceeds the schema-defined review threshold, the archive grows materially, or search performance regresses.
- A page loses curated/semantic reachability, or a generic relationship can be strengthened.
- A report changes lifecycle state, derivation roots, or supersession lineage.
`;
}

export function generateMaintenanceReview(root = process.cwd(), { check = false, date = generatedOn() } = {}) {
  const vault = loadVault(root);
  const output = renderMaintenanceReview(vault, date);
  const outputPath = path.join(root, '_meta/Maintenance Review.md');
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  const stale = stableGeneratedText(actual) !== stableGeneratedText(output);
  if (check && stale) throw new Error('_meta/Maintenance Review.md is stale; regenerate it');
  if (!check && stale) fs.writeFileSync(outputPath, output);
  return { outputPath, stale, draftCount: calculateReviewSchedule(vault, date).draftRows.length };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const check = process.argv.includes('--check');
    const result = generateMaintenanceReview(process.cwd(), { check });
    console.log(`${check ? 'Verified' : 'Generated'} _meta/Maintenance Review.md: ${result.draftCount} capacity-scheduled drafts.`);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
