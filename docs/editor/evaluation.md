# Browser editor evaluation

Pages CMS is the best first candidate for making this site's article editing easier. It can provide a list of articles, separate metadata fields, and image uploads while leaving Zola, Markdown files, Git history, and page addresses in place. Decap becomes more attractive if a formal editorial review queue is needed. The current GitHub forms remain useful after the reliability fixes.

This is a configuration-level evaluation, based on documentation accessed on 8 September 2026. The [pilot configuration](pages-pilot.yml) is ready for an isolated repository trial; it is not an activated production editor. No account connection, hosted save, or authenticated media upload has been performed.

| Requirement | Pages CMS assessment | Remaining evidence |
| --- | --- | --- |
| Preserve Zola TOML | Explicit `toml-frontmatter` and `+++` support | Save both existing Spanish articles and inspect the exact resulting diff. |
| Find and edit articles | Collection view with title/date and separate fields | Observe Francisco finding and correcting a paragraph. |
| Preserve existing URLs | Rename is disabled; filenames remain stable while editing | Change a title and verify the filename does not change. |
| Upload a cover | Repository media input and public output paths are configurable | Upload a photo, confirm its saved path and deployed responsive variants. |
| Preserve shortcode syntax | The pilot uses a Markdown code field instead of a rich-text conversion | Save a `media` block and an HTML image, verifying their contents and attributes. |
| Keep language files separate | The pilot excludes EN/IT files and section/draft templates | Verify the CMS's actual collection matching behavior before use. |
| Avoid unintended publication | New entries default to `draft = true` | Verify draft exclusion from pages, search, feeds, and translation output. |
| Protect reviewed translations | This is an automation requirement outside the editor | Existing automatic translation of Spanish edits can still overwrite target files; resolve that before production editor adoption. |

Pages CMS documents its [collection formats and exclusions](https://pagescms.org/docs/configuration/content/), [filename controls](https://pagescms.org/docs/configuration/content/filename/), [operation controls](https://pagescms.org/docs/configuration/content/operations/), and [media paths](https://pagescms.org/docs/configuration/media/). Its [code field](https://pagescms.org/docs/configuration/fields/code/) supports Markdown highlighting, and its [date field](https://pagescms.org/docs/configuration/fields/date/) supports an explicit `yyyy-MM-dd` output format. These capabilities support the proposed pilot; they do not prove hosted round-trip behavior.

The pilot intentionally covers only Spanish articles. It keeps category values as text because existing articles use both `REFLEXIONES` and title-case category values. It includes the publishing workflow's `source_issue` metadata as a hidden, read-only field. Verify preservation of unknown optional metadata as well; a CMS save must not silently remove fields it does not expose.

For new files, the filename template uses the chosen article date rather than the current calendar date. Existing filenames sometimes contain a date different from their publication metadata, so editing must not regenerate their names. Media uploads use randomized names to reduce accidental collisions, with a public path under `/images/articulos/uploads/` that the existing Zola image processing can resolve.

## Pilot acceptance scenario

Francisco finds a copied Spanish article, corrects a paragraph containing `###` headings, changes a quoted title, retains a `media` shortcode, uploads a replacement cover, and saves it. The generated site displays the complete intended text and cover at the same URL. Existing English and Italian files, other metadata, and source image originals remain intact. He then creates a draft, verifies that it is absent from the public output, and deliberately publishes it.

The first trial excludes rich-text conversion, galleries as editable nested objects, all other content collections, preview hosting, multiple editor roles, and a generator or hosting migration.

## Running the trial

1. Use an isolated copy of the repository with production deployment and automatic translation disabled. Copy `pages-pilot.yml` to `.pages.yml` there.
2. Connect that copy to Pages CMS using an account permitted to edit it. Review the actual repository access requested by the service.
3. Perform the acceptance scenario with copies of both existing articles, a quoted-title fixture, an image, and a new draft. Inspect the saved files and Git diff, including fields outside the form.
4. Build using Zola 0.21.0 and run the documented metadata/browser checks. Verify all existing page URLs still resolve.
5. Record where Francisco needs help, whether the editor changes shortcode syntax, and whether all unchanged fields survive. Adopt it only if it improves the real editing task and passes those checks.

Before production adoption, protect manually corrected translations, verify how CMS-authored commits trigger the existing workflows, and decide how failed saves/deployments are surfaced to the editor. The issue workflow's confirmation comments apply to issue-created content; they are not a status interface for CMS saves.

## Alternatives and decision

Improved GitHub forms have the lowest migration cost but still leave corrections and image replacement awkward. Decap supports [explicit TOML frontmatter](https://decapcms.org/docs/configuration-options/) and a [pull-request editorial workflow](https://decapcms.org/docs/editorial-workflows/), with additional [GitHub authentication setup](https://decapcms.org/docs/github-backend/). Choose it if draft review is the primary task rather than simple direct editing.

A custom admin application would require ownership of authentication, save conflicts, media management, validation, and recovery. The current evidence does not justify that maintenance burden. No subscription price is assumed for either product; select hosted versus self-hosted operation and verify current terms before adoption.

The decision is to trial Pages CMS for one Spanish article collection and keep the current publishing path operational. Live editor validation and translation-edit protection remain outstanding adoption work.
