---
title: "Raw Source Policy"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-19"
status: "evergreen"
---

# Raw Source Policy

Raw sources remain in the vault for verification but are excluded from default knowledge browsing and graph views. They never count as knowledge entries.

## Classification

- `source-note` — curated extraction or ordinary archived source.
- `raw-transcript` — verbatim transcript; filter with `source_format: raw-transcript`.
- `raw-collection` — concatenated full-text collection containing multiple source units.
- `processing_status` — `unprocessed`, `processing`, `processed`, `superseded`, or `exempt`.

## Search behavior

Normal reader search should include:

`path:"01-Business-Strategy" OR path:"02-Social-Media-Strategy" OR path:"03-Tactics-and-Playbooks" OR path:"04-Frameworks-and-Mental-Models" OR path:"05-Intelligence-and-Research" OR path:"07-Articles" OR path:"Reports" OR file:"Home" OR file:"Home-ZH"`

Source-verification search should begin with:

`path:"06-Source-Library"`

The default graph uses the exact reader filter documented in [[Graph Views]]. Source traceability remains available as a separate graph/search mode.

The repeatable before/after proxy in [[Search Performance]] measures full-vault scanning against the exact reader scope. Regenerate it after large archive changes.

## Large-source thresholds

- Review every Markdown source larger than 1 MB.
- Split when a file exceeds 5 MB, creates measurable indexing delay, or has stable independent units that need direct linking.
- Consider a separate linked archive vault when raw sources exceed 250 MB or materially degrade startup/search performance.
- A retained large source requires `large_source: true` and `split_decision` metadata.

## Recorded split decisions

[[2026-07-13_Essays_PaulGraham_CollectedEssays]] remains a single `raw-collection` because derived pages depend on its stable source identity and splitting the collection into individual essay files would add navigation and maintenance cost. Reassess against the policy thresholds and generated [[Search Performance]] evidence if the source or its indexing behavior changes.

[[2026-07-13_Book_JamesDaleDavidsonWilliamReesMogg_TheSovereignIndividual_RawTranscript]] remains a single `raw-transcript` because chapter headings provide adequate internal navigation and a book-level source identity keeps citations stable. Reassess against the policy thresholds and generated [[Search Performance]] evidence if the source or its indexing behavior changes.
