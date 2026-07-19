import path from 'node:path';
import {
  categorizeInbound,
  generatedOn,
  recordEdges,
  resolveWikilink,
  extractWikilinks,
  typeSet,
} from './vault.mjs';

const LANGUAGE_LABELS = new Map([['en', 'English'], ['zh', '中文']]);
const PRIORITY_ORDER = new Map([['critical', 0], ['high', 1], ['normal', 2], ['low', 3]]);

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
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

function displayTitle(record) {
  return record.title || path.posix.basename(record.rel, '.md');
}

function link(record) {
  return `[[${record.rel.replace(/\.md$/i, '')}|${escapeCell(displayTitle(record))}]]`;
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value === null || value === undefined || value === '' ? [] : [String(value)];
}

function creatorNames(record) {
  if (Array.isArray(record.data.creators)) {
    return record.data.creators
      .map((creator) => creator && typeof creator === 'object' ? creator.name : '')
      .filter(Boolean)
      .join('; ');
  }
  return String(record.data.author || '');
}

function activeStates(vault) {
  return new Set(vault.schema.lifecycle?.knowledge?.active_states || ['draft', 'reviewed', 'evergreen']);
}

function retiredStates(vault) {
  return new Set(vault.schema.lifecycle?.knowledge?.retired_states || []);
}

function knowledge(vault, { activeOnly = false } = {}) {
  const types = typeSet(vault.schema, 'knowledge');
  const records = vault.records.filter((record) => types.has(record.type));
  return activeOnly ? records.filter((record) => activeStates(vault).has(record.status)) : records;
}

function domainLabel(vault, domain) {
  const indexPath = vault.schema.domains?.[domain]?.index;
  const index = vault.records.find((record) => record.rel === indexPath);
  if (index?.title) return index.title;
  return domain.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function subfolderFor(record, vault) {
  const root = vault.schema.domains?.[record.domain]?.root || '';
  if (!root || !record.rel.startsWith(root)) return 'Other';
  const remainder = record.rel.slice(root.length);
  const parts = remainder.split('/');
  return parts.length > 1 ? parts[0] : 'Domain root';
}

function languageSections(records) {
  let output = '';
  const languages = [...new Set(records.map((record) => record.lang || 'other'))]
    .sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a === 'zh' ? -1 : b === 'zh' ? 1 : a.localeCompare(b)));
  for (const language of languages) {
    const pages = records.filter((record) => (record.lang || 'other') === language)
      .sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
    output += `##### ${LANGUAGE_LABELS.get(language) || language}\n\n`;
    output += `${pages.length} page${pages.length === 1 ? '' : 's'}.\n\n`;
    output += pages.map((record) => `- ${link(record)} — ${record.status}`).join('\n') + '\n\n';
  }
  return output;
}

export function renderPortableIndex(vault, date = generatedOn()) {
  const pages = knowledge(vault, { activeOnly: true });
  let sections = '';
  for (const [domain, config] of Object.entries(vault.schema.domains || {})) {
    if (!config.root || ['source-library', 'reports'].includes(domain)) continue;
    const domainPages = pages.filter((record) => record.domain === domain);
    if (!domainPages.length) continue;
    const label = domainLabel(vault, domain);
    sections += `## ${label}\n\n`;
    sections += `${domainPages.length} active knowledge page${domainPages.length === 1 ? '' : 's'}. Domain map: [[${config.index.replace(/\.md$/, '')}|${label} Index]].\n\n`;
    const folders = [...new Set(domainPages.map((record) => subfolderFor(record, vault)))].sort((a, b) => {
      if (a === 'Domain root') return -1;
      if (b === 'Domain root') return 1;
      return a.localeCompare(b);
    });
    for (const folder of folders) {
      const folderPages = domainPages.filter((record) => subfolderFor(record, vault) === folder);
      sections += `### ${folder}\n\n`;
      sections += `${folderPages.length} page${folderPages.length === 1 ? '' : 's'}.\n\n`;
      const types = [...new Set(folderPages.map((record) => record.type))].sort();
      for (const type of types) {
        const typed = folderPages.filter((record) => record.type === type);
        sections += `#### ${type}\n\n`;
        sections += languageSections(typed);
      }
    }
  }
  return `---
title: "Portable Index"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${date}"
status: "generated"
---

# Portable Index

Static, plugin-independent access to all ${pages.length} active knowledge pages. Pages are grouped by domain, subfolder, type, and language. Retired lifecycle states are intentionally excluded. Generated by \`node tools/generate-navigation-indexes.mjs\`.

${sections}`;
}

function facetCounts(records, prefix) {
  const counts = new Map();
  for (const record of records) {
    for (const tag of record.tags.filter((item) => item.startsWith(prefix))) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
}

export function renderSourceAuthorIndex(vault, date = generatedOn()) {
  const pages = knowledge(vault, { activeOnly: true });
  const sources = vault.records.filter((record) => ['source', 'source-manifest'].includes(record.type));
  const authors = new Map();
  for (const source of sources) {
    const names = creatorNames(source).split('; ').filter(Boolean);
    for (const author of names.length ? names : ['[unknown]']) authors.set(author, (authors.get(author) || 0) + 1);
  }
  const sourceDerivatives = new Map(sources.map((source) => [source.rel, new Set()]));
  for (const entry of pages) {
    for (const sourceRef of entry.sources || []) {
      const matches = vault.bySourceId.get(String(sourceRef.id || '')) || [];
      if (matches.length === 1 && sourceDerivatives.has(matches[0].rel)) sourceDerivatives.get(matches[0].rel).add(entry);
    }
    for (const item of extractWikilinks(entry.body)) {
      const target = resolveWikilink(item.raw, entry, vault);
      if (target.status === 'resolved' && sourceDerivatives.has(target.record.rel)) sourceDerivatives.get(target.record.rel).add(entry);
    }
  }
  let sourceSections = '';
  for (const sourceType of [...new Set(sources.map((source) => String(source.data.source_type || 'Unclassified')))].sort()) {
    const items = sources.filter((source) => String(source.data.source_type || 'Unclassified') === sourceType)
      .sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
    sourceSections += `## ${sourceType} sources\n\n${items.length} source record${items.length === 1 ? '' : 's'}.\n\n`;
    sourceSections += table(['Source', 'Author', 'Format', 'Processing', 'Direct active derivatives'], items.map((record) => {
      const derivatives = [...sourceDerivatives.get(record.rel)].sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
      return [
        link(record), creatorNames(record), record.data.source_format || '', record.data.processing_status || '',
        derivatives.length ? derivatives.map(link).join('<br>') : '—',
      ];
    }));
  }
  return `---
title: "Source and Author Index"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${date}"
status: "generated"
---

# Source and Author Index

Static browsing facets for provenance and people. Retired knowledge is excluded from derivative and facet counts. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Person facets

${table(['Person tag', 'Active knowledge pages'], facetCounts(pages, 'person/').map(([tag, count]) => [`#${tag}`, count]))}
## Source facets

${table(['Source tag', 'Active knowledge pages'], facetCounts(pages, 'source/').map(([tag, count]) => [`#${tag}`, count]))}
## Archived-source authors

${table(['Author as archived', 'Source records'], [...authors].sort(([a], [b]) => a.localeCompare(b)))}
${sourceSections}`;
}

function dateOnly(value) {
  const string = String(value || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(string) ? string : '';
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function endOfWeekOnOrAfter(date) {
  const value = new Date(`${date}T00:00:00Z`);
  const daysToSunday = (7 - value.getUTCDay()) % 7;
  value.setUTCDate(value.getUTCDate() + daysToSunday);
  return value.toISOString().slice(0, 10);
}

function priority(record, vault) {
  const explicit = String(record.data.review_priority || '');
  if (PRIORITY_ORDER.has(explicit)) return explicit;
  if (['series-hub', 'domain-index', 'source-manifest'].includes(record.type)) return 'high';
  return vault.schema.editorial_governance?.default_review_priority || 'normal';
}

function owner(record, vault) {
  return String(record.data.owner || vault.schema.editorial_governance?.stewards?.[record.domain]
    || vault.schema.editorial_governance?.default_owner || 'unassigned');
}

export function calculateReviewSchedule(vault, date = generatedOn()) {
  const pages = knowledge(vault);
  const capacity = Number(vault.schema.editorial_governance?.weekly_draft_capacity_per_domain || 10);
  const currentCycle = endOfWeekOnOrAfter(date);
  const draftRows = [];
  const capacityRows = [];
  for (const domain of [...new Set(pages.filter((record) => record.status === 'draft').map((record) => record.domain))].sort()) {
    const drafts = pages.filter((record) => record.domain === domain && record.status === 'draft').sort((a, b) => {
      return (PRIORITY_ORDER.get(priority(a, vault)) - PRIORITY_ORDER.get(priority(b, vault)))
        || dateOnly(a.data.date_added).localeCompare(dateOnly(b.data.date_added))
        || displayTitle(a).localeCompare(displayTitle(b));
    });
    const allocations = new Map();
    for (const record of drafts) {
      const added = dateOnly(record.data.date_added) || date;
      const rank = priority(record, vault);
      let target = endOfWeekOnOrAfter(addDays(added, 7));
      if (rank === 'critical') target = currentCycle;
      else if (rank === 'high') target = addDays(target, -7);
      else if (rank === 'low') target = addDays(target, 14);
      if (target < currentCycle && rank !== 'critical') target = currentCycle;
      while ((allocations.get(target) || 0) >= capacity) target = addDays(target, 7);
      allocations.set(target, (allocations.get(target) || 0) + 1);
      draftRows.push({ record, owner: owner(record, vault), priority: rank, reviewDue: target });
    }
    let cumulative = 0;
    for (const [cycle, count] of [...allocations].sort()) {
      cumulative += count;
      capacityRows.push({ domain, cycle, scheduled: count, capacity, queuedLater: Math.max(0, drafts.length - cumulative) });
    }
  }
  const intervals = vault.schema.lifecycle?.knowledge?.review_intervals_days || {};
  const recurringRows = pages.filter((record) => Object.hasOwn(intervals, record.status)).map((record) => {
    const base = dateOnly(record.data.reviewed_on) || dateOnly(record.data.updated) || dateOnly(record.data.date_added) || date;
    let due = addDays(base, Number(intervals[record.status]));
    const rank = priority(record, vault);
    if (rank === 'critical') due = currentCycle;
    else if (rank === 'high') due = addDays(due, -7);
    else if (rank === 'low') due = addDays(due, 14);
    return { record, owner: owner(record, vault), priority: rank, reviewDue: due };
  }).sort((a, b) => a.reviewDue.localeCompare(b.reviewDue) || displayTitle(a.record).localeCompare(displayTitle(b.record)));
  return { draftRows, recurringRows, capacityRows, currentCycle };
}

function ageDays(record, date, field = 'date_added') {
  const added = dateOnly(record.data[field]);
  if (!added) return '—';
  return Math.max(0, Math.floor((new Date(`${date}T00:00:00Z`) - new Date(`${added}T00:00:00Z`)) / 86_400_000));
}

export function renderEditorialDashboard(vault, date = generatedOn()) {
  const allKnowledge = knowledge(vault);
  const active = allKnowledge.filter((record) => activeStates(vault).has(record.status));
  const retired = allKnowledge.filter((record) => retiredStates(vault).has(record.status));
  const sources = vault.records.filter((record) => ['source', 'source-manifest'].includes(record.type));
  const edges = recordEdges(vault);
  const nonGeneratedEdges = edges.filter((edge) => !vault.generatedArtifacts.has(edge.from.rel));
  const inbound = categorizeInbound(allKnowledge, nonGeneratedEdges, vault);
  const zeroOrganic = active.filter((record) => {
    const categories = inbound.get(record.rel);
    return categories.semantic.size + categories.curated.size === 0;
  });
  const { draftRows, recurringRows, capacityRows } = calculateReviewSchedule(vault, date);
  const missingTranslations = active.filter((record) => !record.relationships.some((relationship) => relationship.type === 'translation'));
  const translationCandidates = active.flatMap((record) => listValue(record.data.translation_candidates).map((candidate) => ({ record, candidate })));
  const sourceInbound = new Map(sources.map((source) => [source.rel, 0]));
  for (const edge of edges) if (sourceInbound.has(edge.to.rel) && typeSet(vault.schema, 'knowledge').has(edge.from.type) && activeStates(vault).has(edge.from.status)) sourceInbound.set(edge.to.rel, sourceInbound.get(edge.to.rel) + 1);
  const unprocessed = sources.filter((record) => record.data.processing_status === 'unprocessed');
  const uncovered = sources.filter((record) => sourceInbound.get(record.rel) === 0 && !['unprocessed', 'exempt'].includes(record.data.processing_status));
  const categoryRows = active.map((record) => {
    const categories = inbound.get(record.rel);
    const sourceInventories = new Set(record.sources.map((source) => source.id)).size;
    const generatedInventories = 1 + (record.type === 'article' ? 1 : 0) + sourceInventories;
    return [link(record), categories.curated.size, categories.semantic.size, generatedInventories, categories.incidental.size];
  }).filter((row) => row.slice(1).some(Boolean));
  return `---
title: "Editorial Dashboard"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${date}"
status: "generated"
---

# Editorial Dashboard

Static, capacity-aware editorial and architecture queues. Generated inventories are reported separately and never manufacture organic connectivity. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Queue summary

| Queue | Pages |
|---|---:|
| Active knowledge | ${active.length} |
| Draft review | ${draftRows.length} |
| Recurring review | ${recurringRows.length} |
| Missing translation coverage | ${missingTranslations.length} |
| Explicit translation proposals | ${translationCandidates.length} |
| Retired lifecycle | ${retired.length} |
| Zero curated or semantic inbound | ${zeroOrganic.length} |
| Unprocessed sources | ${unprocessed.length} |
| Sources without direct active knowledge links | ${uncovered.length} |

## Draft review queue

${table(['Page', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Review due'], draftRows.map((row) => [link(row.record), row.owner, row.record.domain, ageDays(row.record, date), row.priority, row.record.status, row.reviewDue]))}
## Recurring review queue

${table(['Page', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Review due'], recurringRows.map((row) => [link(row.record), row.owner, row.record.domain, ageDays(row.record, date), row.priority, row.record.status, row.reviewDue]))}
## Weekly capacity

${table(['Domain', 'Cycle ending', 'Scheduled', 'Capacity', 'Queued after this cycle'], capacityRows.map((row) => [row.domain, row.cycle, row.scheduled, row.capacity, row.queuedLater]))}
## Missing translation coverage

This queue identifies active pages that lack a reciprocal translation edge. It names only the missing target language; it does not infer an equivalent page.

${table(['Page', 'Target language', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle'], missingTranslations.map((record) => [link(record), record.lang === 'zh' ? 'en' : 'zh', owner(record, vault), record.domain, ageDays(record, date), priority(record, vault), record.status]))}
## Explicit translation proposals

Only explicit metadata proposes a match; shared tags never fabricate equivalence.

${table(['Page', 'Proposed match', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle'], translationCandidates.map((row) => [link(row.record), row.candidate, owner(row.record, vault), row.record.domain, ageDays(row.record, date), priority(row.record, vault), row.record.status]))}
## Retirement and replacement queue

${table(['Page', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Replaced by'], retired.map((record) => [link(record), owner(record, vault), record.domain, ageDays(record, date), priority(record, vault), record.status, listValue(record.data.replaced_by).join('<br>') || '—']))}
## Zero curated or semantic inbound

${table(['Page', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Type'], zeroOrganic.map((record) => [link(record), owner(record, vault), record.domain, ageDays(record, date), priority(record, vault), record.status, record.type]))}
## Inbound-category detail

Generated inventory coverage is computed from declared deterministic inventories (Portable, Article where applicable, and Source/Author by source ID), never by reading current generated output files.

${table(['Page', 'Curated', 'Semantic', 'Generated', 'Incidental'], categoryRows)}
## Unprocessed sources

${table(['Source', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Creators', 'Type'], unprocessed.map((record) => [link(record), owner(record, vault), record.domain, ageDays(record, date, 'date_archived'), priority(record, vault), record.data.processing_status, creatorNames(record), record.data.source_type || '']))}
## Sources without direct active knowledge links

${table(['Source', 'Owner', 'Domain', 'Age days', 'Priority', 'Lifecycle', 'Creators', 'Type'], uncovered.map((record) => [link(record), owner(record, vault), record.domain, ageDays(record, date, 'date_archived'), priority(record, vault), record.data.processing_status, creatorNames(record), record.data.source_type || '']))}`;
}

export function renderArticleIndex(vault, date = generatedOn()) {
  const articles = knowledge(vault).filter((record) => record.type === 'article');
  const active = articles.filter((record) => activeStates(vault).has(record.status)).sort((a, b) => String(b.data.date_added || '').localeCompare(String(a.data.date_added || '')) || displayTitle(a).localeCompare(displayTitle(b)));
  const retired = articles.filter((record) => retiredStates(vault).has(record.status)).sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
  const sourceCount = (record) => extractWikilinks(record.body).filter((item) => {
    const target = resolveWikilink(item.raw, record, vault);
    return target.status === 'resolved'
      && typeSet(vault.schema, 'knowledge').has(target.record.type)
      && activeStates(vault).has(target.record.status);
  }).length;
  const articleTable = (records, retiredView = false) => retiredView
    ? table(['Article', 'Language', 'Status', 'Replaced by'], records.map((record) => [link(record), record.lang, record.status, listValue(record.data.replaced_by).join('<br>') || '—']))
    : table(['Article', 'Linked active knowledge entries', 'Language', 'Date added', 'Status'], records.map((record) => [link(record), sourceCount(record), record.lang, record.data.date_added || '', record.status]));
  return `---
title: "Articles"
type: "article-index"
domain: "articles"
lang: "en"
generated_on: "${date}"
status: "generated"
---

# Articles

Outward-facing essays and composed pieces synthesized from multiple entries. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Placement rule

Belongs here: finished articles, essays, and publishable drafts that combine multiple entries into one narrative. Does not belong here: raw source notes, single-idea evergreen entries, or internal-only playbooks.

## Active articles

### English

${articleTable(active.filter((record) => record.lang === 'en'))}### 中文

${articleTable(active.filter((record) => record.lang === 'zh'))}
## Retired articles

### English

${articleTable(retired.filter((record) => record.lang === 'en'), true)}### 中文

${articleTable(retired.filter((record) => record.lang === 'zh'), true)}`;
}

export function renderReportsIndex(vault, date = generatedOn()) {
  const reports = vault.records.filter((record) => record.type === 'report');
  const reportLifecycle = vault.schema.lifecycle?.report || {};
  const reportActiveStates = new Set(reportLifecycle.active_states || ['draft', 'reviewed']);
  const reportRetiredStates = new Set(reportLifecycle.retired_states || ['superseded']);
  const active = reports.filter((record) => reportActiveStates.has(record.status)).sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
  const retired = reports.filter((record) => reportRetiredStates.has(record.status)).sort((a, b) => displayTitle(a).localeCompare(displayTitle(b)));
  const lineageLinks = (record, field) => listValue(record.data[field]).map((target) => {
    const resolution = vault.byRel.get(String(target).replace(/\.md$/i, ''));
    return resolution ? link(resolution) : String(target);
  }).join('<br>') || '—';
  const derived = (record) => lineageLinks(record, 'derived_from');
  const supersedes = (record) => lineageLinks(record, 'supersedes');
  const activeTable = (records) => table(['Report', 'Generated', 'Status', 'Derived collections', 'Owner'], records.map((record) => [link(record), record.data.generated_on || '', record.status, derived(record), record.data.owner || '']));
  const retiredTable = (records) => table(['Report', 'Generated', 'Status', 'Supersedes', 'Owner'], records.map((record) => [link(record), record.data.generated_on || '', record.status, supersedes(record), record.data.owner || '']));
  const browse = `## Browse reports

### Active reports

#### English

${activeTable(active.filter((record) => record.lang === 'en'))}#### 中文

${activeTable(active.filter((record) => record.lang === 'zh'))}### Superseded reports

#### English

${retiredTable(retired.filter((record) => record.lang === 'en'))}#### 中文

${retiredTable(retired.filter((record) => record.lang === 'zh'))}`;
  const index = vault.records.find((record) => record.rel === 'Reports/Reports Index.md');
  if (!index) throw new Error('Reports/Reports Index.md is missing');
  let output = index.text.replace(/^generated_on:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m, `generated_on: "${date}"`);
  const start = output.indexOf('## Browse reports');
  if (start < 0) throw new Error('Reports Index is missing its Browse reports section');
  const next = output.indexOf('\n## ', start + '## Browse reports'.length);
  output = `${output.slice(0, start)}${browse.trimEnd()}\n${next < 0 ? '' : output.slice(next + 1)}`;
  return output.trimEnd();
}

export function renderNavigationArtifacts(vault, { date = generatedOn() } = {}) {
  return new Map([
    ['_meta/Portable Index.md', renderPortableIndex(vault, date)],
    ['_meta/Source and Author Index.md', renderSourceAuthorIndex(vault, date)],
    ['_meta/Editorial Dashboard.md', renderEditorialDashboard(vault, date)],
    ['07-Articles/Articles Index.md', renderArticleIndex(vault, date)],
    ['Reports/Reports Index.md', renderReportsIndex(vault, date)],
  ]);
}
