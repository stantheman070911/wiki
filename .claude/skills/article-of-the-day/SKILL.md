---
name: article-of-the-day
description: >-
  Write, file, and deliver THE WIKI's daily "Article of the Day" — a 1–2 minute
  original synthesis of one especially valuable topic, drawn from multiple wiki
  sources, saved to 07-Articles/, indexed, checked, committed, pushed, and sent
  via Telegram. Use whenever the user (or the morning automation) says "article
  of the day", "write today's article", or asks for a daily article from THE
  WIKI.
---

# Article of the Day

Immerse yourself in THE WIKI and develop a thorough understanding of its
contents.

Before choosing a topic, review the examples in `07-Articles/`. Then select one
topic from the wiki that you consider especially valuable, interesting, or
worth revisiting.

Identify and read all relevant source material connected to that topic,
including linked notes, transcripts, articles, books, and any other supporting
documents. Synthesize the material into an original "Article of the Day."

## Requirements

- Aim for approximately 1–2 minutes of reading time.
- Draw on multiple sources rather than summarizing a single document.
- Emphasize timeless insights, enduring principles, and practical takeaways.
- Ensure every factual claim is supported by the underlying source material.
- Match the tone, clarity, and editorial quality of the examples in
  `07-Articles/`. Treat those examples as a standard of craft, not as
  structural templates.

## Structure

Let the idea determine the form.

Do not choose a structure before you understand what the article needs to say.
First identify the central insight, argument, tension, or question. Then choose
the form that communicates it most effectively.

A familiar arc such as contrarian hook → mechanism → analogy → synthesis →
exercise → maxim may be used when it genuinely suits the material, but it must
never be treated as a default template.

Valid forms include, but are not limited to:

- A narrative or case study sustained throughout the piece
- An argument developed from a concrete scene or example
- A question examined from several angles without a tidy resolution
- A direct explanation that trusts the reader
- A piece that ends on an open question or unresolved thought

Analogies, exercises, and closing aphorisms are optional. Include them only
when they materially strengthen the article. A strong article may contain none
of them.

Avoid allowing every article to converge on the same shape. If the form becomes
predictable, that is evidence that the structure was chosen before the message.
A daily reader should not be able to infer tomorrow's structure from today's.

## Completion steps

Once the article is complete and you are satisfied with its quality:

1. Save it in `07-Articles/`, following `Vault Conventions.md` — start from
   `00-Templates/Article-Template.md` (frontmatter with `lang`, `tags` from
   `_meta/tags.md`, `status: draft`, `updated`: today) and end with a
   "Sources in THE WIKI" section linking the entries you synthesized.
2. Add one line for it at the top of `07-Articles/Articles Index.md`.
3. Update every other artifact the article makes stale, so the knowledge base
   stays consistent: any new tag registered in `_meta/tags.md` (under the right
   facet, with a Boundaries note if it sits close to an existing term), the
   subdomain `… Map.md` or domain index if the article changes how a topic
   should be navigated, the link to the 中文版 if one exists, and links from any
   entry that should point back at the article.
4. Run `npm run check` from the vault root and fix anything it flags before
   committing.
5. Commit the changes to git and push to the remote repository.
6. Send the user a copy through the Telegram notify skill. Send the article as
   plain text: remove all Markdown syntax, including headings, asterisks, bold
   markers, and other formatting characters.
