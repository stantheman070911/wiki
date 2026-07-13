---
title: "Maintenance Schedule"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-13"
status: "evergreen"
---

# Maintenance Schedule

This is the operating cadence for keeping THE WIKI structurally healthy. Complete the generated checks before making subjective editorial decisions; record material taxonomy, folder, or lifecycle decisions in version history.

## After every structural change

1. Run `node tools/generate-taxonomy-registry.mjs` after tag vocabulary changes.
2. Run `node tools/generate-topic-index.mjs` after tag usage changes.
3. Run `node tools/generate-navigation-indexes.mjs` after pages, sources, links, or statuses change.
4. Run `node tools/benchmark-vault-search.mjs` after adding or splitting a source larger than 1 MB.
5. Run `node tools/generate-maintenance-review.mjs` during scheduled maintenance.
6. Run `node tools/generate-architecture-report.mjs` and `node tools/audit-vault.mjs`.
7. Do not close the change while the audit reports a structural error.

## Monthly while growing rapidly

| Review | Action | Completion criterion |
|---|---|---|
| Taxonomy | Review proposed tags, overlaps, labels, synonyms, parents, and lifecycle states | Every used tag is registered; no deprecated or merged tag remains in knowledge metadata |
| Folder capacity | Review folders over 25 entries and unusually small buckets | Every high-volume folder has an adequate MOC before another folder level is introduced |
| Sources | Review archive size, unprocessed records, direct-link gaps, and attachments | Every retained attachment is linked; every processed source is covered; every file over 1 MB has a split decision |
| Drafts | Review age, priority, and accountable owner where one exists | Drafts older than 30 days are promoted, explicitly retained, archived, or deleted |
| Relationships | Review generic `related` links and zero-inbound pages | Stronger relationship types replace generic links where justified; every zero-inbound page is linked or intentionally isolated |
| Navigation | Regenerate all static indexes and inspect Home/domain entry points | Essential browsing works without Dataview and every knowledge page appears in the portable index |

## Quarterly

- Reassess taxonomy parent-child structure, bilingual labels, deprecated tags, and documented overlap decisions.
- Reassess folder boundaries and subdomain maps; consolidate unstable or undersized categories.
- Measure vault startup and search responsiveness; compare raw-source archive size with the thresholds in [[Raw Source Policy]].
- Review cornerstone status and the oldest `reviewed_on` dates.
- Test the knowledge-only graph, recreate the [[Graph Views#Source-traceability graph|source-traceability graph]], and confirm Home remains the landing page.
- Review this schedule and [[Architecture Schema]] whenever the page-type model changes.

## Architecture-program acceptance criteria

The architecture program is complete only when all of the following are true:

- No generic `README.md` page or ambiguous README fragment link remains.
- Every page has an explicit supported `type`; standard entries satisfy their page-type contract.
- Every active topic appears in the generated complete index; deprecated topics do not appear as active.
- Every retained source and attachment is linked, covered, or explicitly unprocessed/exempt.
- No retired `_Inbox` path, broken file link, or broken heading fragment remains.
- Every intentional filename/title mismatch has a collision-free alias; knowledge filenames stay within 80 characters.
- Both language variants implement the shared content spine with documented heading alternatives.
- Knowledge-only and source-traceability graph definitions are operational.
- Home, domain maps, portable indexes, source/author facets, and editorial dashboards are usable.
- The validator covers fragments, hubs, articles, attachments, topics, sources, series, aliases, page types, and folder conformity.
- `node tools/audit-vault.mjs` exits successfully with zero structural errors.

## Ownership

`owner` is required only when a real editor accepts accountability for a page or queue. Never assign a fictional owner. An owner reviews the page by the stated interval; unowned drafts remain visible in [[Editorial Dashboard]] for assignment.
