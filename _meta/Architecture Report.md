---
title: "Architecture Report"
type: "governance"
domain: "meta"
lang: "en"
generated_on: "2026-07-19"
status: "generated"
---

# Architecture Report

Generated from canonical vault frontmatter, `_meta/vault-schema.yaml`, and `_meta/taxonomy-registry.json` by `node tools/generate-architecture-report.mjs`. Counts never come from generated indexes or dashboards. Do not hand-edit metrics.

## Gate status

- Canonical vault check: **PASS**
- Blocking contract violations: **0**
- Validator warnings: **0**
- Markdown pages: **637**
- Knowledge pages: **469** total; **469** active
- Canonical source records: **107**
- Source attachments: **58**
- Governed taxonomy terms: **242**
- Active topic terms: **153**
- Zero organic-inbound active knowledge pages: **0**
- Draft review queue: **282**
- Recurring reviews currently due: **0**
- Unprocessed sources: **0**

## Coverage gates

| Gate | Direct result |
|---|---:|
| Canonical source IDs unique | 107/107 |
| Structured source references resolve | 650/650 |
| Active knowledge graph components | 1 |
| Active reader pages unreachable from a home | 0 |
| MOC conceptual coverage | 278/278 |
| Governed leaf inventories | 33 |
| Canonical taxonomy registry | loaded and validated |

| Home | Unreachable active reader pages |
|---|---|
| Home-ZH.md | 0 |
| Home.md | 0 |

## Canonical check findings

_None._

## Pages by type

| Type | Pages |
|---|---|
| [missing] | 1 |
| article | 10 |
| article-index | 1 |
| conventions | 1 |
| domain-index | 5 |
| framework | 203 |
| governance | 13 |
| inbox-index | 1 |
| playbook | 109 |
| report | 2 |
| report-index | 1 |
| research | 11 |
| series-entry | 18 |
| series-hub | 2 |
| source | 106 |
| source-index | 1 |
| source-manifest | 1 |
| strategy | 116 |
| subdomain-index | 9 |
| taxonomy-registry | 1 |
| template | 21 |
| topic-index | 1 |
| vault-home | 2 |
| workflow | 1 |

## Knowledge by domain

| Domain | Pages |
|---|---|
| articles | 10 |
| business-strategy | 119 |
| frameworks-and-mental-models | 203 |
| intelligence-and-research | 11 |
| social-media-strategy | 17 |
| tactics-and-playbooks | 109 |

## Knowledge by language

| Language | Pages |
|---|---|
| en | 395 |
| zh | 74 |

## Knowledge by lifecycle state

| State | Pages |
|---|---|
| draft | 282 |
| reviewed | 182 |
| evergreen | 5 |
| deprecated | 0 |
| superseded | 0 |
| replaced | 0 |
| archived | 0 |

## Source records by format

| Source format | Records |
|---|---|
| manifest | 1 |
| raw-collection | 1 |
| raw-transcript | 60 |
| source-note | 45 |

## Source processing lifecycle

| Processing state | Records |
|---|---|
| unprocessed | 0 |
| processing | 0 |
| processed | 107 |
| superseded | 0 |
| exempt | 0 |

## Knowledge-source roles

- Structured source references: **650** across **469** knowledge pages.
- Knowledge pages with multiple sources: **92**.
- Source locators: **158**.
- Canonical source records with no knowledge-page reference: **6**.

| Role | References |
|---|---|
| primary | 469 |
| supporting | 181 |
| contrasting | 0 |
| example | 0 |
| background | 0 |

## Source library by collection

| Collection | Source records | Attachments | Knowledge references |
|---|---|---|---|
| Books | 40 | 8 | 310 |
| Conversations | 2 | 0 | 46 |
| Courses | 2 | 49 | 19 |
| Diagrams | 1 | 0 | 2 |
| Essays | 1 | 0 | 25 |
| Podcasts | 12 | 0 | 55 |
| Presentations | 2 | 1 | 16 |
| Videos | 47 | 0 | 177 |

## Taxonomy lifecycle states

| State | Terms |
|---|---|
| proposed | 0 |
| active | 242 |
| deprecated | 0 |
| merged | 0 |

## Structured relationship types

| Relationship | Edges |
|---|---|
| prerequisite | 23 |
| is-prerequisite-for | 23 |
| applies | 529 |
| is-applied-by | 529 |
| example | 41 |
| has-example | 41 |
| replaces | 0 |
| replaced-by | 0 |
| derives-from | 90 |
| has-derivative | 90 |
| contrast | 4 |
| translation | 0 |
| related | 2004 |

## Review scheduling

| Signal | Direct result |
|---|---:|
| Capacity-scheduled drafts | 282 |
| Draft allocation cycles | 33 |
| Recurring lifecycle reviews | 187 |
| Recurring reviews currently due | 0 |

Review counts come from the schema-defined lifecycle intervals, priorities, ownership, and weekly capacity through the shared review scheduler.

## Readability structure

| Signal | Knowledge pages |
|---|---:|
| Contains a Markdown table | 45 |
| Contains Mermaid | 3 |
| Contains an Obsidian callout | 1 |
| At least 900 words with no H3 | 111 |

## Enforcement

`node tools/check-vault.mjs` remains the canonical release gate. This report is a deterministic read model over the same schema and structured metadata; it does not define a parallel contract. Regenerate with `node tools/generate-architecture-report.mjs` and verify freshness with `node tools/generate-architecture-report.mjs --check`.
