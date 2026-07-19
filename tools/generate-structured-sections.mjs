#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  loadVault,
  replaceRelationshipSection,
  replaceReportLineageSections,
  replaceSourceSection,
  typeSet,
} from './lib/vault.mjs';

export function generateStructuredSections(root = process.cwd(), { check = false } = {}) {
  const vault = loadVault(root);
  if (vault.parseErrors.length) throw new Error(vault.parseErrors.join('\n'));
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const changed = [];
  for (const record of vault.records.filter((item) => knowledgeTypes.has(item.type))) {
    if (!Array.isArray(record.data.relationships) || !Array.isArray(record.data.sources)) {
      throw new Error(`${record.rel}: sources and relationships must be migrated before generating body sections`);
    }
    let body = replaceRelationshipSection(record, vault);
    body = replaceSourceSection({ ...record, body }, vault);
    if (body === record.body) continue;
    changed.push(record.rel);
    if (!check) {
      const header = record.text.slice(0, record.text.length - record.body.length);
      fs.writeFileSync(record.file, `${header}${body}`);
    }
  }
  for (const record of vault.records.filter((item) => item.type === 'report')) {
    const body = replaceReportLineageSections(record, vault);
    if (body === record.body) continue;
    changed.push(record.rel);
    if (!check) {
      const header = record.text.slice(0, record.text.length - record.body.length);
      fs.writeFileSync(record.file, `${header}${body}`);
    }
  }
  if (check && changed.length) throw new Error(`${changed.length} stale structured body sections: ${changed.join(', ')}`);
  return { checked: vault.records.filter((item) => knowledgeTypes.has(item.type) || item.type === 'report').length, changed };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const check = process.argv.includes('--check');
  try {
    const result = generateStructuredSections(process.cwd(), { check });
    console.log(`${check ? 'Verified' : 'Generated'} ${result.checked} structured relationship/source sections; ${result.changed.length} ${check ? 'stale' : 'updated'}.`);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
