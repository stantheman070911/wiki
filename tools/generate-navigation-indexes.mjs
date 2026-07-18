#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);
const generatedNavigation = new Set([
  '_meta/Portable Index.md',
  '_meta/Source and Author Index.md',
  '_meta/Editorial Dashboard.md',
]);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function frontmatter(text) {
  if (!text.startsWith('---\n')) return '';
  const end = text.indexOf('\n---', 4);
  return end < 0 ? '' : text.slice(4, end);
}

function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function inlineList(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm'));
  if (!match) return [];
  return match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function link(record) {
  return `[[${record.rel.replace(/\.md$/, '')}|${escapeCell(record.title || path.posix.basename(record.rel, '.md'))}]]`;
}

function escapeCell(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
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

function extractWikilinks(text) {
  return [...text.matchAll(/(?<!!)\[\[([^\]\n]+)\]\]/g)].map((match) => match[1].replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim().replace(/\.md$/i, ''));
}

const records = walk(root).map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  return {
    rel: path.relative(root, file).split(path.sep).join('/'),
    text,
    title: scalar(fm, 'title'),
    type: scalar(fm, 'type'),
    domain: scalar(fm, 'domain'),
    lang: scalar(fm, 'lang'),
    status: scalar(fm, 'status'),
    dateAdded: scalar(fm, 'date_added'),
    updated: scalar(fm, 'updated'),
    reviewedOn: scalar(fm, 'reviewed_on'),
    sourceType: scalar(fm, 'source_type'),
    sourceFormat: scalar(fm, 'source_format'),
    processingStatus: scalar(fm, 'processing_status'),
    author: scalar(fm, 'author'),
    tags: inlineList(fm, 'tags'),
  };
});
const byRel = new Map(records.map((record) => [record.rel.replace(/\.md$/, ''), record]));
const byName = new Map();
for (const record of records) {
  for (const key of new Set([path.posix.basename(record.rel, '.md'), record.title].filter(Boolean))) {
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(record);
  }
}

function resolve(target, from) {
  if (!target) return null;
  const direct = byRel.get(target);
  if (direct) return direct;
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), target));
  if (byRel.has(relative)) return byRel.get(relative);
  const names = [...new Set(byName.get(target) || [])];
  return names.length === 1 ? names[0] : null;
}

const knowledge = records.filter((record) => knowledgeTypes.has(record.type));
const sources = records.filter((record) => record.type === 'source');
const generatedOn = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const domainOrder = [
  ['business-strategy', 'Business Strategy', '01-Business-Strategy/Business Strategy Index'],
  ['social-media-strategy', 'Social Media Strategy', '02-Social-Media-Strategy/Social Media Strategy Index'],
  ['tactics-and-playbooks', 'Tactics and Playbooks', '03-Tactics-and-Playbooks/Tactics and Playbooks Index'],
  ['frameworks-and-mental-models', 'Frameworks and Mental Models', '04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index'],
  ['intelligence-and-research', 'Intelligence and Research', '05-Intelligence-and-Research/Intelligence and Research Index'],
  ['articles', 'Articles', '07-Articles/Articles Index'],
];

let portableSections = '';
for (const [domain, label, indexPath] of domainOrder) {
  const pages = knowledge.filter((record) => record.domain === domain).sort((a, b) => (a.type.localeCompare(b.type) || a.title.localeCompare(b.title)));
  portableSections += `## ${label} (${pages.length})\n\nDomain map: [[${indexPath}|${label} Index]]\n\n`;
  portableSections += table(['Page', 'Type', 'Language', 'Status'], pages.map((record) => [link(record), record.type, record.lang, record.status]));
}

const portable = `---
title: "Portable Index"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Portable Index

Static, plugin-independent access to all ${knowledge.length} knowledge pages. Use the curated domain maps for guided browsing; use this inventory when Dataview is unavailable. Generated by \`node tools/generate-navigation-indexes.mjs\`.

${portableSections}`;

const facetCounts = (prefix) => {
  const counts = new Map();
  for (const record of knowledge) for (const tag of record.tags.filter((item) => item.startsWith(prefix))) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
};
const authors = new Map();
for (const source of sources) authors.set(source.author || '[unknown]', (authors.get(source.author || '[unknown]') || 0) + 1);

let sourceSections = '';
const sourceDerivatives = new Map(sources.map((source) => [source.rel, []]));
for (const entry of knowledge) {
  for (const raw of extractWikilinks(entry.text)) {
    const target = resolve(raw, entry);
    if (target && sourceDerivatives.has(target.rel)) sourceDerivatives.get(target.rel).push(entry);
  }
}
for (const sourceType of [...new Set(sources.map((source) => source.sourceType))].sort()) {
  const items = sources.filter((source) => source.sourceType === sourceType).sort((a, b) => a.title.localeCompare(b.title));
  sourceSections += `## ${sourceType || 'Unclassified'} sources (${items.length})\n\n`;
  sourceSections += table(['Source', 'Author', 'Format', 'Processing', 'Direct derived entries'], items.map((record) => [
    link(record),
    record.author,
    record.sourceFormat,
    record.processingStatus,
    sourceDerivatives.get(record.rel).length ? sourceDerivatives.get(record.rel).map(link).join('<br>') : '—',
  ]));
}

const entities = `---
title: "Source and Author Index"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Source and Author Index

Static browsing facets for provenance and people. Tag links open Obsidian's tag results; source records open directly. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Person facets (${facetCounts('person/').length})

${table(['Person tag', 'Knowledge pages'], facetCounts('person/').map(([tag, count]) => [`#${tag}`, count]))}
## Source facets (${facetCounts('source/').length})

${table(['Source tag', 'Knowledge pages'], facetCounts('source/').map(([tag, count]) => [`#${tag}`, count]))}
## Archived-source authors (${authors.size})

${table(['Author as archived', 'Source records'], [...authors].sort(([a], [b]) => a.localeCompare(b)).map(([author, count]) => [author, count]))}
${sourceSections}`;

const inbound = new Map(knowledge.map((record) => [record.rel, 0]));
const sourceInbound = new Map(sources.map((record) => [record.rel, 0]));
for (const from of records.filter((record) => !generatedNavigation.has(record.rel) && !record.rel.startsWith('_meta/') && !record.rel.startsWith('00-Templates/') && !record.rel.startsWith('06-Source-Library/'))) {
  for (const raw of extractWikilinks(from.text)) {
    const target = resolve(raw, from);
    if (!target) continue;
    if (inbound.has(target.rel)) inbound.set(target.rel, inbound.get(target.rel) + 1);
    if (sourceInbound.has(target.rel) && knowledgeTypes.has(from.type)) sourceInbound.set(target.rel, sourceInbound.get(target.rel) + 1);
  }
}
const drafts = knowledge.filter((record) => record.status === 'draft').sort((a, b) => (a.updated || '').localeCompare(b.updated || '') || a.title.localeCompare(b.title));
const reviewQueue = knowledge.filter((record) => ['reviewed', 'evergreen'].includes(record.status)).sort((a, b) => (a.reviewedOn || '').localeCompare(b.reviewedOn || '') || a.title.localeCompare(b.title));
const zeroInbound = knowledge.filter((record) => inbound.get(record.rel) === 0).sort((a, b) => a.domain.localeCompare(b.domain) || a.title.localeCompare(b.title));
const recentlyChanged = [...knowledge].sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || a.title.localeCompare(b.title)).slice(0, 20);
const cornerstones = knowledge.filter((record) => inbound.get(record.rel) >= 12 || record.type === 'series-hub').sort((a, b) => inbound.get(b.rel) - inbound.get(a.rel) || a.title.localeCompare(b.title));
const unprocessed = sources.filter((record) => record.processingStatus === 'unprocessed').sort((a, b) => a.title.localeCompare(b.title));
const uncoveredSources = sources.filter((record) => sourceInbound.get(record.rel) === 0 && !['unprocessed', 'exempt'].includes(record.processingStatus)).sort((a, b) => a.title.localeCompare(b.title));

const dashboard = `---
title: "Editorial Dashboard"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Editorial Dashboard

Static editorial and architecture queues. Generated inventories, metadata/governance pages, templates, and source records are excluded from inbound-link counts so the orphan signal reflects reader-facing knowledge navigation. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Structural alerts

[[Architecture Report#Coverage gates|Architecture Report — coverage gates]] is the blocking view for missing metadata, folder/type mismatches, broken file or fragment links, source-folder violations, series integrity, alias problems, and stale portable indexes. [[Maintenance Review]] records the recurring taxonomy, capacity, source, draft, link, hierarchy, and visual-structure review.

## Queue summary

| Queue | Pages |
|---|---:|
| Draft knowledge | ${drafts.length} |
| Reviewed / evergreen | ${reviewQueue.length} |
| Zero organic inbound links | ${zeroInbound.length} |
| Unprocessed sources | ${unprocessed.length} |
| Processed sources without direct knowledge links | ${uncoveredSources.length} |
| Cornerstone pages | ${cornerstones.length} |

## Draft queue (${drafts.length})

${table(['Page', 'Domain', 'Type', 'Updated'], drafts.map((record) => [link(record), record.domain, record.type, record.updated]))}
## Review queue (${reviewQueue.length})

Oldest review date first.

${table(['Page', 'Status', 'Reviewed on'], reviewQueue.map((record) => [link(record), record.status, record.reviewedOn]))}
## Zero organic inbound links (${zeroInbound.length})

Pages with no inbound link from knowledge pages, Home, articles, or curated domain/subdomain maps. Generated inventories and governance/source pages do not manufacture connectivity.

### Distribution by domain

${table(['Domain', 'Pages'], [...zeroInbound.reduce((counts, record) => counts.set(record.domain, (counts.get(record.domain) || 0) + 1), new Map())].sort(([a], [b]) => a.localeCompare(b)))}
### Pages

${table(['Page', 'Domain', 'Type', 'Status'], zeroInbound.map((record) => [link(record), record.domain, record.type, record.status]))}
## Recently changed (${recentlyChanged.length})

${table(['Page', 'Domain', 'Type', 'Updated'], recentlyChanged.map((record) => [link(record), record.domain, record.type, record.updated]))}
## Cornerstone pages (${cornerstones.length})

Cornerstones are reviewed or evergreen pages with at least 12 organic inbound links, plus manually designated series hubs.

${table(['Page', 'Inbound links', 'Type', 'Status'], cornerstones.map((record) => [link(record), inbound.get(record.rel), record.type, record.status]))}
## Unprocessed sources (${unprocessed.length})

${table(['Source', 'Type', 'Author'], unprocessed.map((record) => [link(record), record.sourceType, record.author]))}
## Processed sources without direct knowledge links (${uncoveredSources.length})

The structural audit also accepts manifest and canonical-source coverage; this stricter queue shows only direct knowledge-to-source links.

${table(['Source', 'Type', 'Processing'], uncoveredSources.map((record) => [link(record), record.sourceType, record.processingStatus]))}`;

const articles = knowledge.filter((record) => record.type === 'article').sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || '') || a.title.localeCompare(b.title));
const articleIndex = `---
title: "Articles"
type: "article-index"
domain: "articles"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Articles

Outward-facing essays and composed pieces synthesized from multiple WIKI entries. Generated by \`node tools/generate-navigation-indexes.mjs\`.

## Placement rule

Belongs here: finished articles, essays, and publishable drafts that combine multiple entries into one narrative. Does not belong here: raw source notes, single-idea evergreen entries, or internal-only playbooks.

## Index

${table(['Article', 'Linked source entries', 'Date added', 'Status'], articles.map((record) => [link(record), extractWikilinks(record.text).length, record.dateAdded, record.status]))}`;

fs.writeFileSync(path.join(root, '_meta', 'Portable Index.md'), portable);
fs.writeFileSync(path.join(root, '_meta', 'Source and Author Index.md'), entities);
fs.writeFileSync(path.join(root, '_meta', 'Editorial Dashboard.md'), dashboard);
fs.writeFileSync(path.join(root, '07-Articles', 'Articles Index.md'), articleIndex);
console.log(`Generated portable navigation: ${knowledge.length} knowledge pages, ${sources.length} sources, ${zeroInbound.length} zero-inbound pages.`);
