import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  duplicateIdentityErrors,
  validateReplacementForwarding,
  validateStructuredMetadata,
} from '../check-vault.mjs';
import { validateLeafInventories } from '../lib/inventory.mjs';
import {
  renderArticleIndex,
  renderNavigationArtifacts,
  renderPortableIndex,
  renderReportsIndex,
} from '../lib/navigation.mjs';
import {
  buildRecordIndexes,
  directedReachability,
  extractWikilinks,
  loadVault,
  loadSchema,
  parseFrontmatter,
  parseWikilink,
  replaceRelationshipSection,
  replaceSourceSection,
  renderRelationshipSection,
  renderSourceSection,
  resolveWikilink,
  undirectedComponents,
  validateResolvedFragment,
} from '../lib/vault.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const schema = loadSchema(root);

function record(rel, title, aliases = [], body = '') {
  return { rel, title, aliases, body, data: {}, type: 'governance', lang: 'en', relationships: [], sources: [] };
}

test('proper YAML parsing preserves block-list aliases and multiline scalars', () => {
  const text = fs.readFileSync(path.join(root, 'tools/tests/fixtures/frontmatter-edge-cases.md'), 'utf8');
  const parsed = parseFrontmatter(text, 'fixture.md');
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.data.title, 'Multiline Fixture Title');
  assert.deepEqual(parsed.data.aliases, ['Old Fixture Name', 'Fixture Alias']);
  assert.equal(parsed.data.description, 'First preserved line.\nSecond preserved line.\n');
});

test('alias-based links survive a canonical rename and validate headings and block IDs', () => {
  const target = record('Folder/New Canonical Name.md', 'New Canonical Name', ['Old Fixture Name'], '## Addressable heading\n\nParagraph. ^fixture-block\n');
  const from = record('From.md', 'From');
  const vault = { records: [from, target], ...buildRecordIndexes([from, target]) };
  const renamed = resolveWikilink('Old Fixture Name#Addressable heading', from, vault);
  assert.equal(renamed.status, 'resolved');
  assert.equal(renamed.record.rel, target.rel);
  assert.equal(validateResolvedFragment(renamed), null);
  assert.equal(validateResolvedFragment(resolveWikilink('Old Fixture Name#^fixture-block', from, vault)), null);
});

test('escaped table aliases parse as aliases, not as part of the path', () => {
  assert.deepEqual(parseWikilink('Folder/Page\\|Display'), { page: 'Folder/Page', heading: '', block: '', target: 'Folder/Page' });
});

test('genuine-link extraction ignores inline code, fenced code, and comments', () => {
  const body = '[[Real]]\n`[[Inline]]`\n```md\n[[Fenced]]\n```\n<!-- [[Comment]] -->\n';
  assert.deepEqual(extractWikilinks(body).map((link) => link.raw), ['Real']);
});

test('duplicate normalized titles and aliases are globally rejected', () => {
  const records = [record('A.md', 'Same Name'), record('B.md', 'Different', ['same-name'])];
  assert.ok(duplicateIdentityErrors(records).some((error) => error.includes('global title/alias collision')));
});

test('directed reachability and undirected connectedness remain distinct', () => {
  const a = record('A.md', 'A');
  const b = record('B.md', 'B');
  const c = record('C.md', 'C');
  const edges = [{ from: b, to: a }, { from: c, to: b }];
  assert.deepEqual([...directedReachability('A.md', [a, b, c], edges).visited], ['A.md']);
  assert.equal(undirectedComponents([a, b, c], edges).length, 1);
});

test('structured relationship and source sections render canonical paths with full parity fields', () => {
  const source = { ...record('06-Source-Library/Books/Source.md', 'Canonical Source'), data: { source_id: 'SRC-0001' } };
  const target = record('04-Frameworks-and-Mental-Models/Target.md', 'Target Page');
  const page = {
    ...record('01-Business-Strategy/Page.md', 'Page'),
    relationships: [{ type: 'applies', target: '04-Frameworks-and-Mental-Models/Target' }],
    sources: [{ id: 'SRC-0001', role: 'primary', locator: { chapter: 2, page: 10 } }],
  };
  const records = [page, target, source];
  const indexes = buildRecordIndexes(records);
  const vault = { schema, records, ...indexes };
  assert.match(renderRelationshipSection(page, vault), /\*\*Applies:\*\* \[\[04-Frameworks-and-Mental-Models\/Target\|Target Page\]\]/);
  assert.match(renderSourceSection(page, vault), /\*\*primary:\*\* \[\[06-Source-Library\/Books\/Source\|Canonical Source\]\] — locator: chapter=2; page=10/);
});

test('leaf inventory validation enforces exact page membership and a single claiming owner', () => {
  const owner = { ...record('Domain/Map.md', 'Map'), type: 'domain-index', domain: 'fixture', body: '```dataview\nTABLE file.link\nFROM "Domain/Leaf"\nWHERE type = "framework"\nAND contains(list("draft", "reviewed", "evergreen"), status)\n```\n' };
  const page = { ...record('Domain/Leaf/Page.md', 'Page'), type: 'framework', domain: 'fixture', status: 'draft' };
  const fixtureSchema = {
    lifecycle: { knowledge: { active_states: ['draft', 'reviewed', 'evergreen'] }, report: { active_states: ['draft', 'reviewed'] } },
    scopes: { knowledge: { page_types: ['framework'] } },
    domains: { fixture: { root: 'Domain/', index: 'Domain/Map.md', child_folders: ['Leaf'] } },
    navigation_contracts: { leaf_inventory_owners: { 'Domain/Leaf': 'Domain/Map.md' } },
  };
  const makeVault = (records) => ({ schema: fixtureSchema, records, generatedArtifacts: new Set(), root, ...buildRecordIndexes(records) });
  assert.deepEqual(validateLeafInventories(makeVault([owner, page])).errors, []);
  const duplicateOwner = { ...owner, rel: 'Domain/Second Map.md', title: 'Second Map' };
  assert.ok(validateLeafInventories(makeVault([owner, duplicateOwner, page])).errors.some((error) => error.includes('ownership multiplicity mismatch')));
  const missingQuery = { ...owner, body: owner.body.replace('type = "framework"', 'type = "playbook"') };
  assert.ok(validateLeafInventories(makeVault([missingQuery, page])).errors.some((error) => error.includes('exact qualifying inventory mismatch')));
  const displayedStatusOnly = {
    ...owner,
    body: owner.body
      .replace('TABLE file.link', 'TABLE file.link, status')
      .replace('\nAND contains(list("draft", "reviewed", "evergreen"), status)', ''),
  };
  assert.ok(validateLeafInventories(makeVault([displayedStatusOnly, page])).errors.some((error) => error.includes('must explicitly filter active lifecycle states')));
});

test('translation edges are canonical, cross-language, reciprocal, and one-to-one', () => {
  const source = {
    ...record('06-Source-Library/Books/Source.md', 'Source'),
    type: 'source',
    data: {
      source_id: 'SRC-0001',
      creators: [{ name: 'Fixture Author', role: 'author' }],
    },
  };
  const english = {
    ...record('01-Business-Strategy/English.md', 'English', [], '# English\n\n## Source reference\n\n_fixture_\n\n## Relationships\n\n_fixture_\n'),
    type: 'framework', domain: 'business-strategy', lang: 'en', status: 'draft',
    data: {}, sources: [{ id: 'SRC-0001', role: 'primary' }],
    relationships: [{ type: 'translation', target: '01-Business-Strategy/中文' }],
  };
  const chinese = {
    ...record('01-Business-Strategy/中文.md', '中文', [], '# 中文\n\n## 來源\n\n_fixture_\n\n## 關係\n\n_fixture_\n'),
    type: 'framework', domain: 'business-strategy', lang: 'zh', status: 'draft',
    data: {}, sources: [{ id: 'SRC-0001', role: 'primary' }],
    relationships: [{ type: 'translation', target: '01-Business-Strategy/English' }],
  };
  for (const page of [english, chinese]) {
    page.data = { sources: page.sources, relationships: page.relationships };
  }
  const records = [english, chinese, source];
  const vault = { schema, records, generatedArtifacts: new Set(), ...buildRecordIndexes(records) };
  for (const page of [english, chinese]) {
    page.body = replaceSourceSection(page, vault);
    page.body = replaceRelationshipSection(page, vault);
  }
  assert.deepEqual(validateStructuredMetadata(vault), []);

  chinese.relationships = [{ type: 'related', target: '01-Business-Strategy/English' }];
  chinese.data.relationships = chinese.relationships;
  english.relationships.push({ type: 'related', target: '01-Business-Strategy/中文' });
  english.data.relationships = english.relationships;
  for (const page of [english, chinese]) page.body = replaceRelationshipSection(page, vault);
  assert.ok(validateStructuredMetadata(vault).some((error) => error.includes('translation') && error.includes('requires inverse')));
});

test('retired pages stay out of active inventories and appear only in retirement views', () => {
  const active = {
    ...record('07-Articles/Active.md', 'Active'), type: 'article', domain: 'articles', lang: 'en', status: 'draft',
    data: { date_added: '2026-07-01' },
  };
  const retired = {
    ...record('07-Articles/Retired.md', 'Retired'), type: 'article', domain: 'articles', lang: 'en', status: 'superseded',
    data: { date_added: '2026-06-01', replaced_by: '07-Articles/Active' },
  };
  const reportIndex = {
    ...record('Reports/Reports Index.md', 'Reports'), type: 'report-index', domain: 'reports', status: 'generated',
    text: '---\ntitle: Reports\ntype: report-index\ndomain: reports\nlang: en\ngenerated_on: 2026-07-19\nstatus: generated\n---\n# Reports\n\n## Browse reports\n',
  };
  const activeReport = {
    ...record('Reports/Active Report.md', 'Active Report'), type: 'report', domain: 'reports', lang: 'en', status: 'reviewed',
    data: { generated_on: '2026-07-19', derived_from: ['07-Articles/Active'], owner: 'owner' },
  };
  const retiredReport = {
    ...record('Reports/Old Report.md', 'Old Report'), type: 'report', domain: 'reports', lang: 'en', status: 'superseded',
    data: { generated_on: '2026-06-01', derived_from: ['07-Articles/Retired'], supersedes: ['Reports/Active Report'], owner: 'owner' },
  };
  const records = [active, retired, reportIndex, activeReport, retiredReport];
  const vault = { schema, records, generatedArtifacts: new Set(['Reports/Reports Index.md']), ...buildRecordIndexes(records) };
  const portable = renderPortableIndex(vault, '2026-07-19');
  const articles = renderArticleIndex(vault, '2026-07-19');
  const reports = renderReportsIndex(vault, '2026-07-19');
  assert.match(portable, /07-Articles\/Active/);
  assert.doesNotMatch(portable, /07-Articles\/Retired/);
  assert.match(articles.slice(articles.indexOf('## Active articles'), articles.indexOf('## Retired articles')), /07-Articles\/Active/);
  assert.doesNotMatch(articles.slice(articles.indexOf('## Active articles'), articles.indexOf('## Retired articles')), /07-Articles\/Retired/);
  assert.match(articles.slice(articles.indexOf('## Retired articles')), /07-Articles\/Retired/);
  assert.doesNotMatch(reports.slice(reports.indexOf('### Active reports'), reports.indexOf('### Superseded reports')), /Reports\/Old Report/);
  assert.match(reports.slice(reports.indexOf('### Superseded reports')), /Reports\/Old Report/);
});

test('retired forwarding pages expose one canonical redirect and reciprocal replacement edge', () => {
  const oldPage = {
    ...record('04-Frameworks-and-Mental-Models/Old.md', 'Old', [], '> [!warning] Superseded by [[04-Frameworks-and-Mental-Models/New|New]].\n'),
    type: 'framework', status: 'superseded', data: { replaced_by: '04-Frameworks-and-Mental-Models/New' },
    relationships: [{ type: 'replaced-by', target: '04-Frameworks-and-Mental-Models/New' }],
  };
  const newPage = {
    ...record('04-Frameworks-and-Mental-Models/New.md', 'New'), type: 'framework', status: 'evergreen',
    relationships: [{ type: 'replaces', target: '04-Frameworks-and-Mental-Models/Old' }],
  };
  const records = [oldPage, newPage];
  const vault = { schema, records, ...buildRecordIndexes(records) };
  assert.deepEqual(validateReplacementForwarding(oldPage, vault), []);
  oldPage.body = '> [!warning] Superseded by [[04-Frameworks-and-Mental-Models/Wrong]].\n';
  assert.ok(validateReplacementForwarding(oldPage, vault).some((error) => error.includes('notice target must match')));
  oldPage.body = '> [!warning] Superseded by [[04-Frameworks-and-Mental-Models/New]].\n';
  newPage.relationships = [];
  assert.ok(validateReplacementForwarding(oldPage, vault).some((error) => error.includes('reciprocal replaces')));
});

test('navigation artifacts are independent of their previous generated bodies in one pass', () => {
  const vault = loadVault(root);
  const date = '2026-07-19';
  const first = renderNavigationArtifacts(vault, { date });
  for (const [rel, text] of first) {
    const generated = vault.records.find((item) => item.rel === rel);
    assert.ok(generated, rel);
    const parsed = parseFrontmatter(text, rel);
    generated.text = text;
    generated.body = parsed.body;
    generated.data = parsed.data;
    generated.title = String(parsed.data.title || '');
    generated.status = String(parsed.data.status || '');
  }
  assert.deepEqual(renderNavigationArtifacts(vault, { date }), first);
});
