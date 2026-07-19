#!/usr/bin/env node
// THE WIKI vault check — the single lint gate.
//
// Five checks, nothing else:
//   1. Every [[wikilink]] resolves to an existing file or alias.
//   2. Every tag on a knowledge page appears in _meta/tags.md.
//   3. Knowledge pages have valid `lang`, nonempty `tags`, and valid `status`.
//   4. Knowledge pages have a Source section containing at least one wikilink
//      (or an explicit "no source" marker).
//   5. No duplicate note names/aliases; no loose entries in the roots of
//      domains that use sub-topic folders (01, 03, 04).
//
// Conventions live in `Vault Conventions.md`. This script deliberately does
// not check headings, graph shape, lifecycle transitions, or anything a
// human editor is better placed to judge.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORED_DIRS = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const KNOWLEDGE_PREFIXES = [
  '01-Business-Strategy/',
  '02-Social-Media-Strategy/',
  '03-Tactics-and-Playbooks/',
  '04-Frameworks-and-Mental-Models/',
  '05-Intelligence-and-Research/',
  '07-Articles/',
  'Reports/',
];
const SUBFOLDER_REQUIRED = [
  '01-Business-Strategy',
  '03-Tactics-and-Playbooks',
  '04-Frameworks-and-Mental-Models',
];
const LANGS = new Set(['en', 'zh']);
const STATUSES = new Set(['draft', 'reviewed']);
const SOURCE_HEADINGS = [
  'source', 'source reference', 'sources in the wiki', 'derivation roots',
  '來源', 'the wiki 來源',
];
const NO_SOURCE_MARKERS = ['no source', '無來源', '无来源'];
const TAGS_FILE = '_meta/tags.md';

// ---------------------------------------------------------------- filesystem

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && IGNORED_DIRS.has(entry.name)) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

// ---------------------------------------------------------------- parsing

function parseFrontmatter(text, file, errors) {
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---', 4);
  if (end === -1) return {};
  try {
    return parseYaml(text.slice(4, end)) || {};
  } catch (error) {
    errors.push(`${file}: frontmatter does not parse (${error.message.split('\n')[0]})`);
    return {};
  }
}

function stripCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function wikilinks(text) {
  const targets = [];
  // `\|` is how a pipe is escaped inside tables; normalize before matching.
  const normalized = stripCodeBlocks(text).replace(/\\\|/g, '|');
  for (const match of normalized.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
    const target = match[1].trim();
    if (target) targets.push(target);
  }
  return targets;
}

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

// ---------------------------------------------------------------- load vault

const errors = [];
const allFiles = walk(ROOT).map(rel);
const mdFiles = allFiles.filter((file) => file.endsWith('.md'));

const pages = mdFiles.map((file) => {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const fm = parseFrontmatter(text, file, errors);
  return { file, text, fm };
});

const isKnowledge = (file) =>
  KNOWLEDGE_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
  !/(?:^|\/)[^/]*(?:Index|Map)\.md$/.test(file);

const knowledgePages = pages.filter((page) => isKnowledge(page.file));

// ------------------------------------------------- check 1: links resolve

// Resolution targets: full path (with and without .md), basename (without
// .md for notes), and frontmatter aliases — matching how Obsidian resolves.
const resolvable = new Set();
for (const file of allFiles) {
  resolvable.add(file.toLowerCase());
  resolvable.add(file.replace(/\.md$/, '').toLowerCase());
  const base = path.posix.basename(file);
  resolvable.add(base.toLowerCase());
  resolvable.add(base.replace(/\.md$/, '').toLowerCase());
}
for (const page of pages) {
  for (const alias of asList(page.fm.aliases)) resolvable.add(alias.toLowerCase());
}

let linkCount = 0;
for (const page of pages) {
  for (const target of wikilinks(page.text)) {
    linkCount += 1;
    if (!resolvable.has(target.toLowerCase())) {
      errors.push(`${page.file}: unresolved link [[${target}]]`);
    }
  }
}

// ------------------------------------------------- check 2: tags registered

const tagsPage = pages.find((page) => page.file === TAGS_FILE);
const knownTags = new Set();
if (!tagsPage) {
  errors.push(`${TAGS_FILE}: missing tag vocabulary file`);
} else {
  for (const match of tagsPage.text.matchAll(/^- ((?:topic|person|source)\/\S+)$/gm)) {
    knownTags.add(match[1]);
  }
}

for (const page of knowledgePages) {
  for (const tag of asList(page.fm.tags)) {
    if (knownTags.size && !knownTags.has(tag)) {
      errors.push(`${page.file}: tag "${tag}" is not listed in ${TAGS_FILE}`);
    }
  }
}

// ------------------------------------------------- check 3: frontmatter

for (const page of knowledgePages) {
  const { lang, status } = page.fm;
  if (!LANGS.has(lang)) errors.push(`${page.file}: lang must be en or zh (got ${JSON.stringify(lang ?? null)})`);
  if (!STATUSES.has(status)) errors.push(`${page.file}: status must be draft or reviewed (got ${JSON.stringify(status ?? null)})`);
  if (asList(page.fm.tags).length === 0) errors.push(`${page.file}: tags must be a nonempty list`);
}

// ------------------------------------------------- check 4: source section

for (const page of knowledgePages) {
  const sections = page.text.split(/^## +/m).slice(1);
  const sourceSection = sections.find((section) => {
    const heading = section.split('\n', 1)[0].trim().toLowerCase();
    return SOURCE_HEADINGS.includes(heading);
  });
  if (!sourceSection) {
    errors.push(`${page.file}: missing a Source section (## Source reference / ## 來源 / ## Sources in THE WIKI)`);
    continue;
  }
  const body = sourceSection.slice(sourceSection.indexOf('\n') + 1).toLowerCase();
  const hasLink = wikilinks(sourceSection).length > 0;
  const hasMarker = NO_SOURCE_MARKERS.some((marker) => body.includes(marker));
  if (!hasLink && !hasMarker) {
    errors.push(`${page.file}: Source section has neither a wikilink nor a "no source" marker`);
  }
}

// ------------------------------------------------- check 5: names and placement

const byBasename = new Map();
for (const file of mdFiles) {
  const base = path.posix.basename(file, '.md').toLowerCase();
  if (!byBasename.has(base)) byBasename.set(base, []);
  byBasename.get(base).push(file);
}
for (const [base, files] of byBasename) {
  if (files.length > 1) errors.push(`duplicate note name "${base}": ${files.join(', ')}`);
}

const aliasOwners = new Map();
for (const page of pages) {
  for (const alias of asList(page.fm.aliases)) {
    const key = alias.toLowerCase();
    if (byBasename.has(key) && byBasename.get(key)[0] !== page.file) {
      errors.push(`${page.file}: alias "${alias}" collides with note ${byBasename.get(key)[0]}`);
    }
    if (aliasOwners.has(key) && aliasOwners.get(key) !== page.file) {
      errors.push(`${page.file}: alias "${alias}" is already used by ${aliasOwners.get(key)}`);
    }
    aliasOwners.set(key, page.file);
  }
}

for (const domain of SUBFOLDER_REQUIRED) {
  for (const file of mdFiles) {
    if (path.posix.dirname(file) === domain && !/(?:Index|Map)\.md$/.test(file)) {
      errors.push(`${file}: entries in ${domain}/ belong in a sub-topic folder`);
    }
  }
}

// ---------------------------------------------------------------- report

console.log(`checked ${mdFiles.length} pages (${knowledgePages.length} knowledge), ${linkCount} links, ${knownTags.size} tags`);
if (errors.length) {
  console.error(`\nFAIL: ${errors.length} violations:`);
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exit(1);
}
console.log('OK');
