import path from 'node:path';

import { calculateReviewSchedule } from './navigation.mjs';
import {
  generatedOn,
  headings,
  toPosix,
  typeSet,
} from './vault.mjs';

export const ARCHITECTURE_REPORT_REL = '_meta/Architecture Report.md';

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

function countBy(items, selector) {
  const counts = new Map();
  for (const item of items) {
    const key = String(selector(item) || '[missing]');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function orderedRows(counts, preferred = []) {
  const rows = [];
  const seen = new Set();
  for (const key of preferred) {
    rows.push([key, counts.get(key) || 0]);
    seen.add(key);
  }
  for (const [key, count] of [...counts].sort(([a], [b]) => a.localeCompare(b))) {
    if (!seen.has(key)) rows.push([key, count]);
  }
  return rows;
}

function classTypes(schema, className) {
  return new Set(Object.entries(schema.page_types || {})
    .filter(([, contract]) => contract?.class === className)
    .map(([type]) => type));
}

function relativeFile(vault, file) {
  return toPosix(path.isAbsolute(file) ? path.relative(vault.root, file) : file);
}

function sourceRoots(vault, sourceTypes) {
  const domains = new Set();
  for (const type of sourceTypes) {
    for (const domain of vault.schema.page_types?.[type]?.allowed_domains || []) domains.add(domain);
  }
  return [...domains].map((domain) => ({
    domain,
    root: vault.schema.domains?.[domain]?.root || '',
    collections: vault.schema.domains?.[domain]?.child_folders || [],
  })).filter((item) => item.root);
}

function sourceCollection(rel, roots) {
  const owner = roots.find(({ root }) => rel.startsWith(root));
  if (!owner) return '[outside registered source roots]';
  const collection = rel.slice(owner.root.length).split('/')[0] || '[root]';
  return roots.length === 1 ? collection : `${owner.domain}/${collection}`;
}

function sourceAttachments(vault, roots) {
  const extension = vault.schema.filesystem?.markdown_extension || '.md';
  return vault.allFiles.map((file) => relativeFile(vault, file))
    .filter((rel) => roots.some(({ root }) => rel.startsWith(root)))
    .filter((rel) => !rel.endsWith(extension))
    .filter((rel) => !path.posix.basename(rel).startsWith('.'));
}

function checkFindings(checkResult) {
  const errors = Array.isArray(checkResult?.errors) ? checkResult.errors : [];
  const warnings = Array.isArray(checkResult?.warnings) ? checkResult.warnings : [];
  if (!errors.length && !warnings.length) return '_None._\n';
  return [
    ...errors.map((error) => `- **Blocking:** ${error}`),
    ...warnings.map((warning) => `- **Warning:** ${warning}`),
    '',
  ].join('\n');
}

function reportRecordForPageCounts(vault) {
  const existing = vault.records.find((record) => record.rel === ARCHITECTURE_REPORT_REL);
  return existing || { type: 'governance' };
}

export function collectArchitectureReportData(vault, {
  date = generatedOn(),
  taxonomyRegistry,
  checkResult = { ok: false, errors: ['Canonical vault check was not supplied.'], warnings: [], metrics: {} },
} = {}) {
  if (!taxonomyRegistry) throw new Error('collectArchitectureReportData requires the canonical taxonomy registry');
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const sourceTypes = classTypes(vault.schema, 'source');
  const activeStates = new Set(vault.schema.lifecycle?.knowledge?.active_states || []);
  const knowledge = vault.records.filter((record) => knowledgeTypes.has(record.type));
  const activeKnowledge = knowledge.filter((record) => activeStates.has(record.status));
  const sources = vault.records.filter((record) => sourceTypes.has(record.type));
  const roots = sourceRoots(vault, sourceTypes);
  const attachments = sourceAttachments(vault, roots);
  const reportRecord = reportRecordForPageCounts(vault);
  const countedRecords = [
    ...vault.records.filter((record) => record.rel !== ARCHITECTURE_REPORT_REL),
    reportRecord,
  ];
  const schedule = calculateReviewSchedule(vault, date);
  const dueRecurring = schedule.recurringRows.filter((row) => row.reviewDue <= date);

  const sourceIdField = vault.schema.provenance?.source_id?.field || 'source_id';
  const sourceById = new Map();
  const duplicateSourceIds = new Set();
  for (const source of sources) {
    const id = String(source.data[sourceIdField] || '');
    if (sourceById.has(id)) duplicateSourceIds.add(id);
    else sourceById.set(id, source);
  }
  const sourceItems = knowledge.flatMap((record) => record.sources || []);
  const referencedIds = new Set(sourceItems.map((item) => String(item.id || '')).filter(Boolean));
  const unknownSourceReferences = sourceItems.filter((item) => !sourceById.has(String(item.id || '')));
  const unreferencedSources = sources.filter((record) => !referencedIds.has(String(record.data[sourceIdField] || '')));
  const roleCounts = countBy(sourceItems, (item) => item.role);
  const relationshipCounts = countBy(knowledge.flatMap((record) => record.relationships || []), (item) => item.type);
  const sourceFormatCounts = countBy(sources, (record) => record.data.source_format);
  const processingCounts = countBy(sources, (record) => record.data.processing_status);

  const collectionCounts = new Map();
  const ensureCollection = (collection) => {
    if (!collectionCounts.has(collection)) collectionCounts.set(collection, { records: 0, attachments: 0, references: 0 });
    return collectionCounts.get(collection);
  };
  for (const root of roots) {
    for (const collection of root.collections) ensureCollection(roots.length === 1 ? collection : `${root.domain}/${collection}`);
  }
  for (const source of sources) ensureCollection(sourceCollection(source.rel, roots)).records += 1;
  for (const attachment of attachments) ensureCollection(sourceCollection(attachment, roots)).attachments += 1;
  for (const item of sourceItems) {
    const source = sourceById.get(String(item.id || ''));
    if (source) ensureCollection(sourceCollection(source.rel, roots)).references += 1;
  }

  const taxonomyStateCounts = countBy(taxonomyRegistry.terms || [], (term) => term.state);
  const activeTopics = (taxonomyRegistry.terms || [])
    .filter((term) => term.facet === 'topic' && term.state === 'active' && term.approved === true).length;
  const checkMetrics = checkResult.metrics || {};
  const unreachableByHome = checkMetrics.unreachableByHome || {};
  const unreachableTotal = Object.values(unreachableByHome).reduce((sum, count) => sum + Number(count || 0), 0);

  const tablePages = knowledge.filter((record) => /^\s*\|.*\|\s*$/m.test(record.body)).length;
  const mermaidPages = knowledge.filter((record) => /^```mermaid\s*$/m.test(record.body)).length;
  const calloutPages = knowledge.filter((record) => /^> \[!/m.test(record.body)).length;
  const longWithoutH3 = knowledge.filter((record) => {
    const words = (record.body.match(/[\p{L}\p{N}]+/gu) || []).length;
    return words >= 900 && !headings(record.body).some((heading) => heading.level >= 3);
  }).length;

  return {
    date,
    checkResult,
    checkMetrics,
    countedRecords,
    knowledge,
    activeKnowledge,
    sources,
    attachments,
    schedule,
    dueRecurring,
    sourceItems,
    referencedIds,
    duplicateSourceIds,
    unknownSourceReferences,
    unreferencedSources,
    activeTopics,
    taxonomyRegistry,
    unreachableByHome,
    unreachableTotal,
    rows: {
      pageTypes: orderedRows(countBy(countedRecords, (record) => record.type)),
      knowledgeDomains: orderedRows(countBy(knowledge, (record) => record.domain)),
      knowledgeLanguages: orderedRows(countBy(knowledge, (record) => record.lang)),
      knowledgeStatuses: orderedRows(countBy(knowledge, (record) => record.status), vault.schema.lifecycle?.knowledge?.states || []),
      sourceFormats: orderedRows(sourceFormatCounts),
      processingStatuses: orderedRows(processingCounts, vault.schema.lifecycle?.source_processing?.states || []),
      sourceRoles: orderedRows(roleCounts, vault.schema.provenance?.roles || []),
      relationships: orderedRows(relationshipCounts, Object.keys(vault.schema.relationships?.labels || {})),
      taxonomyStates: orderedRows(taxonomyStateCounts, taxonomyRegistry.lifecycle || []),
      collections: [...collectionCounts].sort(([a], [b]) => a.localeCompare(b))
        .map(([collection, counts]) => [collection, counts.records, counts.attachments, counts.references]),
      reachability: Object.entries(unreachableByHome).sort(([a], [b]) => a.localeCompare(b))
        .map(([home, count]) => [home, count]),
    },
    readability: { tablePages, mermaidPages, calloutPages, longWithoutH3 },
  };
}

export function renderArchitectureReport(vault, options = {}) {
  const data = collectArchitectureReportData(vault, options);
  const checkOk = data.checkResult.ok === true;
  const unprocessed = data.sources.filter((record) => record.data.processing_status === 'unprocessed').length;
  const multiSourcePages = data.knowledge.filter((record) => (record.sources || []).length > 1).length;
  const locatorCount = data.sourceItems.filter((item) => typeof item.locator === 'string' && item.locator.trim()).length;
  const sourceIdsUnique = new Set(data.sources.map((record) => String(record.data.source_id || ''))).size;
  const sourceReferencesResolved = data.sourceItems.length - data.unknownSourceReferences.length;
  const components = data.checkMetrics.undirectedComponents;
  const mocCoverage = data.checkMetrics.mocCoverage || 'not available';
  const leafInventories = data.checkMetrics.leafInventories ?? 'not available';

  return `---
title: "Architecture Report"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${data.date}"
status: "generated"
---

# Architecture Report

Generated from canonical vault frontmatter, \`_meta/vault-schema.yaml\`, and \`_meta/taxonomy-registry.json\` by \`node tools/generate-architecture-report.mjs\`. Counts never come from generated indexes or dashboards. Do not hand-edit metrics.

## Gate status

- Canonical vault check: **${checkOk ? 'PASS' : 'FAIL'}**
- Blocking contract violations: **${data.checkResult.errors?.length || 0}**
- Validator warnings: **${data.checkResult.warnings?.length || 0}**
- Markdown pages: **${data.countedRecords.length}**
- Knowledge pages: **${data.knowledge.length}** total; **${data.activeKnowledge.length}** active
- Canonical source records: **${data.sources.length}**
- Source attachments: **${data.attachments.length}**
- Governed taxonomy terms: **${data.taxonomyRegistry.terms.length}**
- Active topic terms: **${data.activeTopics}**
- Zero organic-inbound active knowledge pages: **${data.checkMetrics.zeroOrganicInbound ?? 'not available'}**
- Draft review queue: **${data.schedule.draftRows.length}**
- Recurring reviews currently due: **${data.dueRecurring.length}**
- Unprocessed sources: **${unprocessed}**

## Coverage gates

| Gate | Direct result |
|---|---:|
| Canonical source IDs unique | ${sourceIdsUnique}/${data.sources.length} |
| Structured source references resolve | ${sourceReferencesResolved}/${data.sourceItems.length} |
| Active knowledge graph components | ${components ?? 'not available'} |
| Active reader pages unreachable from a home | ${data.unreachableTotal} |
| MOC conceptual coverage | ${mocCoverage} |
| Governed leaf inventories | ${leafInventories} |
| Canonical taxonomy registry | loaded and validated |

${table(['Home', 'Unreachable active reader pages'], data.rows.reachability)}
## Canonical check findings

${checkFindings(data.checkResult)}
## Pages by type

${table(['Type', 'Pages'], data.rows.pageTypes)}
## Knowledge by domain

${table(['Domain', 'Pages'], data.rows.knowledgeDomains)}
## Knowledge by language

${table(['Language', 'Pages'], data.rows.knowledgeLanguages)}
## Knowledge by lifecycle state

${table(['State', 'Pages'], data.rows.knowledgeStatuses)}
## Source records by format

${table(['Source format', 'Records'], data.rows.sourceFormats)}
## Source processing lifecycle

${table(['Processing state', 'Records'], data.rows.processingStatuses)}
## Knowledge-source roles

- Structured source references: **${data.sourceItems.length}** across **${data.knowledge.length}** knowledge pages.
- Knowledge pages with multiple sources: **${multiSourcePages}**.
- Source locators: **${locatorCount}**.
- Canonical source records with no knowledge-page reference: **${data.unreferencedSources.length}**.

${table(['Role', 'References'], data.rows.sourceRoles)}
## Source library by collection

${table(['Collection', 'Source records', 'Attachments', 'Knowledge references'], data.rows.collections)}
## Taxonomy lifecycle states

${table(['State', 'Terms'], data.rows.taxonomyStates)}
## Structured relationship types

${table(['Relationship', 'Edges'], data.rows.relationships)}
## Review scheduling

| Signal | Direct result |
|---|---:|
| Capacity-scheduled drafts | ${data.schedule.draftRows.length} |
| Draft allocation cycles | ${data.schedule.capacityRows.length} |
| Recurring lifecycle reviews | ${data.schedule.recurringRows.length} |
| Recurring reviews currently due | ${data.dueRecurring.length} |

Review counts come from the schema-defined lifecycle intervals, priorities, ownership, and weekly capacity through the shared review scheduler.

## Readability structure

| Signal | Knowledge pages |
|---|---:|
| Contains a Markdown table | ${data.readability.tablePages} |
| Contains Mermaid | ${data.readability.mermaidPages} |
| Contains an Obsidian callout | ${data.readability.calloutPages} |
| At least 900 words with no H3 | ${data.readability.longWithoutH3} |

## Enforcement

\`node tools/check-vault.mjs\` remains the canonical release gate. This report is a deterministic read model over the same schema and structured metadata; it does not define a parallel contract. Regenerate with \`node tools/generate-architecture-report.mjs\` and verify freshness with \`node tools/generate-architecture-report.mjs --check\`.
`;
}

