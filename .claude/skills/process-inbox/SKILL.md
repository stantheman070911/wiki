---
name: process-inbox
description: >-
  Process raw source material into THE WIKI knowledge vault, following its
  conventions (placement, tags from _meta/tags.md, source links, graph wiring,
  the npm run check gate, commit and push). Use this whenever the user drops a
  transcript, article, book, PDF, podcast, video, course, or notes into
  `_Inbox/` and wants it distilled into entries — and any time they say
  "process the inbox", "process the next inbox items", "add this to THE WIKI",
  "distill this source", "turn this transcript into an entry", or "file this
  source", even if they don't name the inbox explicitly.
---

# Process Inbox → THE WIKI

THE WIKI turns raw sources into lasting, findable knowledge. Raw material lands
in `_Inbox/`; your job is to distill each item into one or more **entries**,
archive the original, and leave every related artifact — indexes, maps, tags,
links — synchronized, so a problem gets solved once, not repeatedly.

A batch is not finished when the entries exist. It is finished when nothing
else in the vault still needs updating because of them.

## Before you touch anything

Read `Vault Conventions.md` — the single rulebook (placement, frontmatter,
entry shape, tags, naming). The tag vocabulary is `_meta/tags.md`.

Then list `_Inbox/` (ignore `Inbox Index.md` — it is the folder's README, not
an item) and give the user a **one-line plan per item**: proposed entry
title(s), destination folder, and any existing entry you'll update instead of
duplicating. Wait for a nod if anything is ambiguous, then proceed.
Announce: "Using the process-inbox skill."

Before writing, search the vault for near-duplicates of each planned title.
`npm run check` fails on any two notes sharing a basename, vault-wide, and
entry titles are long and similar — this is the most common way a large batch
breaks at the end.

## The workflow, per source item

### 1. Archive the source

Start from `00-Templates/Source-Template.md`. File the original under
`06-Source-Library/<Type>/` (`Books`, `Podcasts`, `Videos`, `Courses`,
`Conversations`, `Essays`, `Diagrams`, `Presentations`), named
`YYYY-MM-DD_Type_Author_TitleInPascalCase[_RawTranscript].md`. A large
structured course may get its own named subfolder under `Courses/` with a
manifest note.

Keep the raw text, but scrub artifacts that pollute the vault: strip stray `#`
characters that Obsidian would render as false tags (`#moziation`,
`#keenanpeeps`, OCR debris like `#L`), and drop garbage lines from bad
extraction. The check cannot see these; they have needed cleanup commits twice.

### 2. Distill and write entries

Extract the reusable ideas, frameworks, tactics, and notable examples; discard
filler. **Condense, don't summarize** — an entry must be usable without the
source. One idea-cluster per entry; split a dense source into several entries.
If an entry for the idea already exists, **update it** instead of duplicating —
and say so in the commit message.

Start from `00-Templates/Entry-Template.md` (or `Entry-Template-ZH.md` for a
Chinese entry). Follow the shared spine: summary → context → core material →
application → Related → Source.

- **Placement:** per `Vault Conventions.md`. In `01`, `03`, and `04`, entries
  go in a sub-topic folder — never loose in the domain root. If a sub-topic
  folder is well past ~25 entries and the new material forms a coherent
  cluster, raise splitting it with the user rather than splitting unasked.
- **Frontmatter:** `lang`, `tags`, `status: draft`, `updated` (today).
- **Tags:** reuse terms from `_meta/tags.md`; every tag must exist there. A
  genuinely new tag is added to `_meta/tags.md` in the same change — under the
  right facet section, and with a line in its **Boundaries** section whenever
  it sits close to an existing term (`topic/investing` vs
  `topic/money-management`, `person/jl-collins` vs `person/jim-collins`). No
  near-synonyms of existing tags.
- **Source section:** the heading must be one the check recognizes —
  `## Source reference` (EN) or `## 來源` (ZH) — containing a wikilink to the
  archived source record, or an explicit "no source" marker.

### 3. Wire it into the graph

New entries must not land as orphans. `npm run check` does not test for this;
it is the step that keeps THE WIKI navigable.

- **Subdomain map:** where the sub-topic folder has a `… Map.md` (about half
  of them do — all of `04` except two, plus a few in `01` and `03`), add each
  new entry to the right conceptual cluster in it. Where there is none, the
  domain index is the navigation surface; don't create a map unasked.
- **Domain index:** update the `… Index.md` only when the batch changes how
  the domain should be navigated — a new guided path, a new series, a
  cornerstone worth putting in Start here. The entry tables themselves are
  Dataview-generated and need no manual edit.
- **Reciprocal links:** for every wikilink you add in a new entry's Related
  section, add the return link from the existing entry. A batch of ten entries
  normally means a dozen or more one-line edits to established pages.
- **Cross-language pairs:** if the entry has a true counterpart in the other
  language, link both directions.
- **Source Library:** add a manifest line only for a collection archived as its
  own subfolder; individual sources appear via Dataview.

### 4. Clean up and check

Delete each processed item from `_Inbox/` — its signal now lives in entries and
the raw copy is preserved in `06-Source-Library/`. Leave `Inbox Index.md` in
place. Then run, from the vault root:

```bash
npm run check
```

It must pass with zero violations. Fix whatever it flags before going on.

### 5. Sweep for consistency, then commit and push

Before committing, verify nothing else in the vault is now stale because of
this batch: index and map files, `_meta/tags.md`, backlinks from entries you
touched, any Home or series page that lists what you changed. The check
verifies links resolve — not that the knowledge base still reads as one
consistent whole. That part is yours.

Then commit and push. Write the message the way the vault's history does: a
one-line subject naming the sources, then a body covering what was distilled
and where, anything folded into an existing entry instead of a new one, tags
registered (with their boundary notes), how the entries were wired in, and the
check's final counts.

```
Process JL Collins' The Simple Path to Wealth from the inbox

Distill the book into six entries: the four-step financial independence
playbook in 03/Wealth-and-Skill-Building, plus the market-behaviour and
opportunity-cost models in 04.

Add topic/investing, person/jl-collins, and source/the-simple-path-to-wealth
to the tag vocabulary, with boundary notes separating investing from
money-management and JL Collins from Jim Collins.

Wire the new entries into the Decision Making and Risk and Mindset and
Identity maps, add a financial-independence guided path to the Tactics
index, and add reciprocal links from six existing entries.

npm run check passes: 730 pages, 7673 links, 284 tags.
```

## Worked example (shape, not a recipe)

Input: a raw YouTube transcript about premium pricing, dropped in `_Inbox/`.

1. Archive → `06-Source-Library/Videos/2026-07-12_Video_JaneDoe_WhyPremiumWins_RawTranscript.md`,
   stray `#` markers stripped.
2. Distill → one framework-shaped idea about anchoring on daily ritual.
3. Write → `01-Business-Strategy/Pricing-and-Offers/Ritual Anchoring - Price the Habit, Not the Occasion.md`
   with `lang: en`, `status: draft`, tags `[topic/pricing, topic/positioning, person/jane-doe]`,
   a Related section linking the existing Barbell Pricing and Aesop entries, and
   a `## Source reference` section linking the archived transcript.
4. Wire → Pricing-and-Offers has no map, so add the return links to Barbell
   Pricing and Aesop, and leave the Business Strategy index alone unless the
   entry changes how the domain should be read.
5. Delete the transcript from `_Inbox/` → `npm run check` passes → commit and push.
