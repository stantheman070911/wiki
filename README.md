# THE WIKI

A centralized knowledge vault for intelligence, wisdom, business strategy, social media strategy, and practical tactics. THE WIKI exists to turn every useful answer, lesson, framework, and decision into lasting, searchable institutional knowledge — so problems get solved once, not repeatedly.

## Purpose

Every entry should make THE WIKI more comprehensive, practical, and reusable. Source material (podcasts, articles, books, PDFs, papers, videos, images, presentations, interviews, conversations) is filtered for signal, distilled into concise notes, and organized so it can be found and applied later.

## Structure

```
THE WIKI/
├── README.md                          This file
├── 00-Templates/                      Entry template and conventions
├── 01-Business-Strategy/              Business models, growth, ops, decision-making
├── 02-Social-Media-Strategy/          Platform strategy, content strategy, growth tactics
├── 03-Tactics-and-Playbooks/          Step-by-step, repeatable how-tos
├── 04-Frameworks-and-Mental-Models/   Reusable thinking tools and mental models
├── 05-Intelligence-and-Research/      Market/competitor intel, notable examples, research findings
├── 06-Source-Library/                 Raw source materials and extraction notes, organized by source
├── 07-Articles/                       Composed, outward-facing pieces synthesized from multiple entries
└── _Inbox/                            Unprocessed material awaiting triage
```

Each domain folder has its own `README.md` index listing its entries. Add new subfolders under a domain as topics accumulate (e.g. `02-Social-Media-Strategy/Content-Repurposing/`).

## Placement rules

Use the folder that describes the entry's primary job:

- `01-Business-Strategy/` — markets, business models, positioning, pricing, growth, org strategy, and unit economics.
- `02-Social-Media-Strategy/` — platforms, audience growth, distribution, creator positioning, and content strategy.
- `03-Tactics-and-Playbooks/` — repeatable execution steps, checklists, workflows, and operating procedures.
- `04-Frameworks-and-Mental-Models/` — reusable decision tools and cross-domain thinking models.
- `05-Intelligence-and-Research/` — observations, research, forecasts, examples, and cases not yet generalized.
- `06-Source-Library/` — raw or semi-processed source material kept for traceability.
- `07-Articles/` — outward-facing synthesized essays built from multiple entries.

When a topic becomes a series or dense cluster, create a subfolder with a `README.md` hub inside the relevant domain. Do not create a new top-level folder unless the existing taxonomy cannot hold the topic.

## How an entry gets created

1. **Drop it in `_Inbox/`** — a raw transcript, article, note, or link, if it needs processing later.
2. **Extract signal from noise** — identify the key ideas, principles, frameworks, strategies, tactics, and notable examples. Discard filler.
3. **Write the entry** using `00-Templates/Entry-Template.md`, placed in the relevant domain folder.
4. **Link it** — add a line to that domain's `README.md` index, and cross-link to related entries where useful.
5. **Archive the source** (optional) — if worth preserving, file the original under `06-Source-Library/`, referenced from the entry.

## Tagging conventions

Use lowercase, hyphenated tags in each entry's front matter, e.g. `tags: [pricing, saas, negotiation]`. Reuse existing tags before inventing new ones — check domain READMEs for tags already in use.

## Maintenance

Run `node tools/audit-vault.mjs` after structural edits to catch broken internal links, stale section counts, missing README files, front matter drift, and source-library documentation drift.

## Principles

- Condense, don't summarize. Every entry should be usable without reading the source.
- Prefer frameworks and mental models over one-off facts — they generalize.
- Cite the source and date on every entry for traceability.
- Update existing entries when better information arrives, rather than creating duplicates.
