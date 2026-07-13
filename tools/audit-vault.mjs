#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.obsidian', '.claude', 'node_modules']);
const errors = [];
const warnings = [];

const knowledgeTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'article', 'series-entry', 'series-hub']);
const standardEntryTypes = new Set(['strategy', 'playbook', 'framework', 'research', 'series-entry']);
const allowedTypes = new Set([
  ...knowledgeTypes,
  'source', 'source-manifest', 'domain-index', 'subdomain-index', 'source-index', 'article-index',
  'inbox-index', 'vault-home', 'conventions', 'taxonomy-registry', 'topic-index', 'workflow',
  'governance', 'template',
]);
const portableIndexes = new Map([
  ['Vault Conventions.md', 'conventions'],
  ['Home.md', 'vault-home'],
  ['01-Business-Strategy/Business Strategy Index.md', 'domain-index'],
  ['02-Social-Media-Strategy/Social Media Strategy Index.md', 'domain-index'],
  ['03-Tactics-and-Playbooks/Tactics and Playbooks Index.md', 'domain-index'],
  ['04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index.md', 'domain-index'],
  ['05-Intelligence-and-Research/Intelligence and Research Index.md', 'domain-index'],
  ['06-Source-Library/Source Library Index.md', 'source-index'],
  ['07-Articles/Articles Index.md', 'article-index'],
  ['_Inbox/Inbox Index.md', 'inbox-index'],
  ['_meta/Architecture Schema.md', 'governance'],
  ['_meta/Architecture Report.md', 'governance'],
  ['_meta/Architecture Program Status.md', 'governance'],
  ['_meta/Editorial Dashboard.md', 'governance'],
  ['_meta/Graph Views.md', 'governance'],
  ['_meta/Maintenance Schedule.md', 'governance'],
  ['_meta/Maintenance Review.md', 'governance'],
  ['_meta/Portable Index.md', 'governance'],
  ['_meta/Raw Source Policy.md', 'governance'],
  ['_meta/Search Performance.md', 'governance'],
  ['_meta/Source and Author Index.md', 'governance'],
  ['_meta/Tags.md', 'taxonomy-registry'],
  ['_meta/Topic-Index.md', 'topic-index'],
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function frontmatter(text) {
  if (!text.startsWith('---\n')) return '';
  const end = text.indexOf('\n---', 4);
  return end < 0 ? '' : text.slice(4, end);
}

function body(text) {
  if (!text.startsWith('---\n')) return text;
  const end = text.indexOf('\n---', 4);
  return end < 0 ? text : text.slice(end + 4);
}

function scalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function hasTopLevelKey(fm, key) {
  return new RegExp(`^${key}:`, 'm').test(fm);
}

function inlineList(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*\\[(.*?)\\]\\s*$`, 'm'));
  if (!match) return [];
  return match[1].split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function aliases(fm) {
  const result = inlineList(fm, 'aliases');
  const block = fm.match(/^aliases:\s*\n((?:\s+- .*\n?)*)/m);
  if (block) {
    for (const line of block[1].split('\n')) {
      const match = line.match(/^\s+-\s+(.+)$/);
      if (match) result.push(match[1].trim().replace(/^['"]|['"]$/g, ''));
    }
  }
  return [...new Set(result)];
}

function nestedScalar(fm, parent, key) {
  const lines = fm.split('\n');
  const start = lines.findIndex((line) => line === `${parent}:`);
  if (start < 0) return '';
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\S/.test(lines[i])) break;
    const match = lines[i].match(new RegExp(`^\\s+${key}:\\s*(.*?)\\s*$`));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

function headings(text) {
  return [...body(text).matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)].map((match) => ({ level: match[1].length, text: match[2].trim() }));
}

function extractWikilinks(text) {
  return [...text.matchAll(/(?<!!)\[\[([^\]\n]+)\]\]/g)].map((match) => match[1]);
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

const allFiles = walk(root);
const markdownFiles = allFiles.filter((file) => file.endsWith('.md')).map((file) => toPosix(path.relative(root, file)));
const markdownSet = new Set(markdownFiles);
const records = new Map();
const basenameIndex = new Map();
const nameIndex = new Map();

function addIndex(index, key, rel) {
  if (!key) return;
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(rel);
}

for (const rel of markdownFiles) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const fm = frontmatter(text);
  const record = {
    rel,
    text,
    fm,
    body: body(text),
    type: scalar(fm, 'type'),
    title: scalar(fm, 'title'),
    lang: scalar(fm, 'lang'),
    domain: scalar(fm, 'domain'),
    status: scalar(fm, 'status'),
    series: scalar(fm, 'series'),
    tags: inlineList(fm, 'tags'),
    aliases: aliases(fm),
    headings: headings(text),
  };
  records.set(rel, record);
  addIndex(basenameIndex, path.posix.basename(rel, '.md'), rel);
  addIndex(nameIndex, record.title, rel);
  for (const alias of record.aliases) addIndex(nameIndex, alias, rel);
}

function cleanTarget(raw) {
  return raw.replace(/\\\|/g, '|').split('|')[0].trim();
}

function resolveWikilink(raw, fromRel) {
  const target = cleanTarget(raw);
  const pagePart = target.split('#')[0].split('^')[0].trim().replace(/\.md$/i, '');
  if (!pagePart) return fromRel;
  const fromDir = path.posix.dirname(fromRel);
  const candidates = [];
  if (pagePart.includes('/')) {
    candidates.push(`${path.posix.normalize(pagePart)}.md`);
    candidates.push(`${path.posix.normalize(path.posix.join(fromDir, pagePart))}.md`);
  } else {
    candidates.push(`${path.posix.normalize(path.posix.join(fromDir, pagePart))}.md`);
    candidates.push(`${pagePart}.md`);
  }
  for (const candidate of candidates) if (markdownSet.has(candidate)) return candidate;
  const named = [...new Set([...(nameIndex.get(pagePart) || []), ...(basenameIndex.get(pagePart) || [])])];
  if (named.length === 1) return named[0];
  if (named.length > 1) errors.push(`${fromRel}: ambiguous wikilink [[${raw}]] matches ${named.join(', ')}`);
  return null;
}

function markdownTarget(raw, fromRel) {
  let target = raw.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  target = target.replace(/\\([()])/g, '$1');
  if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  try { target = decodeURIComponent(target.split('#')[0]); } catch { target = target.split('#')[0]; }
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), target));
}

function sectionExists(record, accepted) {
  return record.headings.some((heading) => heading.level === 2 && accepted.includes(heading.text));
}

function sectionBody(record, accepted) {
  const matches = [...record.body.matchAll(/^##\s+(.+?)\s*$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    if (!accepted.includes(matches[index][1].trim())) continue;
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : record.body.length;
    return record.body.slice(start, end);
  }
  return '';
}

function requireFields(record, keys) {
  for (const key of keys) if (!hasTopLevelKey(record.fm, key)) errors.push(`${record.rel}: missing frontmatter field "${key}" for type ${record.type}`);
}

for (const [rel, expectedType] of portableIndexes) {
  if (!records.has(rel)) errors.push(`missing required semantic page: ${rel}`);
  else if (records.get(rel).type !== expectedType) errors.push(`${rel}: expected type ${expectedType}, found ${records.get(rel).type || '[missing]'}`);
}

for (const rel of markdownFiles.filter((file) => path.posix.basename(file) === 'README.md')) {
  errors.push(`${rel}: generic README.md filenames are prohibited; use a semantic page name`);
}

const summaryAliases = ['One-line summary', 'Summary', '一句話總結'];
const contextAliases = ['Context', 'Background', 'Principle', 'Scenario', '背景', '情境', '適用情境', '這一關的處境', '這是什麼'];
const applicationAliases = ['Tactics / how to apply', 'Application', 'Implications', 'Recommended Action', '應用', '應用方式', '如何應用', '建議做法'];
const relationshipAliases = ['Relationships', 'Related entries', '關係', '相關條目'];
const sourceAliases = ['Source reference', 'Sources in THE WIKI', '來源'];
const canonicalZhH2 = new Map([
  ['strategy', ['一句話總結', '背景', '核心策略', '應用', '關係', '來源']],
  ['playbook', ['一句話總結', '背景', '執行方法', '應用', '關係', '來源']],
  ['framework', ['一句話總結', '背景', '核心模型', '應用', '關係', '來源']],
  ['research', ['一句話總結', '背景', '觀察與證據', '應用', '關係', '來源']],
  ['series-entry', ['一句話總結', '背景', '核心內容', '應用', '關係', '來源']],
]);

for (const record of records.values()) {
  if (!record.fm) {
    errors.push(`${record.rel}: missing YAML frontmatter`);
    continue;
  }
  if (!record.type) errors.push(`${record.rel}: missing explicit page type`);
  else if (!allowedTypes.has(record.type)) errors.push(`${record.rel}: unsupported page type "${record.type}"`);
  if (record.type !== 'source' && !record.headings.some((heading) => heading.level === 1)) errors.push(`${record.rel}: missing H1 title`);

  if (standardEntryTypes.has(record.type)) {
    requireFields(record, ['title', 'type', 'domain', 'lang', 'tags', 'source', 'date_added', 'updated', 'reviewed_on', 'status']);
    if (!summaryAliases.some((heading) => sectionExists(record, [heading]))) errors.push(`${record.rel}: missing shared-spine summary section`);
    if (!contextAliases.some((heading) => sectionExists(record, [heading]))) warnings.push(`${record.rel}: missing documented context/background section`);
    if (!applicationAliases.some((heading) => sectionExists(record, [heading]))) warnings.push(`${record.rel}: missing documented application/implications section`);
    if (!relationshipAliases.some((heading) => sectionExists(record, [heading]))) errors.push(`${record.rel}: missing relationships section`);
    if (!sourceAliases.some((heading) => sectionExists(record, [heading]))) errors.push(`${record.rel}: missing source section`);
  } else if (record.type === 'series-hub') {
    requireFields(record, ['title', 'type', 'domain', 'series', 'lang', 'tags', 'source', 'date_added', 'updated', 'reviewed_on', 'status']);
    if (!relationshipAliases.some((heading) => sectionExists(record, [heading]))) errors.push(`${record.rel}: series hub missing relationships section`);
    if (!sourceAliases.some((heading) => sectionExists(record, [heading]))) errors.push(`${record.rel}: series hub missing source section`);
  } else if (record.type === 'article') {
    requireFields(record, ['title', 'type', 'domain', 'lang', 'tags', 'date_added', 'updated', 'reviewed_on', 'status']);
    if (!sectionExists(record, ['Sources in THE WIKI'])) errors.push(`${record.rel}: article missing "Sources in THE WIKI"`);
  } else if (record.type === 'source') {
    requireFields(record, ['title', 'type', 'domain', 'lang', 'source_type', 'source_format', 'processing_status', 'author', 'date_archived', 'status']);
    if (/_RawTranscript\.md$/.test(record.rel) && scalar(record.fm, 'source_format') !== 'raw-transcript') errors.push(`${record.rel}: raw transcript must declare source_format: raw-transcript`);
    if (!['source-note', 'raw-transcript', 'raw-collection'].includes(scalar(record.fm, 'source_format'))) errors.push(`${record.rel}: invalid source_format`);
    const bytes = fs.statSync(path.join(root, record.rel)).size;
    if (bytes > 1_000_000 && (scalar(record.fm, 'large_source') !== 'true' || !scalar(record.fm, 'split_decision'))) errors.push(`${record.rel}: source over 1 MB requires large_source: true and split_decision`);
  } else if (record.type === 'source-manifest') {
    requireFields(record, ['title', 'type', 'domain', 'lang', 'source_type', 'source_format', 'processing_status', 'status']);
    if (!sectionExists(record, ['Processing status'])) errors.push(`${record.rel}: source manifest missing Processing status section`);
  } else if (record.type === 'domain-index') {
    requireFields(record, ['title', 'type', 'domain', 'lang']);
    if (!sectionExists(record, ['Placement rule']) || !sectionExists(record, ['Index'])) errors.push(`${record.rel}: domain index requires Placement rule and Index sections`);
  } else if (record.type === 'template') {
    requireFields(record, ['title', 'type', 'template_for', 'lang']);
    if (!['generic-knowledge', 'framework', 'playbook', 'research', 'article', 'series-entry', 'series-hub', 'source-manifest'].includes(scalar(record.fm, 'template_for'))) errors.push(`${record.rel}: unsupported template_for value`);
  }

  if (standardEntryTypes.has(record.type) || record.type === 'series-hub') {
    if (sectionExists(record, ['Related entries', '相關條目'])) errors.push(`${record.rel}: legacy relationship heading must be migrated to Relationships or 關係`);
    const relationshipText = sectionBody(record, ['Relationships', '關係']);
    for (const line of relationshipText.split('\n').filter((item) => /^\s*-\s+/.test(item) && item.includes('[['))) {
      if (!/^\s*-\s+\*\*(prerequisite|applies|example|contrast|translation|related):\*\*/.test(line)) {
        errors.push(`${record.rel}: untyped relationship line: ${line.trim()}`);
      }
    }
  }

  if (record.lang === 'zh' && canonicalZhH2.has(record.type)) {
    const actual = record.headings.filter((heading) => heading.level === 2).map((heading) => heading.text);
    const expected = canonicalZhH2.get(record.type);
    if (actual.join('\n') !== expected.join('\n')) errors.push(`${record.rel}: Chinese H2 architecture must be ${expected.join(' → ')}`);
  }

  if (knowledgeTypes.has(record.type)) {
    if (!['draft', 'reviewed', 'evergreen'].includes(record.status)) errors.push(`${record.rel}: invalid knowledge lifecycle status "${record.status}"`);
    const reviewedOn = scalar(record.fm, 'reviewed_on');
    if (record.status === 'draft' && reviewedOn) errors.push(`${record.rel}: draft must have an empty reviewed_on value`);
    if (['reviewed', 'evergreen'].includes(record.status) && !reviewedOn) errors.push(`${record.rel}: ${record.status} page requires reviewed_on`);
    const stem = path.posix.basename(record.rel, '.md');
    if (record.title && stem !== record.title && !record.aliases.includes(record.title)) errors.push(`${record.rel}: filename/title mismatch requires the full title as an alias`);
    if (stem.length > 80) errors.push(`${record.rel}: knowledge filename exceeds 80 characters (${stem.length})`);
  }
  if (record.type === 'source' && path.posix.basename(record.rel, '.md').length > 120) warnings.push(`${record.rel}: source filename exceeds 120 characters`);
}

const linkEdges = [];
const attachmentInbound = new Map();
const skipIllustrativeLinks = new Set(['template', 'workflow', 'conventions', 'governance']);
for (const record of records.values()) {
  if (!skipIllustrativeLinks.has(record.type)) {
    for (const raw of extractWikilinks(record.body)) {
      const destination = resolveWikilink(raw, record.rel);
      if (!destination) {
        errors.push(`${record.rel}: broken wikilink [[${raw}]]`);
        continue;
      }
      linkEdges.push({ from: record.rel, to: destination });
      const target = cleanTarget(raw);
      if (target.includes('#')) {
        const fragment = target.split('#').slice(1).join('#').split('^')[0].trim();
        if (fragment && !records.get(destination).headings.some((heading) => heading.text === fragment)) {
          errors.push(`${record.rel}: broken heading fragment [[${raw}]]; "${fragment}" not found in ${destination}`);
        }
      }
    }
    for (const raw of extractMarkdownLinks(record.body)) {
      const target = markdownTarget(raw, record.rel);
      if (!target) continue;
      if (!fs.existsSync(path.join(root, target))) errors.push(`${record.rel}: broken Markdown link (${raw})`);
      else attachmentInbound.set(target, (attachmentInbound.get(target) || 0) + 1);
    }
  }
}

const allowedInboxTypes = new Set(['workflow', 'inbox-index', 'vault-home', 'conventions']);
for (const record of records.values()) {
  if (!allowedInboxTypes.has(record.type) && /`_Inbox\/[^`]+`/.test(record.text)) errors.push(`${record.rel}: references a retired Inbox path`);
}

const tagVocabulary = new Set();
const tagStates = new Map();
const tagRegistry = records.get('_meta/Tags.md');
if (tagRegistry) {
  for (const match of tagRegistry.text.matchAll(/`((?:topic|person|source)\/[^`\s)]+)(?:\s|`)/g)) tagVocabulary.add(match[1]);
  for (const line of tagRegistry.text.split('\n').filter((item) => item.startsWith('| `'))) {
    const columns = line.split('|').slice(1, -1).map((item) => item.trim());
    const tag = columns[0]?.replace(/`/g, '');
    const state = columns[5];
    if (tag && ['proposed', 'active', 'deprecated', 'merged'].includes(state)) tagStates.set(tag, state);
    if (tag?.startsWith('topic/') && (!columns[1] || !columns[2] || !columns[7] || !columns[8] || !columns[9])) errors.push(`_meta/Tags.md: incomplete semantic registry row for ${tag}`);
  }
}
const activeTopics = new Set();
const topicLanguages = new Map();
for (const record of records.values()) {
  if (!knowledgeTypes.has(record.type)) continue;
  for (const tag of record.tags) {
    if (!/^(topic|person|source)\//.test(tag)) errors.push(`${record.rel}: un-faceted tag "${tag}"`);
    else if (!tagVocabulary.has(tag)) errors.push(`${record.rel}: tag "${tag}" is absent from the taxonomy registry`);
    else if (['deprecated', 'merged'].includes(tagStates.get(tag))) errors.push(`${record.rel}: uses ${tagStates.get(tag)} tag "${tag}"`);
    if (tag.startsWith('topic/')) {
      activeTopics.add(tag);
      if (!topicLanguages.has(tag)) topicLanguages.set(tag, new Set());
      topicLanguages.get(tag).add(record.lang);
    }
  }
}

const topicIndex = records.get('_meta/Topic-Index.md');
if (topicIndex) {
  const indexedTopics = new Set([...topicIndex.text.matchAll(/^\| #(topic\/[^ |]+) \|/gm)].map((match) => match[1]));
  for (const topic of activeTopics) if (!indexedTopics.has(topic)) errors.push(`_meta/Topic-Index.md: active topic missing from generated index: ${topic}`);
  for (const topic of indexedTopics) if (!activeTopics.has(topic)) errors.push(`_meta/Topic-Index.md: stale topic not used by any knowledge page: ${topic}`);
  const allHeading = topicIndex.text.match(/^## All topics \((\d+)\)$/m);
  if (!allHeading || Number(allHeading[1]) !== activeTopics.size) errors.push(`_meta/Topic-Index.md: All topics count is stale; expected ${activeTopics.size}`);
  const expectedBilingual = [...topicLanguages.values()].filter((languages) => languages.has('en') && languages.has('zh')).length;
  const expectedMonolingual = activeTopics.size - expectedBilingual;
  const bilingualHeading = topicIndex.text.match(/^## Bilingual topics \((\d+)\)$/m);
  const monolingualHeading = topicIndex.text.match(/^## Monolingual topics \((\d+)\)$/m);
  if (!bilingualHeading || Number(bilingualHeading[1]) !== expectedBilingual) errors.push(`_meta/Topic-Index.md: bilingual count is stale; expected ${expectedBilingual}`);
  if (!monolingualHeading || Number(monolingualHeading[1]) !== expectedMonolingual) errors.push(`_meta/Topic-Index.md: monolingual count is stale; expected ${expectedMonolingual}`);
}

const portableIndex = records.get('_meta/Portable Index.md');
if (portableIndex) {
  const declared = portableIndex.text.match(/access to all (\d+) knowledge pages/i);
  const expected = [...records.values()].filter((record) => knowledgeTypes.has(record.type)).length;
  if (!declared || Number(declared[1]) !== expected) errors.push(`_meta/Portable Index.md: stale knowledge count; expected ${expected}`);
}
const sourceAuthorIndex = records.get('_meta/Source and Author Index.md');
if (sourceAuthorIndex) {
  const indexed = (sourceAuthorIndex.text.match(/^\| \[\[06-Source-Library\//gm) || []).length;
  const expected = [...records.values()].filter((record) => record.type === 'source').length;
  if (indexed !== expected) errors.push(`_meta/Source and Author Index.md: expected ${expected} source rows, found ${indexed}`);
}
const articleIndex = records.get('07-Articles/Articles Index.md');
if (articleIndex) {
  const indexed = (articleIndex.text.match(/^\| \[\[07-Articles\/(?!Articles Index)/gm) || []).length;
  const expected = [...records.values()].filter((record) => record.type === 'article').length;
  if (indexed !== expected) errors.push(`07-Articles/Articles Index.md: expected ${expected} article rows, found ${indexed}`);
}

try {
  const graph = JSON.parse(fs.readFileSync(path.join(root, '.obsidian', 'graph.json'), 'utf8'));
  for (const excluded of ['06-Source-Library', '00-Templates', '_meta', '_Inbox']) {
    if (!String(graph.search || '').includes(`-path:\"${excluded}\"`)) errors.push(`.obsidian/graph.json: knowledge-only graph does not exclude ${excluded}`);
  }
  if (graph.showAttachments !== false) errors.push('.obsidian/graph.json: knowledge-only graph must hide attachments');
} catch (error) {
  errors.push(`.obsidian/graph.json: unreadable graph configuration (${error.message})`);
}

try {
  const graph = JSON.parse(fs.readFileSync(path.join(root, '.obsidian', 'graph-source-traceability.json'), 'utf8'));
  if (!String(graph.search || '').includes('06-Source-Library')) errors.push('.obsidian/graph-source-traceability.json: source preset must include the Source Library');
  if (graph.showAttachments !== true || graph.showOrphans !== true || graph.showArrow !== true) errors.push('.obsidian/graph-source-traceability.json: source preset must show attachments, orphans, and arrows');
} catch (error) {
  errors.push(`.obsidian/graph-source-traceability.json: unreadable source-traceability configuration (${error.message})`);
}

try {
  const templates = JSON.parse(fs.readFileSync(path.join(root, '.obsidian', 'templates.json'), 'utf8'));
  if (templates.folder !== '00-Templates') errors.push('.obsidian/templates.json: Templates folder must be 00-Templates');
} catch (error) {
  errors.push(`.obsidian/templates.json: unreadable Templates configuration (${error.message})`);
}

try {
  const corePlugins = JSON.parse(fs.readFileSync(path.join(root, '.obsidian', 'core-plugins.json'), 'utf8'));
  if (corePlugins.templates !== true) errors.push('.obsidian/core-plugins.json: Templates core plugin must be enabled');
} catch (error) {
  errors.push(`.obsidian/core-plugins.json: unreadable core-plugin configuration (${error.message})`);
}

const incoming = new Map(markdownFiles.map((rel) => [rel, []]));
for (const edge of linkEdges) incoming.get(edge.to)?.push(edge.from);
const sources = [...records.values()].filter((record) => record.type === 'source');
for (const source of sources) {
  const direct = incoming.get(source.rel) || [];
  const directlyCovered = direct.some((rel) => knowledgeTypes.has(records.get(rel)?.type) || records.get(rel)?.type === 'source-manifest');
  const transitivelyCovered = direct.some((rel) => records.get(rel)?.type === 'source' && (incoming.get(rel) || []).some((parent) => knowledgeTypes.has(records.get(parent)?.type)));
  if (!directlyCovered && !transitivelyCovered && !['unprocessed', 'exempt'].includes(scalar(source.fm, 'processing_status'))) {
    errors.push(`${source.rel}: processed source has no inbound knowledge, manifest, or covered canonical-source link`);
  }
}

for (const record of records.values()) {
  if (!standardEntryTypes.has(record.type) && record.type !== 'series-hub') continue;
  const sourceText = sectionBody(record, ['Source reference', '來源']);
  const hasWikiSource = extractWikilinks(sourceText).some((raw) => {
    const target = resolveWikilink(raw, record.rel);
    return target && ['source', 'source-manifest'].includes(records.get(target)?.type);
  });
  const hasAttachment = extractMarkdownLinks(sourceText).some((raw) => {
    const target = markdownTarget(raw, record.rel);
    return target && target.startsWith('06-Source-Library/') && fs.existsSync(path.join(root, target));
  });
  const hasUrl = Boolean(nestedScalar(record.fm, 'source', 'url'));
  if (!hasWikiSource && !hasAttachment && !hasUrl && !/source unavailable/i.test(sourceText)) errors.push(`${record.rel}: source section lacks a navigable archive link, URL, or explicit source-unavailable marker`);
}

const sourceAttachments = allFiles
  .map((file) => toPosix(path.relative(root, file)))
  .filter((rel) => rel.startsWith('06-Source-Library/') && !rel.endsWith('.md') && !rel.endsWith('.DS_Store'));
for (const attachment of sourceAttachments) if (!attachmentInbound.has(attachment)) errors.push(`${attachment}: retained attachment has no inbound Markdown link or manifest entry`);

const expectedSourceFolders = new Map([
  ['book', 'Books'], ['workbook', 'Books'], ['conversation', 'Conversations'], ['course', 'Courses'],
  ['diagram', 'Diagrams'], ['essay', 'Essays'], ['essays', 'Essays'], ['podcast', 'Podcasts'],
  ['playlist', 'Podcasts'], ['talk', 'Podcasts'], ['presentation', 'Presentations'], ['video', 'Videos'],
]);
for (const source of sources) {
  const sourceType = scalar(source.fm, 'source_type');
  const expected = expectedSourceFolders.get(sourceType);
  const actual = source.rel.split('/')[1];
  if (expected && actual !== expected) errors.push(`${source.rel}: source_type ${sourceType} belongs in 06-Source-Library/${expected}/`);
}

const expectedDomainFolders = new Map([
  ['business-strategy', '01-Business-Strategy/'], ['social-media-strategy', '02-Social-Media-Strategy/'],
  ['tactics-and-playbooks', '03-Tactics-and-Playbooks/'], ['frameworks-and-mental-models', '04-Frameworks-and-Mental-Models/'],
  ['intelligence-and-research', '05-Intelligence-and-Research/'], ['articles', '07-Articles/'], ['source-library', '06-Source-Library/'],
]);
for (const record of records.values()) {
  const expected = expectedDomainFolders.get(record.domain);
  if (expected && !record.rel.startsWith(expected)) errors.push(`${record.rel}: domain ${record.domain} conflicts with folder placement`);
}

const seriesGroups = new Map();
for (const record of records.values()) {
  if (!record.series) continue;
  if (!seriesGroups.has(record.series)) seriesGroups.set(record.series, { hubs: [], entries: [] });
  seriesGroups.get(record.series)[record.type === 'series-hub' ? 'hubs' : 'entries'].push(record);
}
for (const [series, group] of seriesGroups) {
  if (group.hubs.length !== 1) errors.push(`series ${series}: expected exactly one series hub, found ${group.hubs.length}`);
  if (group.hubs.length !== 1) continue;
  const hub = group.hubs[0];
  const hubTargets = new Set(linkEdges.filter((edge) => edge.from === hub.rel).map((edge) => edge.to));
  for (const entry of group.entries) {
    const entryTargets = new Set(linkEdges.filter((edge) => edge.from === entry.rel).map((edge) => edge.to));
    if (!entryTargets.has(hub.rel)) errors.push(`${entry.rel}: series entry does not link its hub ${hub.rel}`);
    if (!hubTargets.has(entry.rel)) errors.push(`${hub.rel}: series hub does not list ${entry.rel}`);
  }
}

const aliasOwners = new Map();
for (const record of records.values()) {
  for (const alias of record.aliases) {
    if (!aliasOwners.has(alias)) aliasOwners.set(alias, []);
    aliasOwners.get(alias).push(record.rel);
  }
}
for (const [alias, owners] of aliasOwners) if (owners.length > 1) errors.push(`alias collision "${alias}": ${owners.join(', ')}`);

const typeCounts = new Map();
const statusCounts = new Map();
for (const record of records.values()) {
  typeCounts.set(record.type || '[missing]', (typeCounts.get(record.type || '[missing]') || 0) + 1);
  if (knowledgeTypes.has(record.type)) statusCounts.set(record.status || '[missing]', (statusCounts.get(record.status || '[missing]') || 0) + 1);
}

console.log(`Architecture summary: ${markdownFiles.length} Markdown pages, ${activeTopics.size} active topics, ${sources.length} source records, ${sourceAttachments.length} attachments.`);
console.log(`Page types: ${[...typeCounts].sort().map(([key, value]) => `${key}=${value}`).join(', ')}`);
console.log(`Knowledge status: ${[...statusCounts].sort().map(([key, value]) => `${key}=${value}`).join(', ')}`);

if (warnings.length) {
  console.warn(`Vault audit warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (errors.length) {
  console.error(`Vault audit failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Vault audit passed with zero structural errors.');
}
