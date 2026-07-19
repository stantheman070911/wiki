---
title: "Vault Conventions"
aliases: ["THE WIKI Conventions"]
type: "conventions"
domain: "meta"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
owner: "stanley-lu"
---

# Vault Conventions

A centralized knowledge vault for intelligence, wisdom, business strategy, social media strategy, and practical tactics. THE WIKI exists to turn every useful answer, lesson, framework, and decision into lasting, searchable institutional knowledge — so problems get solved once, not repeatedly.

## Purpose

Every entry should make THE WIKI more comprehensive, practical, and reusable. Source material (podcasts, articles, books, PDFs, papers, videos, images, presentations, interviews, conversations) is filtered for signal, distilled into concise notes, and organized so it can be found and applied later.

## Structure

### Architectural invariants

THE WIKI preserves one directional information flow: archived material in `06-Source-Library/` feeds reusable reader-facing knowledge in `01`–`05`; knowledge is then composed into articles in `07` and governed reports in `Reports/`. Sources are evidence, knowledge pages are reusable units, and articles/reports are downstream syntheses. A downstream synthesis may cite its inputs but must never be treated as a source record.

Top-level folders are primarily **page-role boundaries** and are enforced by `type`. Their names also provide broad reader-facing subject orientation, but subject overlap never overrides the role boundary. Subfolders and `domain` describe durable subject/stewardship areas; tags and relationships carry cross-domain relevance. This combination is intentional and must not be implemented as a hybrid exception system.

```
THE WIKI/
├── Vault Conventions.md               Canonical conventions
├── Home.md                            Landing page / dashboard
├── 00-Templates/                      Entry templates (EN + ZH)
├── 01-Business-Strategy/              Grouped into sub-topic folders
│   ├── Pricing-and-Offers/            Positioning-and-Branding/  Growth-and-Scaling/
│   ├── Traffic-and-Acquisition/       Business-Models-and-Customers/  Finance-Capital-and-Exit/
│   ├── 100M-Scaling-Roadmap/          series hub (overview + stages)
│   └── 連鎖經營學-陳宗賢/               series hub (overview + modules)
├── 02-Social-Media-Strategy/          Flat (small domain)
├── 03-Tactics-and-Playbooks/          Grouped into sub-topic folders
├── 04-Frameworks-and-Mental-Models/   Grouped into sub-topic folders
├── 05-Intelligence-and-Research/      Flat (small domain)
├── 06-Source-Library/                 Raw/extraction notes, by source type
├── 07-Articles/                       Composed, outward-facing pieces
├── Reports/                           Governed dated downstream syntheses
├── _Inbox/                            Unprocessed material awaiting triage
└── _meta/
    ├── Architecture Schema.md          Machine-checkable structural contract
    ├── Editorial Dashboard.md          Generated maintenance queues
    ├── Portable Index.md               Static all-knowledge fallback
    ├── Source and Author Index.md       Generated provenance facets
    ├── Tags.md                        Governed, faceted tag vocabulary
    └── Topic-Index.md                 Generated complete topic navigation
```

Each domain has a semantically named index page. Live index inventories use the optional **Dataview** community plugin
(Settings → Community plugins → Browse → *Dataview* → Install → Enable); [[Portable Index]] provides a generated
Markdown fallback when it is unavailable. When a domain grows past ~25 entries, split it into sub-topic
folders (as `01`, `03`, `04` already are); keep small domains flat.

## Placement rules (canonical)

Use the folder that describes the entry's primary job and declare the same role explicitly with `type`.
Type-to-folder placement is enforced: `domain`, tags, and cross-links may express subject relevance, but
they never authorize a page to live outside the location allowed for its type. Domain index pages restate
the short version; [[Architecture Schema]] defines page types, ambiguous placement boundaries, and the
independent roles of folders, metadata, tags, and series.

- `01-Business-Strategy/` — markets, business models, positioning, pricing, growth, org strategy, unit economics.
- `02-Social-Media-Strategy/` — platforms, audience growth, distribution, creator positioning, content strategy.
- `03-Tactics-and-Playbooks/` — repeatable execution steps, checklists, workflows, operating procedures.
- `04-Frameworks-and-Mental-Models/` — reusable decision tools and cross-domain thinking models.
- `05-Intelligence-and-Research/` — observations, research, forecasts, examples, cases not yet generalized.
- `06-Source-Library/` — raw or semi-processed source material kept for traceability.
- `07-Articles/` — outward-facing synthesized essays built from multiple entries.
- `Reports/` — governed dated syntheses with structured `derived_from` roots; reports participate in navigation and lifecycle but never become source records.

Within a domain, drop the entry in the sub-topic folder that fits. Do not create a new top-level folder unless the existing taxonomy genuinely cannot hold the topic.

## How an entry gets created

1. **Drop it in `_Inbox/`** — a raw transcript, article, note, or link, if it needs processing later.
2. **Extract signal from noise** — key ideas, principles, frameworks, tactics, notable examples. Discard filler.
3. **Write the entry** from the matching page-type and language template in `00-Templates/`, placed in the right sub-topic folder.
4. **Structure provenance and relationships** — reference stable source IDs in `sources[]`, store typed canonical paths in `relationships[]`, and render both reader-facing sections from metadata. Refresh generated inventories through the maintenance workflow; never hand-edit their tables or counts.
5. **Archive the source** — file the original under `06-Source-Library/`; its source record owns the authoritative bibliography.

## Conventions

### Language (bilingual policy)
One language per entry, set with `lang: en` or `lang: zh` in front matter. English and Chinese page-type
templates share the content spine defined in [[Architecture Schema#Shared content spine]], while allowing
documented language-appropriate headings. [[Topic-Index]] is the generated complete topic map; its
bilingual view identifies topics represented in both languages. When an entry is a true translation of
another, also link the pair directly with a `translation` relationship.

### Tags — faceted and controlled
Every tag carries a facet prefix and must be an explicitly approved, active term in the canonical `_meta/taxonomy-registry.json`. [[Tags]] is its generated human-readable view:

- `topic/…` — what it is about (`topic/pricing`, `topic/positioning`).
- `person/…` — the source author (`person/alex-hormozi`).
- `source/…` — a program, podcast, or brand used as provenance (`source/bloom-nutrition`).

Reuse an existing term before proposing a new one. Add a genuinely new term to `_meta/taxonomy-registry.json` as `proposed` with `approved: false`; use it on knowledge pages only after overlap, aliases, spelling, parent, and definition are reviewed and it becomes `active` with `approved: true`.

### Linking
Semantic links live in the structured `relationships` array as canonical paths. Use the strongest supported predicate and store the reciprocal inverse where the schema requires one; reserve generic `related` for genuinely ambiguous associations. The generated `Relationships`/`關係` section is a reader view, not a second source of truth.

Knowledge provenance lives in `sources[]` as `{id, role, locator?}` references. Authoritative title, creators, language, format, publication data, and URL live only on the source record identified by that stable ID. The generated `Source reference`/`來源` section renders a genuine link to that record; retained attachments remain linked from the source record itself.

### Naming
- Entry files use readable titles, not slugs. English: Title Case, with a `" - "` (spaced hyphen)
  separating title and subtitle. Chinese: natural title; full-width punctuation (`：，`) is fine.
- Source files: `YYYY-MM-DD_Type_Author_TitleInPascalCase` (sortable, greppable).
- Avoid characters illegal in file paths (`/ \ : * ? " < > |`, ASCII colon). Full-width `：` is allowed.

### Status lifecycle
Active knowledge moves from `draft` to `reviewed`, with `evergreen` reserved for intentionally maintained cornerstones. Retirement uses `deprecated`, `superseded`, `replaced`, and `archived`; forwarding states require `replaced_by`. Reports are dated snapshots and use the report lifecycle in [[Reports Index]]. Transitions, capacity-aware review dates, stewardship, and queue ownership are defined in [[Editorial Governance]] and [[Architecture Schema#Lifecycle]].

Curated supporting surfaces, generated outputs, and historical governance snapshots use a separate supporting lifecycle; see [[Editorial Governance#Supporting-surface lifecycle]]. Generated pages are rebuilt from source data, not promoted through the knowledge lifecycle.

## Maintenance

[[Maintenance Schedule]] is the canonical operator sequence for conditional regeneration and recurring review. Close every structural change with `npm run check`, the single release gate backed by `_meta/vault-schema.yaml`. Generated pages such as [[Tags]], [[Topic-Index]], [[Portable Index]], [[Editorial Dashboard]], and [[Maintenance Review]] are outputs of that workflow, not places to copy or maintain source rules, counts, or queues.

## Obsidian setup

- `Home.md` is the intended landing page. Open or pin it from Quick Switcher; Obsidian's workspace file records the user's live last-open tab and is not an architectural invariant.
- The Templates core plugin is enabled and `.obsidian/templates.json` points to `00-Templates/`. Choose the template matching both page type and language; the generic entry templates are compatibility fallbacks only.
- Dataview is optional enhancement software. Curated maps and [[Portable Index]] remain the required navigation layer.
- The committed global graph is knowledge-only. [[Graph Views]] documents the source-traceability filter and recreation steps.

## Principles

- Condense, don't summarize. Every entry should be usable without reading the source.
- Prefer frameworks and mental models over one-off facts — they generalize.
- Reference stable source IDs on every entry; keep authoritative bibliography on canonical source records.
- Update existing entries when better information arrives, rather than creating duplicates.
