---
title: "Graph Views"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-13"
status: "evergreen"
---

# Graph Views

Obsidian's default global graph is configured as the knowledge-only view. The filters below are the portable definitions for recreating or bookmarking both intended graph modes.

## Knowledge-only graph

Filter:

`-path:"06-Source-Library" -path:"00-Templates" -path:"_meta" -path:"_Inbox"`

Use this for browsing distilled knowledge. Color groups correspond to the five main knowledge domains and articles.

## Source-traceability graph

Filter:

`path:"06-Source-Library" OR path:"01-Business-Strategy" OR path:"02-Social-Media-Strategy" OR path:"03-Tactics-and-Playbooks" OR path:"04-Frameworks-and-Mental-Models" OR path:"05-Intelligence-and-Research"`

Use this for source coverage and orphan investigation. Enable arrows and keep source nodes visible. Save it as a graph bookmark named **Source traceability** in Obsidian; bookmarks are workspace/user state and are intentionally not treated as portable vault architecture.

The complete named portable preset is stored at `.obsidian/graph-source-traceability.json`. Obsidian only auto-loads `.obsidian/graph.json`, so the active global graph remains knowledge-only; use the preset as the authoritative configuration when recreating the **Source traceability** workspace/bookmark.
