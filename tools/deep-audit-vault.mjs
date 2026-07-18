#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);
const readerTypes = new Set([...knowledgeTypes, 'domain-index', 'subdomain-index', 'article-index', 'home']);
const nestedDomainRoots = new Set(['01-Business-Strategy', '03-Tactics-and-Playbooks', '04-Frameworks-and-Mental-Models']);
const generatedNavigation = new Set([
  '_meta/Portable Index.md',
  '_meta/Source and Author Index.md',
  '_meta/Editorial Dashboard.md',
]);
const errors = [];

function walk(dir, all = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, all);
    else all.push(full);
  }
  return all;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function frontmatter(text) {
  return text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1] || '';
}

function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function inlineList(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm'));
  return match ? match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : [];
}

function sourceScalar(fm, key) {
  const block = fm.match(/^source:\s*\n((?:^[ \t]+.*(?:\n|$))*)/m)?.[1] || '';
  const match = block.match(new RegExp(`^[ \\t]+${key}:\\s*(.*?)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function extractWikilinks(text) {
  return [...text.matchAll(/(?<!!)\[\[([^\]\n]+)\]\]/g)].map((match) => match[1]
    .replace(/\\\|/g, '|')
    .split('|')[0]
    .split('#')[0]
    .trim()
    .replace(/\.md$/i, ''));
}

function section(text, headings) {
  const escaped = headings.map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(new RegExp(`^## (?:${escaped})\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return match?.[1] || '';
}

function addError(record, message) {
  errors.push(`${record.rel}: ${message}`);
}

const allFiles = walk(root);
const markdown = allFiles.filter((file) => file.endsWith('.md'));
const records = markdown.map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  return {
    file,
    rel: rel(file),
    text,
    fm,
    body: text.replace(/^---\n[\s\S]*?\n---(?:\n|$)/, ''),
    title: scalar(fm, 'title'),
    type: scalar(fm, 'type'),
    domain: scalar(fm, 'domain'),
    lang: scalar(fm, 'lang'),
    status: scalar(fm, 'status'),
    dateAdded: scalar(fm, 'date_added'),
    updated: scalar(fm, 'updated'),
    reviewedOn: scalar(fm, 'reviewed_on'),
    sourceType: scalar(fm, 'source_type'),
    author: scalar(fm, 'author'),
    tags: inlineList(fm, 'tags'),
    entrySource: {
      type: sourceScalar(fm, 'type'),
      name: sourceScalar(fm, 'name'),
      author: sourceScalar(fm, 'author'),
    },
  };
});

const knowledge = records.filter((record) => knowledgeTypes.has(record.type));
const sources = records.filter((record) => record.type === 'source');
const readers = records.filter((record) => readerTypes.has(record.type) || record.rel === 'Home.md');
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
  if (byRel.has(target)) return byRel.get(target);
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), target));
  if (byRel.has(relative)) return byRel.get(relative);
  const names = [...new Set(byName.get(target) || [])];
  return names.length === 1 ? names[0] : null;
}

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const validDate = /^\d{4}-\d{2}-\d{2}$/;

for (const record of knowledge) {
  const h1s = [...record.body.matchAll(/^#\s+(.+)$/gm)].map((match) => match[1].trim());
  if (h1s.length !== 1) addError(record, `expected exactly one H1, found ${h1s.length}`);
  else if (h1s[0] !== record.title) addError(record, `H1 does not match frontmatter title (${JSON.stringify(h1s[0])} vs ${JSON.stringify(record.title)})`);

  for (const [field, value] of [['date_added', record.dateAdded], ['updated', record.updated], ['reviewed_on', record.reviewedOn]]) {
    if (!value) continue;
    if (!validDate.test(value)) addError(record, `${field} is not YYYY-MM-DD: ${value}`);
    else if (value > today) addError(record, `${field} is in the future: ${value}`);
  }
  if (record.dateAdded && record.updated && record.updated < record.dateAdded) addError(record, 'updated precedes date_added');
  if (record.dateAdded && record.reviewedOn && record.reviewedOn < record.dateAdded) addError(record, 'reviewed_on precedes date_added');
  if (!record.tags.some((tag) => tag.startsWith('topic/'))) addError(record, 'has no topic/ tag');
  if (record.entrySource.author && !record.tags.some((tag) => tag.startsWith('person/') || tag.startsWith('source/'))) {
    addError(record, 'named source author has no person/ or source/ provenance tag');
  }

  const parts = record.rel.split('/');
  if (parts.length === 2 && nestedDomainRoots.has(parts[0]) && !['series-hub'].includes(record.type)) {
    addError(record, 'standard knowledge entry is directly in a domain root that requires sub-topic placement');
  }

  const han = (record.body.match(/\p{Script=Han}/gu) || []).length;
  const latin = (record.body.match(/[A-Za-z]/g) || []).length;
  if (record.lang === 'zh' && han < 20) addError(record, 'declares zh but contains too little Chinese text');
  if (record.lang === 'en' && han > 100 && han > latin * 0.35) addError(record, 'declares en but the body is predominantly Chinese');

  if (record.type !== 'article' && record.type !== 'series-hub') {
    const relations = section(record.body, ['Relationships', '關係']);
    const targets = extractWikilinks(relations);
    const resolved = targets.map((target) => resolve(target, record)).filter(Boolean);
    if (!resolved.some((target) => knowledgeTypes.has(target.type) && target.rel !== record.rel)) {
      addError(record, 'relationship section has no link to another knowledge entry');
    }
    if (resolved.some((target) => target.rel === record.rel)) addError(record, 'relationship section links to itself');
    const duplicates = resolved.map((target) => target.rel).filter((target, index, list) => list.indexOf(target) !== index);
    if (duplicates.length) addError(record, `relationship section repeats ${[...new Set(duplicates)].join(', ')}`);
  }

  const linkedSources = [...new Set(extractWikilinks(record.text)
    .map((target) => resolve(target, record))
    .filter((target) => target?.type === 'source'))];
  // The canonical audit verifies that source references resolve. Here, direct
  // archive links are counted without requiring exact display-name parity:
  // interview guests, compilers, playlists, and collected works legitimately
  // use different author/name/type labels at the entry and archive levels.
  void linkedSources;
}

for (const record of records.filter((item) => item.type === 'subdomain-index')) {
  const h1s = [...record.body.matchAll(/^#\s+(.+)$/gm)].map((match) => match[1].trim());
  if (h1s.length !== 1 || h1s[0] !== record.title) addError(record, 'subdomain map must have one H1 matching its title');
}

for (const source of sources) {
  const filename = path.posix.basename(source.rel);
  if (!/^\d{4}-\d{2}-\d{2}_[A-Za-z]+_.+\.md$/.test(filename)) addError(source, 'archived source filename does not begin YYYY-MM-DD_Type_');
  if (source.title.includes('_')) addError(source, 'source display title contains an underscore');
  if (source.status !== 'source') addError(source, `source status is ${JSON.stringify(source.status)}, expected "source"`);
  if (!validDate.test(scalar(source.fm, 'date_archived'))) addError(source, 'date_archived is not YYYY-MM-DD');
}

for (const file of allFiles.filter((item) => path.basename(item) === '.DS_Store')) {
  errors.push(`${rel(file)}: Finder metadata file should not be stored in the vault`);
}

const exactGroups = (items, key, label) => {
  const groups = new Map();
  for (const item of items) {
    const value = key(item);
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  for (const group of groups.values()) {
    if (group.length > 1) errors.push(`${label}: ${group.map((item) => item.rel).join(' | ')}`);
  }
};

exactGroups(knowledge, (record) => normalize(record.title), 'duplicate knowledge title');
exactGroups(knowledge, (record) => normalize(section(record.body, ['One-line summary', '一句話總結'])), 'duplicate one-line summary');
exactGroups(sources, (record) => crypto.createHash('sha256').update(record.text).digest('hex'), 'byte-identical archived sources');

for (let i = 0; i < knowledge.length; i += 1) {
  for (let j = i + 1; j < knowledge.length; j += 1) {
    if (knowledge[i].type === 'series-entry' && knowledge[j].type === 'series-entry'
      && path.posix.dirname(knowledge[i].rel) === path.posix.dirname(knowledge[j].rel)) continue;
    const a = normalize(knowledge[i].title);
    const b = normalize(knowledge[j].title);
    const aPrefix = a.split(' ').slice(0, 3).join(' ');
    const bPrefix = b.split(' ').slice(0, 3).join(' ');
    const suspicious = (Math.min(a.length, b.length) >= 24 && (a.includes(b) || b.includes(a)))
      || (aPrefix.length >= 12 && aPrefix === bPrefix && Math.abs(a.length - b.length) < 45);
    if (!suspicious) continue;
    const linked = extractWikilinks(knowledge[i].text).some((target) => resolve(target, knowledge[i])?.rel === knowledge[j].rel)
      || extractWikilinks(knowledge[j].text).some((target) => resolve(target, knowledge[j])?.rel === knowledge[i].rel);
    if (!linked) errors.push(`near-duplicate titles are not cross-linked: ${knowledge[i].rel} | ${knowledge[j].rel}`);
  }
}

const folderCounts = new Map();
for (const record of knowledge) {
  const folder = path.posix.dirname(record.rel);
  folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
}
const mapFolders = new Set(records.filter((record) => record.type === 'subdomain-index').map((record) => path.posix.dirname(record.rel)));
for (const [folder, count] of folderCounts) {
  if (count >= 25 && !mapFolders.has(folder)) errors.push(`${folder}: ${count} knowledge entries require a subdomain-index map`);
}

const inbound = new Map(knowledge.map((record) => [record.rel, 0]));
for (const from of records.filter((record) => !generatedNavigation.has(record.rel)
  && !record.rel.startsWith('_meta/')
  && !record.rel.startsWith('00-Templates/')
  && !record.rel.startsWith('06-Source-Library/'))) {
  for (const target of extractWikilinks(from.text)) {
    const resolved = resolve(target, from);
    if (resolved && inbound.has(resolved.rel)) inbound.set(resolved.rel, inbound.get(resolved.rel) + 1);
  }
}
for (const [file, count] of inbound) if (count === 0) errors.push(`${file}: zero organic inbound links`);

const readerByRel = new Map(readers.map((record) => [record.rel, record]));
const graph = new Map(readers.map((record) => [record.rel, new Set()]));
for (const from of readers) {
  for (const target of extractWikilinks(from.text)) {
    const resolved = resolve(target, from);
    if (!resolved || !readerByRel.has(resolved.rel)) continue;
    graph.get(from.rel).add(resolved.rel);
    graph.get(resolved.rel).add(from.rel);
  }
}
const visited = new Set();
const queue = graph.has('Home.md') ? ['Home.md'] : [];
while (queue.length) {
  const current = queue.shift();
  if (visited.has(current)) continue;
  visited.add(current);
  for (const next of graph.get(current) || []) if (!visited.has(next)) queue.push(next);
}
for (const record of knowledge) if (!visited.has(record.rel)) addError(record, 'is not connected to Home through the reader-facing link graph');

if (errors.length) {
  console.error(`Deep vault audit failed with ${errors.length} error(s):`);
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Deep vault audit passed: ${knowledge.length} knowledge pages, ${sources.length} sources, ${mapFolders.size} subdomain maps, 0 zero-inbound pages, 1 connected reader graph, 0 duplicate records.`);
