#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  generatedOn,
  loadVault,
  stableGeneratedText,
} from './lib/vault.mjs';
import { renderNavigationArtifacts } from './lib/navigation.mjs';

export function generateNavigationIndexes(root = process.cwd(), options = {}) {
  const vault = loadVault(root);
  const date = options.date || generatedOn();
  const artifacts = renderNavigationArtifacts(vault, { date });
  const stale = [];
  for (const [rel, rendered] of artifacts) {
    const absolute = path.join(root, rel);
    const expected = rendered.trimEnd() + '\n';
    const actual = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
    if (stableGeneratedText(actual) === stableGeneratedText(expected)) continue;
    stale.push(rel);
    if (!options.check) fs.writeFileSync(absolute, expected);
  }
  if (options.check && stale.length) {
    throw new Error(`Stale generated navigation artifacts: ${stale.join(', ')}`);
  }
  return { artifacts, stale, date };
}

function isMain() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isMain()) {
  const check = process.argv.includes('--check');
  try {
    const result = generateNavigationIndexes(process.cwd(), { check });
    console.log(check
      ? `PASS: ${result.artifacts.size} generated navigation artifacts are current.`
      : `Generated ${result.artifacts.size} navigation artifacts (${result.date}).`);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
