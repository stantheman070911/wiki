#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const write = process.argv.includes('--write');
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);

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
function frontmatter(text) { const match = text.match(/^---\n([\s\S]*?)\n---/); return match?.[1] || ''; }
function scalar(fm, key) { const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm')); return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''; }
function inlineList(fm, key) { const match = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm')); return match ? match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []; }
function blockList(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\n((?:\\s+- .*\\n?)*)`, 'm'));
  return match ? match[1].split('\n').map((line) => line.match(/^\s+-\s+(.+)$/)?.[1]?.replace(/^['"]|['"]$/g, '')).filter(Boolean) : [];
}

const records = walk(root).map((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  return {
    file,
    rel: path.relative(root, file).split(path.sep).join('/'),
    text,
    type: scalar(fm, 'type'),
    title: scalar(fm, 'title'),
    series: scalar(fm, 'series'),
    aliases: [...inlineList(fm, 'aliases'), ...blockList(fm, 'aliases')],
  };
}).filter((record) => knowledgeTypes.has(record.type));

const byPath = new Map(records.map((record) => [record.rel.replace(/\.md$/, ''), record]));
const byName = new Map();
for (const record of records) {
  for (const name of new Set([path.posix.basename(record.rel, '.md'), record.title, ...record.aliases].filter(Boolean))) {
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(record);
  }
}
function resolve(raw, from) {
  const target = raw.replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim().replace(/\.md$/i, '');
  if (byPath.has(target)) return byPath.get(target);
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), target));
  if (byPath.has(relative)) return byPath.get(relative);
  const candidates = byName.get(target) || byName.get(path.posix.basename(target)) || [];
  return candidates.length === 1 ? candidates[0] : null;
}
function order(record) {
  const match = path.posix.basename(record.rel).match(/^(?:Stage|Module)-?(\d+)/i);
  return match ? Number(match[1]) : null;
}
function relationFor(from, targets) {
  if (!targets.length || targets.some((target) => !target)) return 'related';
  const fromOrder = order(from);
  if (from.type === 'series-entry' && fromOrder !== null && targets.every((target) => target.series === from.series && order(target) !== null && order(target) < fromOrder)) return 'prerequisite';
  if (from.type === 'playbook' && targets.every((target) => ['strategy', 'framework'].includes(target.type))) return 'applies';
  if (from.type === 'strategy' && targets.every((target) => target.type === 'framework')) return 'applies';
  if (from.type === 'series-entry' && targets.every((target) => target.type === 'framework')) return 'applies';
  if (from.type === 'research' && targets.every((target) => ['strategy', 'framework', 'playbook'].includes(target.type))) return 'example';
  return 'related';
}

const changedByType = new Map();
let changedFiles = 0;
let splitLines = 0;
for (const record of records) {
  let changed = false;
  const next = record.text.replace(/^(\s*)- \*\*related:\*\*(.*)$/gm, (line, indent, tail) => {
    const links = [...tail.matchAll(/\[\[([^\]\n]+)\]\]/g)];
    const targets = links.map((match) => resolve(match[1], record));
    const fromOrder = order(record);
    if (record.type === 'series-entry' && fromOrder !== null && links.length === 2 && /[｜|]/.test(tail)) {
      const splitTargets = targets.map((target, index) => ({ target, link: links[index][0] }));
      if (splitTargets.every(({ target }) => target?.series === record.series && order(target) !== null)) {
        changed = true;
        splitLines += 1;
        for (const { target } of splitTargets) {
          const type = order(target) < fromOrder ? 'prerequisite' : 'related';
          if (type !== 'related') changedByType.set(type, (changedByType.get(type) || 0) + 1);
        }
        return splitTargets.map(({ target, link }) => `${indent}- **${order(target) < fromOrder ? 'prerequisite' : 'related'}:** ${link}`).join('\n');
      }
    }
    const relation = relationFor(record, targets);
    if (relation === 'related') return line;
    changed = true;
    changedByType.set(relation, (changedByType.get(relation) || 0) + 1);
    return `${indent}- **${relation}:**${tail}`;
  });
  if (!changed) continue;
  changedFiles += 1;
  if (write) fs.writeFileSync(record.file, next);
}

const summary = [...changedByType].sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => `${type}=${count}`).join(', ');
console.log(`${write ? 'Migrated' : 'Would migrate'} ${changedFiles} files (${summary || 'no high-confidence changes'}; split series lines=${splitLines}).`);
