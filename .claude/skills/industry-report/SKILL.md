---
name: industry-report
description: >-
  Study one industry at a time through THE WIKI: read everything the vault
  contains about the given industry, synthesize a comprehensive business
  analysis, and file it as a dated report in Reports/ (indexed, checked,
  committed, pushed). Use whenever the user asks for an industry report,
  industry deep-dive, or "learning session" on a business type — the industry
  is passed as the argument (e.g. "/industry-report yoga studios").
---

# Industry Report

The industry to study is given as the skill argument. It should name a business
type, ideally with a one-sentence definition and representative examples (e.g.
"in-person training businesses — businesses where the primary product is the
owner's expertise delivered directly to clients: personal trainers, yoga
teachers, tutors, music teachers…"). If no industry was provided, ask the user
for one before doing anything else.

Immerse yourself in THE WIKI and develop a thorough understanding of its
structure, content, and knowledge base.

This is a business learning exercise where we study one industry at a time by
synthesizing everything THE WIKI contains about it. For the chosen industry,
identify and read all relevant material across THE WIKI, including linked
notes, source documents, transcripts, articles, books, research, and any other
supporting resources.

## The analysis

After reviewing all relevant material, produce a comprehensive analysis of the
industry, including:

- How these businesses typically operate
- Common business models and pricing strategies
- Customer acquisition channels
- Retention and referral mechanisms
- Operational workflows
- Growth paths from solo practitioner to larger business
- Common challenges and constraints
- Recurring patterns, principles, and best practices found across the source
  material
- Contradictory viewpoints or strategies, where applicable

Focus on extracting timeless business principles and industry-specific insights
rather than summarizing individual sources. Synthesize the information into a
cohesive understanding of how the industry works.

## Completion steps

1. Save the analysis in `Reports/` with a descriptive title, following
   `Vault Conventions.md` — start from `00-Templates/Report-Template.md`,
   state the synthesis date in the opening line, and end with a
   "Sources in THE WIKI" section linking the entries and source records most
   material to the synthesis.
2. If this report replaces an earlier report on the same industry, add a
   one-line "Superseded by [[this report]]" notice at the top of the old one.
3. Add one line for the new report at the top of `Reports/Reports Index.md`,
   with the date.
4. Run `npm run check` from the vault root, fix anything it flags, then commit
   and push.
