---
type: "workflow"
domain: "meta"
tags: [meta]
---

# Process Inbox — reusable prompt

Paste the prompt below into a fresh Claude session (run from the vault root) to
triage and distill everything currently in `_Inbox/` into THE WIKI. It mirrors
the `process-inbox` skill (`.claude/skills/process-inbox/`, which auto-loads in
Claude Code); this file is the version-controlled, copy-pasteable copy for use
anywhere. Keep the two in sync if you change the workflow.

```text
Process the raw source material in `_Inbox/` into THE WIKI, following the vault's
conventions exactly. Read `Vault Conventions.md`, `_meta/Architecture Schema.md`, and
`_meta/Tags.md` first, then work through each item in `_Inbox/`.

For EACH source item:

1. ARCHIVE THE RAW SOURCE
   - File the original under `06-Source-Library/<Type>/` (Books, Podcasts, Videos, Courses,
     Conversations, Diagrams, Presentations — create a new type folder only if truly needed).
   - Name it `YYYY-MM-DD_Type_Author_TitleInPascalCase[_RawTranscript].md` (dated, greppable).
   - Add source frontmatter: title, type: source, domain: source-library, lang (en|zh),
     source_type, source_format, processing_status, author, date_archived, status: "source".

2. DISTILL SIGNAL → ENTRIES
   - Extract the reusable ideas, frameworks, tactics, and notable examples. Discard filler.
     Condense, don't summarize — an entry must be usable without reading the source.
   - Prefer generalizable frameworks/mental models over one-off facts.
   - One idea-cluster per entry. Split a dense source into multiple entries when warranted.
   - If an entry for this idea already exists, UPDATE it instead of creating a duplicate.

3. WRITE EACH ENTRY
   - Copy the matching template: `00-Templates/Entry-Template.md` (English source) or
     `Entry-Template-ZH.md` (Chinese source). One language per entry, matching the source.
   - Place it in the correct domain AND sub-topic folder (see the canonical placement rules
     in Vault Conventions; 01/03/04 require a sub-topic sub-folder — never leave an entry in a domain root).
   - Front matter: title, explicit type, domain, lang, tags, source block, date_added,
     updated (today), reviewed_on (blank), status: "draft".
   - TAGS: faceted and controlled. Every tag must already exist in `_meta/Tags.md` and carry a
     prefix — `topic/…`, `person/…`, `source/…`. Reuse existing tags; do NOT invent near-duplicates.
     If a genuinely new tag is unavoidable, add it to `_meta/Tags.md` first (with facet prefix).
   - Keep the canonical section headings (summary / source / related, plus the template's other
     sections as applicable). Chinese entries use the ZH template's headings.
   - LINK THE SOURCE with a real link, never a bare code-span: a wikilink for the archived .md note
     (`[[2026-07-08_Book_Author_Title]]`) or an angle-bracket link for an attachment
     (`[file.pdf](<../../06-Source-Library/…/file.pdf>)`).
   - Cross-link related entries with `[[wikilinks]]`; link a true cross-language counterpart if one exists.

4. CLEAN UP
   - Remove the processed item from `_Inbox/` (its signal now lives in an entry; raw copy is in 06).

FINALLY, across everything you changed:
   - Run `node tools/generate-topic-index.mjs`, then `node tools/audit-vault.mjs`. It MUST pass
     with zero errors. Resolve every error, and
     resolve warnings too (off-vocabulary/singleton tags, code-span source refs) — don't leave new ones.
   - Domain indexes and Home counts are Dataview-generated, so don't hand-edit index tables.

Before you start, give me a one-line plan per inbox item (proposed entries + destination folders +
which existing entries you'll update). Then proceed.
```
