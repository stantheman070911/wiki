#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  collectTaxonomyUsage,
  loadTaxonomyRegistry,
  sortedTerms,
} from './lib/taxonomy-registry.mjs';
import { generatedOn } from './lib/vault.mjs';

function markdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function codeTag(value) {
  return value ? `\`${value}\`` : '—';
}

export function renderTaxonomyRegistry(registry, usage, generatedOn) {
  const terms = sortedTerms(registry);
  const stateCounts = new Map(registry.lifecycle.map((state) => [state, 0]));
  let zeroUse = 0;
  const tableRows = terms.map((term) => {
    const count = usage.counts.get(term.tag) || 0;
    stateCounts.set(term.state, (stateCounts.get(term.state) || 0) + 1);
    if (count === 0) zeroUse += 1;
    return `| \`${term.tag}\` | ${markdownCell(term.labels.en)} | ${markdownCell(term.labels.zh)} | ${codeTag(term.parent)} | ${term.aliases.length ? markdownCell(term.aliases.join('; ')) : '—'} | ${term.state} | ${count} | ${markdownCell(term.definition)} | ${markdownCell(term.include_when)} | ${markdownCell(term.exclude_when)} | ${codeTag(term.replacement)} | \`${term.id}\` | ${term.approved ? 'yes' : 'no'} |`;
  });
  const stateSummary = registry.lifecycle.map((state) => `${state}: **${stateCounts.get(state) || 0}**`).join(' · ');

  return `---
title: "Tag Registry"
type: "taxonomy-registry"
domain: "meta"
lang: "en"
generated_on: "${generatedOn}"
status: "generated"
---

# Tag Registry

This is the generated human-readable view of the canonical taxonomy in \`_meta/taxonomy-registry.json\`. Edit the canonical data file, never this page, then run \`node tools/generate-taxonomy-registry.mjs\` and \`node tools/generate-topic-index.mjs\`.

## Governance rules

- Facets are \`topic/\`, \`person/\`, and \`source/\`.
- Every term has a stable ID independent of its display labels and usage count.
- A new term begins as \`proposed\` with \`approved: false\`. It may not appear on a knowledge page until overlap, aliases, spelling, parent, and definition are reviewed and the term is explicitly changed to \`active\` with \`approved: true\`.
- Aliases improve discovery but never become parallel page tags. Invalid spellings are rejected with their canonical replacement.
- Deprecated and merged terms remain in the canonical registry even at zero uses. A merged term must name an active replacement.
- Counts are computed evidence, not canonical taxonomy data.
- The canonical boundaries for known overlapping clusters are also documented in [[Architecture Schema#Taxonomy boundaries]].

## Registry status

Governed terms: **${terms.length}** · ${stateSummary} · zero-use: **${zeroUse}**

## Registry

| Tag | English label | Chinese label | Parent | Synonyms / aliases | State | Uses | Definition | Include when | Exclude when | Replacement | Stable ID | Approved |
|---|---|---|---|---|---|---:|---|---|---|---|---|---|
${tableRows.join('\n')}

## Lifecycle

\`proposed\` → \`active\` → \`deprecated\` → \`merged\`. Terms are never removed merely because their use count reaches zero. Deprecation preserves the historical term; merging additionally requires an explicit active replacement.
`;
}

export function generateTaxonomyRegistry(root = process.cwd(), { check = false } = {}) {
  const usage = collectTaxonomyUsage(root);
  const registry = loadTaxonomyRegistry(root, usage);
  const output = renderTaxonomyRegistry(registry, usage, generatedOn());
  const outputPath = path.join(root, '_meta', 'Tags.md');
  if (check) {
    if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) throw new Error('_meta/Tags.md is stale; regenerate it');
  } else {
    fs.writeFileSync(outputPath, output);
  }
  const topicCount = registry.terms.filter((term) => term.facet === 'topic').length;
  return { termCount: registry.terms.length, topicCount, outputPath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = generateTaxonomyRegistry(process.cwd(), { check: process.argv.includes('--check') });
    console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${path.relative(process.cwd(), result.outputPath)}: ${result.termCount} governed tags (${result.topicCount} topics).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
