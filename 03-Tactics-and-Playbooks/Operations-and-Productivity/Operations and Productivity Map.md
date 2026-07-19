---
title: "Operations and Productivity Map"
title_zh: "營運與生產力導覽"
type: "subdomain-index"
domain: "tactics-and-playbooks"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
owner: "stanley-lu"
---

# Operations and Productivity Map

> **中文名稱：** 營運與生產力導覽

Use this map for diagnosing operating problems, managing flow and constraints, standardizing work, running management cadences, and applying tools responsibly. Return to [[03-Tactics-and-Playbooks/Tactics and Playbooks Index|Tactics and Playbooks]].

## Start here

- [[Diagnose Problems to Get at Their Root Causes]] — separate symptoms from causes
- [[Drum-Buffer-Rope - Release Work at the Constraint's Pace]] — manage flow around the constraint
- [[Checklist Design - Pause Points, Killer Items, and Field Testing]] — standardize critical execution
- [[The OKR Operating Cycle - Set, Check In, Score, and Reflect]] — establish a recurring management loop
- [[Focus as Elimination - The Deep-Work Playbook]] — protect high-value work

## Conceptual clusters

### Diagnosis and improvement

- [[Design Improvements to Your Machine to Get Around Your Problems]]
- [[Diagnose Problems to Get at Their Root Causes]]
- [[Perceive and Don't Tolerate Problems]]
- [[The Algorithm - Musk's Five-Step Process Method]]
- [[The Customer-Base Test Kitchen - Distributed R&D Before Rollout]]
- [[Triple-A Growth Sprints - Analyze, Ask, and Act]]

### Constraints, time, and focus

- [[Do What You Set Out to Do]]
- [[Drum-Buffer-Rope - Release Work at the Constraint's Pace]]
- [[Focus as Elimination - The Deep-Work Playbook]]
- [[Know Thy Time - Record, Eliminate, and Consolidate]]
- [[工作習慣與誠實忠告]]

### Standards, checklists, and protocols

- [[Checklist Design - Pause Points, Killer Items, and Field Testing]]
- [[Make It Chimp-Proof - SOPs, Checklists, and Systematizing the Vital 20%]]
- [[Team Checklists - Communication Before Coordination]]
- [[Use Tools and Protocols to Shape How Work Is Done]]
- [[Using AI in Your Business - Train Like an Employee and the Department Playbook]]

### Management, governance, and rhythm

- [[Don't Overlook Governance]]
- [[Manage as Someone Operating a Machine to Achieve a Goal]]
- [[Meetings as Managerial Production]]
- [[The OKR Operating Cycle - Set, Check In, Score, and Reflect]]
- [[The Perfect Repeatable Week - Designing a Predictable Business Rhythm]]

## Capacity decision

This folder has a dedicated MOC because diagnosis, flow, standardization, and management cadence are distinct entry points. Keep one physical folder while the practices remain tightly connected; split only when a cluster has separate stewardship or sustained retrieval friction.

## Inventory

```dataview
TABLE WITHOUT ID file.link AS "Entry", type AS "Type", lang AS "Lang", tags AS "Topics", status AS "Status", updated AS "Updated"
FROM "03-Tactics-and-Playbooks/Operations-and-Productivity"
WHERE type != "subdomain-index"
AND contains(list("draft", "reviewed", "evergreen"), status)
SORT file.name ASC
```
