---
title: "Editorial Governance"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
owner: "stanley-lu"
---

# Editorial Governance

This page assigns stewardship, defines the full knowledge lifecycle, and specifies capacity-aware review queues. The generated [[Editorial Dashboard]] is the operational view; this page is the durable policy.

## Stewardship

`stanley-lu` is the current accountable vault maintainer. A future team may replace this assignment with named domain specialists, but every domain and queue must always resolve to one active steward.

| Domain or surface | Steward |
|---|---|
| Business Strategy | `stanley-lu` |
| Social Media Strategy | `stanley-lu` |
| Tactics and Playbooks | `stanley-lu` |
| Frameworks and Mental Models | `stanley-lu` |
| Intelligence and Research | `stanley-lu` |
| Source Library | `stanley-lu` |
| Articles | `stanley-lu` |
| Reports | `stanley-lu` |
| Taxonomy and architecture | `stanley-lu` |

## Lifecycle states

| State | Meaning | Presented as current knowledge? | Next action |
|---|---|---:|---|
| `draft` | Structurally valid but awaiting editorial review | Yes, marked draft | Review, merge, or retire |
| `reviewed` | Structurally and editorially reviewed | Yes | Review when due |
| `evergreen` | Intentionally maintained cornerstone | Yes | Priority recurring review |
| `deprecated` | Still useful for historical context but no longer preferred | No | Link a preferred replacement or archive |
| `superseded` | Replaced by a newer page or artifact | No | Require `replaced_by` and forward readers |
| `replaced` | Kept only as a forwarding shell after a merge or rename | No | Require `replaced_by`; contain no competing guidance |
| `archived` | Retained for provenance or history; no active maintenance | No | Exclude from active indexes |

Allowed transitions are:

```text
draft → reviewed → evergreen
draft|reviewed|evergreen → deprecated → archived
draft|reviewed|evergreen|deprecated → superseded → replaced|archived
replaced → archived
```

Returning an archived or replaced page to an active state requires a new review and a recorded architecture decision. Active indexes must show only `draft`, `reviewed`, and `evergreen` pages; retirement views show the other states separately.

## Supporting-surface lifecycle

Supporting pages do not pass through the knowledge or report lifecycle. The machine-readable schema owns each page type's allowed status and required metadata; this policy explains how those states are used.

| State | Supporting surfaces | Operating rule |
|---|---|---|
| `evergreen` | Curated homes and maps, conventions, source and Inbox indexes, and versioned workflows | Maintain deliberately, update `updated` after a structural change, and preserve an accountable owner where the page contract requires one |
| `generated` | Deterministic registries, inventories, indexes, dashboards, and review snapshots | Regenerate from source metadata and links; carry `generated_on`; never hand-edit counts or queues |
| `historical` | Frozen governance snapshots retained as evidence | Require `snapshot_on`, link current policy or generated status views, and do not present the snapshot as current guidance |

Allowed supporting transitions are `evergreen → historical`, `generated → generated|historical`, with `historical` terminal. Templates are blueprints governed by template contracts and placeholder validation, not editorial pages to promote through a lifecycle.

Generated inventories and dashboards may supplement reader navigation, but they do not replace curated Home, domain maps, subdomain maps, or deliberate cross-links. They are excluded from curated-reader and organic-inbound credit even when a generated index remains available as a portable fallback.

## Replacement and forwarding

- `deprecated` pages should declare `replaced_by` when a preferred alternative exists.
- `superseded` and `replaced` pages must declare exactly one resolvable `replaced_by` target.
- A forwarding page retains its old filename, title, and aliases for retrieval, starts with a visible `Superseded by [[Target]]` notice, and contains no duplicate current guidance.
- A renamed page preserves the former filename or title as an alias. If a physical forwarding page is retained, it uses `status: replaced`.
- Generated active indexes and MOCs must not present retired pages as current. They may include a clearly separated retired-items section.

## Queue ownership

| Queue | Owner | Ordering |
|---|---|---|
| Inbox and source processing | `stanley-lu` | Oldest unprocessed first |
| Draft review | `stanley-lu` | Priority, age, then domain |
| Recurring review | `stanley-lu` | Overdue days, priority, then inbound role |
| Translation pairs | `stanley-lu` | Explicit candidate priority, then age |
| Deprecation and replacement | `stanley-lu` | Broken forwarding first, then oldest decision |
| Taxonomy approval | `stanley-lu` | Proposed terms before synonym/merge review |
| Architecture maintenance | `stanley-lu` | Failed gates before warnings |

## Capacity-aware review schedule

Review dates are derived; editors do not manually maintain a universal 30-day deadline.

1. Assign each page a `review_priority`: `critical`, `high`, `normal`, or `low`. When absent, generators derive `normal`; series hubs, domain maps, source manifests, and high-inbound evergreen pages derive `high`.
2. Within each domain, sort drafts by priority, then `date_added`, then title.
3. Allocate the schema-defined `editorial_governance.weekly_draft_capacity_per_domain` within each domain and weekly review cycle. A page's `review_due` is the end of the first cycle with available capacity, starting seven days after creation.
4. Use the schema-defined `lifecycle.knowledge.review_intervals_days` for recurring review. `archived` and `replaced` pages have no recurring due date after forwarding validation passes.
5. `critical` work moves to the current cycle; `high` moves one cycle earlier; `low` moves two cycles later. Capacity displacement must remain visible rather than silently deleting another page's due date.

The schema is the single numeric source of truth. The generated dashboard must calculate and expose queues by owner, domain, age, priority, lifecycle state, and due date, including capacity overflow per weekly cycle; governance prose must not copy live counts or independently redefine queue thresholds.

## Acceptance rules

- Every domain and queue has exactly one active steward/owner.
- `superseded` and `replaced` pages have a valid `replaced_by` target.
- Active navigation excludes retired lifecycle states.
- Review due dates are reproducible from metadata and this policy.
- Queue generation never changes source metadata merely to make capacity targets pass.
