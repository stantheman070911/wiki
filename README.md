# THE WIKI

A centralized knowledge vault for business strategy, social media strategy, tactics, and frameworks. THE WIKI turns every useful answer, lesson, framework, and decision into lasting, searchable knowledge — so problems get solved once, not repeatedly.

Source material (podcasts, articles, books, videos, courses, conversations) is filtered for signal, distilled into concise entries, and organized to be found and applied later. It is an [Obsidian](https://obsidian.md) vault, but every page is plain Markdown and readable without Obsidian.

> **New here?** Start with [`Home.md`](Home.md), then read [`Vault Conventions.md`](Vault%20Conventions.md) — the single rulebook.

## Structure

| Folder | Purpose |
| --- | --- |
| [`01-Business-Strategy/`](01-Business-Strategy/) | Business models, positioning, pricing, growth, ops, finance |
| [`02-Social-Media-Strategy/`](02-Social-Media-Strategy/) | Platform strategy, audience growth, distribution, content strategy |
| [`03-Tactics-and-Playbooks/`](03-Tactics-and-Playbooks/) | Repeatable execution steps, checklists, workflows |
| [`04-Frameworks-and-Mental-Models/`](04-Frameworks-and-Mental-Models/) | Reusable decision tools and thinking models |
| [`05-Intelligence-and-Research/`](05-Intelligence-and-Research/) | Observations, research, and examples not yet generalized |
| [`06-Source-Library/`](06-Source-Library/) | Archived source material, organized by source type |
| [`07-Articles/`](07-Articles/) | Outward-facing essays synthesized from multiple entries |
| [`Reports/`](Reports/) | Dated syntheses generated from the wiki |
| [`_Inbox/`](_Inbox/) | Unprocessed material awaiting triage |

Content flows one way: raw sources (`06`) → distilled entries (`01`–`05`) → composed syntheses (`07`, `Reports/`).

## How an entry gets created

1. Drop raw material in `_Inbox/`.
2. Archive the source under `06-Source-Library/`, distill the signal, and write entries from the templates in `00-Templates/` — condensed enough to be usable without the source.
3. Link related entries and the source record, tag from `_meta/tags.md`, and run the lint gate:

```bash
npm run check
```

The check verifies links resolve, tags are registered, frontmatter is valid, and every entry cites its source. It runs in CI on every push. Full rules: [`Vault Conventions.md`](Vault%20Conventions.md).
