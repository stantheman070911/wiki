import fs from 'node:fs';
import path from 'node:path';

import YAML from 'yaml';

import {
  extractMarkdownLinks,
  extractWikilinks,
  loadVault,
  normalizeIdentity,
  parseWikilink,
  renderSourceSection,
  resolveMarkdownLink,
  resolveWikilink,
} from './vault.mjs';

export const SOURCE_ID_PATTERN = /^SRC-(\d{4,})$/;
export const KNOWLEDGE_SOURCE_ROLES = new Set([
  'primary',
  'supporting',
  'contrasting',
  'example',
  'background',
]);

const SOURCE_TYPES = new Set(['source', 'source-manifest']);
const SOURCE_HEADINGS = new Set(['Source reference', '來源']);
const TITLE_OVERRIDES = new Map([
  [
    '06-Source-Library/Books/2026-07-08_Book_RiesTrout_22ImmutableLawsOfMarketing.md',
    {
      title: 'The 22 Immutable Laws of Marketing — archived source',
      aliases: ['The 22 Immutable Laws of Marketing — source archive'],
    },
  ],
  [
    '06-Source-Library/Podcasts/2026-07-01_Podcast_JackNeil_AlexHormozi.md',
    {
      title: 'Alex Hormozi on the Jack Neil Podcast',
      aliases: ['Alex Hormozi — Jack Neil Podcast'],
    },
  ],
  [
    '06-Source-Library/Podcasts/2026-07-01_Podcast_ModernWisdom_AlexHormozi.md',
    {
      title: 'Alex Hormozi on Modern Wisdom with Chris Williamson',
      aliases: ['Alex Hormozi × Chris Williamson — Modern Wisdom'],
    },
  ],
]);

function isNonempty(value) {
  return value !== undefined && value !== null && value !== ''
    && (!Array.isArray(value) || value.length > 0);
}

function asList(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null || value === '' ? [] : [value];
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function sourceRecords(vault) {
  return vault.records.filter((record) => SOURCE_TYPES.has(record.type));
}

function knowledgeRecords(vault) {
  const types = new Set(vault.schema.scopes?.knowledge?.page_types || []);
  return vault.records.filter((record) => types.has(record.type));
}

export function sourceSection(body) {
  const matches = [...body.matchAll(/^##\s+(.+?)\s*$/gm)]
    .filter((match) => SOURCE_HEADINGS.has(match[1].trim()));
  if (!matches.length) return '';
  const match = matches.at(-1);
  const start = match.index + match[0].length;
  const remainder = body.slice(start);
  const nextHeading = remainder.search(/^##\s+/m);
  return nextHeading >= 0 ? remainder.slice(0, nextHeading) : remainder;
}

function inferLanguage(text, fallback = 'en') {
  const value = String(text || '');
  const han = (value.match(/[\p{Script=Han}]/gu) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  if (han >= 8 && han / Math.max(1, han + latin) >= 0.18) return 'zh';
  if (latin >= 8) return 'en';
  return fallback || 'en';
}

function splitCreators(name, sourceType) {
  const value = String(name || '').trim();
  if (!value) return [{ name: 'Unknown', role: 'unknown' }];
  if (value === 'Alex Hormozi / Acquisition.com') {
    return [{ name: 'Alex Hormozi', role: 'author' }];
  }
  if (['book', 'essays', 'workbook'].includes(sourceType)) {
    const people = value.split(/\s+(?:&|and|with)\s+/i).map((item) => item.trim()).filter(Boolean);
    if (people.length > 1) return people.map((person) => ({ name: person, role: 'author' }));
    return [{ name: value, role: 'author' }];
  }
  return [{ name: value, role: 'creator' }];
}

function typeFromAttachment(rel, legacyType = '') {
  const folder = rel.split('/')[1] || '';
  const folderMap = {
    Books: 'book',
    Conversations: 'conversation',
    Courses: 'course',
    Diagrams: 'diagram',
    Essays: 'essays',
    Podcasts: 'podcast',
    Presentations: 'presentation',
    Videos: 'video',
  };
  if (folderMap[folder]) return folderMap[folder];
  const normalized = String(legacyType || '').trim().toLowerCase();
  return normalized === 'pdf' ? 'document' : normalized || 'document';
}

function archivedDate(rel) {
  return path.posix.basename(rel).match(/^(\d{4}-\d{2}-\d{2})_/)?.[1] || '';
}

function renderFrontmatter(data) {
  return YAML.stringify(data, {
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
    lineWidth: 0,
  }).trimEnd();
}

function replaceWholeFrontmatter(text, data) {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (!match) throw new Error('Cannot replace missing frontmatter');
  return `---\n${renderFrontmatter(data)}\n---${text.slice(match[0].length)}`;
}

function renderSources(items) {
  const lines = ['sources:'];
  for (const item of items) {
    lines.push(`  - id: ${JSON.stringify(item.id)}`);
    lines.push(`    role: ${JSON.stringify(item.role)}`);
    if (item.locator) lines.push(`    locator: ${JSON.stringify(item.locator)}`);
  }
  return lines;
}

export function replaceLegacySourceObject(text, items) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Cannot migrate missing frontmatter');
  const lines = match[1].split(/\r?\n/);
  const index = lines.findIndex((line) => /^source:\s*$/.test(line));
  if (index < 0) return text;
  let end = index + 1;
  while (end < lines.length && /^\s+/.test(lines[end])) end += 1;
  lines.splice(index, end - index, ...renderSources(items));
  const replacement = `---\n${lines.join('\n')}\n---`;
  return replacement + text.slice(match[0].length);
}

export function setKnowledgeSources(text, items) {
  const replaced = replaceLegacySourceObject(text, items);
  if (replaced !== text || /^sources:\s*$/m.test(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '')) return replaced;
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error('Cannot add sources to missing frontmatter');
  const lines = match[1].split(/\r?\n/);
  let index = lines.findIndex((line) => /^(?:date_added|updated|reviewed_on|status|parent_map):/.test(line));
  if (index < 0) index = lines.length;
  lines.splice(index, 0, ...renderSources(items));
  return `---\n${lines.join('\n')}\n---` + text.slice(match[0].length);
}

function companionRel(attachmentRel) {
  return attachmentRel.replace(/\.[^/.]+$/, '.md');
}

function attachmentLinks(record, vault) {
  const section = sourceSection(record.body);
  return extractMarkdownLinks(section)
    .map((link) => ({ link, resolved: resolveMarkdownLink(link.raw, record, vault) }))
    .filter(({ resolved }) => resolved.status === 'resolved' && resolved.rel.startsWith('06-Source-Library/'))
    .filter(({ resolved }) => !resolved.rel.endsWith('.md'));
}

function directSourceReferences(record, vault) {
  const section = sourceSection(record.body);
  return extractWikilinks(section).map((link) => {
    const resolved = resolveWikilink(link.raw, record, vault);
    return { link, resolved };
  }).filter(({ resolved }) => resolved.status === 'resolved' && SOURCE_TYPES.has(resolved.record.type));
}

export function planAttachmentWrappers(vault) {
  const planned = new Map();
  const companionByAttachment = new Map();
  const anomalies = [];
  const existingByRel = new Map(vault.records.map((record) => [record.rel, record]));
  const reservedIdentities = new Set(vault.records.flatMap((record) => [record.title, ...record.aliases])
    .map(normalizeIdentity)
    .filter(Boolean));

  for (const record of knowledgeRecords(vault).filter((item) => item.data.source && typeof item.data.source === 'object')) {
    if (directSourceReferences(record, vault).length) continue;
    const attachments = attachmentLinks(record, vault);
    if (!attachments.length) {
      anomalies.push({ severity: 'error', code: 'unresolved-legacy-source', file: record.rel });
      continue;
    }
    if (attachments.length > 1) {
      anomalies.push({
        severity: 'error',
        code: 'ambiguous-attachment-only-source',
        file: record.rel,
        attachments: attachments.map(({ resolved }) => resolved.rel),
      });
      continue;
    }
    const attachmentRel = attachments[0].resolved.rel;
    const wrapperRel = companionRel(attachmentRel);
    companionByAttachment.set(attachmentRel, wrapperRel);
    const existing = existingByRel.get(wrapperRel);
    if (existing) {
      if (!SOURCE_TYPES.has(existing.type)) {
        anomalies.push({ severity: 'error', code: 'companion-path-collision', file: wrapperRel });
      }
      continue;
    }
    if (planned.has(wrapperRel)) continue;
    const legacy = record.data.source;
    const baseTitle = String(legacy.name || path.posix.basename(attachmentRel, path.posix.extname(attachmentRel))).trim();
    const explicitTitle = TITLE_OVERRIDES.get(wrapperRel)?.title;
    let title = explicitTitle || baseTitle;
    if (!explicitTitle && reservedIdentities.has(normalizeIdentity(title))) {
      title = `${baseTitle} — archived source`;
      if (reservedIdentities.has(normalizeIdentity(title))) {
        title = `${baseTitle} — archived source (${path.posix.basename(attachmentRel)})`;
      }
    }
    reservedIdentities.add(normalizeIdentity(title));
    const sourceType = typeFromAttachment(attachmentRel, legacy.type);
    const sourceLang = inferLanguage(`${title} ${legacy.author || ''}`, record.lang || 'en');
    const data = {
      title,
      type: 'source',
      domain: 'source-library',
      creators: splitCreators(legacy.author, sourceType),
      source_type: sourceType,
      source_format: 'source-note',
      source_lang: sourceLang,
      note_lang: sourceLang,
      processing_status: 'processed',
      ...(legacy.date_of_source ? { published_on: String(legacy.date_of_source) } : {}),
      ...(legacy.author === 'Alex Hormozi / Acquisition.com' ? { publisher: 'Acquisition.com' } : {}),
      ...(legacy.url ? { url: String(legacy.url) } : {}),
      date_archived: archivedDate(attachmentRel),
      status: 'source',
    };
    const filename = path.posix.basename(attachmentRel);
    const body = `\n# ${title}\n\nArchived source attachment: [${filename}](<${filename}>)\n`;
    planned.set(wrapperRel, {
      rel: wrapperRel,
      file: path.join(vault.root, wrapperRel),
      data,
      body,
      text: '',
      type: 'source',
      title,
    });
  }
  return { planned, companionByAttachment, anomalies };
}

export function assignSequentialSourceIds(records) {
  const byRel = new Map();
  const seen = new Map();
  const errors = [];
  let max = 0;
  for (const record of records) {
    const id = String(record.data.source_id || '').trim();
    if (!id) continue;
    const match = id.match(SOURCE_ID_PATTERN);
    if (!match) {
      errors.push(`${record.rel}: invalid source_id ${id}`);
      continue;
    }
    if (seen.has(id)) errors.push(`${record.rel}: duplicate source_id ${id} also used by ${seen.get(id)}`);
    seen.set(id, record.rel);
    max = Math.max(max, Number(match[1]));
    byRel.set(record.rel, id);
  }
  for (const record of [...records].filter((item) => !byRel.has(item.rel)).sort((a, b) => a.rel.localeCompare(b.rel))) {
    max += 1;
    const id = `SRC-${String(max).padStart(4, '0')}`;
    byRel.set(record.rel, id);
    seen.set(id, record.rel);
  }
  return { byRel, errors, assigned: records.filter((record) => !record.data.source_id).length };
}

function contextWindow(section, index, previousEnd) {
  return section.slice(Math.max(previousEnd, index - 450), index);
}

function lastMatch(text, patterns) {
  let best = null;
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (!best || match.index >= best.index) best = { index: match.index, value: match[0].trim() };
    }
  }
  return best?.value || '';
}

export function inferLocator(context, rawWikilink = '') {
  if (rawWikilink) {
    const parsed = parseWikilink(rawWikilink);
    if (parsed.block) return `block ${parsed.block}`;
    if (parsed.heading) return parsed.heading;
  }
  return lastMatch(context, [
    /\b(?:chapters?|ch\.)\s*\d+(?:\s*[–—-]\s*\d+)?(?:\s*(?:,|and)\s*\d+(?:\s*[–—-]\s*\d+)?)*/gi,
    /\bparts?\s+(?:[IVX]+|\d+)(?:\s*[–—-]\s*(?:[IVX]+|\d+))?(?:\s*,\s*(?:chapters?|ch\.)\s*\d+(?:\s*[–—-]\s*\d+)?)?/gi,
    /\b(?:laws?|stages?|modules?|sections?|pages?|pp\.)\s*#?\d+(?:\s*[–—-]\s*\d+)?(?:\s*(?:,|and)\s*\d+(?:\s*[–—-]\s*\d+)?)*/gi,
    /第[一二三四五六七八九十百\d]+(?:章|節|部|模組|階段)/g,
  ]);
}

function inferRole(context, ordinal) {
  if (/\b(?:contrast|contrasting|counterpoint|in tension)\b/i.test(context)) return 'contrasting';
  if (/\b(?:example|case study|illustrat(?:e|es|ion))\b/i.test(context)) return 'example';
  if (/\b(?:background|historical context|overview)\b/i.test(context)) return 'background';
  if (/\b(?:additional source|supplement|support|corroborat|alongside|also)\b/i.test(context)) return 'supporting';
  return ordinal === 0 ? 'primary' : 'supporting';
}

export function collectKnowledgeSourceItems(record, vault, sourceByRel, companionByAttachment) {
  const section = sourceSection(record.body);
  const candidates = [];
  for (const link of extractWikilinks(section)) {
    const resolved = resolveWikilink(link.raw, record, vault);
    if (resolved.status === 'resolved' && SOURCE_TYPES.has(resolved.record.type)) {
      candidates.push({ rel: resolved.record.rel, index: link.index, end: link.index + link.raw.length + 4, raw: link.raw });
    }
  }
  for (const link of extractMarkdownLinks(section)) {
    const resolved = resolveMarkdownLink(link.raw, record, vault);
    if (resolved.status !== 'resolved') continue;
    if (resolved.record && SOURCE_TYPES.has(resolved.record.type)) {
      candidates.push({ rel: resolved.record.rel, index: link.index, end: link.index + link.raw.length + 4, raw: '' });
      continue;
    }
    const wrapperRel = companionByAttachment.get(resolved.rel);
    if (wrapperRel) candidates.push({ rel: wrapperRel, index: link.index, end: link.index + link.raw.length + 4, raw: '' });
  }
  candidates.sort((a, b) => a.index - b.index);
  const unique = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate.rel)) continue;
    seen.add(candidate.rel);
    unique.push(candidate);
  }
  let previousEnd = 0;
  const items = unique.map((candidate, ordinal) => {
    const source = sourceByRel.get(candidate.rel);
    if (!source) throw new Error(`${record.rel}: unresolved source record ${candidate.rel}`);
    const context = contextWindow(section, candidate.index, previousEnd);
    previousEnd = candidate.end;
    const locator = inferLocator(context, candidate.raw);
    return {
      id: source.source_id,
      role: inferRole(context, ordinal),
      ...(locator ? { locator } : {}),
      _rel: candidate.rel,
    };
  });
  if (items.length && !items.some((item) => item.role === 'primary')) items[0].role = 'primary';
  return items;
}

function articleKnowledgeLinks(record, vault) {
  const match = [...record.body.matchAll(/^##\s+Sources in THE WIKI\s*$/gm)].at(-1);
  if (!match) return [];
  const start = match.index + match[0].length;
  const remainder = record.body.slice(start);
  const next = remainder.search(/^##\s+/m);
  const section = next >= 0 ? remainder.slice(0, next) : remainder;
  const result = [];
  const seen = new Set();
  for (const link of extractWikilinks(section)) {
    const resolved = resolveWikilink(link.raw, record, vault);
    if (resolved.status !== 'resolved' || SOURCE_TYPES.has(resolved.record.type) || seen.has(resolved.record.rel)) continue;
    seen.add(resolved.record.rel);
    result.push(resolved.record);
  }
  return result;
}

function collectArticleSourceItems(record, vault, knowledgeItems) {
  const ids = [];
  const seen = new Set();
  for (const linked of articleKnowledgeLinks(record, vault)) {
    const upstream = knowledgeItems.get(linked.rel) || asList(linked.data.sources);
    for (const item of upstream) {
      const id = String(item.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids.map((id, index) => ({ id, role: index === 0 ? 'primary' : 'supporting' }));
}

function orderedSourceData(record, id, legacyCandidates, anomalies) {
  const data = record.data;
  const override = TITLE_OVERRIDES.get(record.rel);
  const uniqueLegacy = (key) => uniqueStrings(legacyCandidates.map((item) => item[key]));
  const legacyAuthors = uniqueLegacy('author');
  const legacyPublished = uniqueLegacy('date_of_source');
  const legacyUrls = uniqueLegacy('url');
  if (legacyPublished.length > 1) {
    anomalies.push({ severity: 'warning', code: 'conflicting-published-on', file: record.rel, values: legacyPublished });
  }
  if (legacyUrls.length > 1) {
    anomalies.push({ severity: 'warning', code: 'conflicting-url', file: record.rel, values: legacyUrls });
  }
  if (legacyAuthors.length > 1 && !isNonempty(data.creators) && !isNonempty(data.author)) {
    anomalies.push({ severity: 'warning', code: 'conflicting-creators', file: record.rel, values: legacyAuthors });
  }

  const sourceType = String(data.source_type || 'document');
  const creatorSeed = data.author || (legacyAuthors.length === 1 ? legacyAuthors[0] : '');
  const creators = Array.isArray(data.creators) && data.creators.length
    ? data.creators
    : splitCreators(creatorSeed, sourceType);
  const aliases = uniqueStrings([
    ...asList(data.aliases),
    ...(override?.aliases || []),
  ]).filter((alias) => alias !== override?.title);
  const sourceLang = String(data.source_lang || data.lang || inferLanguage(data.title, 'en'));
  const noteLang = String(data.note_lang || inferLanguage(record.body, data.lang || sourceLang));
  const title = override?.title || String(data.title || record.title);
  const publishedOn = data.published_on || (legacyPublished.length === 1 ? legacyPublished[0] : '');
  const url = data.url || (legacyUrls.length === 1 ? legacyUrls[0] : '');
  const publisher = data.publisher
    || (creatorSeed === 'Alex Hormozi / Acquisition.com' ? 'Acquisition.com' : '');

  const out = {
    source_id: id,
    title,
    ...(aliases.length ? { aliases } : {}),
    type: data.type,
    domain: data.domain,
    creators,
    source_type: sourceType,
    source_format: data.source_format,
    source_lang: sourceLang,
    note_lang: noteLang,
  };
  const reserved = new Set([
    'source_id', 'title', 'aliases', 'type', 'domain', 'creators', 'author', 'lang',
    'source_type', 'source_format', 'source_lang', 'note_lang', 'processing_status',
    'published_on', 'publisher', 'url', 'date_archived', 'status',
  ]);
  for (const [key, value] of Object.entries(data)) {
    if (!reserved.has(key)) out[key] = value;
  }
  out.processing_status = data.processing_status;
  if (publishedOn) out.published_on = String(publishedOn);
  if (publisher) out.publisher = String(publisher);
  if (url) out.url = String(url);
  out.date_archived = data.date_archived;
  out.status = data.status;
  return out;
}

function overrideH1(text, rel) {
  const override = TITLE_OVERRIDES.get(rel);
  if (!override) return text;
  return text.replace(/^#\s+.+$/m, `# ${override.title}`);
}

function sourceRecordForValidation(record, id) {
  return { ...record, source_id: id };
}

function sourceIdAttachmentMap(vault, sourceById) {
  const result = new Map();
  for (const record of sourceRecords(vault)) {
    const id = String(record.data.source_id || '');
    if (!sourceById.has(id)) continue;
    for (const link of extractMarkdownLinks(record.body)) {
      const resolved = resolveMarkdownLink(link.raw, record, vault);
      if (resolved.status === 'resolved' && !resolved.rel.endsWith('.md')) result.set(resolved.rel, id);
    }
  }
  return result;
}

export function validateSourceMetadata(vault) {
  const errors = [...vault.parseErrors];
  const sources = sourceRecords(vault);
  const byId = new Map();
  const titleOwners = new Map();
  const required = [
    'source_id', 'title', 'creators', 'source_type', 'source_format', 'source_lang',
    'note_lang', 'processing_status', 'date_archived', 'status',
  ];
  for (const record of sources) {
    for (const key of required) {
      if (!isNonempty(record.data[key])) errors.push(`${record.rel}: missing required source field ${key}`);
    }
    const id = String(record.data.source_id || '');
    if (!SOURCE_ID_PATTERN.test(id)) errors.push(`${record.rel}: invalid source_id ${id || '[blank]'}`);
    if (byId.has(id)) errors.push(`${record.rel}: duplicate source_id ${id} also used by ${byId.get(id).rel}`);
    else byId.set(id, record);
    if ('lang' in record.data || 'author' in record.data) errors.push(`${record.rel}: legacy source lang/author fields remain`);
    if (!Array.isArray(record.data.creators) || !record.data.creators.length
      || record.data.creators.some((creator) => !creator || typeof creator !== 'object' || !creator.name || !creator.role)) {
      errors.push(`${record.rel}: creators must be a nonempty [{name, role}] array`);
    }
    const titleKey = normalizeIdentity(record.title);
    if (titleOwners.has(titleKey)) errors.push(`${record.rel}: duplicate canonical source title with ${titleOwners.get(titleKey)}`);
    else titleOwners.set(titleKey, record.rel);
  }
  const attachmentToId = sourceIdAttachmentMap(vault, byId);
  for (const record of knowledgeRecords(vault)) {
    if (record.data.source) errors.push(`${record.rel}: legacy singular source object remains`);
    const items = record.data.sources;
    if (!Array.isArray(items) || !items.length) {
      errors.push(`${record.rel}: knowledge page requires a nonempty sources array`);
      continue;
    }
    if (!Array.isArray(items)) continue;
    const ids = new Set();
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`${record.rel}: each sources item must be an object`);
        continue;
      }
      if (!byId.has(String(item.id || ''))) errors.push(`${record.rel}: unknown source id ${item.id || '[blank]'}`);
      if (!KNOWLEDGE_SOURCE_ROLES.has(item.role)) errors.push(`${record.rel}: invalid source role ${item.role || '[blank]'}`);
      if (ids.has(item.id)) errors.push(`${record.rel}: duplicate source id ${item.id}`);
      ids.add(item.id);
      if ('locator' in item && (typeof item.locator !== 'string' || !item.locator.trim())) {
        errors.push(`${record.rel}: locator must be a nonempty string when present`);
      }
      const extra = Object.keys(item).filter((key) => !['id', 'role', 'locator'].includes(key));
      if (extra.length) errors.push(`${record.rel}: unsupported sources item fields ${extra.join(', ')}`);
    }
    if (items.length && !items.some((item) => item.role === 'primary')) errors.push(`${record.rel}: sources requires a primary item`);

    const section = sourceSection(record.body);
    const bodyIds = new Set();
    for (const link of extractWikilinks(section)) {
      const resolved = resolveWikilink(link.raw, record, vault);
      if (resolved.status === 'resolved' && SOURCE_TYPES.has(resolved.record.type)) bodyIds.add(resolved.record.data.source_id);
    }
    for (const link of extractMarkdownLinks(section)) {
      const resolved = resolveMarkdownLink(link.raw, record, vault);
      if (resolved.status === 'resolved' && attachmentToId.has(resolved.rel)) bodyIds.add(attachmentToId.get(resolved.rel));
    }
    const structured = new Set(items.map((item) => item.id));
    const missingInMetadata = [...bodyIds].filter((id) => !structured.has(id));
    const missingInBody = [...structured].filter((id) => !bodyIds.has(id));
    if (missingInMetadata.length) errors.push(`${record.rel}: body source links missing from metadata ${missingInMetadata.join(', ')}`);
    if (missingInBody.length) errors.push(`${record.rel}: metadata source ids missing from body source section ${missingInBody.join(', ')}`);

    for (const key of ['creators', 'source_type', 'source_format', 'source_lang', 'note_lang', 'published_on', 'publisher', 'url']) {
      if (key in record.data) errors.push(`${record.rel}: canonical bibliographic field ${key} belongs only on source records`);
    }
  }
  return errors;
}

export function planSourceMetadataMigration(root = process.cwd()) {
  const vault = loadVault(root);
  const parentMaps = new Map(knowledgeRecords(vault).map((record) => [record.rel, record.data.parent_map]));
  const wrapperPlan = planAttachmentWrappers(vault);
  const sources = [...sourceRecords(vault), ...wrapperPlan.planned.values()];
  const assigned = assignSequentialSourceIds(sources);
  const anomalies = [...wrapperPlan.anomalies];
  for (const error of assigned.errors) anomalies.push({ severity: 'error', code: 'source-id', message: error });
  const sourceByRel = new Map(sources.map((record) => [
    record.rel,
    sourceRecordForValidation(record, assigned.byRel.get(record.rel)),
  ]));
  const knowledgeItems = new Map();
  const legacyBySource = new Map();
  const roleCounts = new Map();
  let multipleSourcePages = 0;
  let locatorCount = 0;

  for (const record of knowledgeRecords(vault).filter((item) => item.data.source && typeof item.data.source === 'object')) {
    const items = collectKnowledgeSourceItems(record, vault, sourceByRel, wrapperPlan.companionByAttachment);
    if (!items.length) {
      anomalies.push({ severity: 'error', code: 'unresolved-legacy-source', file: record.rel });
      continue;
    }
    if (items.length > 1) multipleSourcePages += 1;
    locatorCount += items.filter((item) => item.locator).length;
    for (const item of items) roleCounts.set(item.role, (roleCounts.get(item.role) || 0) + 1);
    knowledgeItems.set(record.rel, items);
    const primary = items.find((item) => item.role === 'primary') || items[0];
    if (!legacyBySource.has(primary._rel)) legacyBySource.set(primary._rel, []);
    legacyBySource.get(primary._rel).push(record.data.source);
  }
  let articlePagesDerived = 0;
  for (const record of knowledgeRecords(vault).filter((item) => item.type === 'article' && !Array.isArray(item.data.sources))) {
    const items = collectArticleSourceItems(record, vault, knowledgeItems);
    if (!items.length) {
      anomalies.push({ severity: 'error', code: 'article-sources-unresolved', file: record.rel });
      continue;
    }
    articlePagesDerived += 1;
    if (items.length > 1) multipleSourcePages += 1;
    for (const item of items) roleCounts.set(item.role, (roleCounts.get(item.role) || 0) + 1);
    knowledgeItems.set(record.rel, items);
  }

  const changes = [];
  let sourceRecordsUpdated = 0;
  let knowledgePagesMigrated = 0;
  for (const record of sources) {
    const id = assigned.byRel.get(record.rel);
    const data = orderedSourceData(record, id, legacyBySource.get(record.rel) || [], anomalies);
    const baseText = record.text || `---\nplaceholder: true\n---${record.body}`;
    let text = replaceWholeFrontmatter(baseText, data);
    text = overrideH1(text, record.rel);
    if (text !== record.text) {
      sourceRecordsUpdated += 1;
      changes.push({ rel: record.rel, text, kind: record.text ? 'source-record' : 'source-wrapper' });
    }
  }
  for (const record of knowledgeRecords(vault)) {
    const items = knowledgeItems.get(record.rel);
    if (!items) continue;
    const cleanItems = items.map(({ _rel, ...item }) => item);
    const text = setKnowledgeSources(record.text, cleanItems);
    const beforeBody = record.text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0];
    const afterBody = text.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0];
    if (record.text.slice(beforeBody?.length || 0) !== text.slice(afterBody?.length || 0)) {
      throw new Error(`${record.rel}: migration changed knowledge-page body content`);
    }
    if (text !== record.text) {
      knowledgePagesMigrated += 1;
      changes.push({ rel: record.rel, text, kind: 'knowledge-page' });
    }
  }
  return {
    vault,
    changes,
    anomalies,
    parentMaps,
    summary: {
      sourceRecords: sources.length,
      sourceIdsAssigned: assigned.assigned,
      sourceRecordsUpdated,
      wrappersCreated: wrapperPlan.planned.size,
      knowledgePagesMigrated,
      multipleSourcePages,
      articlePagesDerived,
      locatorsAdded: locatorCount,
      roles: Object.fromEntries([...roleCounts].sort()),
      warnings: anomalies.filter((item) => item.severity === 'warning').length,
      errors: anomalies.filter((item) => item.severity === 'error').length,
    },
  };
}

export function migrateSourceMetadata(root = process.cwd(), options = {}) {
  const plan = planSourceMetadataMigration(root);
  const fatal = plan.anomalies.filter((item) => item.severity === 'error');
  if (fatal.length) {
    throw new Error(`Source metadata migration has ${fatal.length} blocking anomal${fatal.length === 1 ? 'y' : 'ies'}: ${JSON.stringify(fatal)}`);
  }
  if (options.check) {
    if (plan.changes.length) throw new Error(`Source metadata migration is stale: ${plan.changes.length} file(s) would change`);
    const errors = validateSourceMetadata(plan.vault);
    if (errors.length) throw new Error(`Source metadata parity failed:\n${errors.join('\n')}`);
    return { ...plan, validationErrors: [] };
  }
  if (options.dryRun) return { ...plan, validationErrors: [] };
  for (const change of plan.changes) {
    const absolute = path.join(root, change.rel);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, change.text);
  }
  let migrated = loadVault(root);
  let articleSourceSectionsGenerated = 0;
  for (const record of knowledgeRecords(migrated).filter((item) => item.type === 'article')) {
    if (/^##\s+Source reference\s*$/m.test(record.body)) continue;
    const rendered = renderSourceSection(record, migrated);
    const body = `${record.body.trimEnd()}\n\n${rendered}`;
    const header = record.text.slice(0, record.text.length - record.body.length);
    fs.writeFileSync(record.file, `${header}${body}`);
    articleSourceSectionsGenerated += 1;
  }
  migrated = loadVault(root);
  const validationErrors = validateSourceMetadata(migrated);
  for (const [rel, parentMap] of plan.parentMaps) {
    const after = migrated.records.find((record) => record.rel === rel)?.data.parent_map;
    if (after !== parentMap) validationErrors.push(`${rel}: parent_map changed during source migration`);
  }
  if (validationErrors.length) throw new Error(`Source metadata parity failed after migration:\n${validationErrors.join('\n')}`);
  plan.summary.articleSourceSectionsGenerated = articleSourceSectionsGenerated;
  return { ...plan, validationErrors };
}
