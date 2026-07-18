---
type: "vault-home"
title: "THE WIKI"
tags: [home]
---

# THE WIKI

A centralized knowledge vault for business strategy, social media strategy, tactics, and frameworks — every useful lesson turned into lasting, searchable institutional knowledge.

## Start here

1. **Choose the reader's job:** strategy, execution, reasoning, research, or synthesis.
2. **Open the matching domain map** below; use its curated path before the generated inventory.
3. **Follow relationships** inside an entry for prerequisites, applications, examples, contrasts, and translations.
4. **Verify provenance** through the linked source record or collection manifest.

Core architecture: [[Vault Conventions|editorial conventions]] · [[Architecture Schema|page types and validation rules]] · [[Topic-Index#All topics (154)|complete topic index]] · [[Portable Index|plugin-independent inventory]]

## Sections

- [[01-Business-Strategy/Business Strategy Index|01 — Business Strategy]] — business models, growth, ops, decision-making *(`$= dv.pages('"01-Business-Strategy"').where(p => ["strategy", "series-entry", "series-hub"].includes(p.type)).length` entries and hubs)*
- [[02-Social-Media-Strategy/Social Media Strategy Index|02 — Social Media Strategy]] — platform strategy, content strategy, growth tactics *(`$= dv.pages('"02-Social-Media-Strategy"').where(p => p.type == "strategy").length` entries)*
- [[03-Tactics-and-Playbooks/Tactics and Playbooks Index|03 — Tactics and Playbooks]] — step-by-step, repeatable how-tos *(`$= dv.pages('"03-Tactics-and-Playbooks"').where(p => p.type == "playbook").length` entries)*
- [[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index|04 — Frameworks and Mental Models]] — reusable thinking tools and mental models *(`$= dv.pages('"04-Frameworks-and-Mental-Models"').where(p => p.type == "framework").length` entries)*
- [[05-Intelligence-and-Research/Intelligence and Research Index|05 — Intelligence and Research]] — market/competitor intel, notable examples, research findings *(`$= dv.pages('"05-Intelligence-and-Research"').where(p => p.type == "research").length` entries)*
- [[06-Source-Library/Source Library Index|06 — Source Library]] — raw source materials and extraction notes, organized by source *(`$= dv.pages('"06-Source-Library"').where(p => ["source", "source-manifest"].includes(p.type)).length` records and manifests)*
- [[07-Articles/Articles Index|07 — Articles]] — composed, outward-facing pieces synthesized from multiple entries *(`$= dv.pages('"07-Articles"').where(p => p.type == "article").length` articles)*
- [[_Inbox/Inbox Index|Inbox]] — unprocessed material awaiting triage

**`Reports/`** — long-form analytical syntheses generated *from* the wiki (not source material feeding into it). These are downstream deliverables, not peer entries: intentionally kept outside the sub-topic taxonomy and the wikilink graph, with no inbound or outbound links to other vault pages. Provenance is noted in each report's own text rather than via links. Treat a report as a dated snapshot that may drift from the source entries it was synthesized from.

## Major series

- [[01-Business-Strategy/100M-Scaling-Roadmap/$100M Scaling Roadmap Overview|$100M Scaling Roadmap]] — ten ordered scaling stages
- [[01-Business-Strategy/連鎖經營學-陳宗賢/連鎖經營學總覽|連鎖經營學]] — eight modules with a complete [[06-Source-Library/Courses/陳宗賢的連鎖經營學/連鎖經營學來源清單|source manifest]]

## Recently added

```dataview
TABLE WITHOUT ID file.link AS "Page", type AS "Type", domain AS "Domain", date_added AS "Added"
WHERE contains(list("strategy", "playbook", "framework", "research", "article", "series-entry", "series-hub"), type)
SORT date_added DESC, file.name ASC
LIMIT 12
```

## Recently updated

```dataview
TABLE WITHOUT ID file.link AS "Page", type AS "Type", status AS "Status", updated AS "Updated"
WHERE contains(list("strategy", "playbook", "framework", "research", "article", "series-entry", "series-hub"), type)
SORT updated DESC, file.name ASC
LIMIT 12
```

## Cornerstone pages

Cornerstones are reviewed or evergreen knowledge pages with at least 12 inbound links, plus manually designated series hubs.

```dataview
TABLE WITHOUT ID file.link AS "Page", length(file.inlinks) AS "Inbound", type AS "Type", status AS "Status"
WHERE contains(list("strategy", "playbook", "framework", "research", "series-entry", "series-hub"), type)
AND (length(file.inlinks) >= 12 OR type = "series-hub")
SORT length(file.inlinks) DESC
```

## Editorial queues

The static [[Editorial Dashboard]] preserves these queues when Dataview is unavailable and adds zero-inbound, cornerstone, source, and architecture-maintenance views.

### Drafts

```dataview
TABLE WITHOUT ID file.link AS "Page", type AS "Type", domain AS "Domain", date_added AS "Added"
WHERE status = "draft" AND contains(list("strategy", "playbook", "framework", "research", "article", "series-entry"), type)
SORT date_added ASC
```

### Review due

```dataview
TABLE WITHOUT ID file.link AS "Page", type AS "Type", reviewed_on AS "Last reviewed"
WHERE (status = "reviewed" OR status = "evergreen") AND reviewed_on
SORT reviewed_on ASC
```

### Unprocessed sources

```dataview
TABLE WITHOUT ID file.link AS "Source", source_type AS "Type", author AS "Author", date_archived AS "Archived"
WHERE type = "source" AND processing_status = "unprocessed"
SORT date_archived ASC
```

## Navigate

- **New entry** → duplicate `00-Templates/Entry-Template.md` (English) or `Entry-Template-ZH.md` (中文) into the right sub-topic folder
- **Unsure where it goes** → drop it in `_Inbox/` first; see placement rules in [[Vault Conventions]]
- **Process the inbox** → paste [[Process-Inbox]] into Claude (or use the `process-inbox` skill)
- **Find a topic** → Quick Switcher (`Cmd+O`), global search (`Cmd+Shift+F`), or the tag pane
- **Browse every topic** → [[Topic-Index#All topics (154)|Topic Index — all 154 active topics]]
- **Bridge English and Chinese** → [[Topic-Index#Bilingual topics (83)|83 bilingual topics]]; monolingual topics remain visible in the complete index
- **Read taxonomy rules** → [[Tags]] — the governed, faceted vocabulary (`topic/` `person/` `source/`)
- **Browse sources and people** → [[Source and Author Index]] — author, person, source, and media-type facets
- **Use the portable inventory** → [[Portable Index]] — every knowledge page without a plugin dependency
- **Maintain the architecture** → [[Editorial Dashboard]] · [[Architecture Report]] · [[Maintenance Review]] · [[Architecture Program Status]] · [[Maintenance Schedule]]
- **See how everything connects** → open Graph view from the left ribbon

> Dataview powers optional live tables on Home and domain maps. Essential navigation remains available through curated links and the generated [[Portable Index]].

## Principles

- Condense, don't summarize — every entry should be usable without reading the source.
- Prefer frameworks and mental models over one-off facts — they generalize.
- Cite the source and date on every entry, and link it, for traceability.
- Update existing entries when better information arrives, rather than creating duplicates.

---
*Full conventions and structure: [[Vault Conventions]]*
