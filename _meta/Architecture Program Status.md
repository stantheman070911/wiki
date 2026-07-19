---
title: "Architecture Program Status - 2026-07-13 Historical Snapshot"
aliases:
  - "Architecture Program Status"
type: "governance"
domain: "meta"
lang: "en"
snapshot_on: "2026-07-13"
updated: "2026-07-19"
status: "historical"
---

# Architecture Program Status — 2026-07-13 Historical Snapshot

> [!warning] Frozen historical record
> This page preserves the architecture-program handoff as recorded on 13 July 2026. It is not a live status page and must not be used for current counts or release decisions. Use [[Architecture Report]], [[Maintenance Review]], and [[Editorial Dashboard]] for generated current state.

The numbered ledger below records the completion judgments made at the snapshot date. “Complete” meant that the requested structure or governing system existed and passed the then-current validation; it did not mean every draft had been promoted or every weak link had received human editorial judgment.

## Priority 0

| # | Status | Evidence |
|---:|---|---|
| 1 | Complete | No `README.md` remains; semantic index and hub filenames plus aliases are enforced. |
| 2 | Complete | Every domain placement link explicitly resolves to [[Vault Conventions#Placement rules (canonical)]]. |
| 3 | Complete | `tools/audit-vault.mjs` resolves the destination before validating fragments. |
| 4 | Complete | Hubs and semantic indexes have explicit types, rules, counts, and validation. |
| 5 | Complete | [[Architecture Schema#Page types]] defines the explicit page-type model; all pages are typed. |
| 6 | Complete | [[Topic-Index]] was generated with active, bilingual, monolingual, and deprecated views. |
| 7 | Complete | [[Home]] distinguishes the complete taxonomy from the bilingual bridge. |
| 8 | Complete | Every standard entry has a navigable source, URL, attachment, or explicit unavailable marker. |
| 9 | Complete | No retired `_Inbox` reference remains; the audit blocks regression. |
| 10 | Complete | [[連鎖經營學來源清單]] maps all collection files, attachments, modules, derivatives, and status. |
| 11 | Complete | Series modules use navigable template and spreadsheet links. |
| 12 | Complete | Video sources live under `Videos/`; source-folder conformity is enforced. |
| 13 | Complete | The retained-attachment set was recorded as having inbound coverage. |
| 14 | Complete | Markdown sources were recorded as covered or explicitly lifecycle-classified. |

## Priority 1

| # | Status | Evidence |
|---:|---|---|
| 15 | Complete | [[Tags]] is a generated semantic registry with labels, hierarchy, synonyms, lifecycle, definition, and scope rules. |
| 16 | Complete | Overlapping taxonomy boundaries are explicit in [[Architecture Schema#Taxonomy boundaries]]. |
| 17 | Complete | Core metadata is present; `owner` is conditional on a real accountable editor. |
| 18 | Operational | Objective lifecycle and review intervals are defined; queues are visible in [[Editorial Dashboard]]. |
| 19 | Complete | [[Architecture Schema#Folder axes and placement]] separates folder, type, tag, and series axes. |
| 20 | Complete | Overlapping folder scopes and examples are documented and validated by domain/folder rules. |
| 21 | Complete | Page-type definitions replace subjective primary-job placement. |
| 22 | Complete | Oversized areas had MOCs and explicit capacity decisions; unstable subfolders were intentionally avoided. |
| 23 | Complete | All five major domain maps contain Start Here, curated paths, cornerstones, frameworks/playbooks, series, and inventory. |
| 24 | Complete | MOCs exist for Mindset and Identity, Decision Making and Risk, and Focus, Execution, and Systems. |
| 25 | Complete | Type-specific templates exist for frameworks, playbooks, diagnostics, research, series entries/hubs, articles, and manifests. |
| 26 | Complete | Templates and audit enforce the shared content spine. |
| 27 | Complete | English and Chinese variants share concepts rather than claiming identical headings. |
| 28 | Complete | Chinese standard entries were consolidated into canonical page-type architectures; exact sequences were covered by validation. |
| 29 | Complete | English section-layout variants were reviewed as a bounded mix of canonical, diagnostic, and source-specific layouts implementing the shared spine. |
| 30 | Complete | H3 and visual-use rules are defined in [[Architecture Schema#Shared content spine]]. |
| 31 | Complete | Long entries were migrated where independently linkable blocks existed; already well-segmented H2-only pages remain unchanged. |
| 32 | Complete | [[Architecture Schema#Visual grammar]] governs tables, callouts, diagrams, procedures, and images. |
| 33 | Complete | Structured tables now appear beyond the audited baseline; diagrams remain need-driven rather than decorative. |
| 34 | Complete | Relationship lists used the typed-label model; the conservative semantic pass applied stronger labels while leaving ambiguous links `related`. |
| 35 | Complete | Alias and rename policy is defined in [[Architecture Schema#Naming and aliases]]. |
| 36 | Complete | All intentional filename/title mismatches have aliases; collisions are checked. |
| 37 | Complete | Knowledge filenames are within 80 characters; full titles remain searchable through aliases. |
| 38 | Complete | The identified complex multi-file collection has a manifest and reusable manifest template. |
| 39 | Complete | [[Raw Source Policy]] defines search separation, verification access, and archive thresholds. |
| 40 | Complete | Raw transcripts declared `source_format: raw-transcript` and were excluded from knowledge-page scope. |
| 41 | Complete | Large Markdown sources had documented split decisions; [[Search Performance]] provided a repeatable comparison. |

## Priority 2

| # | Status | Evidence |
|---:|---|---|
| 42 | Complete | [[Home]] is a dashboard with entry paths, series, live queues, cornerstone logic, topics, provenance, and maintenance links. |
| 43 | Operational convention | Home is the canonical landing page and can be pinned; live `.obsidian/workspace.json` is not enforced because Obsidian rewrites it to the user's last-open tab. |
| 44 | Complete | [[Portable Index]], generated article inventory, curated maps, and [[Source and Author Index]] keep essential navigation independent of Dataview. |
| 45 | Complete | Templates core plugin and `00-Templates/` configuration are committed and validated. |
| 46 | Complete | The active global graph is knowledge-only, attachment-free, domain-colored, and validated. |
| 47 | Complete | [[Graph Views]] and `.obsidian/graph-source-traceability.json` provide the named source-traceability preset. |
| 48 | Complete | [[Editorial Dashboard]] plus [[Architecture Report]] expose editorial queues and structural gates. |
| 49 | Complete | Cornerstone criteria combine inbound-link threshold, review state, and explicit series hubs. |
| 50 | Complete | [[Source and Author Index]] browses people, provenance tags, authors, source media types, records, and direct derivatives. |

## Automated governance

| # | Status | Evidence |
|---:|---|---|
| 51 | Complete | [[Architecture Report]] covers counts, lifecycle, source formats, coverage, orphans, and structural gates. |
| 52 | Complete | Audit validates active, bilingual, monolingual, and deprecated topic-index freshness. |
| 53 | Complete | Audit validates knowledge source links, Markdown source coverage, and all attachments. |
| 54 | Complete | Audit validates bidirectional series hub/entry integrity; manifests cover module assets. |
| 55 | Complete | Required fields, sections, relationships, lifecycle, and sources vary by page type. |
| 56 | Complete | Filename length, title/alias mismatch, rename aliases, and alias collisions are enforced. |
| 57 | Complete | Domain/folder and source-type/folder conformity are enforced with documented boundaries. |
| 58 | Complete | Critical generated indexes have count/freshness checks and work as portable Markdown. |

## Ongoing maintenance

| # | Status | Evidence |
|---:|---|---|
| 59 | Operational | [[Maintenance Schedule]] defines recurring taxonomy review and regeneration. |
| 60 | Operational | Folder-capacity thresholds and MOC-first decisions are reviewed monthly/quarterly. |
| 61 | Operational | Source size, coverage, performance, and archive-vault thresholds are scheduled. |
| 62 | Operational | Draft age, ownership, promotion, retention, and deletion are scheduled and visible. |
| 63 | Operational | Typed-link quality and zero-inbound pages have a recurring review queue. |
| 64 | Complete | [[Maintenance Schedule#Architecture-program acceptance criteria]] defined measurable completion and the release-gate commands. |

## Live status moved to generated governance

Current counts, queues, and audit results are intentionally absent from this historical page. Consult:

- [[Architecture Report]] for the generated structural scorecard and release result;
- [[Maintenance Review]] for generated recurring-maintenance evidence;
- [[Editorial Dashboard]] for current editorial queues;
- [[Maintenance Schedule]] for the active review cadence and acceptance criteria.
