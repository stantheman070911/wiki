#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, '_meta', 'Topic-Index.md');
const includedTypes = new Set([
  'strategy',
  'playbook',
  'framework',
  'research',
  'article',
  'series-entry',
  'series-hub',
]);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.obsidian', '.claude', 'node_modules'].includes(entry.name)) continue;
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

function tags(fm) {
  const match = fm.match(/^tags:\s*\[(.*?)\]\s*$/m);
  if (!match) return [];
  return match[1].split(',').map((tag) => tag.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

const topics = new Map();
for (const file of walk(root)) {
  const fm = frontmatter(fs.readFileSync(file, 'utf8'));
  const type = scalar(fm, 'type');
  if (!includedTypes.has(type)) continue;
  const lang = scalar(fm, 'lang');
  for (const tag of tags(fm).filter((tag) => tag.startsWith('topic/'))) {
    if (!topics.has(tag)) topics.set(tag, { en: 0, zh: 0, other: 0, state: 'active' });
    const row = topics.get(tag);
    if (lang === 'en') row.en += 1;
    else if (lang === 'zh') row.zh += 1;
    else row.other += 1;
  }
}

const registryText = fs.readFileSync(path.join(root, '_meta', 'Tags.md'), 'utf8');
for (const line of registryText.split('\n')) {
  if (!line.startsWith('| `topic/')) continue;
  const columns = line.split('|').slice(1, -1).map((item) => item.trim());
  const tag = columns[0]?.replace(/`/g, '');
  const state = columns[5];
  if (!tag || !['proposed', 'active', 'deprecated', 'merged'].includes(state)) continue;
  if (!topics.has(tag)) topics.set(tag, { en: 0, zh: 0, other: 0, state });
  else topics.get(tag).state = state;
}

const rows = [...topics.entries()].sort(([a], [b]) => a.localeCompare(b));
const active = rows.filter(([, counts]) => counts.state === 'active');
const bilingual = active.filter(([, counts]) => counts.en > 0 && counts.zh > 0);
const monolingual = active.filter(([, counts]) => !(counts.en > 0 && counts.zh > 0));
const deprecated = rows.filter(([, counts]) => counts.state === 'deprecated');

function table(items) {
  if (!items.length) return '_None._\n';
  return [
    '| Topic | EN | ZH | Total | State |',
    '|---|---:|---:|---:|---|',
    ...items.map(([tag, counts]) => `| #${tag} | ${counts.en} | ${counts.zh} | ${counts.en + counts.zh + counts.other} | ${counts.state} |`),
    '',
  ].join('\n');
}

const generatedOn = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());

const generated = `---
title: "Topic Index"
type: "topic-index"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Topic Index

This is the complete, generated topic-navigation layer for THE WIKI. Select any tag to open Obsidian's tag results. Do not edit counts or topic lists here; update entry metadata or the governed registry in [[Tags]], then run \`node tools/generate-topic-index.mjs\`.

## All topics (${active.length})

${table(active)}
## Bilingual topics (${bilingual.length})

Topics currently used by at least one English and one Chinese page.

${table(bilingual)}
## Monolingual topics (${monolingual.length})

Topics currently used in one language only. They remain part of the complete taxonomy.

${table(monolingual)}
## Deprecated topics (${deprecated.length})

Deprecated topics remain visible for migration and audit purposes but must not be added to new pages.

${table(deprecated)}`;

fs.writeFileSync(outputPath, generated);
console.log(`Generated ${path.relative(root, outputPath)}: ${active.length} active topics (${bilingual.length} bilingual, ${monolingual.length} monolingual, ${deprecated.length} deprecated).`);
