# THE WIKI

A centralized knowledge vault for intelligence, business strategy, social media strategy, tactics, and frameworks. THE WIKI turns every useful answer, lesson, framework, and decision into lasting, searchable institutional knowledge — so problems get solved once, not repeatedly.

Source material (podcasts, articles, books, PDFs, papers, videos, presentations, interviews, conversations) is filtered for signal, distilled into concise notes, and organized so it can be found and applied later. It is an [Obsidian](https://obsidian.md) vault, but every knowledge page is plain Markdown and readable without Obsidian.

> **New here?** Start with [`Home.md`](Home.md) — the landing page and dashboard — then read [`Vault Conventions.md`](Vault%20Conventions.md) for the full editorial rules.

## What's inside

The vault is bilingual (English + 中文, one language per entry) and organized by the *job* a page does, not by source. Content flows from raw material toward reusable knowledge and, finally, outward-facing synthesis:

```
raw source  →  distilled entry  →  cross-linked knowledge  →  composed article
 (_Inbox,        (domains 01–05)      (wikilink graph)           (07-Articles)
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
| [`Reports/`](Reports/) | Long-form syntheses generated *from* the wiki — downstream deliverables kept outside the taxonomy and the wikilink graph |
| [`_meta/`](_meta/) | Architecture schema, taxonomy, generated indexes, and maintenance dashboards |
| [`tools/`](tools/) | Node.js scripts that generate indexes and audit the vault |

Each domain has a semantically named index page (e.g. [`Business Strategy Index.md`](01-Business-Strategy/Business%20Strategy%20Index.md)). When a domain grows past ~25 entries it's split into sub-topic folders; small domains stay flat.

## How an entry gets created

1. **Drop it in [`_Inbox/`](_Inbox/)** — a raw transcript, article, note, or link that needs processing later.
2. **Extract signal from noise** — key ideas, principles, frameworks, tactics, notable examples. Discard filler.
3. **Write the entry** from the matching page-type and language template in [`00-Templates/`](00-Templates/), placed in the right sub-topic folder.
4. **Link it** — cross-link related entries with `[[wikilinks]]` and link the archived source.
5. **Archive the source** under [`06-Source-Library/`](06-Source-Library/) and link to it from the entry.

If you're using Claude, the `process-inbox` skill automates steps 2–5 following these exact conventions.

## Conventions at a glance

- **One language per entry**, declared with `lang: en` or `lang: zh` in front matter. True translations are linked with a `translation` relationship.
- **Faceted, controlled tags** — every tag carries a facet prefix (`topic/…`, `person/…`, `source/…`) and must already exist in [`_meta/Tags.md`](_meta/Tags.md).
- **Explicit page `type`** in front matter (`strategy`, `playbook`, `framework`, `research`, `article`, `source`, `series-hub`, …) declares each page's job.
- **Status lifecycle** — `draft` → `reviewed` → `evergreen`.
- **Cite and link the source and date** on every entry, for traceability.
- **Condense, don't summarize** — every entry should be usable without reading the source.

Full rules: [`Vault Conventions.md`](Vault%20Conventions.md) · machine-checkable contract: [`_meta/Architecture Schema.md`](_meta/Architecture%20Schema.md)

## Maintenance tooling

The [`tools/`](tools/) scripts keep the vault's indexes and structure consistent. Run them with Node.js from the vault root:

```bash
# after tag changes
node tools/generate-taxonomy-registry.mjs
node tools/generate-topic-index.mjs

# after page, link, source, or status changes
node tools/generate-navigation-indexes.mjs

# after any structural edit — validates links, indexes, types, provenance, series, etc.
node tools/audit-vault.mjs

# after editorial or navigation changes — validates placement, dates, headings,
# provenance parity, relationship quality, duplicate risk, MOC capacity, and graph reachability
node tools/deep-audit-vault.mjs
```

`generate-architecture-report.mjs` and `generate-maintenance-review.mjs` write the current scorecard and review into [`_meta/`](_meta/). Both audits are release gates: `audit-vault.mjs` enforces the architecture contract, while `deep-audit-vault.mjs` checks editorial placement, provenance parity, duplicate risk, and reader-graph health.

## Obsidian setup (optional)

The vault works as plain Markdown, but Obsidian adds navigation and live indexes:

- **Landing page** — open or pin [`Home.md`](Home.md).
- **Dataview** (community plugin) powers the live tables on `Home.md` and the domain indexes. It's optional; [`_meta/Portable Index.md`](_meta/Portable%20Index.md) is a generated, plugin-independent fallback that lists every knowledge page.
- **Templates** core plugin points at [`00-Templates/`](00-Templates/).

Local app and session state (`.obsidian/workspace.json`, community plugin binaries, `.claude/`) is git-ignored; the shared configuration and all content are tracked.
