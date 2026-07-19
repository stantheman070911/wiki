---
title: "Process Inbox"
type: "workflow"
domain: "meta"
lang: "en"
tags: [meta]
updated: "2026-07-19"
status: "evergreen"
owner: "stanley-lu"
---

# Process Inbox

This is the portable launcher for inbox processing, not a second copy of the vault contract. The canonical rules live in:

- [[Vault Conventions]] for editorial intent and placement;
- [[Architecture Schema]] and `_meta/vault-schema.yaml` for page types, metadata, source IDs, relationships, lifecycle, and machine checks;
- `00-Templates/` for current page-type and language layouts;
- `_meta/taxonomy-registry.json` for the governed tag vocabulary;
- the `process-inbox` skill for the operational walkthrough when that local skill is available.

## Reusable prompt

```text
Process every item currently in `_Inbox/` into THE WIKI.

Before changing files, read `Vault Conventions.md`, `_meta/Architecture Schema.md`,
`_meta/vault-schema.yaml`, the relevant page templates, and the canonical taxonomy
registry. Give me a one-line plan per inbox item: proposed output pages, destination
folders, archived source record, and any existing page to update instead of duplicate.

For each approved item, archive the source under `06-Source-Library/`, allocate its
immutable source ID through the repository migration utility, and create or update the
smallest useful set of knowledge pages from the matching page-type/language templates.
Use structured source and relationship metadata, preserve provenance links, and let the
canonical generator render those body sections. Remove the processed Inbox copy only
after its archived source and derived knowledge are safely linked.

Finish by running `npm run check`. Resolve every violation before reporting completion.
Do not hand-edit generated registries, indexes, dashboards, or structured body sections.
```
