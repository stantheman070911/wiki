#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { migrateSourceMetadata } from './lib/source-metadata.mjs';

export { migrateSourceMetadata } from './lib/source-metadata.mjs';

function isMain() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isMain()) {
  const dryRun = process.argv.includes('--dry-run');
  const check = process.argv.includes('--check');
  try {
    const result = migrateSourceMetadata(process.cwd(), { dryRun, check });
    const verb = check ? 'Verified' : dryRun ? 'Planned' : 'Migrated';
    console.log(`${verb} structured source metadata.`);
    console.log(JSON.stringify(result.summary, null, 2));
    if (result.anomalies.length) {
      console.log('Non-blocking anomalies:');
      console.log(JSON.stringify(result.anomalies, null, 2));
    }
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
