---
title: "Dependent Events and Statistical Fluctuations - Why Balanced Capacity Fails"
type: "framework"
domain: "frameworks-and-mental-models"
lang: "en"
tags:
  [
    topic/theory-of-constraints,
    topic/systems,
    topic/operations,
    topic/risk,
    person/eliyahu-m-goldratt,
    person/jeff-cox,
    source/the-goal
  ]
sources:
  - id: "SRC-0030"
    role: "primary"
date_added: "2026-07-18"
updated: "2026-07-18"
reviewed_on: ""
status: "draft"
parent_map: 04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Focus
  Execution and Systems Map
relationships:
  - type: is-applied-by
    target: 03-Tactics-and-Playbooks/Operations-and-Productivity/Drum-Buffer-Rope -
      Release Work at the Constraint's Pace
  - type: related
    target: 04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Theory of
      Constraints - The Five Focusing Steps
  - type: related
    target: 04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Throughput
      Accounting - Manage the System, Not Local Costs
  - type: related
    target: 07-Articles/Fix the Bottleneck, Not Everything
---

# Dependent Events and Statistical Fluctuations - Why Balanced Capacity Fails

> **Up:** [[Home|Home]] → [[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index|Frameworks and Mental Models]] → [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Focus Execution and Systems Map|Focus, Execution, and Systems]]

## One-line summary
In a dependent flow, normal variation accumulates downstream, so a perfectly balanced chain without protective capacity or buffers produces growing queues and missed commitments.

## Context
Planning often assumes that if every step has the same average capacity as demand, the whole system will meet demand. That ignores the interaction between dependency—one step must wait for another—and statistical fluctuation—actual output varies around the average.

## Key insights
- **Averages do not synchronize themselves.** A later step cannot process output that an earlier step failed to deliver, even if both have the same average rate.
- **Negative deviations accumulate; positive deviations are capped.** A downstream resource can lose time when starved, but it cannot use future extra capacity to recover if it is already balanced at full load.
- **The slowest effective step governs system throughput.** Faster work elsewhere mostly lengthens the queue rather than making the whole chain finish sooner.
- **Protective capacity is necessary.** Non-constraints need spare capacity to recover after disruptions and rebuild the buffer before the next disruption.
- **Inventory and capacity trade off.** More protective inventory gives upstream resources more recovery time; more protective capacity permits a smaller buffer and shorter lead time.

## Framework / model (if applicable)
For a chain of dependent steps:

1. Each step has a variable actual output around an average rate.
2. A shortfall at step A immediately limits step B because B cannot work on missing input.
3. If B has no spare capacity, later above-average output at A cannot erase B's lost time.
4. Repeated shortfalls accumulate as lateness before the constraint or waiting inventory elsewhere.
5. The system therefore needs a deliberate combination of constraint protection, spare non-constraint capacity, and controlled work release.

## Tactics / how to apply
- Map the dependency chain and identify where work can be starved, blocked, or forced to wait for a companion part.
- Measure variation and recovery time, not only average cycle time and nominal capacity.
- Avoid balancing every resource to 100% of forecast demand; preserve enough upstream capacity to restore depleted buffers.
- Place protection before the constraint and before synchronization points such as final assembly, then monitor for missing work rather than just total inventory.
- When lead-time promises tighten or demand rises, recalculate the buffer–capacity balance; yesterday's protection may no longer be sufficient.

## Notable examples
In the book's dice-and-match simulation, every station had identical average capacity, yet downstream output fell behind and inventory accumulated. The Boy Scout hike made the same mechanism visible: gaps opened and grew behind variable walkers until the slowest walker, Herbie, set the pace and the group reorganized around him.

## Relationships

<!-- generated from frontmatter relationships; do not edit by hand -->
- **Is applied by:** [[03-Tactics-and-Playbooks/Operations-and-Productivity/Drum-Buffer-Rope - Release Work at the Constraint's Pace|Drum-Buffer-Rope - Release Work at the Constraint's Pace]]
- **Related:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Theory of Constraints - The Five Focusing Steps|Theory of Constraints - The Five Focusing Steps]]
- **Related:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Throughput Accounting - Manage the System, Not Local Costs|Throughput Accounting - Manage the System, Not Local Costs]]
- **Related:** [[07-Articles/Fix the Bottleneck, Not Everything|Fix the Bottleneck, Not Everything]]
## Source reference

<!-- generated from frontmatter sources; do not edit by hand -->
- **primary:** [[06-Source-Library/Books/2026-07-18_Book_EliyahuMGoldrattJeffCox_TheGoal_RawTranscript|The Goal]]
