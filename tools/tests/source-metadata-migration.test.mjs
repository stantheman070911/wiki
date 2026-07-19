import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assignSequentialSourceIds,
  migrateSourceMetadata,
  validateSourceMetadata,
} from '../lib/source-metadata.mjs';
import { loadVault } from '../lib/vault.mjs';

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-source-migration-'));
  fs.mkdirSync(path.join(root, '_meta'), { recursive: true });
  fs.writeFileSync(path.join(root, '_meta', 'vault-schema.yaml'), `schema_version: 1
filesystem:
  ignored_directories: []
  markdown_extension: .md
scopes:
  knowledge:
    page_types: [strategy, article]
`);
  return root;
}

function write(root, rel, text) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function source(title, author, date = '2026-07-01') {
  return `---
title: "${title}"
type: "source"
domain: "source-library"
lang: "en"
source_type: "book"
source_format: "source-note"
processing_status: "processed"
author: "${author}"
date_archived: "${date}"
status: "source"
---

# ${title}

Archived notes.
`;
}

test('sequential IDs preserve existing assignments and append after the maximum', () => {
  const records = [
    { rel: 'b.md', data: { source_id: 'SRC-0007' } },
    { rel: 'a.md', data: {} },
    { rel: 'c.md', data: {} },
  ];
  const result = assignSequentialSourceIds(records);
  assert.deepEqual(result.errors, []);
  assert.equal(result.byRel.get('b.md'), 'SRC-0007');
  assert.equal(result.byRel.get('a.md'), 'SRC-0008');
  assert.equal(result.byRel.get('c.md'), 'SRC-0009');
});

test('migration preserves knowledge body and parent_map while structuring multiple sources and locators', () => {
  const root = fixtureRoot();
  try {
    write(root, '06-Source-Library/Books/Alpha.md', source('Alpha Book', 'Alice Author'));
    write(root, '06-Source-Library/Books/Beta.md', source('Beta Book', 'Bob Author'));
    const body = `# Decision Note

## One-line summary
Summary.

## Source reference
Alice Author, *Alpha Book* (2020), chapter 3. [[Alpha]].

Additional source: [[Beta]].
`;
    write(root, '01-Business-Strategy/Decision Note.md', `---
title: "Decision Note"
type: "strategy"
domain: "business-strategy"
lang: "en"
tags: [topic/example]
source:
  type: "book"
  name: "Alpha Book"
  author: "Alice Author"
  url: "https://example.com/alpha"
  date_of_source: "2020"
date_added: "2026-07-01"
updated: "2026-07-01"
reviewed_on: ""
status: "draft"
parent_map: "01-Business-Strategy/Business Strategy Index"
---

${body}`);

    const first = migrateSourceMetadata(root);
    assert.equal(first.summary.knowledgePagesMigrated, 1);
    assert.equal(first.summary.multipleSourcePages, 1);
    const vault = loadVault(root);
    const page = vault.records.find((record) => record.rel === '01-Business-Strategy/Decision Note.md');
    assert.equal(page.data.parent_map, '01-Business-Strategy/Business Strategy Index');
    assert.equal(page.body, `\n${body}`);
    assert.equal(page.data.source, undefined);
    assert.deepEqual(page.data.sources, [
      { id: 'SRC-0001', role: 'primary', locator: 'chapter 3' },
      { id: 'SRC-0002', role: 'supporting' },
    ]);
    const alpha = vault.bySourceId.get('SRC-0001')[0];
    assert.deepEqual(alpha.data.creators, [{ name: 'Alice Author', role: 'author' }]);
    assert.equal(alpha.data.published_on, '2020');
    assert.equal(alpha.data.url, 'https://example.com/alpha');
    assert.equal(alpha.data.author, undefined);
    assert.equal(alpha.data.lang, undefined);
    assert.deepEqual(validateSourceMetadata(vault), []);

    const second = migrateSourceMetadata(root);
    assert.equal(second.changes.length, 0);
    assert.doesNotThrow(() => migrateSourceMetadata(root, { check: true }));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('attachment-only provenance gets an idempotent companion source record', () => {
  const root = fixtureRoot();
  try {
    write(root, '06-Source-Library/Books/2026-07-01_Book_Example.txt', 'archived source');
    write(root, '01-Business-Strategy/Attachment Note.md', `---
title: "Example Book"
type: "strategy"
domain: "business-strategy"
lang: "en"
tags: [topic/example]
source:
  type: "book"
  name: "Example Book"
  author: "Example Author"
  url: ""
  date_of_source: "2019"
date_added: "2026-07-01"
updated: "2026-07-01"
reviewed_on: ""
status: "draft"
parent_map: "01-Business-Strategy/Business Strategy Index"
---

# Example Book

## One-line summary
Summary.

## Source reference
Example Author, *Example Book* (2019), Chapter 2. [archive](<../06-Source-Library/Books/2026-07-01_Book_Example.txt>).
`);

    const result = migrateSourceMetadata(root);
    assert.equal(result.summary.wrappersCreated, 1);
    const wrapper = path.join(root, '06-Source-Library/Books/2026-07-01_Book_Example.md');
    assert.ok(fs.existsSync(wrapper));
    const vault = loadVault(root);
    const page = vault.records.find((record) => record.rel.endsWith('Attachment Note.md'));
    assert.deepEqual(page.data.sources, [{ id: 'SRC-0001', role: 'primary', locator: 'Chapter 2' }]);
    const sourceRecord = vault.bySourceId.get('SRC-0001')[0];
    assert.equal(sourceRecord.title, 'Example Book — archived source');
    assert.deepEqual(validateSourceMetadata(vault), []);
    assert.equal(migrateSourceMetadata(root).changes.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('parity validator rejects dangling IDs and unsupported roles', () => {
  const root = fixtureRoot();
  try {
    write(root, '06-Source-Library/Books/Alpha.md', source('Alpha Book', 'Alice Author'));
    write(root, '01-Business-Strategy/Decision Note.md', `---
title: "Decision Note"
type: "strategy"
domain: "business-strategy"
lang: "en"
tags: [topic/example]
sources:
  - id: "SRC-9999"
    role: "citation"
date_added: "2026-07-01"
updated: "2026-07-01"
reviewed_on: ""
status: "draft"
parent_map: "01-Business-Strategy/Business Strategy Index"
---

# Decision Note

## Source reference
[[Alpha]]
`);
    const errors = validateSourceMetadata(loadVault(root));
    assert.ok(errors.some((error) => error.includes('unknown source id SRC-9999')));
    assert.ok(errors.some((error) => error.includes('invalid source role citation')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
