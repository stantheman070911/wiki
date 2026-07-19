import path from 'node:path';

import { extractWikilinks, resolveWikilink, typeSet } from './vault.mjs';

export const MOC_SPECS = [
  ['01-Business-Strategy/Business-Models-and-Customers/Business Models and Customers Map.md', 5],
  ['03-Tactics-and-Playbooks/Sales-and-Lead-Generation/Sales and Lead Generation Map.md', 5],
  ['04-Frameworks-and-Mental-Models/Decision-Making-and-Risk/Decision Making and Risk Map.md', 5],
  ['04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Focus Execution and Systems Map.md', 5],
  ['04-Frameworks-and-Mental-Models/Life-Leadership-and-Wellbeing/Life Leadership and Wellbeing Map.md', 5],
  ['04-Frameworks-and-Mental-Models/Mindset-and-Identity/Mindset and Identity Map.md', 5],
  ['03-Tactics-and-Playbooks/Content-Creation-and-Distribution/Content Creation and Distribution Map.md', 4],
  ['03-Tactics-and-Playbooks/Operations-and-Productivity/Operations and Productivity Map.md', 4],
  ['04-Frameworks-and-Mental-Models/Persuasion-and-Influence/Persuasion and Influence Map.md', 4],
].map(([rel, groups]) => ({ rel, groups }));

function conceptualSection(body) {
  const heading = body.match(/^## Conceptual clusters\s*$/m);
  if (!heading) return '';
  const remainder = body.slice(heading.index + heading[0].length).replace(/^\r?\n/, '');
  const nextH2 = remainder.search(/^##\s+/m);
  return nextH2 < 0 ? remainder : remainder.slice(0, nextH2);
}

function conceptualGroups(section) {
  return [...section.matchAll(/^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s+|(?![\s\S]))/gm)]
    .map((match) => ({ heading: match[1], body: match[2] }));
}

export function mocCoverage(vault, spec) {
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const activeStates = new Set(vault.schema.lifecycle.knowledge.active_states);
  const map = vault.records.find((record) => record.rel === spec.rel);
  if (!map) return { errors: [`missing MOC ${spec.rel}`], pages: [], groups: [], linked: new Set(), missing: [] };
  const folder = `${path.posix.dirname(spec.rel)}/`;
  const pages = vault.records.filter((record) => record.rel.startsWith(folder) && knowledgeTypes.has(record.type) && activeStates.has(record.status));
  const pagePaths = new Set(pages.map((record) => record.rel));
  const groups = conceptualGroups(conceptualSection(map.body));
  const linked = new Set();
  const errors = [];
  if (groups.length !== spec.groups) errors.push(`${spec.rel}: expected ${spec.groups} conceptual H3 groups; found ${groups.length}`);
  for (const group of groups) {
    const links = extractWikilinks(group.body);
    if (!links.length) errors.push(`${spec.rel}#${group.heading}: contains no static page links`);
    for (const link of links) {
      const resolution = resolveWikilink(link.raw, map, vault);
      if (resolution.status !== 'resolved' || !resolution.record) errors.push(`${spec.rel}#${group.heading}: unresolved [[${link.raw}]]`);
      else if (!pagePaths.has(resolution.record.rel)) errors.push(`${spec.rel}#${group.heading}: non-qualifying conceptual target ${resolution.record.rel}`);
      else linked.add(resolution.record.rel);
    }
  }
  const missing = pages.filter((page) => !linked.has(page.rel));
  if (missing.length) errors.push(`${spec.rel}: active folder pages missing from conceptual groups: ${missing.map((page) => page.rel).join(', ')}`);
  return { map, pages, groups, linked, missing, errors };
}

export function validateMocCoverage(vault) {
  const errors = [];
  const actual = new Set(vault.records.filter((record) => record.type === 'subdomain-index').map((record) => record.rel));
  const expected = new Set(MOC_SPECS.map((spec) => spec.rel));
  for (const rel of expected) if (!actual.has(rel)) errors.push(`schema MOC set is missing ${rel}`);
  for (const rel of actual) if (!expected.has(rel)) errors.push(`unregistered MOC outside exact nine-map contract: ${rel}`);
  let pages = 0;
  let covered = 0;
  for (const spec of MOC_SPECS) {
    const result = mocCoverage(vault, spec);
    errors.push(...result.errors);
    pages += result.pages.length;
    covered += result.linked.size;
  }
  return { errors, maps: MOC_SPECS.length, pages, covered };
}
