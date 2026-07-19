#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  collectTaxonomyUsage,
  loadTaxonomyRegistry,
  sortedTerms,
  usageFor,
} from './lib/taxonomy-registry.mjs';
import { generatedOn } from './lib/vault.mjs';

function markdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function activeTable(items, usage) {
  if (!items.length) return '_None._\n';
  return [
    '| Topic | English | 中文 | Parent | EN | ZH | Total | State |',
    '|---|---|---|---|---:|---:|---:|---|',
    ...items.map((term) => {
      const counts = usageFor(usage, term.tag);
      return `| #${term.tag} | ${markdownCell(term.labels.en)} | ${markdownCell(term.labels.zh)} | ${term.parent ? `#${term.parent}` : '—'} | ${counts.en} | ${counts.zh} | ${counts.total} | ${term.state} |`;
    }),
    '',
  ].join('\n');
}

function lifecycleTable(items, usage) {
  if (!items.length) return '_None._\n';
  return [
    '| Topic | English | 中文 | Parent | Uses | State | Replacement | Stable ID | Approved |',
    '|---|---|---|---|---:|---|---|---|---|',
    ...items.map((term) => `| \`${term.tag}\` | ${markdownCell(term.labels.en)} | ${markdownCell(term.labels.zh)} | ${term.parent ? `\`${term.parent}\`` : '—'} | ${usage.counts.get(term.tag) || 0} | ${term.state} | ${term.replacement ? `\`${term.replacement}\`` : '—'} | \`${term.id}\` | ${term.approved ? 'yes' : 'no'} |`),
    '',
  ].join('\n');
}

function hierarchy(registry, usage) {
  const active = sortedTerms(registry, 'topic').filter((term) => term.state === 'active' && term.approved);
  const activeTags = new Set(active.map((term) => term.tag));
  const children = new Map();
  for (const term of active) {
    const parent = term.parent && activeTags.has(term.parent) ? term.parent : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(term);
  }
  for (const values of children.values()) values.sort((a, b) => a.tag.localeCompare(b.tag));
  const lines = [];
  function append(term, depth) {
    const count = usage.counts.get(term.tag) || 0;
    lines.push(`${'  '.repeat(depth)}- #${term.tag} — ${markdownCell(term.labels.en)} / ${markdownCell(term.labels.zh)} (${count} use${count === 1 ? '' : 's'})`);
    for (const child of children.get(term.tag) || []) append(child, depth + 1);
  }
  for (const root of children.get(null) || []) append(root, 0);
  return lines.length ? `${lines.join('\n')}\n` : '_None._\n';
}

export function renderTopicIndex(registry, usage, generatedOn) {
  const topics = sortedTerms(registry, 'topic');
  const activeUsed = topics.filter((term) => term.state === 'active' && term.approved && (usage.counts.get(term.tag) || 0) > 0);
  const bilingual = activeUsed.filter((term) => {
    const counts = usageFor(usage, term.tag);
    return counts.en > 0 && counts.zh > 0;
  });
  const monolingual = activeUsed.filter((term) => {
    const counts = usageFor(usage, term.tag);
    return !(counts.en > 0 && counts.zh > 0);
  });
  const unused = topics.filter((term) => (usage.counts.get(term.tag) || 0) === 0);
  const proposed = topics.filter((term) => term.state === 'proposed');
  const deprecated = topics.filter((term) => term.state === 'deprecated');
  const merged = topics.filter((term) => term.state === 'merged');

  return `---
title: "Topic Index"
type: "topic-index"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Topic Index

This is the generated topic-navigation layer for THE WIKI. It is derived directly from \`_meta/taxonomy-registry.json\` plus current page metadata. Select an active tag to open Obsidian's tag results. Edit neither this page nor [[Tags]] by hand.

## All topics

Count: **${activeUsed.length}**.

Active, explicitly approved topics currently used by at least one knowledge page.

${activeTable(activeUsed, usage)}
## Topic hierarchy

Count: **${topics.filter((term) => term.state === 'active' && term.approved).length}**.

Parent-child relationships for every approved active topic, including zero-use terms.

${hierarchy(registry, usage)}
## Bilingual topics

Count: **${bilingual.length}**.

Topics currently used by at least one English and one Chinese page.

${activeTable(bilingual, usage)}
## Monolingual topics

Count: **${monolingual.length}**.

Topics currently used in one language only. Zero-use terms are tracked separately below.

${activeTable(monolingual, usage)}
## Unused topics

Count: **${unused.length}**.

Canonical topic terms with zero current page uses. They remain visible regardless of lifecycle state.

${lifecycleTable(unused, usage)}
## Proposed topics

Count: **${proposed.length}**.

Proposed topics are retained for review but cannot be used until explicitly activated and approved.

${lifecycleTable(proposed, usage)}
## Deprecated topics

Count: **${deprecated.length}**.

Deprecated topics remain visible for migration and audit purposes but must not be added to pages.

${lifecycleTable(deprecated, usage)}
## Merged topics

Count: **${merged.length}**.

Merged topics retain their stable identity and point to an approved active replacement.

${lifecycleTable(merged, usage)}`;
}

export function generateTopicIndex(root = process.cwd(), { check = false } = {}) {
  const usage = collectTaxonomyUsage(root);
  const registry = loadTaxonomyRegistry(root, usage);
  const output = renderTopicIndex(registry, usage, generatedOn());
  const outputPath = path.join(root, '_meta', 'Topic-Index.md');
  if (check) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) throw new Error('_meta/Topic-Index.md is stale; regenerate it');
  } else {
    fs.writeFileSync(outputPath, output);
  }
  return {
    active: registry.terms.filter((term) => term.facet === 'topic' && term.state === 'active' && term.approved && (usage.counts.get(term.tag) || 0) > 0).length,
    outputPath,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = generateTopicIndex(process.cwd(), { check: process.argv.includes('--check') });
    console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${path.relative(process.cwd(), result.outputPath)}: ${result.active} used active topics.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
