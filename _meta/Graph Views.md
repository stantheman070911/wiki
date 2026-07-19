---
title: "Graph Views"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
---

# Graph Views

Obsidian's default global graph is configured as the exact reader view. The filters below are the portable definitions for recreating or bookmarking both intended graph modes.

## Reader graph

Filter:

`path:"01-Business-Strategy" OR path:"02-Social-Media-Strategy" OR path:"03-Tactics-and-Playbooks" OR path:"04-Frameworks-and-Mental-Models" OR path:"05-Intelligence-and-Research" OR path:"07-Articles" OR path:"Reports" OR file:"Home" OR file:"Home-ZH"`

Use this for browsing the two governed entry points, distilled knowledge, navigation maps, articles, and governed synthesis. Color groups correspond to the five main knowledge domains, articles, and reports. Positive inclusion keeps README, conventions, tooling fixtures, templates, metadata, Inbox material, and source-library records outside the view by construction.

## Source-traceability graph

Filter:

`path:"06-Source-Library" OR path:"01-Business-Strategy" OR path:"02-Social-Media-Strategy" OR path:"03-Tactics-and-Playbooks" OR path:"04-Frameworks-and-Mental-Models" OR path:"05-Intelligence-and-Research" OR path:"07-Articles" OR path:"Reports"`

Use this for source coverage, report derivation, and orphan investigation. Enable arrows and keep source nodes visible. Save it as a graph bookmark named **Source traceability** in Obsidian; bookmarks are workspace/user state and are intentionally not treated as portable vault architecture.

The complete named portable preset is stored at `.obsidian/graph-source-traceability.json`. Obsidian only auto-loads `.obsidian/graph.json`, so the active global graph remains reader-only; use the preset as the authoritative configuration when recreating the **Source traceability** workspace/bookmark.
