import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderTaxonomyRegistry } from '../generate-taxonomy-registry.mjs';
import { renderTopicIndex } from '../generate-topic-index.mjs';
import {
  collectTaxonomyUsage,
  loadTaxonomyRegistry,
  validateRegistry,
} from '../lib/taxonomy-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const usage = collectTaxonomyUsage(root);
const registry = loadTaxonomyRegistry(root, usage);

function topic(overrides) {
  return {
    id: 'tax-topic-9000',
    tag: 'topic/taxonomy-test-anchor',
    facet: 'topic',
    state: 'active',
    approved: true,
    parent: null,
    labels: { en: 'Taxonomy Test Anchor', zh: '分類測試錨點' },
    aliases: [],
    definition: 'A synthetic term used only by the taxonomy validator tests.',
    include_when: 'Use only in an in-memory taxonomy test fixture.',
    exclude_when: 'Exclude from the canonical production vocabulary.',
    replacement: null,
    ...overrides,
  };
}

test('canonical registry validates every real term and current use', () => {
  assert.equal(validateRegistry(registry, usage).length, 0);
  assert.equal(new Set(registry.terms.map((term) => term.id)).size, registry.terms.length);
  assert.equal(new Set(registry.terms.map((term) => term.tag)).size, registry.terms.length);
  assert.ok(registry.terms.every((term) => term.labels.en && term.labels.zh));
  assert.ok(registry.terms.every((term) => 'replacement' in term && Array.isArray(term.aliases)));
});

test('generated views retain zero-use terms in every lifecycle state', () => {
  const fixture = structuredClone(registry);
  fixture.terms.push(
    topic({ id: 'tax-topic-9000', tag: 'topic/taxonomy-test-anchor' }),
    topic({
      id: 'tax-topic-9001',
      tag: 'topic/taxonomy-test-proposal',
      state: 'proposed',
      approved: false,
      labels: { en: 'Taxonomy Test Proposal', zh: '分類測試提案' },
    }),
    topic({
      id: 'tax-topic-9002',
      tag: 'topic/taxonomy-test-deprecated',
      state: 'deprecated',
      labels: { en: 'Taxonomy Test Deprecated', zh: '分類測試已棄用' },
    }),
    topic({
      id: 'tax-topic-9003',
      tag: 'topic/taxonomy-test-merged',
      state: 'merged',
      labels: { en: 'Taxonomy Test Merged', zh: '分類測試已合併' },
      replacement: 'topic/taxonomy-test-anchor',
    }),
  );
  assert.deepEqual(validateRegistry(fixture), []);

  const registryView = renderTaxonomyRegistry(fixture, usage, '2099-01-01');
  for (const tag of ['taxonomy-test-anchor', 'taxonomy-test-proposal', 'taxonomy-test-deprecated', 'taxonomy-test-merged']) {
    assert.match(registryView, new RegExp(`topic/${tag}.*\\| 0 \\|`));
  }

  const topicView = renderTopicIndex(fixture, usage, '2099-01-01');
  assert.match(topicView, /## Proposed topics\n\nCount: \*\*1\*\*\./);
  assert.match(topicView, /## Deprecated topics\n\nCount: \*\*1\*\*\./);
  assert.match(topicView, /## Merged topics\n\nCount: \*\*1\*\*\./);
  assert.doesNotMatch(topicView, /^## .*\(\d+\)$/m);
  assert.match(topicView, /`topic\/taxonomy-test-proposal`/);
  assert.match(topicView, /`topic\/taxonomy-test-deprecated`/);
  assert.match(topicView, /`topic\/taxonomy-test-merged`/);
});

test('used tags must be explicitly approved and active', () => {
  const fixture = structuredClone(registry);
  const usedTerm = fixture.terms.find((term) => term.tag === 'topic/advertising');
  usedTerm.state = 'proposed';
  usedTerm.approved = false;
  const errors = validateRegistry(fixture, usage);
  assert.ok(errors.some((error) => error.includes('topic/advertising: used') && error.includes('only explicitly approved active terms')));

  const unknownUsage = {
    counts: new Map([['topic/unapproved-new-term', 1]]),
    languages: new Map(),
    files: new Map(),
  };
  const unknownErrors = validateRegistry(registry, unknownUsage);
  assert.ok(unknownErrors.some((error) => error.includes('add it as proposed, review overlap, then explicitly activate and approve it')));
});

test('validator rejects alias collisions, near-duplicates, and invalid spellings', () => {
  const aliasFixture = structuredClone(registry);
  aliasFixture.terms.find((term) => term.tag === 'topic/advertising').aliases.push('marketing');
  assert.ok(validateRegistry(aliasFixture).some((error) => error.includes('collides with topic/marketing')));

  const duplicateFixture = structuredClone(registry);
  duplicateFixture.terms.push(topic({
    id: 'tax-topic-9010',
    tag: 'topic/marketng',
    labels: { en: 'Marketng', zh: '行銷錯字' },
  }));
  assert.ok(validateRegistry(duplicateFixture).some((error) => error.includes('probable near-duplicate')));

  const spellingUsage = {
    counts: new Map([['topic/shortform-video', 1]]),
    languages: new Map(),
    files: new Map(),
  };
  assert.ok(validateRegistry(registry, spellingUsage).some((error) => error.includes('use topic/short-form-video')));

  const malformedFixture = structuredClone(registry);
  malformedFixture.terms.find((term) => term.tag === 'topic/advertising').tag = 'topic/Bad_Spelling';
  assert.ok(validateRegistry(malformedFixture).some((error) => error.includes('invalid canonical spelling')));
});
