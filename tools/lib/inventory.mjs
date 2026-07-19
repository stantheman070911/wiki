import path from 'node:path';

import { collectLinks, typeSet } from './vault.mjs';

export function expectedLeafFolders(schema) {
  const leaves = [];
  for (const [domain, config] of Object.entries(schema.domains || {})) {
    if (config.child_folders?.length) {
      for (const child of config.child_folders) leaves.push({ domain, prefix: `${config.root}${child}` });
    } else {
      leaves.push({ domain, prefix: config.root.replace(/\/$/, '') });
    }
  }
  return leaves.sort((a, b) => a.prefix.localeCompare(b.prefix));
}

export function dataviewBlocks(text) {
  return [...String(text).matchAll(/^```dataview\s*\n([\s\S]*?)^```\s*$/gm)].map((match) => {
    const query = match[1];
    const from = query.match(/^FROM\s+"([^"]+)"\s*$/m)?.[1];
    return { query, from: from ? `${from.replace(/\/$/, '')}/` : '' };
  });
}

function listLiteral(query, field) {
  const expression = new RegExp(`contains\\(list\\(([^)]*)\\),\\s*${field}\\)`, 'i').exec(query)?.[1];
  return expression ? [...expression.matchAll(/"([^"]+)"/g)].map((match) => match[1]) : null;
}

function queryMatches(record, block) {
  if (!block.from || !record.rel.startsWith(block.from)) return false;
  const equal = block.query.match(/\btype\s*=\s*"([^"]+)"/i)?.[1];
  const notEqual = block.query.match(/\btype\s*!=\s*"([^"]+)"/i)?.[1];
  const typeList = listLiteral(block.query, 'type');
  const statusList = listLiteral(block.query, 'status');
  if (equal && record.type !== equal) return false;
  if (notEqual && record.type === notEqual) return false;
  if (typeList && !typeList.includes(record.type)) return false;
  if (statusList && !statusList.includes(record.status)) return false;
  return true;
}

function qualifyingRecords(vault, leaf) {
  const prefix = `${leaf.prefix}/`;
  const active = new Set(vault.schema.lifecycle.knowledge.active_states);
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  if (leaf.domain === 'source-library') {
    return vault.records.filter((record) => record.rel.startsWith(prefix) && ['source', 'source-manifest'].includes(record.type));
  }
  if (leaf.domain === 'reports') {
    return vault.records.filter((record) => record.rel.startsWith(prefix) && record.type === 'report' && vault.schema.lifecycle.report.active_states.includes(record.status));
  }
  return vault.records.filter((record) => record.rel.startsWith(prefix) && knowledgeTypes.has(record.type) && active.has(record.status));
}

function candidateRecords(vault, leaf) {
  const prefix = `${leaf.prefix}/`;
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  if (leaf.domain === 'source-library') return vault.records.filter((record) => record.rel.startsWith(prefix) && ['source', 'source-manifest'].includes(record.type));
  if (leaf.domain === 'reports') return vault.records.filter((record) => record.rel.startsWith(prefix) && record.type === 'report');
  return vault.records.filter((record) => record.rel.startsWith(prefix) && knowledgeTypes.has(record.type));
}

export function validateLeafInventories(vault) {
  const errors = [];
  const leaves = expectedLeafFolders(vault.schema);
  const ownership = vault.schema.navigation_contracts?.leaf_inventory_owners || {};
  const expectedKeys = new Set(leaves.map((leaf) => leaf.prefix));
  const declaredKeys = new Set(Object.keys(ownership));
  for (const key of expectedKeys) if (!declaredKeys.has(key)) errors.push(`leaf inventory has no declared owner: ${key}`);
  for (const key of declaredKeys) if (!expectedKeys.has(key)) errors.push(`leaf inventory owner is declared for a non-leaf path: ${key}`);
  const bodyLinks = collectLinks(vault, { includeStructured: false });
  const inventoryTypes = new Set(['domain-index', 'subdomain-index', 'source-index', 'article-index', 'report-index', 'series-hub']);
  const inventoryRecords = vault.records.filter((record) => inventoryTypes.has(record.type));
  const activeStates = vault.schema.lifecycle.knowledge.active_states;
  for (const leaf of leaves) {
    const ownerValue = ownership[leaf.prefix];
    const owners = Array.isArray(ownerValue) ? ownerValue : [ownerValue].filter(Boolean);
    if (owners.length !== 1) {
      errors.push(`${leaf.prefix}: expected exactly one inventory owner; found ${owners.length}`);
      continue;
    }
    const owner = vault.records.find((record) => record.rel === owners[0]);
    if (!owner) {
      errors.push(`${leaf.prefix}: inventory owner does not exist: ${owners[0]}`);
      continue;
    }
    const expected = qualifyingRecords(vault, leaf).filter((record) => record.rel !== owner.rel);
    const expectedSet = new Set(expected.map((record) => record.rel));
    const candidateSet = new Set(candidateRecords(vault, leaf).filter((record) => record.rel !== owner.rel).map((record) => record.rel));
    const actual = new Set();
    const blocks = dataviewBlocks(owner.body).filter((block) => block.from && `${leaf.prefix}/`.startsWith(block.from));
    for (const block of blocks) {
      const concernsKnowledge = leaf.domain !== 'source-library' && leaf.domain !== 'reports';
      const encoded = listLiteral(block.query, 'status');
      if (concernsKnowledge && !encoded) {
        errors.push(`${owner.rel}: inventory query for ${leaf.prefix} must explicitly filter active lifecycle states ${activeStates.join(', ')}`);
      }
      for (const record of vault.records) if (queryMatches(record, block) && candidateSet.has(record.rel)) actual.add(record.rel);
      if (concernsKnowledge) {
        if (encoded && (encoded.length !== activeStates.length || encoded.some((state) => !activeStates.includes(state)))) {
          errors.push(`${owner.rel}: inventory query for ${leaf.prefix} has lifecycle states [${encoded.join(', ')}], expected [${activeStates.join(', ')}]`);
        }
      }
    }
    for (const link of bodyLinks) {
      if (link.from.rel === owner.rel && link.resolution.status === 'resolved' && candidateSet.has(link.resolution.record?.rel)) actual.add(link.resolution.record.rel);
    }
    const claimingOwners = new Set();
    for (const candidate of inventoryRecords) {
      const candidateBlocks = dataviewBlocks(candidate.body).filter((block) => block.from && `${leaf.prefix}/`.startsWith(block.from));
      if (candidateBlocks.length) claimingOwners.add(candidate.rel);
    }
    if (!claimingOwners.has(owner.rel) && [...expectedSet].every((rel) => actual.has(rel))) claimingOwners.add(owner.rel);
    if (claimingOwners.size !== 1 || !claimingOwners.has(owner.rel)) {
      errors.push(`${leaf.prefix}: inventory ownership multiplicity mismatch; declared=${owner.rel}, claiming=[${[...claimingOwners].sort().join(', ')}]`);
    }
    const missing = [...expectedSet].filter((rel) => !actual.has(rel)).sort();
    const extra = [...actual].filter((rel) => !expectedSet.has(rel)).sort();
    if (missing.length || extra.length) errors.push(`${owner.rel}: exact qualifying inventory mismatch for ${leaf.prefix}; missing=[${missing.join(', ')}], extra=[${extra.join(', ')}]`);
  }
  return { errors, leaves: leaves.length };
}
