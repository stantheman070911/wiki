#!/usr/bin/env node

// Compatibility entry point retained for existing local commands. The
// canonical migration owns YAML parsing, page-type selection, link resolution,
// relationship classification, inverse generation, and generated-body parity.
console.warn('DEPRECATED: tools/migrate-relationship-types.mjs delegates to tools/migrate-structured-relationships.mjs.');
await import('./migrate-structured-relationships.mjs');
