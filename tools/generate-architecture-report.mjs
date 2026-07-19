#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { checkVault } from './check-vault.mjs';
import {
  ARCHITECTURE_REPORT_REL,
  renderArchitectureReport,
} from './lib/architecture-report.mjs';
import { loadTaxonomyRegistry } from './lib/taxonomy-registry.mjs';
import { generatedOn, loadVault, stableGeneratedText } from './lib/vault.mjs';

export {
  ARCHITECTURE_REPORT_REL,
  collectArchitectureReportData,
  renderArchitectureReport,
} from './lib/architecture-report.mjs';

export function generateArchitectureReport(root = process.cwd(), {
  check = false,
  date = generatedOn(),
  checkResult,
  taxonomyRegistry,
} = {}) {
  const vault = loadVault(root);
  const registry = taxonomyRegistry || loadTaxonomyRegistry(root);
  const canonicalCheck = checkResult || checkVault(root, { generated: false, date });
  const output = renderArchitectureReport(vault, {
    date,
    taxonomyRegistry: registry,
    checkResult: canonicalCheck,
  });
  const outputPath = path.join(root, ARCHITECTURE_REPORT_REL);
  const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  const stale = stableGeneratedText(actual) !== stableGeneratedText(output);
  if (check && stale) throw new Error(`${ARCHITECTURE_REPORT_REL} is stale; regenerate it`);
  if (!check && stale) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
  }
  return {
    outputPath,
    stale,
    gateOk: canonicalCheck.ok === true,
    errors: canonicalCheck.errors || [],
    warnings: canonicalCheck.warnings || [],
  };
}

function isMain() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isMain()) {
  try {
    const check = process.argv.includes('--check');
    const result = generateArchitectureReport(process.cwd(), { check });
    console.log(`${check ? 'Verified' : 'Generated'} ${ARCHITECTURE_REPORT_REL}: canonical gate ${result.gateOk ? 'PASS' : 'FAIL'}, ${result.errors.length} errors, ${result.warnings.length} warnings.`);
    if (!result.gateOk) process.exitCode = 1;
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
