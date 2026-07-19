import fs from 'node:fs';
import path from 'node:path';
import { loadVault, typeSet } from './vault.mjs';

const TAG_PATTERN = /^(topic|person|source)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_PATTERN = /^tax-(topic|person|source)-\d{4}$/;

export function collectTaxonomyUsage(root = process.cwd()) {
  const vault = loadVault(root);
  if (vault.parseErrors.length) {
    throw new Error(`Cannot collect taxonomy usage while frontmatter is invalid:\n- ${vault.parseErrors.join('\n- ')}`);
  }
  const knowledgeTypes = typeSet(vault.schema, 'knowledge');
  const counts = new Map();
  const languages = new Map();
  const files = new Map();
  for (const record of vault.records) {
    if (!knowledgeTypes.has(record.type)) continue;
    for (const tag of record.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
      if (!languages.has(tag)) languages.set(tag, { en: 0, zh: 0, other: 0 });
      const languageCounts = languages.get(tag);
      if (record.lang === 'en') languageCounts.en += 1;
      else if (record.lang === 'zh') languageCounts.zh += 1;
      else languageCounts.other += 1;
      if (!files.has(tag)) files.set(tag, []);
      files.get(tag).push(record.rel);
    }
  }
  return { counts, languages, files, vault };
}

export function normalizeLookup(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/^#?(?:topic|person|source)\//, '')
    .replace(/&/g, ' and ')
    .replace(/[\s_–—-]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function exceptionKey(first, second) {
  return [first, second].sort((a, b) => a.localeCompare(b)).join('|');
}

function requiredString(term, field, errors) {
  if (typeof term[field] !== 'string' || !term[field].trim()) {
    errors.push(`${term.tag || term.id || '[unknown term]'}: ${field} must be a non-empty string`);
  }
}

export function validateRegistry(registry, usage = null) {
  const errors = [];
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return ['Registry root must be an object'];
  if (registry.schema_version !== 1) errors.push('schema_version must be 1');
  if (!Array.isArray(registry.facets) || !registry.facets.length) errors.push('facets must be a non-empty array');
  if (!Array.isArray(registry.lifecycle) || !registry.lifecycle.length) errors.push('lifecycle must be a non-empty array');
  if (!Array.isArray(registry.terms)) return [...errors, 'terms must be an array'];

  const facets = new Set((registry.facets || []).map((facet) => facet.id));
  const lifecycle = new Set(registry.lifecycle || []);
  const expectedLifecycle = ['proposed', 'active', 'deprecated', 'merged'];
  for (const state of expectedLifecycle) if (!lifecycle.has(state)) errors.push(`lifecycle is missing ${state}`);

  const byTag = new Map();
  const byId = new Map();
  for (const term of registry.terms) {
    if (!term || typeof term !== 'object' || Array.isArray(term)) {
      errors.push('Every taxonomy term must be an object');
      continue;
    }
    for (const field of ['id', 'tag', 'facet', 'state', 'approved', 'parent', 'labels', 'aliases', 'definition', 'include_when', 'exclude_when', 'replacement']) {
      if (!(field in term)) errors.push(`${term.tag || term.id || '[unknown term]'}: missing required field ${field}`);
    }
    requiredString(term, 'id', errors);
    requiredString(term, 'tag', errors);
    requiredString(term, 'facet', errors);
    requiredString(term, 'state', errors);
    requiredString(term, 'definition', errors);
    requiredString(term, 'include_when', errors);
    requiredString(term, 'exclude_when', errors);
    if (typeof term.id === 'string' && !ID_PATTERN.test(term.id)) errors.push(`${term.tag}: invalid stable ID ${term.id}`);
    if (typeof term.tag === 'string' && !TAG_PATTERN.test(term.tag)) errors.push(`${term.tag}: invalid canonical spelling; use a lowercase faceted kebab-case tag`);
    if (!facets.has(term.facet)) errors.push(`${term.tag}: unknown facet ${term.facet}`);
    if (typeof term.tag === 'string' && term.tag.split('/')[0] !== term.facet) errors.push(`${term.tag}: facet field does not match tag prefix`);
    if (typeof term.id === 'string' && ID_PATTERN.test(term.id) && term.id.match(ID_PATTERN)[1] !== term.facet) errors.push(`${term.tag}: stable ID facet does not match term facet`);
    if (!lifecycle.has(term.state)) errors.push(`${term.tag}: unknown lifecycle state ${term.state}`);
    if (typeof term.approved !== 'boolean') errors.push(`${term.tag}: approved must be true or false`);
    if (term.state === 'active' && term.approved !== true) errors.push(`${term.tag}: active terms require explicit approved: true`);
    if (term.state === 'proposed' && term.approved !== false) errors.push(`${term.tag}: proposed terms must remain approved: false until activation`);
    if (term.parent !== null && typeof term.parent !== 'string') errors.push(`${term.tag}: parent must be a canonical tag or null`);
    if (term.replacement !== null && typeof term.replacement !== 'string') errors.push(`${term.tag}: replacement must be a canonical tag or null`);
    if (term.state === 'merged' && !term.replacement) errors.push(`${term.tag}: merged terms require a replacement target`);
    if (['active', 'proposed'].includes(term.state) && term.replacement) errors.push(`${term.tag}: ${term.state} terms cannot declare a replacement`);
    if (!term.labels || typeof term.labels !== 'object' || typeof term.labels.en !== 'string' || !term.labels.en.trim() || typeof term.labels.zh !== 'string' || !term.labels.zh.trim()) {
      errors.push(`${term.tag}: labels.en and labels.zh must both be non-empty strings`);
    }
    if (!Array.isArray(term.aliases) || term.aliases.some((alias) => typeof alias !== 'string' || !alias.trim())) errors.push(`${term.tag}: aliases must be an array of non-empty strings`);
    if (byId.has(term.id)) errors.push(`${term.tag}: duplicate stable ID ${term.id} also used by ${byId.get(term.id)}`);
    else byId.set(term.id, term.tag);
    if (byTag.has(term.tag)) errors.push(`${term.tag}: duplicate canonical tag`);
    else byTag.set(term.tag, term);
  }

  for (const term of registry.terms) {
    if (!term || typeof term !== 'object') continue;
    if (term.parent) {
      const parent = byTag.get(term.parent);
      if (!parent) errors.push(`${term.tag}: parent ${term.parent} does not exist`);
      else {
        if (term.facet !== 'topic' || parent.facet !== 'topic') errors.push(`${term.tag}: parent relationships are only valid between topic terms`);
        if (parent.state !== 'active' || parent.approved !== true) errors.push(`${term.tag}: parent ${term.parent} must be active and approved`);
      }
      if (term.parent === term.tag) errors.push(`${term.tag}: a term cannot be its own parent`);
    }
    if (term.replacement) {
      const replacement = byTag.get(term.replacement);
      if (!replacement) errors.push(`${term.tag}: replacement ${term.replacement} does not exist`);
      else if (replacement.state !== 'active' || replacement.approved !== true) errors.push(`${term.tag}: replacement ${term.replacement} must be active and approved`);
      if (term.replacement === term.tag) errors.push(`${term.tag}: a term cannot replace itself`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(term) {
    if (!term || visited.has(term.tag)) return;
    if (visiting.has(term.tag)) {
      errors.push(`${term.tag}: parent relationship contains a cycle`);
      return;
    }
    visiting.add(term.tag);
    if (term.parent) visit(byTag.get(term.parent));
    visiting.delete(term.tag);
    visited.add(term.tag);
  }
  for (const term of registry.terms) visit(term);

  const tokenOwners = new Map();
  const canonicalTokens = new Map();
  for (const term of registry.terms) {
    if (!term || typeof term !== 'object' || !term.tag || !term.facet) continue;
    const ownTokens = new Set();
    const canonicalValues = [term.tag.split('/').slice(1).join('/'), term.labels?.en, term.labels?.zh].filter(Boolean);
    for (const value of canonicalValues) {
      const normalized = normalizeLookup(value);
      if (!normalized) {
        errors.push(`${term.tag}: empty normalized label from ${JSON.stringify(value)}`);
        continue;
      }
      if (ownTokens.has(normalized)) continue;
      ownTokens.add(normalized);
      const key = `${term.facet}:${normalized}`;
      const owner = tokenOwners.get(key);
      if (owner && owner !== term.tag) errors.push(`${term.tag}: canonical label ${JSON.stringify(value)} collides with ${owner}`);
      else tokenOwners.set(key, term.tag);
    }
    canonicalTokens.set(term.tag, ownTokens);
  }
  for (const term of registry.terms) {
    if (!term || typeof term !== 'object' || !term.tag || !term.facet || !Array.isArray(term.aliases)) continue;
    const seenAliases = new Set();
    for (const alias of term.aliases) {
      const normalized = normalizeLookup(alias);
      if (!normalized) {
        errors.push(`${term.tag}: empty normalized alias from ${JSON.stringify(alias)}`);
        continue;
      }
      if (seenAliases.has(normalized)) {
        errors.push(`${term.tag}: duplicate alias ${JSON.stringify(alias)}`);
        continue;
      }
      seenAliases.add(normalized);
      if (canonicalTokens.get(term.tag)?.has(normalized)) {
        errors.push(`${term.tag}: redundant alias ${JSON.stringify(alias)} duplicates its canonical tag or label`);
        continue;
      }
      const key = `${term.facet}:${normalized}`;
      const owner = tokenOwners.get(key);
      if (owner && owner !== term.tag) errors.push(`${term.tag}: alias ${JSON.stringify(alias)} collides with ${owner}`);
      else tokenOwners.set(key, term.tag);
    }
  }

  const exceptionPairs = new Set();
  if (!Array.isArray(registry.near_duplicate_exceptions)) errors.push('near_duplicate_exceptions must be an array');
  for (const exception of registry.near_duplicate_exceptions || []) {
    if (!exception || !Array.isArray(exception.terms) || exception.terms.length !== 2 || typeof exception.reason !== 'string' || !exception.reason.trim()) {
      errors.push('Every near-duplicate exception must contain two terms and a reason');
      continue;
    }
    const [first, second] = exception.terms;
    if (!byTag.has(first) || !byTag.has(second)) errors.push(`Near-duplicate exception references an unknown term: ${first}, ${second}`);
    exceptionPairs.add(exceptionKey(first, second));
  }
  for (const facet of facets) {
    const terms = registry.terms.filter((term) => term?.facet === facet && typeof term.tag === 'string');
    for (let i = 0; i < terms.length; i += 1) {
      for (let j = i + 1; j < terms.length; j += 1) {
        const first = normalizeLookup(terms[i].tag).replace(/-/g, '');
        const second = normalizeLookup(terms[j].tag).replace(/-/g, '');
        if (Math.min(first.length, second.length) < 5) continue;
        if (levenshtein(first, second) <= 1 && !exceptionPairs.has(exceptionKey(terms[i].tag, terms[j].tag))) {
          errors.push(`${terms[i].tag} and ${terms[j].tag}: probable near-duplicate; merge, alias, or document an exception`);
        }
      }
    }
  }

  if (!registry.invalid_spellings || typeof registry.invalid_spellings !== 'object' || Array.isArray(registry.invalid_spellings)) errors.push('invalid_spellings must be an object');
  for (const [invalid, canonical] of Object.entries(registry.invalid_spellings || {})) {
    if (byTag.has(invalid)) errors.push(`Invalid spelling ${invalid} is also a canonical tag`);
    if (!byTag.has(canonical)) errors.push(`Invalid spelling ${invalid} points to unknown term ${canonical}`);
    if (invalid === canonical) errors.push(`Invalid spelling ${invalid} cannot point to itself`);
  }

  if (usage) {
    for (const [usedTag, count] of usage.counts) {
      if (!count) continue;
      const term = byTag.get(usedTag);
      if (!term) {
        const invalidTarget = registry.invalid_spellings?.[usedTag];
        const facet = usedTag.includes('/') ? usedTag.split('/')[0] : '';
        const aliasTarget = tokenOwners.get(`${facet}:${normalizeLookup(usedTag)}`);
        let suggestion = invalidTarget || aliasTarget;
        if (!suggestion && facets.has(facet)) {
          const normalizedUsed = normalizeLookup(usedTag).replace(/-/g, '');
          const candidates = registry.terms
            .filter((candidate) => candidate.facet === facet)
            .map((candidate) => ({ tag: candidate.tag, distance: levenshtein(normalizedUsed, normalizeLookup(candidate.tag).replace(/-/g, '')) }))
            .sort((a, b) => a.distance - b.distance || a.tag.localeCompare(b.tag));
          if (candidates[0] && candidates[0].distance <= 2) suggestion = candidates[0].tag;
        }
        errors.push(`${usedTag}: used ${count} time(s) but absent from the canonical registry${suggestion ? `; use ${suggestion}` : '; add it as proposed, review overlap, then explicitly activate and approve it'}`);
      } else if (term.state !== 'active' || term.approved !== true) {
        errors.push(`${usedTag}: used ${count} time(s) but state=${term.state} and approved=${term.approved}; only explicitly approved active terms may be used`);
      }
    }
  }

  return [...new Set(errors)];
}

export function loadTaxonomyRegistry(root = process.cwd(), usage = null) {
  const registryPath = path.join(root, '_meta', 'taxonomy-registry.json');
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read canonical taxonomy registry at ${registryPath}: ${error.message}`);
  }
  const errors = validateRegistry(registry, usage);
  if (errors.length) throw new Error(`Canonical taxonomy validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  return registry;
}

export function sortedTerms(registry, facet = null) {
  return registry.terms
    .filter((term) => !facet || term.facet === facet)
    .slice()
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export function usageFor(usage, tag) {
  const languageCounts = usage.languages.get(tag) || { en: 0, zh: 0, other: 0 };
  return { ...languageCounts, total: usage.counts.get(tag) || 0 };
}
