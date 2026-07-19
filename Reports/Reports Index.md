---
title: "Reports Index"
type: "report-index"
domain: "reports"
lang: "en"
generated_on: "2026-07-19"
status: "generated"
---

# Reports Index

Reports are governed, dated syntheses derived from the wiki. They are first-class browsing and graph nodes, but they are not source material and do not replace the entries from which they were synthesized.

## Browse reports

### Active reports

#### English

| Report | Generated | Status | Derived collections | Owner |
|---|---|---|---|---|
| [[Reports/Creator and Personal Brand Businesses - Industry Handbook\|Creator and Personal Brand Businesses: An Industry Handbook]] | 2026-07-18 | draft | [[01-Business-Strategy/Business Strategy Index\|Business Strategy]]<br>[[02-Social-Media-Strategy/Social Media Strategy Index\|Social Media Strategy]]<br>[[03-Tactics-and-Playbooks/Tactics and Playbooks Index\|Tactics and Playbooks]]<br>[[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index\|Frameworks and Mental Models]]<br>[[05-Intelligence-and-Research/Intelligence and Research Index\|Intelligence and Research]]<br>[[06-Source-Library/Source Library Index\|Source Library]] | stanley-lu |
| [[Reports/How In-Person Training Businesses Really Work\|How In-Person Training Businesses Really Work]] | 2026-07-18 | draft | [[01-Business-Strategy/Business Strategy Index\|Business Strategy]]<br>[[03-Tactics-and-Playbooks/Tactics and Playbooks Index\|Tactics and Playbooks]]<br>[[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index\|Frameworks and Mental Models]]<br>[[05-Intelligence-and-Research/Intelligence and Research Index\|Intelligence and Research]]<br>[[06-Source-Library/Source Library Index\|Source Library]] | stanley-lu |
#### 中文

_None._
### Superseded reports

#### English

_None._
#### 中文

_None._
## Report contract

Every report declares:

- `generated_on` — the immutable date of the synthesis snapshot;
- `derived_from` — links to the governed collections or pages used to create it;
- `supersedes` — links to earlier report snapshots it replaces, or an empty list;
- `owner` — the accountable editor; governed reports must not be ownerless;
- `status` — `draft`, `reviewed`, or `superseded`.

Reports move from `draft` to `reviewed` after their structure, navigation, and provenance links are checked. A materially regenerated synthesis becomes a new dated file, links the prior snapshot through `supersedes`, and leaves the prior report available with `status: superseded`. A correction that does not change the synthesis date may be made in place. Reports do not become `evergreen`: `generated_on` is a snapshot date, not a freshness claim.

## Navigation and traceability

Reports appear in the default reader graph and the source-traceability graph. Each report links back here and to its governed derivation roots. Source records remain in [[06-Source-Library/Source Library Index|Source Library]]; a report should link the specific underlying entries or source records when finer-grained traceability is needed.
