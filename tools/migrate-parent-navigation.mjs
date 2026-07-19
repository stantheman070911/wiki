#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { loadVault, typeSet } from './lib/vault.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');
const verbose = process.argv.includes('--verbose');
const vault = loadVault(root);
if (vault.parseErrors.length) throw new Error(vault.parseErrors.join('\n'));

const knowledgeTypes = typeSet(vault.schema, 'knowledge');
const mapByFolder = new Map(Object.entries(
  vault.schema.navigation_contracts?.leaf_inventory_owners || {},
));

const hubsBySeries = new Map(vault.records
  .filter((record) => record.type === 'series-hub' && record.series)
  .map((record) => [record.series, record]));

function withoutExtension(rel) {
  return rel.replace(/\.md$/i, '');
}

function wikilink(rel, label) {
  return `[[${withoutExtension(rel)}|${label}]]`;
}

function parentFor(record) {
  if (record.type === 'series-entry') {
    const hub = hubsBySeries.get(record.series);
    if (!hub) throw new Error(`${record.rel}: series entry has no matching series hub for ${record.series}`);
    return hub;
  }
  const folder = path.posix.dirname(record.rel);
  const mapped = mapByFolder.get(folder);
  // A series hub may itself own its leaf inventory. Its own parent remains the
  // domain index; treating the inventory owner as its parent would self-link.
  if (mapped && mapped !== record.rel) {
    const recordMap = vault.records.find((candidate) => candidate.rel === mapped);
    if (!recordMap) throw new Error(`${record.rel}: configured parent map does not exist: ${mapped}`);
    return recordMap;
  }
  const indexRel = vault.schema.domains?.[record.domain]?.index;
  const index = vault.records.find((candidate) => candidate.rel === indexRel);
  if (!index) throw new Error(`${record.rel}: domain ${record.domain} has no resolvable index`);
  return index;
}

function breadcrumbFor(record, parent) {
  const domain = vault.schema.domains?.[record.domain];
  const domainIndex = vault.records.find((candidate) => candidate.rel === domain?.index);
  const parts = [wikilink('Home.md', 'Home')];
  if (domainIndex) parts.push(wikilink(domainIndex.rel, domainIndex.title.replace(/ Index$/, '')));
  if (parent.rel !== domainIndex?.rel) parts.push(wikilink(parent.rel, parent.title.replace(/ Map$/, '')));
  return `> **Up:** ${parts.join(' → ')}`;
}

function updateRecord(record, parent) {
  const frontmatter = record.text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) throw new Error(`${record.rel}: cannot add parent_map without frontmatter`);
  const document = YAML.parseDocument(frontmatter[1], { prettyErrors: true, uniqueKeys: true });
  if (document.errors.length) throw new Error(`${record.rel}: ${document.errors.map((error) => error.message).join('; ')}`);
  const desiredParent = withoutExtension(parent.rel);
  let frontmatterText = frontmatter[0].replace(/\r\n/g, '\n');
  if (document.get('parent_map') !== desiredParent) {
    document.set('parent_map', desiredParent);
    frontmatterText = `---\n${document.toString().trimEnd()}\n---\n`;
  }
  let body = record.text.slice(frontmatter[0].length);
  const breadcrumb = breadcrumbFor(record, parent);
  if (/^> \*\*Up:\*\* .*$/m.test(body)) {
    body = body.replace(/^> \*\*Up:\*\* .*$/m, breadcrumb);
  } else {
    const h1 = body.match(/^#\s+.+$/m);
    if (!h1) throw new Error(`${record.rel}: cannot add breadcrumb without H1`);
    const insertAt = h1.index + h1[0].length;
    body = `${body.slice(0, insertAt)}\n\n${breadcrumb}${body.slice(insertAt)}`;
  }
  return `${frontmatterText}${body}`;
}

let changed = 0;
const changedPaths = [];
for (const record of vault.records.filter((candidate) => knowledgeTypes.has(candidate.type))) {
  const parent = parentFor(record);
  const next = updateRecord(record, parent);
  if (next === record.text) continue;
  changed += 1;
  changedPaths.push(record.rel);
  if (write) fs.writeFileSync(record.file, next);
}

console.log(`${write ? 'Updated' : 'Would update'} ${changed} knowledge pages with canonical parent_map metadata and static breadcrumbs.`);
if (verbose) for (const rel of changedPaths) console.log(`- ${rel}`);
