---
title: "Architecture Task Completion — 2026-07-19"
aliases:
  - "Architecture Task Completion"
type: "governance"
domain: "meta"
lang: "en"
snapshot_on: "2026-07-19"
status: "historical"
---

# Architecture Task Completion — 2026-07-19

> [!note] Dated acceptance record
> This is the frozen closeout ledger for the 103-item architecture remediation program. It records implementation evidence, not live corpus counts. Current structural state belongs in the generated [[Architecture Report]], [[Maintenance Review]], and [[Editorial Dashboard]].

## Priority 0 — repair current architectural breaches

| # | Status | Acceptance evidence |
|---:|---|---|
| 1 | Done | The Frameworks index has a Strategy-and-Competitive-Advantage inventory governed by exact leaf validation. |
| 2 | Done | `tools/lib/inventory.mjs` compares expected leaves and exact qualifying page sets, including ownership multiplicity. |
| 3 | Done | UCD no longer has a type/location contradiction. |
| 4 | Done | Strict type-to-folder placement is canonical in `_meta/vault-schema.yaml` and [[Vault Conventions]]. |
| 5 | Done | UCD was moved to `04-Frameworks-and-Mental-Models/Brand-and-Positioning/`. |
| 6 | Done | Business inventories query all schema-permitted knowledge types and active states. |
| 7 | Done | Every declared generated artifact is excluded from organic-inbound credit. |
| 8 | Done | `tools/check-vault.mjs` reports directed reader reachability separately from undirected components. |
| 9 | Done | Inbound edges are categorized as curated, semantic, generated, or incidental. |
| 10 | Done | Both Home entry points reach every active reader page through static navigation. |
| 11 | Done | Reports were explicitly selected as governed vault artifacts. |
| 12 | Done | The schema defines a formal `report` page type. |
| 13 | Done | Report contracts require lifecycle, generation, derivation, supersession, and ownership metadata as applicable. |
| 14 | Done | [[Reports Index]] and report scope/lifecycle/graph rules are schema-governed and tested. |
| 15 | Done — governed branch selected | The mutually exclusive external-artifact branch is satisfied by the documented decision to keep governed reports in the vault. |
| 16 | Done | All English templates satisfy their current schema and layout contracts. |
| 17 | Done | English and Chinese Strategy templates exist. |
| 18 | Done | Series templates declare their required `series` properties. |
| 19 | Done | Source Manifest templates match the canonical manifest structure. |
| 20 | Done | Missing Chinese variants were added for every supported bilingual page type. |
| 21 | Done | `_meta/Process-Inbox.md` and the local inbox skill use structured headings and the full `npm run check` workflow. |
| 22 | Done | Legacy `Related entries` instructions were removed; the old Chinese normalizer is read-only and schema-backed. |
| 23 | Done | [[Architecture Program Status]] is a dated historical snapshot with no claim of live counts. |
| 24 | Done | Live counts and queues are generated from source records rather than copied into evergreen governance prose. |

## Priority 1 — rebuild the control plane

| # | Status | Acceptance evidence |
|---:|---|---|
| 25 | Done | `_meta/vault-schema.yaml` is the single machine-readable architecture schema. |
| 26 | Done | Every page type declares its allowed domains, prefixes, or exact paths. |
| 27 | Done | Every page type declares required, optional, and nonempty metadata fields. |
| 28 | Done | Knowledge, report, supporting, and source-processing lifecycle states and transitions are declared. |
| 29 | Done | Canonical layout variants and language-aware heading concepts are schema-defined. |
| 30 | Done | Relationship direction, symmetry, inverse, labels, and reciprocal-storage rules are schema-defined. |
| 31 | Done | Domain roots, indexes, child folders, and leaf owners are schema-defined. |
| 32 | Done | Home, navigation, template, workflow, report, and governance contracts are explicit. |
| 33 | Done | Frontmatter uses the `yaml` parser; regex parsing is no longer an active control plane. |
| 34 | Done | `tools/lib/vault.mjs` centralizes scopes, types, parsing, aliases, links, and generated exclusions. |
| 35 | Done | Active audits and generators share canonical parsing/resolution; legacy entry points delegate to it. |
| 36 | Done | `node tools/check-vault.mjs` is deterministic and is exposed through `npm run check`. |
| 37 | Done | The checker renders deterministic artifacts in memory before freshness comparison. |
| 38 | Done | Generated inventories are validated against exact qualifying sets and once-only membership. |
| 39 | Done | Directed reachability and undirected connectedness are independently enforced. |
| 40 | Done | Genuine file, heading, and block links are validated across governance, templates, reports, and workflows. |
| 41 | Done | Positive graph, search, reader, and audit scopes are schema-backed and parity-checked. |
| 42 | Done | The fixture registry covers every page type and every supported layout. |
| 43 | Done | Fixtures cover aliases, YAML block lists, multiline values, renames, fragments, and duplicate identities. |
| 44 | Done | `.github/workflows/check-vault.yml` runs the single canonical release gate. |
| 45 | Done | `_meta/taxonomy-registry.json` is the durable canonical taxonomy registry. |
| 46 | Done | Every taxonomy term has a stable ID. |
| 47 | Done | Registry terms store state, parent, bilingual labels, aliases, definitions, approval, and replacement/merge targets. |
| 48 | Done | Zero-use proposed, deprecated, merged, and unused terms persist in generated views. |
| 49 | Done | A used tag must be explicitly approved and active. |
| 50 | Done | [[Tags]] and [[Topic-Index]] are deterministic registry-derived outputs. |
| 51 | Done | The Topic Index renders taxonomy parent-child relationships. |
| 52 | Done | Registry validation rejects alias collisions, near-duplicates, invalid spellings, and unapproved use. |
| 53 | Done | Knowledge provenance uses structured `sources` arrays. |
| 54 | Done | Canonical source records have stable sequential `SRC-####` identifiers. |
| 55 | Done | Authoritative bibliography is stored only on canonical source records. |
| 56 | Done | Knowledge pages can reference multiple source IDs. |
| 57 | Done | Primary, supporting, contrasting, example, and background source roles are supported. |
| 58 | Done | Structured locators support chapter, page, section, timestamp, quotation location, and freeform precision. |
| 59 | Done | Source-reference parity rejects unknown IDs, invalid roles, and incompatible metadata. |
| 60 | Done | Semantic relationships are stored in frontmatter metadata. |
| 61 | Done | Every relationship has an explicit directionality and inverse/symmetry contract. |
| 62 | Done | Required reciprocal relationships are validated. |
| 63 | Done | Reader-facing relationship sections are generated from structured metadata. |
| 64 | Done | Stronger predicates replaced a substantial share of formerly generic `related` edges. |
| 65 | Done | Prerequisite, application, contrast, example, translation, replacement, and derivation types are supported. |

## Priority 2 — make browsing scalable

| # | Status | Acceptance evidence |
|---:|---|---|
| 66 | Done | Every governed MOC organizes its conceptual clusters as linked page groups. |
| 67 | Done | `tools/lib/moc-coverage.mjs` and focused tests enforce complete qualifying-page coverage across the nine MOCs. |
| 68 | Done | Every reader-facing knowledge page has a static parent breadcrumb. |
| 69 | Done | Breadcrumbs use one `Up: Home → Domain → Map` pattern. |
| 70 | Done | Every knowledge page stores a canonical `parent_map`. |
| 71 | Done | Every active reader page is statically reachable from both governed Home entry points without Dataview credit. |
| 72 | Done | [[Portable Index]] is grouped Domain → folder → type → language → page. |
| 73 | Done | Large flat inventories were replaced with grouped sections and curated maps. |
| 74 | Done | MOC decisions are based on retrieval complexity, not a rigid page-count rule. |
| 75 | Done | Every folder near or above the review threshold has an explicit map or documented parent-inventory decision. |
| 76 | Done | Changing counts were removed from heading text. |
| 77 | Done | Topic and inventory headings are stable; counts sit below headings or in generated tables. |
| 78 | Done | [[Home-ZH]] and Chinese labels provide entry points for major domains and navigation surfaces. |
| 79 | Done | Domain indexes and MOCs use bilingual navigation labels. |
| 80 | Done | Portable, article, report, topic, and editorial views provide language-filtered sections. |
| 81 | Done | Reciprocal one-to-one cross-language `translation` edges are supported and enforced; no unconfirmed equivalence is fabricated. |
| 82 | Done | [[Editorial Dashboard]] generates missing-translation coverage and explicit-proposal queues. |
| 83 | Done | Deprecated, archived, superseded, and replaced lifecycle states are formal schema states. |
| 84 | Done | Retired knowledge contracts support and require `replaced_by` where applicable. |
| 85 | Done | Forwarding pages require a visible canonical notice plus reciprocal `replaced-by`/`replaces` metadata. |
| 86 | Done | Active inventories exclude retired pages; retirement sections expose them separately. |
| 87 | Done | Every domain has a schema-declared steward. |
| 88 | Done | Editorial and review queues have schema-declared owners. |
| 89 | Done | Review due dates are derived from lifecycle and review dates. |
| 90 | Done | Review scheduling is capacity-aware by domain and has no universal synchronized 30-day cutoff. |
| 91 | Done | Queue views expose owner, domain, age, priority, and lifecycle state. |

## Architecture and governance improvements

| # | Status | Acceptance evidence |
|---:|---|---|
| 92 | Done | The top-level source → knowledge → synthesis model is preserved and documented. |
| 93 | Done | [[Architecture Schema]] documents the deliberate combination of page-role and subject-domain folder axes. |
| 94 | Done | Strict placement plus exact leaf inventories prevents valid pages from disappearing from local navigation. |
| 95 | Done | Supporting page classes have metadata, status, lifecycle, and path contracts. |
| 96 | Done | Supporting-page participation in audit, reader, search, graph, and navigation scopes is explicit and tested. |
| 97 | Done | Reports use the same selected policy across default graph, traceability graph, search, reader navigation, and audit. |
| 98 | Done | Duplicate CI, audit, normalization, relationship-migration, and breadcrumb ownership rules were removed or reduced to canonical delegates. |
| 99 | Done | Architecture, maintenance, taxonomy, topic, source, navigation, and queue counts are rendered from canonical source data. |
| 100 | Done | Generated pages are excluded as outgoing sources in curated reachability, so dashboards cannot substitute for reader navigation. |

## Validation and acceptance

| # | Status | Acceptance evidence |
|---:|---|---|
| 101 | Done | The schema enumerates every leaf folder exactly once and `validateLeafInventories` enforces one declared/claiming owner. |
| 102 | Done | Exact qualifying inventory sets and once-only multiplicity ensure every qualifying page appears exactly once. |
| 103 | Done | `check-vault` proves every reader-facing page is forward-reachable from both Home pages with generated outgoing links disabled. |

## Release evidence

The closing release sequence was: regenerate deterministic outputs, verify every generator in check mode, run migration idempotence checks, then run `npm run check`. The canonical gate and all focused regression tests passed on this snapshot. Future changes must satisfy the current gate rather than relying on this historical result.
