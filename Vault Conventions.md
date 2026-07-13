---
title: "THE WIKI"
type: "conventions"
lang: "en"
---

# THE WIKI

A centralized knowledge vault for intelligence, wisdom, business strategy, social media strategy, and practical tactics. THE WIKI exists to turn every useful answer, lesson, framework, and decision into lasting, searchable institutional knowledge — so problems get solved once, not repeatedly.

## Purpose

Every entry should make THE WIKI more comprehensive, practical, and reusable. Source material (podcasts, articles, books, PDFs, papers, videos, images, presentations, interviews, conversations) is filtered for signal, distilled into concise notes, and organized so it can be found and applied later.

## Structure

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

Use the folder that describes the entry's primary job and declare the purpose explicitly with `type`.
Domain index pages restate the short version; [[Architecture Schema]] defines page types, ambiguous
placement boundaries, and the independent roles of folders, metadata, tags, and series.

- `01-Business-Strategy/` — markets, business models, positioning, pricing, growth, org strategy, unit economics.
- `02-Social-Media-Strategy/` — platforms, audience growth, distribution, creator positioning, content strategy.
- `03-Tactics-and-Playbooks/` — repeatable execution steps, checklists, workflows, operating procedures.
- `04-Frameworks-and-Mental-Models/` — reusable decision tools and cross-domain thinking models.
- `05-Intelligence-and-Research/` — observations, research, forecasts, examples, cases not yet generalized.
- `06-Source-Library/` — raw or semi-processed source material kept for traceability.
- `07-Articles/` — outward-facing synthesized essays built from multiple entries.

Within a domain, drop the entry in the sub-topic folder that fits. Do not create a new top-level folder unless the existing taxonomy genuinely cannot hold the topic.

## How an entry gets created

1. **Drop it in `_Inbox/`** — a raw transcript, article, note, or link, if it needs processing later.
2. **Extract signal from noise** — key ideas, principles, frameworks, tactics, notable examples. Discard filler.
3. **Write the entry** from the matching page-type and language template in `00-Templates/`, placed in the right sub-topic folder.
4. **Link it** — cross-link related entries with `[[wikilinks]]`, and link the archived source (see below). Indexes update automatically via Dataview — no manual table editing.
5. **Archive the source** — file the original under `06-Source-Library/` and link to it from the entry.

## Conventions

### Language (bilingual policy)
One language per entry, set with `lang: en` or `lang: zh` in front matter. English and Chinese page-type
templates share the content spine defined in [[Architecture Schema#Shared content spine]], while allowing
documented language-appropriate headings. [[Topic-Index]] is the generated complete topic map; its
bilingual view identifies topics represented in both languages. When an entry is a true translation of
another, also link the pair directly with a `translation` relationship.

### Tags — faceted and controlled
Every tag carries a facet prefix and must already exist in [[Tags]] (`_meta/Tags.md`):

- `topic/…` — what it is about (`topic/pricing`, `topic/positioning`).
- `person/…` — the source author (`person/alex-hormozi`).
- `source/…` — a program, podcast, or brand used as provenance (`source/bloom-nutrition`).

Reuse an existing tag before coining a new one; add genuinely new tags to `_meta/Tags.md` first.

### Linking
Prefer `[[wikilinks]]` for links between notes. Link the archived source with a real link — a wikilink
for a Markdown note (`[[2026-07-08_Book_RiesTrout_Positioning]]`) or an angle-bracket Markdown link for
an attachment (`[file.xlsx](<../../06-Source-Library/…/file.xlsx>)`). **Never** leave a source path as a
bare code-span; the audit warns on those.

### Naming
- Entry files use readable titles, not slugs. English: Title Case, with a `" - "` (spaced hyphen)
  separating title and subtitle. Chinese: natural title; full-width punctuation (`：，`) is fine.
- Source files: `YYYY-MM-DD_Type_Author_TitleInPascalCase` (sortable, greppable).
- Avoid characters illegal in file paths (`/ \ : * ? " < > |`, ASCII colon). Full-width `：` is allowed.

### Status lifecycle
`draft` on creation → `reviewed` once structure, placement, links, and provenance are checked →
`evergreen` for intentionally maintained cornerstone pages. Promotion, demotion, review intervals, and
substantial-edit behavior are defined in [[Architecture Schema#Lifecycle]].

## Maintenance

After tag changes run `node tools/generate-taxonomy-registry.mjs` and `node tools/generate-topic-index.mjs`.
After page, link, source, or status changes run `node tools/generate-navigation-indexes.mjs`; after any structural edit run
`node tools/audit-vault.mjs`. The audit validates page and fragment links, semantic indexes, explicit
page types, metadata, topic freshness, source and attachment coverage, source folders, series integrity,
aliases, filename limits, and retired Inbox paths. `node tools/generate-architecture-report.mjs` writes
the current scorecard to [[Architecture Report]]. The recurring operating cadence and measurable acceptance criteria live in [[Maintenance Schedule]].
`node tools/generate-maintenance-review.mjs` records the recurring taxonomy, folder, source, draft, relationship, hierarchy, and visual-structure review in [[Maintenance Review]].

## Obsidian setup

- `Home.md` is the intended landing page. Open or pin it from Quick Switcher; Obsidian's workspace file records the user's live last-open tab and is not an architectural invariant.
- The Templates core plugin is enabled and `.obsidian/templates.json` points to `00-Templates/`. Choose the template matching both page type and language; the generic entry templates are compatibility fallbacks only.
- Dataview is optional enhancement software. Curated maps and [[Portable Index]] remain the required navigation layer.
- The committed global graph is knowledge-only. [[Graph Views]] documents the source-traceability filter and recreation steps.

## Principles

- Condense, don't summarize. Every entry should be usable without reading the source.
- Prefer frameworks and mental models over one-off facts — they generalize.
- Cite the source and date on every entry, and link it, for traceability.
- Update existing entries when better information arrives, rather than creating duplicates.
