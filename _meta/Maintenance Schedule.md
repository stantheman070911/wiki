---
title: "Maintenance Schedule"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
---

# Maintenance Schedule

This is the operating cadence for keeping THE WIKI structurally healthy. Complete the generated checks before making subjective editorial decisions; record material taxonomy, folder, or lifecycle decisions in version history.

## After every structural change

1. When an intentional metadata, relationship, taxonomy, or navigation change makes a deterministic artifact stale, run its explicit write generator: `generate-structured-sections.mjs`, `generate-taxonomy-registry.mjs`, `generate-topic-index.mjs`, `generate-navigation-indexes.mjs`, `generate-maintenance-review.mjs`, or `generate-architecture-report.mjs` as applicable.
2. Run `node tools/benchmark-vault-search.mjs` after adding or splitting a source above the schema-defined review threshold.
3. Run `npm run check`. This is the single blocking control-plane command: it regenerates expected outputs in memory, validates exact artifact sets, runs structural and graph contracts, and then runs the test suite.
4. Do not close the change while `npm run check` reports an error. Legacy audit entry points are compatibility wrappers only and do not define independent rules.

## Monthly while growing rapidly

| Review | Action | Completion criterion |
|---|---|---|
| Taxonomy | Review proposed tags, overlaps, labels, synonyms, parents, and lifecycle states | Every used tag is registered; no deprecated or merged tag remains in knowledge metadata |
| Folder capacity | Review folders at or above the schema-defined `map_threshold` and unusually small buckets | Every high-volume folder has an adequate MOC before another folder level is introduced |
| Sources | Review archive size, unprocessed records, direct-link gaps, and attachments | Every retained attachment is linked; every processed source is covered; every file over 1 MB has a split decision |
| Drafts | Review the capacity-aware queue by domain, priority, owner, lifecycle, and computed due date | Each due draft is reviewed within the weekly domain capacity or explicitly rescheduled by policy; no universal age cutoff is used |
| Relationships | Review generic `related` links and zero-inbound pages | Stronger relationship types replace generic links where justified; every zero-inbound page is linked or intentionally isolated |
| Navigation | Regenerate all static indexes and inspect Home/domain entry points | Essential browsing works without Dataview and every knowledge page appears in the portable index |
| Reports | Review report metadata, derivation roots, owners, and supersession chains | Every report is listed in [[Reports Index]], links its governed derivation roots, and has an explicit lifecycle state |

## Quarterly

- Reassess taxonomy parent-child structure, bilingual labels, deprecated tags, and documented overlap decisions.
- Reassess folder boundaries and subdomain maps; consolidate unstable or undersized categories.
- Measure vault startup and search responsiveness; compare raw-source archive size with the thresholds in [[Raw Source Policy]].
- Review cornerstone status and the oldest `reviewed_on` dates.
- Test the knowledge-only graph, recreate the [[Graph Views#Source-traceability graph|source-traceability graph]], and confirm Home remains the landing page.
- Review this schedule and [[Architecture Schema]] whenever the page-type model changes.

## Architecture-program acceptance criteria

The architecture program is complete only when all of the following are true:

The dated 103-item remediation closeout is preserved in [[Architecture Task Completion - 2026-07-19]]. This historical record is evidence of the accepted change, not a substitute for the current generated gates.

- No generic `README.md` page or ambiguous README fragment link remains.
- Every page has an explicit supported `type`; standard entries satisfy their page-type contract.
- Every active topic appears in the generated complete index; deprecated topics do not appear as active.
- Every retained source and attachment is linked, covered, or explicitly unprocessed/exempt.
- No retired `_Inbox` path, broken file link, or broken heading fragment remains.
- Every intentional filename/title mismatch has a collision-free alias; knowledge filenames stay within 80 characters.
- Both language variants implement the shared content spine with documented heading alternatives.
- Knowledge-only and source-traceability graph definitions are operational.
- Governed reports have complete snapshot metadata, appear in [[Reports Index]], and participate in reader and source-traceability navigation.
- Home, domain maps, portable indexes, source/author facets, and editorial dashboards are usable.
- The validator covers fragments, hubs, articles, attachments, topics, sources, series, aliases, page types, and folder conformity.
- `npm run check` exits successfully with zero schema, metadata, placement, provenance, relationship, inventory, duplicate, scope, generated-artifact, or graph errors.

## Ownership

Canonical domain stewards and queue owners are declared in `_meta/vault-schema.yaml` and [[Editorial Governance]]. Pages without an explicit `owner` inherit the domain steward in generated queues; governed supporting pages and reports require the accountable owner directly. Never invent an owner outside that registry. Queue ordering and review dates come from the shared capacity-aware policy.
