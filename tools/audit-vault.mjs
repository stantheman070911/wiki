#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const domainSections = [
  '01-Business-Strategy',
  '02-Social-Media-Strategy',
  '03-Tactics-and-Playbooks',
  '04-Frameworks-and-Mental-Models',
  '05-Intelligence-and-Research',
];
const countedSections = [
  ['01-Business-Strategy', 'entries'],
  ['02-Social-Media-Strategy', 'entries'],
  ['03-Tactics-and-Playbooks', 'entries'],
  ['04-Frameworks-and-Mental-Models', 'entries'],
  ['05-Intelligence-and-Research', 'entries'],
  ['06-Source-Library', 'items'],
  ['07-Articles', 'articles'],
];
const requiredReadmes = [
  ...countedSections.map(([section]) => `${section}/README.md`),
  '_Inbox/README.md',
];
const requiredFrontmatter = ['title', 'category', 'tags', 'source', 'date_added', 'status'];

const errors = [];
const warnings = [];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function frontmatter(text) {
  if (!text.startsWith('---\n')) return '';
  const end = text.indexOf('\n---', 4);
  return end === -1 ? '' : text.slice(4, end);
}

function stripQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function frontmatterValue(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? stripQuotes(match[1]) : '';
}

function frontmatterAliases(fm) {
  const aliases = [];
  const inline = fm.match(/^aliases:\s*\[(.*)\]\s*$/m);
  if (inline) {
    aliases.push(
      ...inline[1]
        .split(',')
        .map((item) => stripQuotes(item))
        .filter(Boolean),
    );
  }

  const block = fm.match(/^aliases:\s*\n((?:\s+- .*\n?)+)/m);
  if (block) {
    for (const line of block[1].split('\n')) {
      const match = line.match(/^\s+-\s+(.+)$/);
      if (match) aliases.push(stripQuotes(match[1]));
    }
  }
  return aliases;
}

function h1Title(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function withoutFragment(target) {
  return target.split('#')[0].split('^')[0].trim();
}

function candidatesForTarget(target, fromRel) {
  const clean = withoutFragment(target.replace(/\.md$/i, ''));
  const fromDir = path.posix.dirname(fromRel);
  const bases = clean.includes('/')
    ? [clean, path.posix.join(fromDir, clean)]
    : [path.posix.join(fromDir, clean), clean];
  const candidates = new Set();
  for (const base of bases) {
    const normalized = path.posix.normalize(base);
    candidates.add(`${normalized}.md`);
    candidates.add(`${normalized}/README.md`);
  }
  return [...candidates];
}

function extractWikilinks(text) {
  const links = [];
  const regex = /\[\[([^\]\n]+)\]\]/g;
  let match;
  while ((match = regex.exec(text))) {
    links.push(match[1].split('|')[0].trim());
  }
  return links;
}

function extractMarkdownLinks(text) {
  const links = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '[' || text[i + 1] === '[' || text[i - 1] === '!') continue;
    let close = i + 1;
    while (close < text.length && text[close] !== ']') close += 1;
    if (text[close] !== ']' || text[close + 1] !== '(') continue;

    let cursor = close + 2;
    let depth = 1;
    let target = '';
    while (cursor < text.length && depth > 0) {
      const char = text[cursor];
      if (char === '\\') {
        target += char + (text[cursor + 1] || '');
        cursor += 2;
        continue;
      }
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      if (depth > 0) target += char;
      cursor += 1;
    }
    if (depth === 0) links.push(target.trim());
    i = cursor;
  }
  return links;
}

function cleanMarkdownTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1);
  }
  return target.replace(/\\([()])/g, '$1');
}

function isExternalTarget(target) {
  return (
    target === '' ||
    target.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  );
}

const allFiles = walk(root);
const markdownFiles = allFiles
  .filter((file) => file.endsWith('.md'))
  .map((file) => toPosix(path.relative(root, file)));
const markdownSet = new Set(markdownFiles);
const basenameIndex = new Map();
const aliasIndex = new Map();

for (const relPath of markdownFiles) {
  const text = read(relPath);
  const fm = frontmatter(text);
  const noExt = relPath.replace(/\.md$/i, '');
  const base = path.posix.basename(noExt);
  if (!basenameIndex.has(base)) basenameIndex.set(base, []);
  basenameIndex.get(base).push(relPath);

  const title = frontmatterValue(fm, 'title') || h1Title(text);
  const aliases = [title, ...frontmatterAliases(fm)].filter(Boolean);
  for (const alias of aliases) {
    if (!aliasIndex.has(alias)) aliasIndex.set(alias, []);
    aliasIndex.get(alias).push(relPath);
  }
}

function resolveWikilink(target, fromRel) {
  const clean = withoutFragment(target.replace(/\.md$/i, ''));
  for (const candidate of candidatesForTarget(clean, fromRel)) {
    if (markdownSet.has(candidate)) return true;
  }
  if (aliasIndex.has(clean)) return true;
  const matches = basenameIndex.get(clean) || [];
  return matches.length === 1;
}

function resolveMarkdownLink(rawTarget, fromRel) {
  const target = cleanMarkdownTarget(rawTarget);
  if (isExternalTarget(target)) return true;
  let localTarget;
  try {
    localTarget = decodeURIComponent(withoutFragment(target));
  } catch {
    localTarget = withoutFragment(target);
  }
  const fromDir = path.posix.dirname(fromRel);
  const direct = path.posix.normalize(path.posix.join(fromDir, localTarget));
  const candidates = [direct];
  if (!path.posix.extname(direct)) {
    candidates.push(`${direct}.md`, `${direct}/README.md`);
  }
  return candidates.some((candidate) => fs.existsSync(path.join(root, candidate)));
}

for (const relPath of markdownFiles) {
  const text = read(relPath);
  for (const target of extractWikilinks(text)) {
    if (!resolveWikilink(target, relPath)) {
      errors.push(`${relPath}: broken wikilink [[${target}]]`);
    }
  }
  for (const target of extractMarkdownLinks(text)) {
    if (!resolveMarkdownLink(target, relPath)) {
      errors.push(`${relPath}: broken Markdown link (${target})`);
    }
  }
}

for (const relPath of requiredReadmes) {
  if (!fileExists(relPath)) {
    errors.push(`missing required README: ${relPath}`);
  }
}

for (const section of domainSections) {
  for (const relPath of markdownFiles.filter((file) => file.startsWith(`${section}/`))) {
    if (path.posix.basename(relPath) === 'README.md') continue;
    const fm = frontmatter(read(relPath));
    if (!fm) {
      errors.push(`${relPath}: missing YAML frontmatter`);
      continue;
    }
    for (const key of requiredFrontmatter) {
      if (!new RegExp(`^${key}:`, 'm').test(fm)) {
        errors.push(`${relPath}: missing frontmatter field "${key}"`);
      }
    }
  }
}

const home = fileExists('Home.md') ? read('Home.md') : '';
for (const [section, label] of countedSections) {
  const actual = markdownFiles.filter(
    (file) => file.startsWith(`${section}/`) && path.posix.basename(file) !== 'README.md',
  ).length;
  const lineRegex = new RegExp(
    `\\[\\[${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/README\\|[^\\]]+\\]\\][^\\n]*\\*\\((\\d+) ${label}\\)\\*`,
  );
  const match = home.match(lineRegex);
  if (!match) {
    errors.push(`Home.md: missing ${label} count for ${section}`);
  } else if (Number(match[1]) !== actual) {
    errors.push(`Home.md: ${section} count is ${match[1]}, expected ${actual}`);
  }
}

if (fileExists('06-Source-Library/README.md')) {
  const sourceReadme = read('06-Source-Library/README.md');
  const sourceRoot = path.join(root, '06-Source-Library');
  const actualFolders = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
  const documentedFolders = [
    ...sourceReadme.matchAll(/[├└]──\s+([^/\n]+)\//g),
  ].map((match) => match[1]).sort();

  for (const folder of actualFolders) {
    if (!documentedFolders.includes(folder)) {
      errors.push(`06-Source-Library/README.md: missing documented folder ${folder}/`);
    }
  }
  for (const folder of documentedFolders) {
    if (!actualFolders.includes(folder)) {
      errors.push(`06-Source-Library/README.md: documents missing folder ${folder}/`);
    }
  }
}

if (warnings.length) {
  console.warn(`Vault audit warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`Vault audit failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Vault audit passed: ${markdownFiles.length} Markdown files checked.`);
}
