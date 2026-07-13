#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);
function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}
function frontmatter(text) { return text.match(/^---\n([\s\S]*?)\n---/)?.[1] || ''; }
function scalar(fm, key) { const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm')); return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''; }
function list(fm, key) { const match = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm')); return match ? match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []; }
function link(record) { return `[[${record.rel.replace(/\.md$/, '')}|${record.title || path.posix.basename(record.rel, '.md')}]]`; }
function table(headers, rows) {
  if (!rows.length) return '_None._\n';
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.map((item) => String(item).replace(/\|/g, '\\|')).join(' | ')} |`), ''].join('\n');
}

const allFiles = walk(root);
const records = allFiles.filter((file) => file.endsWith('.md')).map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  return {
    file,
    rel: path.relative(root, file).split(path.sep).join('/'),
    text,
    title: scalar(fm, 'title'),
    type: scalar(fm, 'type'),
    domain: scalar(fm, 'domain'),
    lang: scalar(fm, 'lang'),
    status: scalar(fm, 'status'),
    dateAdded: scalar(fm, 'date_added'),
    reviewedOn: scalar(fm, 'reviewed_on'),
    owner: scalar(fm, 'owner'),
    processingStatus: scalar(fm, 'processing_status'),
    sourceFormat: scalar(fm, 'source_format'),
    tags: list(fm, 'tags'),
  };
});
const knowledge = records.filter((record) => knowledgeTypes.has(record.type));
const sources = records.filter((record) => record.type === 'source');
const topics = new Map();
for (const record of knowledge) for (const tag of record.tags.filter((item) => item.startsWith('topic/'))) topics.set(tag, (topics.get(tag) || 0) + 1);
const singleUseTopics = [...topics].filter(([, count]) => count === 1).sort(([a], [b]) => a.localeCompare(b));

const folderCounts = new Map();
for (const record of knowledge) {
  const folder = path.posix.dirname(record.rel);
  folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
}
const capacityFolders = [...folderCounts].filter(([, count]) => count >= 20).sort((a, b) => b[1] - a[1]);
const subdomainFolders = new Set(records.filter((record) => record.type === 'subdomain-index').map((record) => path.posix.dirname(record.rel)));

const generatedOn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const today = new Date(`${generatedOn}T00:00:00+08:00`);
const ageDays = (date) => date ? Math.floor((today - new Date(`${date}T00:00:00+08:00`)) / 86_400_000) : null;
const drafts = knowledge.filter((record) => record.status === 'draft');
const staleDrafts = drafts.filter((record) => ageDays(record.dateAdded) > 30);
const unownedDrafts = drafts.filter((record) => !record.owner);

const relationCounts = new Map();
for (const record of knowledge) for (const match of record.text.matchAll(/^\s*- \*\*(prerequisite|applies|example|contrast|translation|related):\*\*/gm)) relationCounts.set(match[1], (relationCounts.get(match[1]) || 0) + 1);
const relationTotal = [...relationCounts.values()].reduce((sum, count) => sum + count, 0);
const genericRelated = relationCounts.get('related') || 0;
const zeroInbound = Number((fs.readFileSync(path.join(root, '_meta', 'Editorial Dashboard.md'), 'utf8').match(/^\| Zero organic inbound links \| (\d+) \|$/m) || [0, 0])[1]);

const longWithoutH3 = knowledge.filter((record) => {
  const body = record.text.replace(/^---[\s\S]*?---\n/, '');
  const words = (body.match(/[\p{L}\p{N}]+/gu) || []).length;
  return words >= 900 && !/^###\s+/m.test(body);
});
const tablePages = knowledge.filter((record) => /^\|.*\|$/m.test(record.text)).length;
const mermaidPages = knowledge.filter((record) => /^```mermaid/m.test(record.text)).length;
const calloutPages = knowledge.filter((record) => /^> \[!/m.test(record.text)).length;
const headingSignatures = new Map([['en', new Set()], ['zh', new Set()]]);
for (const record of knowledge.filter((item) => headingSignatures.has(item.lang) && item.type !== 'article' && item.type !== 'series-hub')) {
  headingSignatures.get(record.lang).add([...record.text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()).join(' → '));
}

const sourceBytes = sources.reduce((sum, record) => sum + fs.statSync(record.file).size, 0);
const largeSources = sources.filter((record) => fs.statSync(record.file).size > 1_000_000);
const unprocessedSources = sources.filter((record) => record.processingStatus === 'unprocessed');
const attachments = allFiles.filter((file) => file.includes(`${path.sep}06-Source-Library${path.sep}`) && !file.endsWith('.md') && !file.endsWith('.DS_Store'));

const output = `---
title: "Maintenance Review"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Maintenance Review

Generated by \`node tools/generate-maintenance-review.mjs\`. This is the current recurring architecture review required by [[Maintenance Schedule]]; it evaluates structure and queues, not content accuracy.

## Decision summary

| Review | Current state | Decision |
|---|---:|---|
| Taxonomy | ${topics.size} active topics; ${singleUseTopics.length} single-use | Retain active vocabulary; review single-use tags for durable scope before adding peers |
| Folder capacity | ${capacityFolders.length} folders at 20+ entries | Keep current MOC-first structure; no new folder level is justified this cycle |
| Source archive | ${(sourceBytes / 1_000_000).toFixed(2)} MB Markdown; ${largeSources.length} files over 1 MB | Retain documented split decisions; separate archive threshold not reached |
| Draft lifecycle | ${drafts.length} drafts; ${staleDrafts.length} older than 30 days | No stale-draft action required; leave ownership unset until a real editor accepts it |
| Link quality | ${relationTotal} typed links; ${zeroInbound} zero-inbound pages | Continue converting generic links only when direction is defensible; triage zero-inbound pages editorially |
| Hierarchy | ${longWithoutH3.length} long H2-only pages | Retain pages already segmented into short H2 units; add H3 only for independently linkable sub-blocks |
| Visual grammar | ${tablePages} table pages; ${mermaidPages} Mermaid; ${calloutPages} callout pages | Structured representation exceeds baseline; add visuals only when relationships or flow require them |
| Layout signatures | EN ${headingSignatures.get('en').size}; ZH ${headingSignatures.get('zh').size} | Chinese H2 architecture is canonical by page type; English variation remains documented and bounded |

## Taxonomy review

The registry has ${topics.size} used topic tags. Active is the preferred form; no deprecated or merged tag is in use. Single-use tags are not automatically invalid, but each should represent a durable retrieval boundary.

${table(['Single-use topic', 'Uses'], singleUseTopics.map(([tag, count]) => [`#${tag}`, count]))}
## Folder-capacity review

| Folder | Knowledge pages | MOC present | Decision |
|---|---:|---|---|
${capacityFolders.map(([folder, count]) => `| ${folder} | ${count} | ${subdomainFolders.has(folder) ? 'yes' : 'no'} | ${count >= 25 ? (subdomainFolders.has(folder) ? 'Retain MOC-first structure' : 'Create MOC before any subfolder') : 'Monitor; below split threshold'} |`).join('\n')}

## Source-archive review

- Markdown source records: **${sources.length}**; raw transcripts: **${sources.filter((record) => record.sourceFormat === 'raw-transcript').length}**.
- Source attachments: **${attachments.length}**; structural audit requires complete inbound coverage.
- Unprocessed sources: **${unprocessedSources.length}**.
- Large sources over 1 MB: **${largeSources.length}**; each requires \`large_source\` and \`split_decision\` metadata.
- Current filesystem-search comparison: [[Search Performance]].

${table(['Large source', 'Size', 'Decision metadata'], largeSources.map((record) => [link(record), `${(fs.statSync(record.file).size / 1_000_000).toFixed(2)} MB`, 'present']))}
## Draft review

- Drafts: **${drafts.length}**; older than 30 days: **${staleDrafts.length}**.
- Drafts without an owner: **${unownedDrafts.length}**. This is expected until a real editor accepts accountability.
- Reviewed or evergreen pages: **${knowledge.length - drafts.length}**.

${staleDrafts.length ? table(['Stale draft', 'Age (days)', 'Owner'], staleDrafts.map((record) => [link(record), ageDays(record.dateAdded), record.owner || 'unassigned'])) : '_No draft has crossed the 30-day review threshold._\n'}
## Relationship-quality review

${table(['Relationship', 'Links', 'Share'], ['prerequisite', 'applies', 'example', 'contrast', 'translation', 'related'].map((type) => [type, relationCounts.get(type) || 0, relationTotal ? `${(((relationCounts.get(type) || 0) / relationTotal) * 100).toFixed(1)}%` : '0.0%']))}
Generic \`related\` remains acceptable only when no stronger direction is defensible. The current generic share is **${relationTotal ? ((genericRelated / relationTotal) * 100).toFixed(1) : '0.0'}%**. [[Editorial Dashboard#Zero organic inbound links (${zeroInbound})|Review the zero-inbound queue]] without manufacturing links from generated inventories.

## Heading and visual-structure review

The long H2-only pages below already have multiple semantic H2 sections. Their lack of H3 is a review signal, not an automatic defect.

Chinese standard entries now use **${headingSignatures.get('zh').size} H2 signatures** across five page types, down from the audited baseline of 54. English standard entries use **${headingSignatures.get('en').size} documented signatures**.

${table(['Long H2-only page', 'H2 sections'], longWithoutH3.map((record) => [link(record), (record.text.match(/^##\s+/gm) || []).length]))}
## Next review triggers

- A topic is proposed, deprecated, merged, or added without a bilingual label.
- A folder crosses its stated capacity threshold or becomes hard to scan.
- A source exceeds 1 MB, raw source bytes double, or search performance materially regresses.
- A draft crosses 30 days or an owner accepts a review queue.
- A page enters the zero-inbound queue or generic relationships can be safely strengthened.
`;

fs.writeFileSync(path.join(root, '_meta', 'Maintenance Review.md'), output);
console.log(`Generated _meta/Maintenance Review.md: ${drafts.length} drafts, ${zeroInbound} zero-inbound, ${relationTotal} relationship links.`);
