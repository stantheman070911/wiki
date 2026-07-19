---
title: Drum-Buffer-Rope - Release Work at the Constraint's Pace
lang: en
tags:
  - topic/theory-of-constraints
  - topic/operations
  - topic/systems
  - topic/prioritization
  - topic/productivity
  - person/eliyahu-m-goldratt
  - person/jeff-cox
  - source/the-goal
status: draft
updated: 2026-07-18
---

# Drum-Buffer-Rope - Release Work at the Constraint's Pace

> **Up:** [[Home|Home]] → [[03-Tactics-and-Playbooks/Tactics and Playbooks Index|Tactics and Playbooks]] → [[03-Tactics-and-Playbooks/Operations-and-Productivity/Operations and Productivity Map|Operations and Productivity]]

## One-line summary
Let the constraint set the production rhythm, protect it and final delivery with time buffers, and tie material release to that rhythm so work-in-process cannot outrun throughput.

## Context
When work is released whenever a non-constraint becomes idle, the system fills with inventory, priorities collide, and the constraint still cannot produce more. Drum-Buffer-Rope synchronizes release and execution around the rate that actually governs output.

## Key insights
- **Drum:** the constraint's schedule is the beat for the system because it determines feasible throughput.
- **Buffer:** protection is measured in time or ready work, not a mandate to maximize inventory; it absorbs variation before the constraint and critical completion points.
- **Rope:** work release is linked to expected constraint consumption, preventing upstream resources from flooding the floor.
- **Buffer holes reveal risk early.** Missing work within the near-term buffer points to where intervention is needed before the constraint or shipment is starved.
- **Protection requires spare capacity.** Upstream non-constraints need enough reserve to replenish a buffer after disruption while continuing to feed current demand.

## Framework / model (if applicable)
1. **Schedule the drum:** sequence the constraint according to real demand and the system's priority rule.
2. **Size the buffers:** protect constraint work and final assembly with enough time for normal variation and recovery.
3. **Set the rope:** calculate material release by working backward from when the constraint will need each job.
4. **Monitor buffer status:** investigate holes that threaten the near-term zone; do not expedite every deviation.
5. **Adjust protection:** when demand, lead-time promises, or variability changes, rebalance release time, buffer size, and protective capacity.

## Tactics / how to apply
- Maintain a finite, sequenced queue before the constraint rather than releasing every available order.
- Calculate release dates from the constraint schedule plus observed upstream travel time; update them as actual jobs clear the constraint.
- Work backward from expected constraint completions to release non-constraint components so they meet at assembly without long waits.
- Escalate based on buffer penetration: first ask the relevant work center to do the endangered job next; break setups or add overtime only when the delivery risk justifies it.
- Distinguish urgent short-lead orders from normal orders and give each an explicit release horizon rather than silently shrinking all buffers.
- Recheck obsolete priority labels after the constraint moves; a rule that once protected flow may later distort it.

## Notable examples
Bearington used constraint data to predict when heat treatment and the NCX-10 would consume work, then released material so roughly three days of protection remained. The change cleared excess queues and made shipping dates predictable. Later, taking more orders without increasing protection reduced spare capacity and starved the constraints in waves, showing that buffers, lead-time promises, and protective capacity must be adjusted together.

## Relationships

- **Applies:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Demand or Supply|Demand or Supply - The One-Constraint Diagnosis, Three Functions, and the Ticking Time Bomb]]
- **Applies:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Dependent Events and Statistical Fluctuations - Why Balanced Capacity Fails|Dependent Events and Statistical Fluctuations - Why Balanced Capacity Fails]]
- **Applies:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Theory of Constraints - The Five Focusing Steps|Theory of Constraints - The Five Focusing Steps]]
- **Applies:** [[04-Frameworks-and-Mental-Models/Focus-Execution-and-Systems/Throughput Accounting - Manage the System, Not Local Costs|Throughput Accounting - Manage the System, Not Local Costs]]
## Source reference

- **primary:** [[06-Source-Library/Books/2026-07-18_Book_EliyahuMGoldrattJeffCox_TheGoal_RawTranscript|The Goal]]
