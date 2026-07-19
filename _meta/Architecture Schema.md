---
title: "Architecture Schema"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-13"
status: "evergreen"
---

# Architecture Schema

This page defines the structural contract for THE WIKI. [[Vault Conventions]] explains editorial intent; this page defines machine-checkable page types, properties, placement boundaries, relationships, naming, and lifecycle rules.

## Page types

| Type | Purpose | Required location | Required content spine |
|---|---|---|---|
| `strategy` | Choices about markets, positioning, offers, growth, or channels | `01` or `02` | Summary, context, implications/application, relationships, source |
| `playbook` | Repeatable execution procedure | `03` | Summary, use case, steps, relationships, source |
| `framework` | Reusable reasoning or decision model | `04` | Summary, context, model, application, relationships, source |
| `research` | Observation, forecast, case, or finding not yet generalized | `05` | Summary, evidence/context, implications, relationships, source |
| `article` | Outward-facing synthesis | `07` | Narrative plus `Sources in THE WIKI` |
| `report` | Governed, dated downstream synthesis | `Reports` | Executive narrative, structured derivation roots, report lifecycle |
| `series-hub` | Authoritative overview and index for an ordered collection | Named series folder | Scope, complete index, relationships, source |
| `series-entry` | One ordered unit in a series | Named series folder | Summary, series navigation, application, relationships, source |
| `source` | Archived source note or raw transcript | `06` by source type | Source metadata and processing state |
| `source-manifest` | Inventory and derivative map for a multi-file collection | Collection folder in `06` | Complete file list, derived pages, processing status |
| `domain-index` | Curated domain map plus generated inventory | Domain root | Placement rule, Start Here, curated map, inventory |
| `subdomain-index` | Orientation for a large or complex subdomain | Subdomain folder | Scope, Start Here, clusters, inventory |
| `report-index` | Complete governed inventory of report snapshots | `Reports` root | Report contract, lifecycle, complete inventory |

Supporting types are `vault-home`, `conventions`, `taxonomy-registry`, `topic-index`, `workflow`, `governance`, `template`, `source-index`, `article-index`, `report-index`, and `inbox-index`.

## Core properties

Knowledge pages require `title`, `type`, `domain`, `lang`, `tags`, `date_added`, `updated`, `reviewed_on`, and `status`. A `series` value is required for series hubs and entries. `owner` is optional until an accountable editor is assigned; never invent an owner.

Reports require `title`, `type: report`, `domain: reports`, `lang`, `status`, `generated_on`, a nonempty `derived_from` list, `supersedes`, and `owner`. `generated_on` identifies an immutable synthesis snapshot; `supersedes` links earlier report snapshots when applicable. Reports are downstream artifacts, never source records.

- `domain` identifies the durable subject/ownership area independently of page type.
- `updated` records the latest substantial edit.
- `reviewed_on` is blank for drafts and records the last structural/editorial review for reviewed or evergreen pages.
- `source_format: raw-transcript` distinguishes raw transcripts from curated `source-note` records.
- `processing_status` is `unprocessed`, `processing`, `processed`, `superseded`, or `exempt`.

## Lifecycle

| Status | Objective criteria | Review interval |
|---|---|---|
| `draft` | Correct page type and source link; shared spine present; not yet editorially checked | Capacity-scheduled |
| `reviewed` | Placement, metadata, headings, links, source traceability, and terminology checked | Review after a substantial edit or within 12 months |
| `evergreen` | Reviewed, stable, load-bearing, and intentionally maintained as a cornerstone | Review within 6 months |
| `deprecated` | Retained for context but no longer preferred | Resolve replacement or archive within 90 days |
| `superseded` | Replaced by a newer page or artifact | Validate forwarding within 30 days |
| `replaced` | Forwarding shell retained for retrieval after merge or rename | No recurring review after forwarding passes |
| `archived` | Historical or provenance-only material outside active navigation | No recurring review |

A substantial conceptual or structural edit updates `updated` and returns the page to `draft` unless the editor reviews it in the same change. Promotion requires setting `reviewed_on`; demotion requires a short note in the edit history or commit. `superseded` and `replaced` pages require a resolvable `replaced_by` target. Active indexes include only `draft`, `reviewed`, and `evergreen`; see [[Editorial Governance]] for transitions, forwarding, stewardship, and capacity-aware review scheduling.

## Folder axes and placement

Top-level folders represent the page's primary operational role, and the page's `type` must conform to the allowed top-level location in the Page types table. `domain` remains a distinct subject and stewardship field, but it does not override type-to-folder placement. Cross-domain relevance belongs in tags, relationships, and curated maps. Subfolders represent stable subject areas. Named series folders represent collection membership and must declare `series` explicitly. Tags carry secondary subjects; folders must not attempt to encode every subject.

- **Business Positioning vs Framework Positioning:** business-specific market or brand choices are `strategy` under `01`; reusable positioning laws and diagnostic models are `framework` under `04`.
- **Social Strategy vs Content Playbooks:** audience/channel choices and platform strategy belong in `02`; repeatable production or distribution procedures belong in `03`.
- **Operations Playbooks vs Execution Frameworks:** executable operating procedures belong in `03`; general models for focus, constraints, and systems thinking belong in `04`.
- **Mixed-purpose pages:** classify by the action a reader takes after reading. Split a page when two independent actions would require two page types.
- **No hybrid placement:** a page may be linked from a domain map outside its home folder, but its file location must still match its declared type. Inventories display type explicitly and validation rejects mismatches rather than silently filtering them out.
- **Series:** use a series folder only when order, shared source, or collection-level navigation is essential.

## Shared content spine

All knowledge page types require these concepts, although documented bilingual headings may vary:

1. Summary: `One-line summary` or `一句話總結`.
2. Context: `Context`, `Background`, `背景`, `情境`, or `適用情境`.
3. Application or implications: `Tactics / how to apply`, `Application`, `Implications`, `應用方式`, `應用`, `建議做法`, or `如何應用`.
4. Typed relationships: `Relationships` or `關係`.
5. Source: `Source reference`, `Sources in THE WIKI`, or `來源`.

Page-type templates may add sections. Undocumented headings must not replace the shared spine. Use H3 for repeated conceptual blocks inside an H2 when a section has three or more independently linkable parts.

### Canonical Chinese H2 architecture

Chinese standard entries use exactly six H2 sections; page-specific detail belongs beneath the type-specific core as H3/H4. This keeps Outline navigation consistent without forcing identical content across page types.

| Type | Canonical H2 sequence |
|---|---|
| `strategy` | `一句話總結` → `背景` → `核心策略` → `應用` → `關係` → `來源` |
| `playbook` | `一句話總結` → `背景` → `執行方法` → `應用` → `關係` → `來源` |
| `framework` | `一句話總結` → `背景` → `核心模型` → `應用` → `關係` → `來源` |
| `research` | `一句話總結` → `背景` → `觀察與證據` → `應用` → `關係` → `來源` |
| `series-entry` | `一句話總結` → `背景` → `核心內容` → `應用` → `關係` → `來源` |

English entries retain documented page-type variation for established standard, diagnostic, and source-specific layouts; every supported variant still implements the same shared spine and is registered in the machine-readable schema.

## Typed relationships

Relationships are directional unless noted:

- `prerequisite` — read or understand the target first.
- `applies` — this page operationalizes the target.
- `example` — this page is an instance of the target.
- `contrast` — the two pages clarify each other through a meaningful difference; symmetric.
- `translation` — true language-equivalent page; symmetric.
- `related` — relevant but no stronger relation applies; symmetric.

Until relationship metadata is migrated, labels may be written in the Relationships section as `- **contrast:** [[Target]]`.

## Taxonomy boundaries

- `topic/simplicity` describes the quality or principle of being simple; `topic/simplification` describes the act or process of reducing complexity.
- `topic/avatar` is a designed customer/content archetype; `topic/persona` is the public identity or character presented by a creator or brand.
- `topic/owned-audience` is any directly reachable audience asset; `topic/private-domain` is the Chinese private-traffic operating model and is narrower.
- `topic/short-form-video` is the cross-platform format; platform tags such as `topic/tiktok` are used only when platform mechanics matter.
- `topic/leadership` concerns direction and influence; `topic/management` concerns planning and control; `topic/org-design` concerns roles, structure, decision rights, and coordination.

## Naming and aliases

- Knowledge filenames should be concise, unique, and no longer than 80 characters. Put explanatory subtitles in `title`.
- Source filenames may exceed 80 characters when required by the dated provenance convention, but should remain below 120 characters.
- When filename and `title` differ, the full title must appear in `aliases`.
- Preserve former filenames as aliases after a rename.
- Add aliases for common abbreviations, punctuation variants, and true translated names when they improve retrieval. Avoid generic aliases such as `README`.

## Visual grammar

- Use numbered lists for ordered procedures.
- Use tables for exact comparisons, mappings, ownership, or repeated fields.
- Use Mermaid only for flows, dependencies, or hierarchies that are materially clearer as a diagram.
- Use callouts for warnings, constraints, decisions, or exceptions—not decoration.
- Embed images only when the visual is itself evidence or materially improves application.

## Maintenance cadence

- Regenerate the taxonomy and topic views after an approved registry change; never hand-edit generated indexes.
- Run `npm test` and `npm run check` after every structural change. `check-vault` is the single release gate and regenerates deterministic outputs in memory before comparison.
- Review taxonomy, folder capacity, source coverage, drafts, and zero-inbound pages monthly while the vault is growing rapidly; move to quarterly once change volume stabilizes.
