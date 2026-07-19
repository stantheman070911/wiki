---
title: THE WIKI
lang: en
---

# THE WIKI

A centralized knowledge vault for business strategy, social media strategy, tactics, and frameworks — every useful lesson turned into lasting, searchable knowledge.

Chinese entry point: [[Home-ZH|THE WIKI 中文入口]] · Rules: [[Vault Conventions]] · Tag vocabulary: [[tags|Tags]]

## Sections

- [[01-Business-Strategy/Business Strategy Index|01 — Business Strategy]] — business models, positioning, pricing, growth, finance
- [[02-Social-Media-Strategy/Social Media Strategy Index|02 — Social Media Strategy]] — platform strategy, audience growth, content strategy
- [[03-Tactics-and-Playbooks/Tactics and Playbooks Index|03 — Tactics and Playbooks]] — step-by-step, repeatable how-tos
- [[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index|04 — Frameworks and Mental Models]] — reusable thinking tools
- [[05-Intelligence-and-Research/Intelligence and Research Index|05 — Intelligence and Research]] — observations, examples, research findings
- [[06-Source-Library/Source Library Index|06 — Source Library]] — archived source materials, by source type
- [[07-Articles/Articles Index|07 — Articles]] — composed, outward-facing essays
- [[Reports/Reports Index|Reports]] — dated syntheses generated from the wiki
- [[_Inbox/Inbox Index|Inbox]] — unprocessed material awaiting triage

## Major series

- [[01-Business-Strategy/100M-Scaling-Roadmap/$100M Scaling Roadmap Overview|$100M Scaling Roadmap]] — ten ordered scaling stages
- [[01-Business-Strategy/連鎖經營學-陳宗賢/連鎖經營學總覽|連鎖經營學]] — eight modules with a complete [[06-Source-Library/Courses/陳宗賢的連鎖經營學/連鎖經營學來源清單|source manifest]]

## Recently updated

```dataview
TABLE WITHOUT ID file.link AS "Page", status AS "Status", updated AS "Updated"
FROM "01-Business-Strategy" OR "02-Social-Media-Strategy" OR "03-Tactics-and-Playbooks" OR "04-Frameworks-and-Mental-Models" OR "05-Intelligence-and-Research" OR "07-Articles" OR "Reports"
WHERE updated
SORT updated DESC, file.name ASC
LIMIT 12
```

## Drafts

```dataview
TABLE WITHOUT ID file.link AS "Page", updated AS "Updated"
FROM "01-Business-Strategy" OR "02-Social-Media-Strategy" OR "03-Tactics-and-Playbooks" OR "04-Frameworks-and-Mental-Models" OR "05-Intelligence-and-Research" OR "07-Articles" OR "Reports"
WHERE status = "draft"
SORT updated ASC, file.name ASC
```

## Navigate

- **New entry** → duplicate [[00-Templates/Entry-Template|Entry-Template]] (English) or [[00-Templates/Entry-Template-ZH|Entry-Template-ZH]] (中文) into the right sub-topic folder
- **Unsure where it goes** → drop it in `_Inbox/` first; the `process-inbox` skill (or any Claude session reading [[Vault Conventions]]) files it
- **Find a topic** → Quick Switcher (`Cmd+O`), global search (`Cmd+Shift+F`), or the tag pane
- **Tag rules** → [[tags|_meta/tags.md]] — faceted vocabulary (`topic/` `person/` `source/`)
- **See how everything connects** → open Graph view from the left ribbon

> Dataview powers the two live tables above; everything else on this page is static links.

## Principles

- Condense, don't summarize — every entry should be usable without reading the source.
- Prefer frameworks and mental models over one-off facts — they generalize.
- Every entry links its archived source; bibliography lives on the source record.
- Update existing entries when better information arrives, rather than creating duplicates.
