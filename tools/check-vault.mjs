#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  categorizeInbound,
  collectLinks,
  directedReachability,
  extractWikilinks,
  generatedOn,
  headings,
  loadVault,
  nonempty,
  normalizeIdentity,
  parseObsidianScopeQuery,
  recordEdges,
  recordsInScope,
  replaceReportLineageSections,
  replaceRelationshipSection,
  replaceSourceSection,
  resolveRelationshipTarget,
  resolveWikilink,
  setDifference,
  stableGeneratedText,
  typeSet,
  undirectedComponents,
  validateDomainMembership,
  validateLayout,
  validateRecordContract,
} from './lib/vault.mjs';
import { renderNavigationArtifacts } from './lib/navigation.mjs';
import { validateMocCoverage } from './lib/moc-coverage.mjs';
import { validateLeafInventories } from './lib/inventory.mjs';
import {
  collectTaxonomyUsage,
  loadTaxonomyRegistry,
  validateRegistry,
} from './lib/taxonomy-registry.mjs';
import { renderTaxonomyRegistry } from './generate-taxonomy-registry.mjs';
import { renderTopicIndex } from './generate-topic-index.mjs';
import { renderMaintenanceReview } from './generate-maintenance-review.mjs';
import { renderArchitectureReport } from './lib/architecture-report.mjs';

function add(errors, condition, message) {
  if (condition) errors.push(message);
}

function canonicalTarget(value) {
  return String(value || '').trim().replace(/^\[\[/, '').replace(/\]\]$/, '').split(/\\?\|/)[0].replace(/\.md$/i, '');
}

export function duplicateIdentityErrors(records) {
  const errors = [];
  const identities = new Map();
  for (const record of records) {
    const values = [
      ['title', record.title],
      ...record.aliases.map((alias) => ['alias', alias]),
    ];
    for (const [kind, value] of values) {
      const normalized = normalizeIdentity(value);
      if (!normalized) continue;
      if (!identities.has(normalized)) identities.set(normalized, []);
      identities.get(normalized).push({ record, kind, value });
    }
  }
  for (const [normalized, occurrences] of identities) {
    const files = [...new Set(occurrences.map(({ record }) => record.rel))];
    if (files.length > 1) errors.push(`global title/alias collision ${JSON.stringify(normalized)}: ${files.join(', ')}`);
  }
  const basenames = new Map();
  for (const record of records) {
    const normalized = normalizeIdentity(path.posix.basename(record.rel, '.md'));
    if (!basenames.has(normalized)) basenames.set(normalized, []);
    basenames.get(normalized).push(record.rel);
  }
  for (const [normalized, files] of basenames) {
    if (files.length > 1) errors.push(`global filename collision ${JSON.stringify(normalized)}: ${files.join(', ')}`);
  }
  return errors;
}

function validateLifecycle(vault) {
  const errors = [];
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const lifecycle = vault.schema.lifecycle.knowledge;
  const states = new Set(lifecycle.states);
  for (const record of vault.records.filter((item) => knowledgeTypes.has(item.type))) {
    add(errors, !states.has(record.status), `${record.rel}: invalid knowledge lifecycle state ${JSON.stringify(record.status)}`);
    const reviewRule = lifecycle.reviewed_on?.[record.status];
    if (reviewRule === 'empty') add(errors, nonempty(record.data.reviewed_on), `${record.rel}: reviewed_on must be empty while status=${record.status}`);
    if (reviewRule === 'nonempty') add(errors, !nonempty(record.data.reviewed_on), `${record.rel}: reviewed_on must be nonempty while status=${record.status}`);
    if (lifecycle.replacement_required.includes(record.status)) {
      const replacements = Array.isArray(record.data.replaced_by) ? record.data.replaced_by : [record.data.replaced_by].filter(nonempty);
      add(errors, replacements.length !== 1, `${record.rel}: status=${record.status} requires exactly one replaced_by target`);
      if (replacements.length === 1) {
        const target = canonicalTarget(replacements[0]);
        const resolution = resolveRelationshipTarget(target, vault);
        add(errors, target === record.rel.replace(/\.md$/i, ''), `${record.rel}: replaced_by cannot target itself`);
        add(errors, resolution.status !== 'resolved', `${record.rel}: replaced_by target is not a resolvable canonical path: ${target}`);
      }
      errors.push(...validateReplacementForwarding(record, vault));
    }
  }
  const reportLifecycle = vault.schema.lifecycle.report;
  const reportStates = new Set(reportLifecycle.states);
  for (const record of vault.records.filter((item) => item.type === 'report')) {
    add(errors, !reportStates.has(record.status), `${record.rel}: invalid report lifecycle state ${JSON.stringify(record.status)}`);
  }
  const historical = vault.records.filter((item) => item.type === 'governance' && item.status === 'historical');
  for (const record of historical) add(errors, !nonempty(record.data.snapshot_on), `${record.rel}: historical governance snapshots require snapshot_on`);
  const generatedSupport = vault.records.filter((item) => ['governance', 'taxonomy-registry', 'topic-index', 'article-index', 'report-index'].includes(item.type) && item.status === 'generated');
  for (const record of generatedSupport) add(errors, !nonempty(record.data.generated_on), `${record.rel}: generated supporting pages require generated_on`);
  return errors;
}

function validateFilesystemLimits(vault, warnings) {
  const errors = [];
  const limits = vault.schema.filesystem.limits;
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  for (const record of vault.records) {
    const basename = path.posix.basename(record.rel, '.md');
    if (knowledgeTypes.has(record.type)) add(errors, [...basename].length > limits.knowledge_filename_max_characters, `${record.rel}: knowledge filename exceeds ${limits.knowledge_filename_max_characters} characters`);
    if (['source', 'source-manifest'].includes(record.type) && [...basename].length > limits.source_filename_review_characters) warnings.push(`${record.rel}: source filename exceeds ${limits.source_filename_review_characters} characters; review portability`);
    if (['source', 'source-manifest'].includes(record.type)) {
      const bytes = fs.statSync(record.file).size;
      if (bytes > limits.source_review_bytes) {
        add(errors, record.data.large_source !== true, `${record.rel}: ${bytes} bytes exceeds source_review_bytes=${limits.source_review_bytes}; set large_source: true`);
        add(errors, !nonempty(record.data.split_decision), `${record.rel}: source above review threshold requires split_decision`);
      }
    }
  }
  return errors;
}

export function validateReplacementForwarding(record, vault) {
  const errors = [];
  if (!['superseded', 'replaced'].includes(record.status)) return errors;
  const replacement = canonicalTarget(Array.isArray(record.data.replaced_by) ? record.data.replaced_by[0] : record.data.replaced_by);
  const noticeRegion = record.body.slice(0, 1200);
  const notice = noticeRegion.match(/Superseded by\s+\[\[([^\]\n]+)\]\]/i);
  if (!notice) {
    errors.push(`${record.rel}: forwarding page must start with a visible Superseded by [[Target]] notice`);
  } else if (canonicalTarget(notice[1]) !== replacement) {
    errors.push(`${record.rel}: forwarding notice target must match replaced_by (${replacement})`);
  }
  const outgoing = record.relationships.filter((relationship) => relationship.type === 'replaced-by' && relationship.target === replacement);
  if (outgoing.length !== 1) errors.push(`${record.rel}: forwarding state requires exactly one replaced-by relationship matching replaced_by`);
  const target = resolveRelationshipTarget(replacement, vault);
  if (target.status === 'resolved') {
    const reverse = target.record.relationships.filter((relationship) => relationship.type === 'replaces' && relationship.target === record.rel.replace(/\.md$/i, ''));
    if (reverse.length !== 1) errors.push(`${record.rel}: replacement target ${target.record.rel} requires exactly one reciprocal replaces relationship`);
  }
  return errors;
}

function exactKeys(item, required, optional, label, errors) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${label}: must be an object`);
    return;
  }
  for (const field of required) add(errors, !nonempty(item[field]), `${label}: ${field} must be nonempty`);
  const allowed = new Set([...required, ...optional]);
  for (const field of Object.keys(item)) add(errors, !allowed.has(field), `${label}: unsupported field ${field}`);
}

export function validateStructuredMetadata(vault) {
  const errors = [];
  const schema = vault.schema;
  const knowledgeTypes = typeSet(schema, 'knowledge');
  const sourceIdRules = schema.provenance.source_id;
  const sourcePattern = new RegExp(sourceIdRules.pattern);
  const sourceIds = new Map();
  const sourceRecords = vault.records.filter((record) => ['source', 'source-manifest'].includes(record.type));
  for (const record of sourceRecords) {
    const id = String(record.data.source_id || '');
    add(errors, !sourcePattern.test(id), `${record.rel}: source_id must match ${sourceIdRules.pattern}`);
    if (id) {
      if (!sourceIds.has(id)) sourceIds.set(id, []);
      sourceIds.get(id).push(record.rel);
    }
    if (!Array.isArray(record.data.creators) || !record.data.creators.length) {
      errors.push(`${record.rel}: creators must be a nonempty array`);
    } else {
      record.data.creators.forEach((creator, index) => exactKeys(creator, ['name', 'role'], [], `${record.rel}: creators[${index}]`, errors));
    }
    add(errors, Object.hasOwn(record.data, 'author'), `${record.rel}: obsolete scalar author field is forbidden; use creators[]`);
    add(errors, Object.hasOwn(record.data, 'lang'), `${record.rel}: obsolete lang field is forbidden; use source_lang and note_lang`);
    if (Object.hasOwn(record.data, 'large_source')) {
      add(errors, typeof record.data.large_source !== 'boolean', `${record.rel}: large_source must be boolean`);
      if (record.data.large_source === true) add(errors, !nonempty(record.data.split_decision), `${record.rel}: large_source=true requires nonempty split_decision`);
    }
    const contract = schema.page_types[record.type];
    const allowedFields = new Set([...(contract.required || []), ...(contract.optional || [])]);
    for (const field of Object.keys(record.data)) add(errors, !allowedFields.has(field), `${record.rel}: non-canonical bibliographic field ${field}`);
  }
  for (const [id, files] of sourceIds) add(errors, files.length !== 1, `source_id ${id} is not globally unique: ${files.join(', ')}`);
  if (sourceIdRules.allocation === 'sequential') {
    const numbers = [...sourceIds.keys()].filter((id) => sourcePattern.test(id)).map((id) => Number(id.match(/(\d+)$/)[1])).sort((a, b) => a - b);
    numbers.forEach((number, index) => add(errors, number !== index + 1, `source_id sequence has a gap or non-canonical start at ${String(number).padStart(4, '0')}`));
  }

  const provenance = schema.provenance;
  const relationshipRules = schema.relationships;
  const relationshipTypes = new Set(Object.keys(relationshipRules.labels));
  for (const record of vault.records.filter((item) => knowledgeTypes.has(item.type))) {
    add(errors, Object.hasOwn(record.data, 'source'), `${record.rel}: obsolete source object is forbidden; use sources[]`);
    if (!Array.isArray(record.data.sources) || !record.data.sources.length) {
      errors.push(`${record.rel}: sources must be a nonempty array`);
    } else {
      const seenSources = new Set();
      record.data.sources.forEach((source, index) => {
        exactKeys(source, provenance.knowledge_item_shape.required, provenance.knowledge_item_shape.optional || [], `${record.rel}: sources[${index}]`, errors);
        add(errors, !provenance.roles.includes(source.role), `${record.rel}: sources[${index}] has unsupported role ${JSON.stringify(source.role)}`);
        const matches = sourceIds.get(String(source.id || '')) || [];
        add(errors, matches.length !== 1, `${record.rel}: sources[${index}] id ${JSON.stringify(source.id)} does not resolve to exactly one source record`);
        if (Object.hasOwn(source, 'locator')) add(errors, !(typeof source.locator === 'string' || (source.locator && typeof source.locator === 'object' && !Array.isArray(source.locator))), `${record.rel}: sources[${index}].locator must be a string or object`);
        const key = `${source.id}\u0000${source.role}\u0000${JSON.stringify(source.locator ?? '')}`;
        add(errors, seenSources.has(key), `${record.rel}: duplicate sources entry for ${source.id}`);
        seenSources.add(key);
      });
    }
    if (!Array.isArray(record.data.relationships) || !record.data.relationships.length) {
      errors.push(`${record.rel}: relationships must be a nonempty array`);
      continue;
    }
    const seenRelationships = new Set();
    record.data.relationships.forEach((relationship, index) => {
      exactKeys(relationship, relationshipRules.item_shape.required, [], `${record.rel}: relationships[${index}]`, errors);
      add(errors, !relationshipTypes.has(relationship.type), `${record.rel}: relationships[${index}] has unsupported type ${JSON.stringify(relationship.type)}`);
      const target = String(relationship.target || '');
      add(errors, target.endsWith('.md') || target.includes('[[') || target.includes('#'), `${record.rel}: relationship target must be a canonical vault path without .md or fragment: ${JSON.stringify(target)}`);
      const resolution = resolveRelationshipTarget(target, vault);
      add(errors, resolution.status !== 'resolved', `${record.rel}: relationship target does not resolve: ${JSON.stringify(target)}`);
      add(errors, resolution.record && !knowledgeTypes.has(resolution.record.type), `${record.rel}: relationship target must be a knowledge page: ${target}`);
      if (relationship.type === 'translation' && resolution.status === 'resolved') {
        add(errors, resolution.record.lang === record.lang, `${record.rel}: translation target must use a different language: ${target}`);
      }
      add(errors, resolution.record?.rel === record.rel, `${record.rel}: relationship cannot target itself`);
      const key = `${relationship.type}\u0000${target}`;
      add(errors, seenRelationships.has(key), `${record.rel}: duplicate relationship ${relationship.type} -> ${target}`);
      seenRelationships.add(key);
    });
    const translations = record.data.relationships.filter((relationship) => relationship.type === 'translation');
    add(errors, translations.length > 1, `${record.rel}: translation relationship must be reciprocal and one-to-one; found ${translations.length} targets`);
    const proposals = Array.isArray(record.data.translation_candidates) ? record.data.translation_candidates : [record.data.translation_candidates].filter(nonempty);
    const seenProposals = new Set();
    for (const proposal of proposals) {
      const targetPath = canonicalTarget(proposal);
      const target = resolveRelationshipTarget(targetPath, vault);
      add(errors, seenProposals.has(targetPath), `${record.rel}: duplicate translation candidate ${targetPath}`);
      add(errors, target.status !== 'resolved', `${record.rel}: translation candidate does not resolve to a canonical page: ${targetPath}`);
      add(errors, target.record && target.record.lang === record.lang, `${record.rel}: translation candidate must use a different language: ${targetPath}`);
      seenProposals.add(targetPath);
    }
    if (record.data.relationships.length && record.data.relationships.every((relationship) => relationshipTypes.has(relationship.type) && resolveRelationshipTarget(relationship.target, vault).status === 'resolved')) {
      try {
        const expectedBody = replaceRelationshipSection(record, vault);
        add(errors, expectedBody !== record.body, `${record.rel}: body relationship section is stale relative to frontmatter relationships`);
      } catch (error) {
        errors.push(error.message);
      }
    }
    if (Array.isArray(record.data.sources) && record.data.sources.length && record.data.sources.every((source) => (sourceIds.get(String(source.id || '')) || []).length === 1)) {
      try {
        const expectedBody = replaceSourceSection(record, vault);
        add(errors, expectedBody !== record.body, `${record.rel}: body source section is stale relative to frontmatter sources`);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }

  for (const record of vault.records.filter((item) => knowledgeTypes.has(item.type) && Array.isArray(item.data.relationships))) {
    for (const relationship of record.relationships) {
      const rule = relationshipRules.labels[relationship.type];
      const target = resolveRelationshipTarget(relationship.target, vault);
      if (!rule || target.status !== 'resolved' || !knowledgeTypes.has(target.record.type)) continue;
      const inverse = rule.inverse;
      const found = target.record.relationships.some((candidate) => candidate.type === inverse && candidate.target === record.rel.replace(/\.md$/i, ''));
      add(errors, !found, `${record.rel}: ${relationship.type} -> ${relationship.target} requires inverse ${inverse} on ${target.record.rel}`);
    }
  }
  return errors;
}

function validateTemplates(vault) {
  const errors = [];
  const templates = vault.records.filter((record) => record.type === 'template');
  const required = vault.schema.template_contracts.required_variants;
  for (const [templateFor, languages] of Object.entries(required)) {
    for (const lang of languages) {
      const matches = templates.filter((record) => record.data.template_for === templateFor && record.lang === lang);
      add(errors, matches.length === 0, `template contract ${templateFor}/${lang} requires at least one variant; found none`);
    }
  }
  if (vault.schema.template_contracts.series_templates_require_field) {
    for (const record of templates.filter((item) => ['series-entry', 'series-hub'].includes(item.data.template_for))) {
      add(errors, !Object.hasOwn(record.data, 'series'), `${record.rel}: series template must declare the series field`);
    }
  }
  for (const record of templates) {
    const target = vault.schema.page_types[record.data.template_for];
    if (!target) continue;
    for (const field of (target.required || []).filter((item) => item !== 'type')) {
      add(errors, !Object.hasOwn(record.data, field), `${record.rel}: template is missing target-contract field ${field}`);
    }
    if ((target.class === 'knowledge') && Object.hasOwn(record.data, 'source')) {
      errors.push(`${record.rel}: knowledge template uses obsolete source object; use sources[]`);
    }
    if (['source', 'source-manifest'].includes(record.data.template_for)) {
      add(errors, Object.hasOwn(record.data, 'author'), `${record.rel}: source template uses obsolete author field`);
    }
  }
  return errors;
}

function validateReports(vault) {
  const errors = [];
  const reports = vault.records.filter((record) => record.type === 'report');
  const supersededTargets = new Map();
  for (const record of reports) {
    const derived = Array.isArray(record.data.derived_from) ? record.data.derived_from : [];
    add(errors, derived.length === 0, `${record.rel}: derived_from must be a nonempty array of canonical paths`);
    const seen = new Set();
    for (const [field, targets] of [['derived_from', derived], ['supersedes', Array.isArray(record.data.supersedes) ? record.data.supersedes : []]]) {
      targets.forEach((raw, index) => {
        const target = String(raw || '');
        add(errors, target !== canonicalTarget(target) || target.endsWith('.md') || target.includes('#'), `${record.rel}: ${field}[${index}] must be a canonical extensionless path: ${JSON.stringify(raw)}`);
        const resolution = resolveRelationshipTarget(target, vault);
        add(errors, resolution.status !== 'resolved', `${record.rel}: ${field}[${index}] does not resolve: ${target}`);
        add(errors, target === record.rel.replace(/\.md$/i, ''), `${record.rel}: ${field}[${index}] cannot target itself`);
        add(errors, seen.has(`${field}\u0000${target}`), `${record.rel}: duplicate ${field} target ${target}`);
        seen.add(`${field}\u0000${target}`);
        if (field === 'supersedes') {
          add(errors, resolution.record && resolution.record.type !== 'report', `${record.rel}: supersedes must target a report: ${target}`);
          if (!supersededTargets.has(target)) supersededTargets.set(target, []);
          supersededTargets.get(target).push(record.rel);
          if (resolution.record?.data.generated_on && record.data.generated_on) {
            add(errors, String(resolution.record.data.generated_on) >= String(record.data.generated_on), `${record.rel}: superseded report must have an earlier generated_on date: ${target}`);
          }
        }
      });
    }
    const supersedes = Array.isArray(record.data.supersedes) ? record.data.supersedes : [];
    add(errors, supersedes.length > Number(vault.schema.report_lineage.supersedes.maximum_targets), `${record.rel}: supersedes allows at most one prior report`);
    try {
      const expectedBody = replaceReportLineageSections(record, vault);
      add(errors, expectedBody !== record.body, `${record.rel}: generated derivation/supersession sections are stale`);
    } catch (error) {
      errors.push(error.message);
    }
  }
  for (const record of reports.filter((item) => item.status === 'superseded')) {
    const target = record.rel.replace(/\.md$/i, '');
    const successors = supersededTargets.get(target) || [];
    add(errors, successors.length !== 1, `${record.rel}: superseded report must be referenced by exactly one successor; found ${successors.length}`);
  }
  for (const [target, successors] of supersededTargets) add(errors, successors.length > 1, `${target}: report is superseded by multiple successors: ${successors.join(', ')}`);
  return errors;
}

function validateSeries(vault) {
  const errors = [];
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const seriesRecords = vault.records.filter((record) => knowledgeTypes.has(record.type) && record.series);
  for (const series of [...new Set(seriesRecords.map((record) => record.series))]) {
    const records = seriesRecords.filter((record) => record.series === series);
    const hubs = records.filter((record) => record.type === 'series-hub');
    add(errors, hubs.length !== 1, `series ${JSON.stringify(series)} requires exactly one series-hub; found ${hubs.length}`);
    add(errors, !records.some((record) => record.type === 'series-entry'), `series ${JSON.stringify(series)} has no series-entry pages`);
    if (hubs.length === 1) {
      const hubPath = hubs[0].rel.replace(/\.md$/i, '');
      for (const record of records.filter((item) => item.type === 'series-entry')) {
        add(errors, canonicalTarget(record.data.parent_map) !== hubPath, `${record.rel}: series entry parent_map must be ${hubPath}`);
      }
    }
  }
  return errors;
}

function validateParentMaps(vault) {
  const errors = [];
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const hubsBySeries = new Map(vault.records.filter((record) => record.type === 'series-hub').map((record) => [record.series, record]));
  const mapsByFolder = new Map(vault.records.filter((record) => record.type === 'subdomain-index').map((record) => [path.posix.dirname(record.rel), record]));
  for (const record of vault.records.filter((item) => knowledgeTypes.has(item.type))) {
    const domain = vault.schema.domains[record.domain];
    if (!domain) continue;
    let expected = domain.index.replace(/\.md$/i, '');
    const folder = path.posix.dirname(record.rel);
    if (mapsByFolder.has(folder)) expected = mapsByFolder.get(folder).rel.replace(/\.md$/i, '');
    if (record.type === 'series-entry' && hubsBySeries.has(record.series)) expected = hubsBySeries.get(record.series).rel.replace(/\.md$/i, '');
    add(errors, canonicalTarget(record.data.parent_map) !== expected, `${record.rel}: parent_map must be ${expected}`);
    const upLine = record.body.match(/^>\s*\*\*Up:\*\*\s*(.+)$/m);
    if (!upLine) {
      errors.push(`${record.rel}: missing static > **Up:** breadcrumb`);
    } else {
      const upLinks = extractWikilinks(upLine[1]);
      add(errors, upLinks.length === 0, `${record.rel}: Up breadcrumb must contain at least one wikilink`);
      if (upLinks.length) {
        const resolution = resolveWikilink(upLinks.at(-1).raw, record, vault);
        add(errors, resolution.status !== 'resolved', `${record.rel}: Up breadcrumb does not resolve`);
        add(errors, resolution.record?.rel.replace(/\.md$/i, '') !== expected, `${record.rel}: Up breadcrumb must target the same parent as parent_map (${expected})`);
      }
    }
  }
  const threshold = Number(vault.schema.navigation_contracts.map_threshold || 25);
  for (const config of Object.values(vault.schema.domains)) {
    for (const child of config.child_folders || []) {
      const folder = `${config.root}${child}`;
      const pages = vault.records.filter((record) => knowledgeTypes.has(record.type) && path.posix.dirname(record.rel) === folder);
      const hasNavigation = mapsByFolder.has(folder) || pages.some((record) => record.type === 'series-hub');
      add(errors, pages.length >= threshold && !hasNavigation, `${folder}/: ${pages.length} direct knowledge pages exceed map threshold ${threshold} without a subdomain map or series hub`);
    }
  }
  return errors;
}

function validateLinks(vault, links) {
  const errors = [];
  for (const link of links) {
    if (link.resolution.status === 'broken') errors.push(`${link.from.rel}: broken ${link.kind} target ${JSON.stringify(link.item.raw || link.item.target || link.item.id)}`);
    if (link.resolution.status === 'ambiguous') errors.push(`${link.from.rel}: ambiguous ${link.kind} target ${JSON.stringify(link.item.raw || link.item.target || link.item.id)}`);
    if (link.fragmentError) errors.push(`${link.from.rel}: ${link.fragmentError}`);
  }
  return errors;
}

function validateGeneratedInventorySets(vault) {
  const errors = [];
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const activeStates = new Set(vault.schema.lifecycle.knowledge.active_states);
  const expectedKnowledge = new Set(vault.records.filter((record) => knowledgeTypes.has(record.type) && activeStates.has(record.status)).map((record) => record.rel));
  const checks = [
    ['_meta/Portable Index.md', null, expectedKnowledge],
    ['07-Articles/Articles Index.md', 'article', new Set(vault.records.filter((record) => record.type === 'article' && activeStates.has(record.status)).map((record) => record.rel))],
    ['Reports/Reports Index.md', 'report', new Set(vault.records.filter((record) => record.type === 'report' && vault.schema.lifecycle.report.active_states.includes(record.status)).map((record) => record.rel))],
    ['_meta/Source and Author Index.md', ['source', 'source-manifest'], new Set(vault.records.filter((record) => ['source', 'source-manifest'].includes(record.type)).map((record) => record.rel))],
  ];
  for (const [rel, types, expected] of checks) {
    const record = vault.records.find((item) => item.rel === rel);
    if (!record) {
      errors.push(`${rel}: generated inventory is missing`);
      continue;
    }
    const allowedTypes = types ? new Set(Array.isArray(types) ? types : [types]) : null;
    const targets = collectLinks(vault, { includeStructured: false })
      .filter((link) => link.from.rel === rel && link.resolution.status === 'resolved'
        && (allowedTypes ? allowedTypes.has(link.resolution.record?.type) : knowledgeTypes.has(link.resolution.record?.type)))
      .map((link) => link.resolution.record.rel);
    const actual = new Set(targets);
    const missing = setDifference(expected, actual);
    const extra = setDifference(actual, expected);
    if (missing.length || extra.length) errors.push(`${rel}: exact inventory mismatch; missing=[${missing.join(', ')}], extra=[${extra.join(', ')}]`);
    const multiplicity = new Map();
    for (const target of targets) multiplicity.set(target, (multiplicity.get(target) || 0) + 1);
    const duplicates = [...multiplicity].filter(([, count]) => count !== 1).map(([target, count]) => `${target} (${count}x)`);
    if (duplicates.length) errors.push(`${rel}: each qualifying inventory page must appear exactly once; duplicates=[${duplicates.join(', ')}]`);
  }
  return errors;
}

function validateGeneratedArtifacts(vault, date, { taxonomyRegistry, taxonomyUsage, checkResult }) {
  const errors = [];
  const expected = renderNavigationArtifacts(vault, { date });
  expected.set('_meta/Maintenance Review.md', renderMaintenanceReview(vault, date));
  expected.set('_meta/Architecture Report.md', renderArchitectureReport(vault, {
    date,
    taxonomyRegistry,
    checkResult,
  }));
  expected.set('_meta/Tags.md', renderTaxonomyRegistry(taxonomyRegistry, taxonomyUsage, date));
  expected.set('_meta/Topic-Index.md', renderTopicIndex(taxonomyRegistry, taxonomyUsage, date));
  const expectedPaths = new Set(expected.keys());
  const declared = new Set(vault.schema.filesystem.deterministic_artifacts);
  for (const rel of setDifference(declared, expectedPaths)) errors.push(`${rel}: deterministic artifact has no in-memory renderer`);
  for (const rel of setDifference(expectedPaths, declared)) errors.push(`${rel}: renderer output is not declared deterministic`);
  for (const [rel, rendered] of expected) {
    const actual = fs.existsSync(path.join(vault.root, rel)) ? fs.readFileSync(path.join(vault.root, rel), 'utf8') : '';
    if (stableGeneratedText(actual) !== stableGeneratedText(rendered)) errors.push(`${rel}: generated artifact is stale`);
  }
  return errors;
}

function validateGraphAndSearchScopes(vault) {
  const errors = [];
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(vault.root, rel), 'utf8'));
  const defaultGraph = readJson('.obsidian/graph.json');
  const sourceGraph = readJson('.obsidian/graph-source-traceability.json');
  const defaultQuery = parseObsidianScopeQuery(defaultGraph.search);
  const sourceQuery = parseObsidianScopeQuery(sourceGraph.search);
  const expectedDefault = new Set(vault.schema.scopes.default_graph.include_prefixes || []);
  const expectedDefaultFiles = new Set((vault.schema.scopes.default_graph.include_paths || []).map((rel) => path.posix.basename(rel, '.md')));
  const expectedSource = new Set(vault.schema.scopes.source_traceability_graph.include_prefixes);
  for (const item of setDifference(expectedDefault, defaultQuery.include)) errors.push(`.obsidian/graph.json: missing reader inclusion ${item}`);
  for (const item of setDifference(defaultQuery.include, expectedDefault)) errors.push(`.obsidian/graph.json: undeclared reader inclusion ${item}`);
  for (const item of setDifference(expectedDefaultFiles, defaultQuery.includeFiles)) errors.push(`.obsidian/graph.json: missing governed root entry ${item}`);
  for (const item of setDifference(defaultQuery.includeFiles, expectedDefaultFiles)) errors.push(`.obsidian/graph.json: undeclared root entry ${item}`);
  add(errors, defaultQuery.exclude.size > 0 || defaultQuery.excludeFiles.size > 0, '.obsidian/graph.json: exact reader scope must use positive inclusion rather than leakage-prone negative filters');
  for (const item of setDifference(expectedSource, sourceQuery.include)) errors.push(`.obsidian/graph-source-traceability.json: missing inclusion ${item}`);
  for (const item of setDifference(sourceQuery.include, expectedSource)) errors.push(`.obsidian/graph-source-traceability.json: undeclared inclusion ${item}`);
  add(errors, Boolean(defaultGraph.showAttachments) !== Boolean(vault.schema.scopes.default_graph.show_attachments), '.obsidian/graph.json: showAttachments differs from schema');
  add(errors, Boolean(sourceGraph.showAttachments) !== Boolean(vault.schema.scopes.source_traceability_graph.show_attachments), '.obsidian/graph-source-traceability.json: showAttachments differs from schema');
  const graphViews = fs.readFileSync(path.join(vault.root, '_meta/Graph Views.md'), 'utf8');
  add(errors, !graphViews.includes(defaultGraph.search), '_meta/Graph Views.md: documented default filter differs from committed graph configuration');
  add(errors, !graphViews.includes(sourceGraph.search), '_meta/Graph Views.md: documented source filter differs from committed graph configuration');
  const rawPolicy = fs.readFileSync(path.join(vault.root, '_meta/Raw Source Policy.md'), 'utf8');
  add(errors, !rawPolicy.includes(defaultGraph.search), '_meta/Raw Source Policy.md: documented reader search differs from the exact default reader scope');
  const searchScope = vault.schema.scopes.knowledge_search;
  for (const item of setDifference(new Set(vault.schema.scopes.default_graph.include_prefixes || []), new Set(searchScope.include_prefixes || []))) errors.push(`knowledge_search: missing default-reader prefix ${item}`);
  for (const item of setDifference(new Set(searchScope.include_prefixes || []), new Set(vault.schema.scopes.default_graph.include_prefixes || []))) errors.push(`knowledge_search: undeclared default-reader prefix ${item}`);
  for (const item of setDifference(new Set(vault.schema.scopes.default_graph.include_paths || []), new Set(searchScope.include_paths || []))) errors.push(`knowledge_search: missing governed root path ${item}`);
  const readerSet = new Set(recordsInScope(vault, 'reader').map((record) => record.rel));
  const searchSet = new Set(recordsInScope(vault, 'knowledge_search').map((record) => record.rel));
  for (const item of setDifference(readerSet, searchSet)) errors.push(`knowledge_search: reader page omitted from exact scope: ${item}`);
  for (const item of setDifference(searchSet, readerSet)) errors.push(`knowledge_search: non-reader page leaked into exact scope: ${item}`);
  return errors;
}

function graphMetrics(vault, edges) {
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const activeStates = new Set(vault.schema.lifecycle.knowledge.active_states);
  const activeKnowledge = vault.records.filter((record) => knowledgeTypes.has(record.type) && activeStates.has(record.status));
  const curatedTypes = typeSet(vault.schema, 'curated_reader');
  const reportActiveStates = new Set(vault.schema.lifecycle.report.active_states);
  const traversal = vault.records.filter((record) => curatedTypes.has(record.type)
    && (!knowledgeTypes.has(record.type) || activeStates.has(record.status))
    && (record.type !== 'report' || reportActiveStates.has(record.status)));
  const unreachableByHome = {};
  for (const home of vault.records.filter((record) => record.type === 'vault-home')) {
    const reach = directedReachability(home.rel, traversal, edges, { excludedFrom: vault.generatedArtifacts });
    unreachableByHome[home.rel] = traversal.filter((record) => !reach.visited.has(record.rel)).map((record) => record.rel);
  }
  const components = undirectedComponents(activeKnowledge, edges);
  const inbound = categorizeInbound(activeKnowledge, edges, vault);
  const inboundTotals = { curated: 0, semantic: 0, generated: 0, incidental: 0 };
  for (const categories of inbound.values()) for (const key of Object.keys(inboundTotals)) inboundTotals[key] += categories[key].size;
  const zeroOrganic = activeKnowledge.filter((record) => {
    const categories = inbound.get(record.rel);
    return categories.curated.size + categories.semantic.size === 0;
  }).map((record) => record.rel);
  return { activeKnowledge, readerPages: traversal, unreachableByHome, components, inboundTotals, zeroOrganic };
}

export function checkVault(root = process.cwd(), options = {}) {
  const errors = [];
  const warnings = [];
  let vault;
  try {
    vault = loadVault(root);
  } catch (error) {
    return { ok: false, errors: [error.message], warnings, metrics: {} };
  }
  errors.push(...vault.parseErrors);
  const audited = recordsInScope(vault, 'audit');
  for (const record of audited) {
    errors.push(...validateRecordContract(record, vault.schema));
    errors.push(...validateLayout(record, vault.schema));
    add(errors, path.posix.basename(record.rel).toLowerCase() === 'readme.md', `${record.rel}: nested README filenames are reserved`);
    add(errors, /(^|\/)untitled(?:\.md)?$/i.test(record.rel), `${record.rel}: untitled filenames are forbidden`);
  }
  errors.push(...duplicateIdentityErrors(audited));
  errors.push(...validateFilesystemLimits(vault, warnings));
  errors.push(...validateLifecycle(vault));
  errors.push(...validateStructuredMetadata(vault));
  errors.push(...validateTemplates(vault));
  errors.push(...validateReports(vault));
  errors.push(...validateSeries(vault));
  errors.push(...validateParentMaps(vault));

  let taxonomyUsage;
  let taxonomyRegistry;
  try {
    taxonomyUsage = collectTaxonomyUsage(vault.root);
    taxonomyRegistry = loadTaxonomyRegistry(vault.root, taxonomyUsage);
    errors.push(...validateRegistry(taxonomyRegistry, taxonomyUsage).map((error) => `taxonomy: ${error}`));
  } catch (error) {
    errors.push(`taxonomy validation failed: ${error.message}`);
  }

  const links = collectLinks(vault);
  errors.push(...validateLinks(vault, links));
  const edges = recordEdges(vault);
  errors.push(...validateDomainMembership(vault, edges));
  const moc = validateMocCoverage(vault);
  errors.push(...moc.errors);
  const leafInventories = validateLeafInventories(vault);
  errors.push(...leafInventories.errors);
  errors.push(...validateGraphAndSearchScopes(vault));

  const metrics = graphMetrics(vault, edges);
  for (const [home, unreachable] of Object.entries(metrics.unreachableByHome)) {
    if (unreachable.length) errors.push(`${home}: ${unreachable.length} active reader pages are not forward-reachable when generated pages cannot supply outgoing navigation: ${unreachable.join(', ')}`);
  }
  add(errors, metrics.components.length !== 1, `active knowledge graph has ${metrics.components.length} undirected components`);
  if (metrics.zeroOrganic.length) warnings.push(`${metrics.zeroOrganic.length} active knowledge pages have zero curated or semantic inbound: ${metrics.zeroOrganic.join(', ')}`);

  const resultMetrics = {
    audited: audited.length,
    knowledge: metrics.activeKnowledge.length,
    readerPages: metrics.readerPages.length,
    links: links.length,
    edges: edges.length,
    undirectedComponents: metrics.components.length,
    unreachableByHome: Object.fromEntries(Object.entries(metrics.unreachableByHome).map(([home, files]) => [home, files.length])),
    zeroOrganicInbound: metrics.zeroOrganic.length,
    inboundCategories: metrics.inboundTotals,
    mocCoverage: `${moc.covered}/${moc.pages}`,
    leafInventories: leafInventories.leaves,
  };
  const canonicalCheck = {
    ok: errors.length === 0,
    errors: [...errors],
    warnings: [...warnings],
    metrics: resultMetrics,
  };

  if (options.generated !== false && taxonomyRegistry && taxonomyUsage) {
    errors.push(...validateGeneratedArtifacts(vault, options.date || generatedOn(), {
      taxonomyRegistry,
      taxonomyUsage,
      checkResult: canonicalCheck,
    }));
    errors.push(...validateGeneratedInventorySets(vault));
  }
  return { ok: errors.length === 0, errors, warnings, metrics: resultMetrics };
}

function isMain() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isMain()) {
  const result = checkVault(process.cwd());
  if (result.ok) {
    console.log(`PASS: ${result.metrics.audited} audited pages; ${result.metrics.knowledge} active knowledge pages; ${result.metrics.edges} resolved edges; ${result.metrics.undirectedComponents} undirected component.`);
    console.log(`Directed reachability (generated navigation excluded): ${Object.entries(result.metrics.unreachableByHome).map(([home, count]) => `${home}=${count} unreachable`).join(', ')}.`);
    console.log(`Inbound edges by source category: curated=${result.metrics.inboundCategories.curated}, semantic=${result.metrics.inboundCategories.semantic}, generated=${result.metrics.inboundCategories.generated}, incidental=${result.metrics.inboundCategories.incidental}; zero organic=${result.metrics.zeroOrganicInbound}.`);
  } else {
    console.error(`FAIL: ${result.errors.length} vault contract violation${result.errors.length === 1 ? '' : 's'}:`);
    for (const error of result.errors) console.error(`- ${error}`);
  }
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  if (!result.ok) process.exitCode = 1;
}
