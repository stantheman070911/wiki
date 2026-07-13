#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const write = process.argv.includes('--write');
const ignored = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const supportedTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'series-entry']);
const coreLabels = new Map([
  ['strategy', '核心策略'],
  ['playbook', '執行方法'],
  ['framework', '核心模型'],
  ['research', '觀察與證據'],
  ['series-entry', '核心內容'],
]);
const aliases = {
  summary: ['一句話總結'],
  context: ['背景', '情境', '適用情境', '這一關的處境', '這是什麼'],
  application: ['應用', '應用方式', '如何應用', '建議做法'],
  relationships: ['關係', '相關條目'],
  source: ['來源'],
};

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
function frontmatter(text) { return text.match(/^---\n([\s\S]*?)\n---/)?.[1] || ''; }
function scalar(fm, key) { const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm')); return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''; }
function splitDocument(text) {
  const fm = text.match(/^---\n[\s\S]*?\n---\n?/);
  return { header: fm?.[0] || '', body: fm ? text.slice(fm[0].length) : text };
}
function sections(body) {
  const matches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  if (!matches.length) return { prefix: body, items: [] };
  return {
    prefix: body.slice(0, matches[0].index).trimEnd(),
    items: matches.map((match, index) => ({
      heading: match[1].trim(),
      content: body.slice(match.index + match[0].length, index + 1 < matches.length ? matches[index + 1].index : body.length).trim(),
    })),
  };
}
function find(items, names) { return items.find((item) => names.includes(item.heading)); }
function demote(content) { return content.replace(/^(#{3,5})(\s+)/gm, '#$1$2'); }
function renderSection(heading, content) { return `## ${heading}\n\n${content.trim()}`; }
function signature(text) { return [...text.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim()).join(' → '); }

let changedPages = 0;
let convertedSections = 0;
const before = new Set();
const after = new Set();
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const fm = frontmatter(text);
  const type = scalar(fm, 'type');
  if (scalar(fm, 'lang') !== 'zh' || !supportedTypes.has(type)) continue;
  before.add(signature(text));
  const { header, body } = splitDocument(text);
  const parsed = sections(body);
  const summary = find(parsed.items, aliases.summary);
  const context = find(parsed.items, aliases.context);
  const application = find(parsed.items, aliases.application);
  const relationships = find(parsed.items, aliases.relationships);
  const source = find(parsed.items, aliases.source);
  if (![summary, context, application, relationships, source].every(Boolean)) throw new Error(`Cannot normalize ${path.relative(root, file)}: shared-spine section missing`);
  const spine = new Set([summary, context, application, relationships, source]);
  const extras = parsed.items.filter((item) => !spine.has(item));
  const coreLabel = coreLabels.get(type);
  const coreParts = [];
  for (const item of extras) {
    if (item.heading === coreLabel) coreParts.push(item.content.trim());
    else {
      convertedSections += 1;
      coreParts.push(`### ${item.heading}\n\n${demote(item.content)}`);
    }
  }
  if (!coreParts.length) coreParts.push('_No additional type-specific section._');
  const normalizedBody = [
    parsed.prefix,
    renderSection('一句話總結', summary.content),
    renderSection('背景', context.content),
    renderSection(coreLabel, coreParts.join('\n\n')),
    renderSection('應用', application.content),
    renderSection('關係', relationships.content),
    renderSection('來源', source.content),
  ].join('\n\n') + '\n';
  const normalized = header + normalizedBody;
  after.add(signature(normalized));
  if (normalized === text) continue;
  changedPages += 1;
  if (write) fs.writeFileSync(file, normalized);
}

console.log(`${write ? 'Normalized' : 'Would normalize'} ${changedPages} Chinese pages; converted ${convertedSections} page-specific H2 sections; signatures ${before.size} -> ${after.size}.`);
