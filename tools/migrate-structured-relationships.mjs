#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  extractWikilinks,
  loadVault,
  replaceRelationshipSection,
  resolveWikilink,
  typeSet,
} from './lib/vault.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');
const vault = loadVault(root);
if (vault.parseErrors.length) throw new Error(vault.parseErrors.join('\n'));

const knowledgeTypes = typeSet(vault.schema, 'knowledge');
const knowledge = vault.records.filter((record) => knowledgeTypes.has(record.type));
const knowledgeByRel = new Map(knowledge.map((record) => [record.rel, record]));
const relationshipRules = vault.schema.relationships?.labels || {};
const allowedTypes = new Set(Object.keys(relationshipRules));

function withoutExtension(rel) {
  return rel.replace(/\.md$/i, '');
}

function order(record) {
  const match = path.posix.basename(record.rel).match(/^(?:Stage|Module)-?(\d+)/i);
  return match ? Number(match[1]) : null;
}

function canonicalType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  const aliases = {
    application: 'applies',
    'applied-by': 'is-applied-by',
    'prerequisite-for': 'is-prerequisite-for',
    'derived-from': 'derives-from',
    'replaced_by': 'replaced-by',
  };
  return aliases[normalized] || normalized;
}

function classifyGeneric(from, target) {
  const fromOrder = order(from);
  const targetOrder = order(target);
  if (from.type === 'article') return 'derives-from';
  if (from.type === 'series-hub' && target.type === 'series-entry' && from.series === target.series) return 'has-derivative';
  if (from.type === 'series-entry' && target.type === 'series-hub' && from.series === target.series) return 'derives-from';
  if (from.type === 'series-entry' && target.type === 'series-entry' && from.series === target.series && fromOrder !== null && targetOrder !== null && targetOrder < fromOrder) return 'prerequisite';
  if (from.type === 'playbook' && ['strategy', 'framework'].includes(target.type)) return 'applies';
  if (['strategy', 'framework'].includes(from.type) && target.type === 'playbook') return 'is-applied-by';
  if (from.type === 'strategy' && target.type === 'framework') return 'applies';
  if (from.type === 'framework' && target.type === 'strategy') return 'is-applied-by';
  if (from.type === 'series-entry' && target.type === 'framework') return 'applies';
  if (from.type === 'research' && ['strategy', 'framework', 'playbook'].includes(target.type)) return 'example';
  if (['strategy', 'framework', 'playbook'].includes(from.type) && target.type === 'research') return 'has-example';
  return 'related';
}

function resolveKnowledge(raw, from) {
  const resolution = resolveWikilink(raw, from, vault);
  return resolution.status === 'resolved' && resolution.record && knowledgeTypes.has(resolution.record.type)
    ? resolution.record
    : null;
}

function relationshipSection(body) {
  const heading = body.match(/^## (Relationships|關係)\s*$/m);
  if (!heading) return null;
  const start = heading.index;
  const contentStart = start + heading[0].length;
  const nextHeading = body.slice(contentStart).match(/^##\s+/m);
  const end = nextHeading ? contentStart + nextHeading.index : body.length;
  return { heading: heading[1], content: body.slice(contentStart, end), start, end };
}

function parseBodyRelationships(record) {
  const parsed = [];
  const section = relationshipSection(record.body);
  if (section) {
    for (const line of section.content.split('\n')) {
      const bullet = line.match(/^\s*-\s+\*\*([^:*]+):\*\*\s*(.*)$/);
      if (!bullet) continue;
      const declared = canonicalType(bullet[1]);
      for (const link of extractWikilinks(bullet[2])) {
        const target = resolveKnowledge(link.raw, record);
        if (!target || target.rel === record.rel) continue;
        parsed.push({ type: declared === 'related' ? classifyGeneric(record, target) : declared, target: withoutExtension(target.rel) });
      }
    }
  }

  if (parsed.length) return parsed;
  const bodyTargets = [];
  for (const link of extractWikilinks(record.body)) {
    const target = resolveKnowledge(link.raw, record);
    if (!target || target.rel === record.rel || bodyTargets.some((item) => item.rel === target.rel)) continue;
    bodyTargets.push(target);
  }
  if (record.type === 'article') return bodyTargets.map((target) => ({ type: 'derives-from', target: withoutExtension(target.rel) }));
  if (record.type === 'series-hub') {
    const entries = bodyTargets.filter((target) => target.type === 'series-entry' && target.series === record.series);
    if (entries.length) return entries.map((target) => ({ type: 'has-derivative', target: withoutExtension(target.rel) }));
  }
  return bodyTargets.slice(0, 1).map((target) => ({ type: classifyGeneric(record, target), target: withoutExtension(target.rel) }));
}

function normalizeStructured(record) {
  if (!Array.isArray(record.data.relationships)) return parseBodyRelationships(record);
  return record.data.relationships.map((item) => ({
    type: canonicalType(item?.type),
    target: String(item?.target || '').replace(/\.md$/i, ''),
  }));
}

const relationships = new Map(knowledge.map((record) => [record.rel, new Map()]));
function add(fromRel, type, targetRel) {
  const normalizedTarget = withoutExtension(targetRel);
  const targetRecordRel = `${normalizedTarget}.md`;
  if (!knowledgeByRel.has(fromRel) || !knowledgeByRel.has(targetRecordRel) || fromRel === targetRecordRel) return;
  if (!allowedTypes.has(type)) throw new Error(`${fromRel}: unsupported relationship type ${type}`);
  relationships.get(fromRel).set(`${type}\u0000${normalizedTarget}`, { type, target: normalizedTarget });
}

for (const record of knowledge) {
  for (const item of normalizeStructured(record)) add(record.rel, item.type, item.target);
}

for (const record of knowledge) {
  for (const item of [...relationships.get(record.rel).values()]) {
    const rule = relationshipRules[item.type];
    const inverse = rule?.inverse;
    if (!inverse) continue;
    add(`${item.target}.md`, inverse, withoutExtension(record.rel));
  }
}

// If a page pair has a stronger typed edge, remove redundant generic `related`
// edges in both directions. This preserves uncertain relationships while making
// the semantic graph prefer actionable predicates.
const strongerPairs = new Set();
for (const [fromRel, items] of relationships) {
  for (const item of items.values()) {
    if (item.type === 'related') continue;
    const pair = [withoutExtension(fromRel), item.target].sort().join('\u0000');
    strongerPairs.add(pair);
  }
}
for (const [fromRel, items] of relationships) {
  for (const [key, item] of items) {
    if (item.type !== 'related') continue;
    const pair = [withoutExtension(fromRel), item.target].sort().join('\u0000');
    if (strongerPairs.has(pair)) items.delete(key);
  }
}

function sortedItems(record) {
  return [...relationships.get(record.rel).values()].sort((a, b) => a.type.localeCompare(b.type) || a.target.localeCompare(b.target));
}

function updateRecord(record, items) {
  const frontmatter = record.text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error(`${record.rel}: missing frontmatter`);
  const document = YAML.parseDocument(frontmatter[1], { prettyErrors: true, uniqueKeys: true });
  if (document.errors.length) throw new Error(`${record.rel}: ${document.errors.map((error) => error.message).join('; ')}`);
  document.set('relationships', items);
  const nextFrontmatter = `---\n${document.toString().trimEnd()}\n---\n`;
  const virtualRecord = {
    ...record,
    data: { ...record.data, relationships: items },
    relationships: items,
  };
  return `${nextFrontmatter}${replaceRelationshipSection(virtualRecord, vault)}`;
}

let changed = 0;
let total = 0;
const counts = new Map();
for (const record of knowledge) {
  const items = sortedItems(record);
  if (!items.length) throw new Error(`${record.rel}: structured relationship migration produced no relationships`);
  total += items.length;
  for (const item of items) counts.set(item.type, (counts.get(item.type) || 0) + 1);
  const next = updateRecord(record, items);
  if (next === record.text) continue;
  changed += 1;
  if (write) fs.writeFileSync(record.file, next);
}

const related = counts.get('related') || 0;
const distribution = [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => `${type}=${count}`).join(', ');
console.log(`${write ? 'Updated' : 'Would update'} ${changed} files; ${total} structured relationships; related=${related} (${(related / total * 100).toFixed(1)}%); ${distribution}.`);
