import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const DEFAULT_SCHEMA_PATH = '_meta/vault-schema.yaml';

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export function generatedOn(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function normalizeIdentity(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function loadSchema(root = process.cwd(), schemaPath = DEFAULT_SCHEMA_PATH) {
  const absolute = path.resolve(root, schemaPath);
  const document = YAML.parseDocument(fs.readFileSync(absolute, 'utf8'), {
    prettyErrors: true,
    uniqueKeys: true,
  });
  if (document.errors.length) {
    throw new Error(`Invalid vault schema ${toPosix(path.relative(root, absolute))}: ${document.errors.map((error) => error.message).join('; ')}`);
  }
  const schema = document.toJS();
  if (!schema || typeof schema !== 'object' || schema.schema_version !== 1) {
    throw new Error(`Unsupported or missing schema_version in ${toPosix(path.relative(root, absolute))}`);
  }
  return schema;
}

export function parseFrontmatter(text, rel = '[memory]') {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { data: {}, body: text, raw: '', errors: [] };
  const document = YAML.parseDocument(match[1], {
    prettyErrors: true,
    uniqueKeys: true,
  });
  const errors = document.errors.map((error) => `${rel}: ${error.message}`);
  let data = {};
  if (!errors.length) {
    const parsed = document.toJS();
    data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  }
  return { data, body: text.slice(match[0].length), raw: match[1], errors };
}

export function walkFiles(root, schema, { includeDirectories = false } = {}) {
  const ignored = new Set(schema.filesystem?.ignored_directories || []);
  const ignoredPrefixes = schema.filesystem?.ignored_prefixes || [];
  const files = [];
  const directories = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const absolute = path.join(dir, entry.name);
      const rel = toPosix(path.relative(root, absolute));
      if (ignoredPrefixes.some((prefix) => rel === prefix.replace(/\/$/, '') || rel.startsWith(prefix))) continue;
      if (entry.isDirectory()) {
        directories.push(absolute);
        visit(absolute);
      } else if (entry.isFile()) files.push(absolute);
    }
  }
  visit(root);
  return includeDirectories ? { files, directories } : files;
}

function asString(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value : String(value);
}

function asList(value) {
  if (Array.isArray(value)) return value.map(asString).filter(Boolean);
  return value === null || value === undefined || value === '' ? [] : [asString(value)];
}

function asObjectList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) : [];
}

export function loadVault(root = process.cwd(), options = {}) {
  const schema = options.schema || loadSchema(root, options.schemaPath);
  const allFiles = walkFiles(root, schema);
  const markdownExtension = schema.filesystem?.markdown_extension || '.md';
  const records = [];
  const parseErrors = [];
  for (const file of allFiles.filter((item) => item.endsWith(markdownExtension))) {
    const rel = toPosix(path.relative(root, file));
    const text = fs.readFileSync(file, 'utf8');
    const parsed = parseFrontmatter(text, rel);
    parseErrors.push(...parsed.errors);
    const data = parsed.data;
    records.push({
      file,
      rel,
      text,
      body: parsed.body,
      frontmatterRaw: parsed.raw,
      data,
      type: asString(data.type),
      title: asString(data.title),
      domain: asString(data.domain),
      lang: asString(data.lang || (['source', 'source-manifest'].includes(asString(data.type)) ? data.note_lang : '')),
      status: asString(data.status),
      series: asString(data.series),
      aliases: asList(data.aliases),
      tags: asList(data.tags),
      sources: asObjectList(data.sources),
      relationships: asObjectList(data.relationships),
    });
  }
  records.sort((a, b) => a.rel.localeCompare(b.rel));
  const vault = { root, schema, allFiles, records, parseErrors };
  Object.assign(vault, buildRecordIndexes(records));
  vault.generatedArtifacts = new Set(schema.filesystem?.generated_artifacts || []);
  vault.deterministicArtifacts = new Set(schema.filesystem?.deterministic_artifacts || []);
  return vault;
}

export function buildRecordIndexes(records) {
  const byRel = new Map();
  const byBasename = new Map();
  const byName = new Map();
  const bySourceId = new Map();
  const add = (index, key, record) => {
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(record);
  };
  for (const record of records) {
    byRel.set(record.rel.replace(/\.md$/i, ''), record);
    add(byBasename, path.posix.basename(record.rel, '.md'), record);
    add(byName, record.title, record);
    for (const alias of record.aliases) add(byName, alias, record);
    if (record.data.source_id) add(bySourceId, asString(record.data.source_id), record);
  }
  return { byRel, byBasename, byName, bySourceId };
}

function maskPreservingNewlines(value) {
  return value.replace(/[^\n]/g, ' ');
}

export function proseOnly(text) {
  return text
    .replace(/<!--([\s\S]*?)-->/g, maskPreservingNewlines)
    .replace(/^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$/gm, maskPreservingNewlines)
    .replace(/`+[^`\n]*`+/g, (value) => ' '.repeat(value.length));
}

export function headings(text) {
  return [...proseOnly(text).matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)]
    .map((match) => ({ level: match[1].length, text: match[2].trim() }));
}

export function blockIds(text) {
  return new Set([...proseOnly(text).matchAll(/(?:^|\s)\^([A-Za-z0-9-]+)\s*$/gm)].map((match) => match[1]));
}

export function extractWikilinks(text, { genuine = true } = {}) {
  const source = genuine ? proseOnly(text) : text;
  return [...source.matchAll(/(!)?\[\[([^\]\n]+)\]\]/g)].map((match) => ({
    raw: match[2],
    embedded: Boolean(match[1]),
    index: match.index,
  }));
}

export function extractMarkdownLinks(text, { genuine = true } = {}) {
  const source = genuine ? proseOnly(text) : text;
  const links = [];
  for (let index = 0; index < source.length; index += 1) {
    const image = source[index] === '!' && source[index + 1] === '[';
    const open = image ? index + 1 : index;
    if (source[open] !== '[' || source[open + 1] === '[') continue;
    let close = open + 1;
    while (close < source.length && source[close] !== ']') close += 1;
    if (source[close] !== ']' || source[close + 1] !== '(') continue;
    let cursor = close + 2;
    let depth = 1;
    let target = '';
    while (cursor < source.length && depth > 0) {
      const char = source[cursor];
      if (char === '\\') {
        target += char + (source[cursor + 1] || '');
        cursor += 2;
        continue;
      }
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      if (depth > 0) target += char;
      cursor += 1;
    }
    if (depth === 0) links.push({ raw: target.trim(), embedded: image, index });
    index = cursor;
  }
  return links;
}

export function parseWikilink(raw) {
  const separator = raw.search(/\\?\|/);
  const target = (separator < 0 ? raw : raw.slice(0, separator)).trim();
  const blockSplit = target.split('^');
  const beforeBlock = blockSplit.shift();
  const block = blockSplit.join('^').trim();
  const headingSplit = beforeBlock.split('#');
  const page = headingSplit.shift().trim().replace(/\.md$/i, '');
  const heading = headingSplit.join('#').trim();
  return { page, heading, block, target };
}

export function resolveWikilink(raw, from, vault) {
  const parsed = parseWikilink(raw);
  if (!parsed.page) return { status: 'resolved', record: from, via: 'self', ...parsed };
  const fromDir = path.posix.dirname(from.rel);
  const candidates = [];
  if (parsed.page.includes('/')) {
    candidates.push(path.posix.normalize(parsed.page));
    candidates.push(path.posix.normalize(path.posix.join(fromDir, parsed.page)));
  } else {
    candidates.push(path.posix.normalize(path.posix.join(fromDir, parsed.page)));
    candidates.push(parsed.page);
  }
  for (const candidate of candidates) {
    if (vault.byRel.has(candidate)) return { status: 'resolved', record: vault.byRel.get(candidate), via: 'path', ...parsed };
  }
  const named = [...new Set([
    ...(vault.byName.get(parsed.page) || []),
    ...(vault.byBasename.get(parsed.page) || []),
  ])];
  if (named.length === 1) return { status: 'resolved', record: named[0], via: 'name-or-alias', ...parsed };
  return { status: named.length ? 'ambiguous' : 'broken', matches: named, ...parsed };
}

function unwrapMarkdownTarget(raw) {
  let target = raw.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  target = target.replace(/\\([()])/g, '$1');
  return target;
}

export function resolveMarkdownLink(raw, from, vault) {
  let target = unwrapMarkdownTarget(raw);
  if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
    return { status: 'external-or-fragment', target };
  }
  let decoded = target;
  try { decoded = decodeURIComponent(target); } catch { /* retain literal target */ }
  const hash = decoded.indexOf('#');
  const fragment = hash >= 0 ? decoded.slice(hash + 1) : '';
  const filePart = (hash >= 0 ? decoded.slice(0, hash) : decoded).trim();
  const rel = path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), filePart));
  const absolute = path.join(vault.root, rel);
  if (!fs.existsSync(absolute)) return { status: 'broken', rel, fragment, target };
  const record = vault.records.find((item) => item.rel === rel);
  return { status: 'resolved', rel, record, fragment, target };
}

export function validateResolvedFragment(resolution) {
  if (resolution.status !== 'resolved' || !resolution.record) return null;
  if (resolution.heading) {
    const exists = headings(resolution.record.body).some((heading) => heading.text === resolution.heading);
    if (!exists) return `heading ${JSON.stringify(resolution.heading)} not found in ${resolution.record.rel}`;
  }
  if (resolution.block && !blockIds(resolution.record.body).has(resolution.block)) {
    return `block ^${resolution.block} not found in ${resolution.record.rel}`;
  }
  return null;
}

export function resolveRelationshipTarget(target, vault) {
  const canonical = String(target || '').trim().replace(/\.md$/i, '');
  if (!canonical) return { status: 'broken', target: canonical };
  const record = vault.byRel.get(canonical);
  return record
    ? { status: 'resolved', record, target: canonical, via: 'canonical-path' }
    : { status: 'broken', target: canonical };
}

function relationshipHeading(record, schema) {
  return schema.relationships?.generated_body_section?.heading_by_language?.[record.lang]
    || schema.relationships?.generated_body_section?.heading_by_language?.en
    || 'Relationships';
}

function replaceExactH2Section(record, headingsToMatch, rendered, label) {
  const matches = [...record.body.matchAll(/^##\s+(.+?)\s*$/gm)].filter((match) => headingsToMatch.has(match[1].trim()));
  if (matches.length !== 1) throw new Error(`${record.rel}: expected exactly one ${label} H2 section`);
  const start = matches[0].index;
  const nextMatch = /^##\s+.+?\s*$/gm;
  nextMatch.lastIndex = start + matches[0][0].length;
  const next = nextMatch.exec(record.body);
  const end = next ? next.index : record.body.length;
  return `${record.body.slice(0, start)}${rendered}${record.body.slice(end).replace(/^\n+/, '\n')}`;
}

export function renderRelationshipSection(record, vault) {
  const heading = relationshipHeading(record, vault.schema);
  const labels = vault.schema.relationships?.labels || {};
  const lines = record.relationships.map((relationship) => {
    const target = resolveRelationshipTarget(relationship.target, vault);
    const targetTitle = target.status === 'resolved' ? (target.record.title || path.posix.basename(target.record.rel, '.md')) : relationship.target;
    const display = labels[relationship.type]?.display?.[record.lang]
      || labels[relationship.type]?.display?.en
      || relationship.type;
    return `- **${display}:** [[${String(relationship.target).replace(/\.md$/i, '')}|${targetTitle}]]`;
  });
  return `## ${heading}\n\n<!-- generated from frontmatter relationships; do not edit by hand -->\n${lines.length ? lines.join('\n') : '_None._'}\n`;
}

export function replaceRelationshipSection(record, vault) {
  const concepts = new Set(vault.schema.heading_concepts?.relationships || ['Relationships', '關係']);
  return replaceExactH2Section(record, concepts, renderRelationshipSection(record, vault), 'relationship');
}

function locatorText(locator) {
  if (typeof locator === 'string') return locator.trim();
  if (!locator || typeof locator !== 'object' || Array.isArray(locator)) return '';
  return Object.entries(locator).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join('; ');
}

export function renderSourceSection(record, vault) {
  const heading = record.lang === 'zh' ? '來源' : 'Source reference';
  const lines = record.sources.map((source) => {
    const matches = vault.bySourceId.get(String(source.id || '')) || [];
    const target = matches.length === 1 ? matches[0] : null;
    const targetPath = target ? target.rel.replace(/\.md$/i, '') : source.id;
    const targetTitle = target ? (target.title || path.posix.basename(target.rel, '.md')) : source.id;
    const locator = locatorText(source.locator);
    return `- **${source.role}:** [[${targetPath}|${targetTitle}]]${locator ? ` — locator: ${locator}` : ''}`;
  });
  return `## ${heading}\n\n<!-- generated from frontmatter sources; do not edit by hand -->\n${lines.length ? lines.join('\n') : '_None._'}\n`;
}

export function replaceSourceSection(record, vault) {
  const heading = record.lang === 'zh' ? '來源' : 'Source reference';
  return replaceExactH2Section(record, new Set([heading]), renderSourceSection(record, vault), 'source reference');
}

function reportLink(target, vault) {
  const resolution = resolveRelationshipTarget(target, vault);
  const title = resolution.status === 'resolved'
    ? (resolution.record.title || path.posix.basename(resolution.record.rel, '.md'))
    : target;
  return `[[${target}|${title}]]`;
}

export function renderReportLineageSections(record, vault) {
  const derivation = asList(record.data.derived_from).map((target) => `- ${reportLink(target, vault)}`).join('\n') || '_None._';
  const supersedes = asList(record.data.supersedes);
  let output = `## Derivation roots\n\n<!-- generated from frontmatter derived_from; do not edit by hand -->\n${derivation}\n`;
  if (supersedes.length) {
    output += `\n## Supersession lineage\n\n<!-- generated from frontmatter supersedes; do not edit by hand -->\n${supersedes.map((target) => `- **Supersedes:** ${reportLink(target, vault)}`).join('\n')}\n`;
  }
  return output;
}

function removeH2Section(body, heading) {
  const pattern = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const match = pattern.exec(body);
  if (!match) return body;
  const next = /^##\s+.+?\s*$/gm;
  next.lastIndex = match.index + match[0].length;
  const nextMatch = next.exec(body);
  const end = nextMatch ? nextMatch.index : body.length;
  return `${body.slice(0, match.index)}${body.slice(end).replace(/^\n+/, '\n')}`;
}

export function replaceReportLineageSections(record, vault) {
  let body = removeH2Section(record.body, 'Derivation roots');
  body = removeH2Section(body, 'Supersession lineage');
  const h1 = body.match(/^#\s+.+?\s*$/m);
  if (!h1) throw new Error(`${record.rel}: report is missing its H1`);
  const insertion = h1.index + h1[0].length;
  const before = body.slice(0, insertion).trimEnd();
  const after = body.slice(insertion).replace(/^\n+/, '');
  const lineage = renderReportLineageSections(record, vault).trimEnd();
  return `${before}\n\n${lineage}\n\n${after}`;
}

export function structuredLinks(vault) {
  const links = [];
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  for (const from of vault.records) {
    for (const relationship of knowledgeTypes.has(from.type) ? from.relationships : []) {
      const resolution = resolveRelationshipTarget(relationship.target, vault);
      links.push({
        kind: 'relationship', from, item: relationship, resolution, fragmentError: null,
      });
    }
    for (const source of knowledgeTypes.has(from.type) ? from.sources : []) {
      const matches = vault.bySourceId.get(String(source.id || '')) || [];
      const resolution = matches.length === 1
        ? { status: 'resolved', record: matches[0], target: source.id, via: 'source-id' }
        : { status: matches.length ? 'ambiguous' : 'broken', matches, target: source.id };
      links.push({ kind: 'provenance', from, item: source, resolution, fragmentError: null });
    }
    if (from.type === 'report') {
      for (const target of asList(from.data.derived_from)) {
        links.push({
          kind: 'report-derivation', from, item: { target },
          resolution: resolveRelationshipTarget(target, vault), fragmentError: null,
        });
      }
      for (const target of asList(from.data.supersedes)) {
        links.push({
          kind: 'report-supersession', from, item: { target },
          resolution: resolveRelationshipTarget(target, vault), fragmentError: null,
        });
      }
    }
  }
  return links;
}

export function collectLinks(vault, options = {}) {
  const includeMarkdown = options.includeMarkdown !== false;
  const genuine = options.genuine !== false;
  const links = [];
  for (const from of vault.records) {
    for (const item of extractWikilinks(from.body, { genuine })) {
      const resolution = resolveWikilink(item.raw, from, vault);
      links.push({ kind: 'wikilink', from, item, resolution, fragmentError: validateResolvedFragment(resolution) });
    }
    if (!includeMarkdown) continue;
    for (const item of extractMarkdownLinks(from.body, { genuine })) {
      const resolution = resolveMarkdownLink(item.raw, from, vault);
      links.push({ kind: 'markdown', from, item, resolution, fragmentError: null });
    }
  }
  if (options.includeStructured !== false) links.push(...structuredLinks(vault));
  return links;
}

export function recordEdges(vault, options = {}) {
  const seen = new Set();
  return collectLinks(vault, options)
    .filter((link) => link.resolution.status === 'resolved' && link.resolution.record)
    .map((link) => ({ from: link.from, to: link.resolution.record, kind: link.kind, raw: link.item.raw || link.item.target || link.item.id }))
    .filter((edge) => {
      const key = `${edge.from.rel}\u0000${edge.to.rel}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function typeSet(schema, scope = 'knowledge') {
  return new Set(schema.scopes?.[scope]?.page_types || []);
}

export function recordsInScope(vault, scopeName) {
  const scope = vault.schema.scopes?.[scopeName] || {};
  const pageTypes = new Set(scope.page_types || []);
  const excludePaths = new Set(scope.exclude_paths || []);
  const excludePrefixes = scope.exclude_prefixes || [];
  const includePrefixes = scope.include_prefixes || [];
  const includePaths = new Set(scope.include_paths || []);
  return vault.records.filter((record) => {
    if (pageTypes.size && !pageTypes.has(record.type)) return false;
    if (excludePaths.has(record.rel)) return false;
    if (excludePrefixes.some((prefix) => record.rel.startsWith(prefix))) return false;
    if ((includePrefixes.length || includePaths.size) && !includePaths.has(record.rel) && !includePrefixes.some((prefix) => record.rel.startsWith(prefix))) return false;
    if (scope.exclude_generated && vault.generatedArtifacts.has(record.rel)) return false;
    return true;
  });
}

export function directedReachability(startRel, records, edges, { excludedFrom = new Set() } = {}) {
  const allowed = new Set(records.map((record) => record.rel));
  if (!allowed.has(startRel)) return { visited: new Set(), distances: new Map() };
  const outgoing = new Map(records.map((record) => [record.rel, new Set()]));
  for (const edge of edges) {
    if (allowed.has(edge.from.rel) && allowed.has(edge.to.rel)) outgoing.get(edge.from.rel).add(edge.to.rel);
  }
  const visited = new Set();
  const distances = new Map([[startRel, 0]]);
  const queue = [startRel];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    if (excludedFrom.has(current)) continue;
    for (const target of outgoing.get(current) || []) {
      if (!distances.has(target)) distances.set(target, distances.get(current) + 1);
      if (!visited.has(target)) queue.push(target);
    }
  }
  return { visited, distances };
}

export function undirectedComponents(records, edges) {
  const allowed = new Set(records.map((record) => record.rel));
  const graph = new Map(records.map((record) => [record.rel, new Set()]));
  for (const edge of edges) {
    if (!allowed.has(edge.from.rel) || !allowed.has(edge.to.rel) || edge.from.rel === edge.to.rel) continue;
    graph.get(edge.from.rel).add(edge.to.rel);
    graph.get(edge.to.rel).add(edge.from.rel);
  }
  const seen = new Set();
  const components = [];
  for (const record of records) {
    if (seen.has(record.rel)) continue;
    const component = [];
    const queue = [record.rel];
    while (queue.length) {
      const current = queue.pop();
      if (seen.has(current)) continue;
      seen.add(current);
      component.push(current);
      for (const next of graph.get(current) || []) if (!seen.has(next)) queue.push(next);
    }
    components.push(component.sort());
  }
  return components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
}

export function inboundCategory(from, vault) {
  if (vault.generatedArtifacts.has(from.rel)) return 'generated';
  if (['vault-home', 'domain-index', 'subdomain-index', 'article-index', 'report-index'].includes(from.type)) return 'curated';
  if ((vault.schema.scopes?.knowledge?.page_types || []).includes(from.type)) return 'semantic';
  return 'incidental';
}

export function categorizeInbound(records, edges, vault) {
  const targetSet = new Set(records.map((record) => record.rel));
  const result = new Map(records.map((record) => [record.rel, {
    curated: new Set(), semantic: new Set(), generated: new Set(), incidental: new Set(),
  }]));
  for (const edge of edges) {
    if (!targetSet.has(edge.to.rel) || edge.from.rel === edge.to.rel) continue;
    result.get(edge.to.rel)[inboundCategory(edge.from, vault)].add(edge.from.rel);
  }
  return result;
}

export function nonempty(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function validateRecordContract(record, schema) {
  const errors = [];
  const contract = schema.page_types?.[record.type];
  if (!contract) return record.type ? [`${record.rel}: unsupported page type ${JSON.stringify(record.type)}`] : [`${record.rel}: missing page type`];
  for (const field of contract.required || []) {
    if (!Object.prototype.hasOwnProperty.call(record.data, field)) errors.push(`${record.rel}: missing required metadata ${field}`);
  }
  for (const field of contract.nonempty || []) {
    if (!nonempty(record.data[field])) errors.push(`${record.rel}: metadata ${field} must be nonempty`);
  }
  const pathContract = contract.path_contracts?.[record.rel];
  for (const field of pathContract?.required || []) {
    if (!Object.prototype.hasOwnProperty.call(record.data, field)) errors.push(`${record.rel}: missing path-required metadata ${field}`);
  }
  for (const field of pathContract?.nonempty || []) {
    if (!nonempty(record.data[field])) errors.push(`${record.rel}: path-required metadata ${field} must be nonempty`);
  }
  if (contract.allowed_domains && !contract.allowed_domains.includes(record.domain)) {
    errors.push(`${record.rel}: type ${record.type} does not allow domain ${JSON.stringify(record.domain)}`);
  }
  if (contract.allowed_statuses && !contract.allowed_statuses.includes(record.status)) {
    errors.push(`${record.rel}: type ${record.type} does not allow lifecycle status ${JSON.stringify(record.status)}`);
  }
  if (contract.allowed_exact_paths && !contract.allowed_exact_paths.includes(record.rel)) {
    errors.push(`${record.rel}: type ${record.type} is not allowed at this exact path`);
  }
  if (contract.allowed_prefixes && !contract.allowed_prefixes.some((prefix) => record.rel.startsWith(prefix))) {
    errors.push(`${record.rel}: type ${record.type} is outside its allowed path prefixes`);
  }
  if (contract.allowed_domains?.includes(record.domain)) {
    const root = schema.domains?.[record.domain]?.root;
    if (root && !record.rel.startsWith(root)) errors.push(`${record.rel}: domain ${record.domain} belongs under ${root}`);
  }
  const actualHeadings = headings(record.body).filter((heading) => heading.level === 2).map((heading) => heading.text);
  for (const required of contract.required_headings || []) {
    if (!actualHeadings.includes(required)) errors.push(`${record.rel}: missing required H2 ${JSON.stringify(required)}`);
  }
  for (const required of pathContract?.required_headings || []) {
    if (!actualHeadings.includes(required)) errors.push(`${record.rel}: missing path-required H2 ${JSON.stringify(required)}`);
  }
  return errors;
}

export function validateLayout(record, schema) {
  const errors = [];
  const contract = schema.page_types?.[record.type];
  if (!contract?.layouts?.length) return errors;
  const actual = headings(record.body).filter((heading) => heading.level === 2).map((heading) => heading.text);
  const candidates = contract.layouts.map((name) => [name, schema.layout_variants?.[name]]).filter(([, layout]) => layout?.languages?.includes(record.lang));
  const valid = candidates.some(([, layout]) => {
    if (layout.exact_h2) return actual.join('\n') === layout.exact_h2.join('\n');
    if (layout.required_headings && !layout.required_headings.every((heading) => actual.includes(heading))) return false;
    if (layout.required_headings_any && !layout.required_headings_any.some((heading) => actual.includes(heading))) return false;
    if (layout.required_concepts) {
      return layout.required_concepts.every((concept) => (schema.heading_concepts?.[concept] || []).some((heading) => actual.includes(heading)));
    }
    return true;
  });
  if (!valid) errors.push(`${record.rel}: H2 layout does not match an allowed ${record.type}/${record.lang} variant`);
  return errors;
}

export function queryFromPaths(text) {
  return new Set([...text.matchAll(/^FROM\s+"([^"]+)"\s*$/gm)].map((match) => `${match[1].replace(/\/$/, '')}/`));
}

export function validateDomainMembership(vault, edges) {
  const errors = [];
  for (const [domain, config] of Object.entries(vault.schema.domains || {})) {
    if (!config.index || !fs.existsSync(path.join(vault.root, config.index))) continue;
    const rootAbsolute = path.join(vault.root, config.root);
    if (!fs.existsSync(rootAbsolute)) continue;
    const actualFolders = fs.readdirSync(rootAbsolute, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const expectedFolders = [...(config.child_folders || [])].sort();
    const missingFolders = expectedFolders.filter((folder) => !actualFolders.includes(folder));
    const unexpectedFolders = actualFolders.filter((folder) => !expectedFolders.includes(folder));
    for (const folder of missingFolders) errors.push(`${config.root}: schema child folder is missing: ${folder}`);
    for (const folder of unexpectedFolders) errors.push(`${config.root}: unregistered child folder: ${folder}`);
    const index = vault.records.find((record) => record.rel === config.index);
    if (!index || !expectedFolders.length || domain === 'source-library') continue;
    const queryPaths = queryFromPaths(index.text);
    const staticTargets = new Set(edges.filter((edge) => edge.from.rel === index.rel).map((edge) => edge.to.rel));
    for (const folder of expectedFolders) {
      const prefix = `${config.root}${folder}/`;
      const covered = queryPaths.has(prefix) || [...staticTargets].some((target) => target.startsWith(prefix));
      if (!covered) errors.push(`${config.index}: child folder has no Dataview query or static navigation link: ${prefix}`);
    }
  }
  return errors;
}

export function parseObsidianPathQuery(query) {
  const include = new Set();
  const exclude = new Set();
  for (const match of String(query || '').matchAll(/(-?)path:"([^"]+)"/g)) {
    (match[1] ? exclude : include).add(`${match[2].replace(/\/$/, '')}/`);
  }
  return { include, exclude };
}

export function parseObsidianScopeQuery(query) {
  const paths = parseObsidianPathQuery(query);
  const includeFiles = new Set();
  const excludeFiles = new Set();
  for (const match of String(query || '').matchAll(/(-?)file:"([^"]+)"/g)) {
    (match[1] ? excludeFiles : includeFiles).add(match[2]);
  }
  return { ...paths, includeFiles, excludeFiles };
}

export function setDifference(left, right) {
  return [...left].filter((item) => !right.has(item)).sort();
}

export function stableGeneratedText(text) {
  return text.replace(/^generated_on:\s*["']?\d{4}-\d{2}-\d{2}["']?\s*$/m, 'generated_on: "<generated>"').trimEnd() + '\n';
}
