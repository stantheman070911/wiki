#!/usr/bin/env node
import {
  loadVault,
  validateLayout,
} from './lib/vault.mjs';

const root = process.cwd();
const write = process.argv.includes('--write');

console.warn('DEPRECATED: normalize-zh-heading-architecture.mjs is now a read-only compatibility check. Canonical Chinese layouts and heading concepts live in _meta/vault-schema.yaml.');

if (write) {
  console.error('The retired --write migration is disabled because it maintained a second heading parser and accepted legacy aliases. Update the canonical template or page deliberately, then run npm run check.');
  process.exitCode = 2;
} else {
  const vault = loadVault(root);
  const candidates = vault.records.filter((record) => {
    const contract = vault.schema.page_types?.[record.type];
    return record.lang === 'zh'
      && contract?.layouts?.some((name) => vault.schema.layout_variants?.[name]?.languages?.includes('zh'));
  });
  const errors = candidates.flatMap((record) => validateLayout(record, vault.schema));

  if (errors.length) {
    console.error(`Chinese layout compatibility check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    const variants = new Set(candidates.flatMap((record) => vault.schema.page_types[record.type].layouts)
      .filter((name) => vault.schema.layout_variants[name]?.languages?.includes('zh')));
    console.log(`Chinese layout compatibility check passed: ${candidates.length} pages across ${variants.size} schema-defined variants.`);
  }
}
