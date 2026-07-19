---
title: Vault Conventions
aliases:
  - THE WIKI Conventions
lang: en
---

# Vault Conventions

THE WIKI turns every useful answer, lesson, framework, and decision into lasting, searchable knowledge — so problems get solved once, not repeatedly. Source material (podcasts, articles, books, videos, courses, conversations) is filtered for signal, distilled into concise entries, and organized to be found and applied later.

This is the single rulebook. If a rule isn't here or in [[tags]], it isn't a rule.

## Structure

```
THE WIKI/
├── Home.md / Home-ZH.md               Landing pages (EN / 中文)
├── 00-Templates/                      Entry templates
├── 01-Business-Strategy/              Sub-topic folders + two series
├── 02-Social-Media-Strategy/          Flat (small domain)
├── 03-Tactics-and-Playbooks/          Sub-topic folders
├── 04-Frameworks-and-Mental-Models/   Sub-topic folders
├── 05-Intelligence-and-Research/      Flat (small domain)
├── 06-Source-Library/                 Archived sources, by source type
├── 07-Articles/                       Composed, outward-facing essays
├── Reports/                           Dated syntheses generated from the wiki
├── _Inbox/                            Unprocessed material awaiting triage
├── _meta/tags.md                      The tag vocabulary
└── tools/check-vault.mjs              The lint gate (`npm run check`)
```

Information flows one way: archived sources in `06` feed knowledge entries in `01`–`05`, which are composed into articles (`07`) and reports (`Reports/`). Articles and reports cite entries; they are never treated as sources.

## Placement

Put each entry in the folder matching its job:

- `01-Business-Strategy/` — markets, business models, positioning, pricing, growth, org strategy, unit economics.
- `02-Social-Media-Strategy/` — platforms, audience growth, distribution, creator positioning, content strategy.
- `03-Tactics-and-Playbooks/` — repeatable execution steps, checklists, workflows, operating procedures.
- `04-Frameworks-and-Mental-Models/` — reusable decision tools and cross-domain thinking models.
- `05-Intelligence-and-Research/` — observations, research, forecasts, and examples not yet generalized.

Rules of thumb: strategy is a *choice*, a playbook is a *procedure*, a framework is a *model*, research is an *observation*. Classify by the action a reader takes after reading. In `01`, `03`, and `04`, entries go in a sub-topic folder — never loose in the domain root. When any folder grows past ~25 entries, split it; keep small domains flat. Don't create a new top-level folder unless the existing ones genuinely cannot hold the topic.

## Frontmatter

Knowledge entries (domains `01`–`05`, `07`, `Reports/`):

```yaml
---
lang: en                    # en | zh — one language per entry
tags:                       # every tag must exist in _meta/tags.md
  - topic/pricing
  - person/alex-hormozi
status: draft               # draft | reviewed
updated: 2026-07-19         # optional — date of last substantial edit
---
```

`title`, `aliases`, and `series` are optional; add them only when they help retrieval (a subtitle that won't fit the filename, a common abbreviation, a former name after a rename). Everything else is derived: the folder gives the domain and page role, git gives the history.

Source records (`06-Source-Library/`):

```yaml
---
title: What Billionaires Do Differently - Raw Transcript
author: Daniel Priestley    # string or list
archived: 2026-07-13
url: https://…              # optional
published: 2026-05-01       # optional
lang: en                    # optional — language of the original
---
```

## Entry shape

Every entry follows the same spine, as a convention (the check does not police headings, except that a Source section must exist):

| Concept | English heading | 中文標題 |
| --- | --- | --- |
| Summary | `One-line summary` | `一句話總結` |
| Context | `Context` | `背景` |
| Core material | free — insights, model, steps, examples | 自由 — `核心策略`、`執行方法`、`核心模型`… |
| Application | `Application` / `Tactics / how to apply` | `應用` |
| Related | `Related` / `Relationships` | `關係` |
| Source | `Source reference` | `來源` |

Writing principles:

- **Condense, don't summarize.** Every entry must be usable without opening the source.
- **Prefer frameworks over one-off facts** — they generalize.
- **One idea-cluster per entry.** Split a dense source into several entries; update an existing entry instead of creating a near-duplicate.
- Use numbered lists for procedures, tables for exact comparisons, and diagrams only when materially clearer.

## Linking

- Link related entries with plain `[[wikilinks]]` in the **Related** section (and inline where natural). Annotate in prose when the relationship matters: `- **Prerequisite:** [[Target]]`.
- Every entry's **Source** section links the archived source record in `06-Source-Library/` (or states "no source" for original thinking).
- Bibliographic detail (author, URL, publication date) lives on the source record, not on entries.
- A true cross-language pair links both directions from the Related sections.

## Tags

Tags carry a facet prefix and must exist in [[tags|_meta/tags.md]]:

- `topic/…` — what it's about (`topic/pricing`).
- `person/…` — the source author (`person/alex-hormozi`).
- `source/…` — a program, podcast, or brand used as provenance.

Reuse an existing term before coining a new one; avoid near-synonyms. A genuinely new tag is added to `_meta/tags.md` in the same edit that first uses it. See the Boundaries section there for overlapping terms.

## Naming

- Entries use readable titles, not slugs. English: Title Case, with `" - "` between title and subtitle; keep filenames under ~80 characters and put longer subtitles in `title`. Chinese: natural titles; full-width punctuation (`：，`) is fine.
- Sources: `YYYY-MM-DD_Type_Author_TitleInPascalCase[_RawTranscript].md` — sortable and greppable.
- Avoid characters that are illegal in file paths (`/ \ : * ? " < > |`); full-width `：` is allowed.

## Status

`draft` → structurally complete, awaiting an editorial read. `reviewed` → checked for placement, clarity, links, and source. Review a draft whenever you touch it; there is no schedule. When reviewing, prune the Related section: keep a link only if you can say why it's related in a few words — then write that why as its annotation — and cut the rest. To retire a page, either delete it (git keeps history) or replace its body with a one-line `Superseded by [[Target]]` notice.

## Processing the inbox

1. **Archive the source** under `06-Source-Library/<Type>/` with source frontmatter.
2. **Distill and write entries** from the matching template in `00-Templates/`, placed per the rules above, linking the source and related entries.
3. **Delete the inbox copy** and run `npm run check`; fix anything it flags.

The `process-inbox` skill walks through this. Keep raw sources; a Markdown source beyond ~1 MB is worth a moment's thought about splitting, but a stable source identity usually wins.

## The check

`npm run check` (also CI on every push) verifies exactly five things: wikilinks resolve, tags are registered, knowledge frontmatter is valid, every entry has a sourced Source section, and names/placement are sane. Fix violations before closing a change. Everything else — graph shape, heading wording, review cadence — is editorial judgment, not machinery.
