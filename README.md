# THE WIKI

A centralized knowledge vault for intelligence, business strategy, social media strategy, tactics, and frameworks. THE WIKI turns every useful answer, lesson, framework, and decision into lasting, searchable institutional knowledge — so problems get solved once, not repeatedly.

Source material (podcasts, articles, books, PDFs, papers, videos, presentations, interviews, conversations) is filtered for signal, distilled into concise notes, and organized so it can be found and applied later. It is an [Obsidian](https://obsidian.md) vault, but every knowledge page is plain Markdown and readable without Obsidian.

> **New here?** Start with [`Home.md`](Home.md) — the curated reader landing page — then read [`Vault Conventions.md`](Vault%20Conventions.md) for the full editorial rules. Operational queues live in generated governance views, not in the reader-navigation contract.

## What's inside

The vault is bilingual (English + 中文, one language per entry) and organized by the *job* a page does, not by source. Content flows from raw material toward reusable knowledge and, finally, outward-facing synthesis:

```
raw source  →  distilled entry  →  cross-linked knowledge  →  composed article / governed report
 (_Inbox,        (domains 01–05)      (wikilink graph)           (07-Articles / Reports)
  06-Source-Library)
```

## Structure

| Folder | Purpose |
| --- | --- |
| [`00-Templates/`](00-Templates/) | Entry templates for each page type, in English and Chinese (`-ZH`) |
| [`01-Business-Strategy/`](01-Business-Strategy/) | Business models, positioning, pricing, growth, ops, finance — split into sub-topic folders, plus two major series |
| [`02-Social-Media-Strategy/`](02-Social-Media-Strategy/) | Platform strategy, audience growth, distribution, creator positioning, content strategy |
| [`03-Tactics-and-Playbooks/`](03-Tactics-and-Playbooks/) | Repeatable execution steps, checklists, workflows, operating procedures |
| [`04-Frameworks-and-Mental-Models/`](04-Frameworks-and-Mental-Models/) | Reusable decision tools and cross-domain thinking models |
| [`05-Intelligence-and-Research/`](05-Intelligence-and-Research/) | Observations, research, forecasts, and notable examples not yet generalized |
| [`06-Source-Library/`](06-Source-Library/) | Raw and semi-processed source material, kept for traceability, organized by source type |
| [`07-Articles/`](07-Articles/) | Outward-facing synthesized essays built from multiple entries |
| [`_Inbox/`](_Inbox/) | Unprocessed material awaiting triage |
| [`Reports/`](Reports/) | Governed, dated syntheses generated *from* the wiki, indexed in [`Reports Index.md`](Reports/Reports%20Index.md) and linked to their derivation roots |
| [`_meta/`](_meta/) | Architecture schema, taxonomy, generated indexes, and maintenance dashboards |
| [`tools/`](tools/) | Node.js scripts that generate indexes and audit the vault |

Each domain has a semantically named index page (e.g. [`Business Strategy Index.md`](01-Business-Strategy/Business%20Strategy%20Index.md)). When a domain grows past ~25 entries it's split into sub-topic folders; small domains stay flat.

## How an entry gets created

1. **Drop it in [`_Inbox/`](_Inbox/)** — a raw transcript, article, note, or link that needs processing later.
2. **Extract signal from noise** — key ideas, principles, frameworks, tactics, notable examples. Discard filler.
3. **Write the entry** from the matching page-type and language template in [`00-Templates/`](00-Templates/), placed in the right sub-topic folder.
4. **Structure provenance and relationships** — reference stable source IDs in `sources[]`, store typed canonical paths in `relationships[]`, and render the reader-facing sections with the generator.
5. **Archive the source** under [`06-Source-Library/`](06-Source-Library/) as the one authoritative bibliographic record.

If you're using Claude, the `process-inbox` skill is a convenience launcher for steps 2–5. The versioned schema, conventions, templates, and taxonomy registry remain authoritative if a local skill copy drifts.

## Conventions at a glance

- **One language per entry**, declared with `lang: en` or `lang: zh` in front matter. True translations are linked with a `translation` relationship.
- **Faceted, controlled tags** — every tag carries a facet prefix (`topic/…`, `person/…`, `source/…`) and must be active and approved in [`_meta/taxonomy-registry.json`](_meta/taxonomy-registry.json); [`_meta/Tags.md`](_meta/Tags.md) is the generated reader view.
- **Explicit page `type`** in front matter (`strategy`, `playbook`, `framework`, `research`, `article`, `source`, `series-hub`, …) declares each page's job.
- **Status lifecycle** — `draft` → `reviewed` → `evergreen`.
- **Report lifecycle** — governed snapshots use `draft` → `reviewed` → `superseded`, with `generated_on`, `derived_from`, `supersedes`, and `owner` metadata.
- **Reference canonical source IDs** on every entry; bibliographic metadata lives only on source records.
- **Condense, don't summarize** — every entry should be usable without reading the source.

Full rules: [`Vault Conventions.md`](Vault%20Conventions.md) · machine-checkable contract: [`_meta/Architecture Schema.md`](_meta/Architecture%20Schema.md)

## Maintenance tooling

[`_meta/Maintenance Schedule.md`](_meta/Maintenance%20Schedule.md) owns the operator sequence and identifies which generator to run for each input change. Finish every structural change with the single release gate:

```bash
npm run check
```

The gate validates the machine contract in [`_meta/vault-schema.yaml`](_meta/vault-schema.yaml), including generated-artifact freshness. Generated indexes, dashboards, counts, and queues are outputs; regenerate them from source pages and metadata rather than editing them by hand or copying their values into governance prose.

## Obsidian setup (optional)

The vault works as plain Markdown, but Obsidian adds navigation and live indexes:

- **Landing page** — open or pin [`Home.md`](Home.md).
- **Dataview** (community plugin) powers the live tables on `Home.md` and the domain indexes. It's optional; [`_meta/Portable Index.md`](_meta/Portable%20Index.md) is a generated, plugin-independent fallback that lists every knowledge page.
- **Templates** core plugin points at [`00-Templates/`](00-Templates/).

Local app and session state (`.obsidian/workspace.json`, community plugin binaries, `.claude/`) is git-ignored; the shared configuration and all content are tracked.
