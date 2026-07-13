---
title: "Architecture Program Status"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-13"
status: "evergreen"
---

# Architecture Program Status

This ledger maps the 64-item architecture program to durable evidence. “Complete” means the requested structure or governing system exists and passes validation; it does not mean every draft has been promoted or every weak link has received human editorial judgment.

## Priority 0

| # | Status | Evidence |
|---:|---|---|
| 1 | Complete | No `README.md` remains; semantic index and hub filenames plus aliases are enforced. |
| 2 | Complete | Every domain placement link explicitly resolves to [[Vault Conventions#Placement rules (canonical)]]. |
| 3 | Complete | `tools/audit-vault.mjs` resolves the destination before validating fragments. |
| 4 | Complete | Hubs and semantic indexes have explicit types, rules, counts, and validation. |
| 5 | Complete | [[Architecture Schema#Page types]] defines the explicit page-type model; all pages are typed. |
| 6 | Complete | [[Topic-Index]] is generated with 153 active, 82 bilingual, 71 monolingual, and deprecated views. |
| 7 | Complete | [[Home]] distinguishes the complete taxonomy from the bilingual bridge. |
| 8 | Complete | Every standard entry has a navigable source, URL, attachment, or explicit unavailable marker. |
| 9 | Complete | No retired `_Inbox` reference remains; the audit blocks regression. |
| 10 | Complete | [[連鎖經營學來源清單]] maps all collection files, attachments, modules, derivatives, and status. |
| 11 | Complete | Series modules use navigable template and spreadsheet links. |
| 12 | Complete | Video sources live under `Videos/`; source-folder conformity is enforced. |
| 13 | Complete | All 57 retained attachments have inbound coverage. |
| 14 | Complete | All 81 Markdown sources are covered or explicitly lifecycle-classified. |

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
| 22 | Complete | Three oversized areas have MOCs and explicit capacity decisions; unstable subfolders were intentionally avoided. |
| 23 | Complete | All five major domain maps contain Start Here, curated paths, cornerstones, frameworks/playbooks, series, and inventory. |
| 24 | Complete | MOCs exist for Mindset and Identity, Decision Making and Risk, and Focus, Execution, and Systems. |
| 25 | Complete | Type-specific templates exist for frameworks, playbooks, diagnostics, research, series entries/hubs, articles, and manifests. |
| 26 | Complete | Templates and audit enforce the shared content spine. |
| 27 | Complete | English and Chinese variants share concepts rather than claiming identical headings. |
| 28 | Complete | Chinese standard entries were reduced from 54 H2 signatures to five canonical page-type architectures; exact sequences now fail validation if they drift. |
| 29 | Complete | The 17 English signatures were reviewed as a bounded mix of canonical, diagnostic, and source-specific layouts; every variant implements the shared spine. |
| 30 | Complete | H3 and visual-use rules are defined in [[Architecture Schema#Shared content spine]]. |
| 31 | Complete | Long entries were migrated where independently linkable blocks existed; already well-segmented H2-only pages remain unchanged. |
| 32 | Complete | [[Architecture Schema#Visual grammar]] governs tables, callouts, diagrams, procedures, and images. |
| 33 | Complete | Structured tables now appear beyond the audited baseline; diagrams remain need-driven rather than decorative. |
| 34 | Complete | Relationship lists use the six-label model; the first conservative semantic pass assigned 222 `applies`, 27 `example`, and 18 `prerequisite` lines while leaving ambiguous links `related`. |
| 35 | Complete | Alias and rename policy is defined in [[Architecture Schema#Naming and aliases]]. |
| 36 | Complete | All intentional filename/title mismatches have aliases; collisions are checked. |
| 37 | Complete | Knowledge filenames are within 80 characters; full titles remain searchable through aliases. |
| 38 | Complete | The identified complex multi-file collection has a manifest and reusable manifest template. |
| 39 | Complete | [[Raw Source Policy]] defines search separation, verification access, and archive thresholds. |
| 40 | Complete | All 39 raw transcripts declare `source_format: raw-transcript` and are excluded from knowledge counts. |
| 41 | Complete | Both files over 1 MB have documented split decisions; [[Search Performance]] provides a repeatable comparison. |

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
| 64 | Complete | [[Maintenance Schedule#Architecture-program acceptance criteria]] defines measurable completion and the audit currently passes. |

## Current editorial queues, not structural failures

- **164 drafts** require editorial promotion, retention, or retirement decisions.
- **96 knowledge pages with zero organic inbound links** require link-quality review; generated inventory links are deliberately excluded from this signal.
- **5 evergreen pages** remain a deliberately small, manually accountable class rather than an automatic popularity label.

Current machine-verifiable state: [[Architecture Report|PASS with zero structural errors and zero shared-spine warnings]].
