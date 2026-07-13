---
title: "Raw Source Policy"
type: "governance"
domain: "meta"
lang: "en"
updated: "2026-07-13"
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

Normal knowledge search should include:

`-path:"06-Source-Library" -path:"00-Templates" -path:"_meta"`

Source-verification search should begin with:

`path:"06-Source-Library"`

The default graph uses the knowledge-only filter documented in [[Graph Views]]. Source traceability remains available as a separate graph/search mode.

The repeatable before/after proxy in [[Search Performance]] measures full-vault scanning against the knowledge-only scope. Regenerate it after large archive changes.

## Large-source thresholds

- Review every Markdown source larger than 1 MB.
- Split when a file exceeds 5 MB, creates measurable indexing delay, or has stable independent units that need direct linking.
- Consider a separate linked archive vault when raw sources exceed 250 MB or materially degrade startup/search performance.
- A retained large source requires `large_source: true` and `split_decision` metadata.

## Current decision

[[2026-07-13_Essays_PaulGraham_CollectedEssays]] is approximately 3.3 MB. It remains a single `raw-collection` because 21 derived entries already depend on its stable source identity, it remains below the 5 MB split threshold, and splitting it into hundreds of essay files would add more navigational and maintenance cost than it removes. Reassess if indexing performance degrades or the file grows.

[[2026-07-13_Book_JamesDaleDavidsonWilliamReesMogg_TheSovereignIndividual_RawTranscript]] is approximately 1.0 MB. It remains a single `raw-transcript` because its chapter headings provide adequate internal navigation, it is well below the split threshold, and preserving one book-level source identity keeps citations stable. Reassess if the transcript grows or search performance changes.
