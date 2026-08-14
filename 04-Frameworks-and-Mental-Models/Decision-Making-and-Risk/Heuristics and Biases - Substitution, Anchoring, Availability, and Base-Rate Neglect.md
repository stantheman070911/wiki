---
title: Heuristics and Biases - Substitution, Anchoring, Availability, and Base-Rate Neglect
lang: en
tags:
  - topic/cognitive-bias
  - topic/decision-making
  - topic/mental-models
  - topic/research
  - person/daniel-kahneman
  - source/thinking-fast-and-slow
status: draft
updated: 2026-07-26
---

# Heuristics and Biases - Substitution, Anchoring, Availability, and Base-Rate Neglect

> **Up:** [[Home|Home]] → [[04-Frameworks-and-Mental-Models/Frameworks and Mental Models Index|Frameworks and Mental Models]] → [[04-Frameworks-and-Mental-Models/Decision-Making-and-Risk/Decision Making and Risk Map|Decision Making and Risk]]

## One-line summary
The mind's shortcuts for hard questions are few in number, measurable in size, and immune to knowing about them — so the defence is procedural (base rates, blind estimates, regression), never introspective.

## Context
"Be aware of your biases" is useless advice, and the research says so: real-estate agents shown an arbitrary asking price were **just as anchored as students with no experience** — the only difference was that the professionals denied the influence. This entry is the catalogue of the main shortcuts with their measured magnitudes, so you can build procedures around them instead of relying on vigilance.

## Anchoring — the one bias you can measure

Anchoring has an index: the ratio of the shift in estimates to the difference between the anchors. **100% = you adopted the anchor wholesale; 0% = you ignored it.** Observed values cluster around 30–55%.

| Setting | Anchor | Index |
| --- | --- | --- |
| Height of the tallest redwood (1,200 ft vs 180 ft) | Plausible | 55% |
| Real-estate agents valuing an actual listed house | Plausible | 41% |
| Business students valuing the same house | Plausible | 48% |
| Donation to save Pacific seabirds ($5 vs $400) | Plausible | >30% |
| African nations in the UN, anchored by a **wheel of fortune** | Random | 44% |
| German judges' prison sentences, anchored by **loaded dice** | Random | 50% |

The decisive finding is the bottom two rows: **obviously random anchors work about as well as informative ones.** Anchors do not operate by being believed. Judges with fifteen years on the bench gave a shoplifter 8 months after rolling a 9 and 5 months after rolling a 3.

Commercially, this is why arbitrary rationing works. Campbell's soup at 10% off, with a shelf sign reading *limit 12 per person*, sold **7 cans per shopper — twice** what the same promotion sold with no limit.

## Substitution and the heuristics it produces

Every heuristic below is the same move: a hard question is silently replaced by an easier one.

- **Availability** — *"How frequent is X?"* becomes *"How easily do examples come to mind?"* Fluency, not frequency. Vivid, recent, and emotionally charged events get overweighted; a single dramatic failure reshapes a whole risk estimate.
- **Affect** — *"Is this a good idea?"* becomes *"How do I feel about it?"* Liking a thing makes you judge its benefits high and its risks low, which is why benefit and risk assessments are correlated in people's heads when they are uncorrelated in the world.
- **Representativeness** — *"How probable is this?"* becomes *"How much does it resemble the stereotype?"* This is what produces the conjunction fallacy (Linda is judged more likely to be a *feminist bank teller* than a *bank teller*) and, more expensively, base-rate neglect.

## Base-rate neglect and the law of small numbers

**Base-rate neglect:** given a vivid description of an individual, people discard the statistics of the class the individual belongs to. Told that most people don't help a stranger having a seizure, students still confidently predicted that *this* person on the video would help. Pallid statistical information loses every fight with a concrete impression.

**The law of small numbers:** we expect small samples to be as representative as large ones. Small samples produce extreme results more often, purely as arithmetic — which is why "the best schools are small schools" and similar findings evaporate on inspection, and why a two-week A/B test or a five-customer survey generates confident nonsense.

## Regression to the mean — the bias that manufactures false causes

The most operationally costly item on the list, because it invents causal beliefs out of noise.

Kahneman's Israeli Air Force instructors insisted that praise made cadets worse and screaming made them better: they had observed exactly that, repeatedly. Both observations were correct and the inference was entirely wrong. Instructors praised only unusually good runs and shouted only after unusually bad ones — and unusual performance regresses toward average regardless of what anyone says.

> Because we tend to be nice to other people when they please us and nasty when they do not, we are statistically punished for being nice and rewarded for being nasty.

Wherever an intervention is applied to an extreme — a struggling salesperson, a collapsing metric, a hot quarter — the next reading moves toward the mean and the intervention takes credit or blame it did not earn.

**The correction procedure for any prediction:**

1. Start with the **baseline** — the average outcome for the class this case belongs to.
2. Form your intuitive estimate from the case-specific evidence.
3. Estimate honestly how strongly that evidence actually correlates with the outcome.
4. Move from the baseline toward your intuition **by that fraction of the distance**. If the correlation is 0.3, go 30% of the way.

Intuitive predictions are as extreme as the evidence; corrected ones are not. That is the whole fix.

## Application

- **Never let anyone else's number arrive first.** Ask each participant for an independent written estimate before a group discussion, before seeing a supplier's quote, before hearing the seller's price. Anchoring is a first-mover advantage, and the only defence is sequencing.
- **When you must negotiate against an extreme anchor, don't counter — reject the frame.** Say the number is unacceptable as a basis for discussion and make the other side start over. Countering keeps you inside their range.
- **Write the base rate before you write the forecast.** What normally happens to businesses like this, hires like this, campaigns like this? Then adjust from it, by an amount proportional to how much your specific evidence really predicts.
- **Before crediting an intervention, ask whether the starting point was extreme.** If you changed something after an unusually bad month, expect improvement whether or not the change worked. Compare against a control or a long-run average, never against the trough.
- **Treat sample size as a first-class question in every test.** "It worked in the pilot" from a handful of customers is a statement about variance, not about the idea.
- **Distrust your risk estimates for anything vivid or recent.** After a dramatic failure — a churned marquee client, a security incident — your availability-driven estimate of recurrence will be far above the true rate. Check the record.

## Related

- **Related:** [[04-Frameworks-and-Mental-Models/Life-Leadership-and-Wellbeing/The Experiencing and Remembering Selves - Duration, Peaks, and Endings|The Experiencing and Remembering Selves]] — peak-end weighting and duration neglect show substitution inside remembered experience.
- **Prerequisite:** [[04-Frameworks-and-Mental-Models/Decision-Making-and-Risk/System 1 and System 2 - The Two-Character Model of Judgment|System 1 and System 2]] — the machinery that runs every substitution listed here.
- **Applied by:** [[04-Frameworks-and-Mental-Models/Decision-Making-and-Risk/The Outside View - Reference Classes Against the Planning Fallacy|The Outside View]] — base-rate neglect at project scale, with the remedy.
- **Applied by:** [[04-Frameworks-and-Mental-Models/Persuasion-and-Influence/Bend Their Reality - Loss, Fairness, Deadlines, and Anchors|Bend Their Reality]] — anchoring used deliberately in negotiation rather than suffered.
- **Related:** [[04-Frameworks-and-Mental-Models/Persuasion-and-Influence/Scarcity and Urgency - Engineering Demand with Supply and Deadlines|Scarcity and Urgency]] — the commercial machinery behind the *limit 12 per person* result.
- **Related:** [[04-Frameworks-and-Mental-Models/Persuasion-and-Influence/Weapons of Influence - Click-Whirr, Trigger Features, and the Contrast Principle|Weapons of Influence]] — Cialdini's contrast principle is anchoring seen from the persuader's side.
- **Related:** [[04-Frameworks-and-Mental-Models/Decision-Making-and-Risk/Learn How to Make Decisions Effectively - Expected Value, Levels, and Algorithms|Learn How to Make Decisions Effectively]] — the expected-value discipline these heuristics displace.
- **Contrast:** [[03-Tactics-and-Playbooks/Operations-and-Productivity/Triple-A Growth Sprints - Analyze, Ask, and Act|Triple-A Growth Sprints]] — read the law of small numbers before drawing conclusions from a short sprint.

## Source reference

- **primary:** [[06-Source-Library/Books/2026-07-26_Book_DanielKahneman_ThinkingFastAndSlow|Thinking, Fast and Slow]] — Part 2 (chapters 10–18): small numbers, anchors, availability, Tom W, Linda, regression, and taming intuitive predictions.
