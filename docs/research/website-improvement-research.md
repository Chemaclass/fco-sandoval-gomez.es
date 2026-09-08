# Website improvement research

The best direction for Francisco Sandoval Gómez’s website is to keep its static architecture and make publishing, translation, discovery, and the presentation of architectural work more dependable. A new frontend framework is unlikely to solve the most valuable problems identified here. The current implementation already supports a distinctive portfolio, readable articles, three languages, and inexpensive static deployment.

The immediate priorities are concrete: prevent article text from being lost during form parsing, restore the translation service, report publishing status accurately, correct multilingual metadata, and make search and image viewing work reliably with a keyboard. A browser-based editor is a promising subsequent investment, especially because creating content currently has a form but editing it requires working directly with Markdown files.

The companion [prioritized ideas backlog](website-improvement-backlog.md) contains 32 independently scoped opportunities. Each includes an acceptance scenario and explicit non-goals. These are candidates for future work, not a commitment to implement the whole list.

## Basis and limits

The evidence covers repository revision `765e98c`, the public website, and documentation accessed on 8 September 2026. The default prioritization balances reader experience, easier publishing, and maintenance. The working audience assumptions are readers interested in architecture and heritage, potential professional collaborators or clients, and the person maintaining the content. Their relative commercial importance has not been established.

The review included content files, templates, CSS, browser JavaScript, GitHub issue forms, publishing and translation workflows, and the author guide. A local build using Zola 0.22.0 succeeded; production configuration pins 0.21.0, so the local build is not an exact reproduction of the deployment environment. Targeted in-memory examples reproduced publishing parser defects without submitting content or calling the translation API.

Live Chrome checks covered the Spanish homepage at 1440 and 390 CSS pixels, a Spanish article at 390 pixels, and the English article listing at 1440 pixels. The sampled routes had no horizontal page overflow or uncaught JavaScript exceptions. This is not a full accessibility certification, exhaustive device matrix, or measured Core Web Vitals assessment. Full-page captures can contain offscreen lazy-loading placeholders; those alone were not treated as broken images.

No private analytics, Search Console data, translation billing, workflow execution history, or editor interviews were available. Traffic gains, conversion improvements, publishing frequency, and actual production translation failures therefore remain unmeasured. Current provider documentation supports the retired-model finding, while the code establishes how failures would be handled.

## Existing strengths and inventory

| Area | Observed position | Implication |
| --- | --- | --- |
| Delivery | Zola, Tera templates, Sass, vanilla JavaScript, GitHub Pages | Preserve the small runtime and portable content. |
| Content | 2 original articles, 2 projects, 13 research entries, 46 external publications | Improve access to the existing archive; avoid elaborate filtering for the two-project portfolio. |
| Languages | 215 Markdown files: 75 Spanish/default, 70 English, 70 Italian, including sections, templates, and utility pages | Raw file count is not the number of original posts. Existing non-template content is substantially translated. |
| Generated output | Local build reported 198 pages and 14 sections; output contained 233 HTML files including pagination and redirects | Metadata defects affect many outputs despite the small number of original articles. |
| Images | 35 local raster/icon assets, 5,938,257 bytes in total | This excludes remote attachments and is not a per-visit transfer measurement. |
| Frontend payload | Generated CSS: 39,365 bytes; source main/search JavaScript: 8,845/9,232 bytes | Image and search payloads deserve more attention than a framework migration. |
| Search | Per-language generated indexes: ES 220,635 bytes, EN 322,415, IT 329,981, before transfer compression | The current client downloads an index on every page even when search is unused. |
| Foundations | Self-hosted fonts, skip link, focus styles, dark theme, Atom feeds, canonical URLs, JSON-LD, responsive image macros for remote images | Improve existing features instead of adding duplicates. |

The design already has an architectural identity: a drawing-led hero, blue and ochre palette, serif headings, and restrained content sections. A generic dashboard aesthetic, extensive animation, or a complete visual reset would add uncertainty without addressing a demonstrated need.

## Publishing and translation findings

### The form parser can silently truncate a post

**Verified, high priority.** In [.github/scripts/content-creator.js](../../.github/scripts/content-creator.js), `parseIssueBody` interprets every `###` heading as a form-field boundary. A body containing an introduction followed by `### Historia` produces `contenido: Introducción` and a separate `historia` property. The generator only publishes `contenido`, so the remainder can disappear. This directly conflicts with [GUIA.md](../../GUIA.md), which teaches authors to use third-level Markdown headings.

The first slice should make an article with ordinary headings and quoted text publish completely through the existing form. Parsing the form envelope must preserve the body as content. Include a regression example containing both ordinary headings and heading text that resembles a form label. A CMS is not required to fix this.

### Ordinary input can generate invalid content or overwrite an existing file

**Verified generator behavior, high priority.** Titles and several metadata fields are interpolated into TOML without complete serialization. The title `La casa "Azul"` generates invalid TOML. `formatDate('2026-99-99')` accepts an impossible date. Two entries with the same title and date produce the same filename, and the workflow uses `writeFileSync` without a collision guard.

Validate required fields and real dates, serialize TOML correctly, constrain output to the intended collection, reject accidental collisions, and build the proposed content before pushing it. Preserve a stable content identity for later edits. A retry of the same submission should be distinguishable from a different post with a colliding title. These checks protect the author’s work and the availability of the whole site.

### Translation uses a retired model

**Verified configuration and provider status, high priority.** Both publishing workflows and the translator default reference `claude-3-5-haiku-20241022`. Anthropic lists this model as retired on 19 February 2026 and states that requests to retired models fail. Its documented replacement in the retirement history should be checked again when implementation begins. No paid API request was made during this review. [1](https://platform.claude.com/docs/en/about-claude/model-deprecations)

Restore one short article’s Spanish-to-English/Italian path using a supported model and representative content. Keep the choice in one configuration location. Do not combine this repair with a provider abstraction, multiple model routing rules, or translation of the entire archive.

### Publication confirmation is ahead of reality

**Verified workflow logic, high priority.** In [.github/workflows/crear-contenido.yml](../../.github/workflows/crear-contenido.yml), a missing API key skips translation and translation exceptions are caught. The workflow can still commit Spanish content, dispatch deployment, close the issue, and say all three languages were published. Dispatching the build does not establish deployment success.

The author needs a truthful distinction between content saved, translations completed, and deployment completed. Report the resulting URL only after the relevant deployment succeeds, retain actionable errors, and provide a safe retry. Correlate confirmation with the actual commit or deployment so simultaneous submissions cannot receive misleading success messages. This does not require a new dashboard.

### Translation maintenance can lose edits or miss source changes

**Verified code paths, high priority for editorial consistency.** [.github/workflows/traducir-contenido.yml](../../.github/workflows/traducir-contenido.yml) compares only `HEAD~1` with `HEAD`, so a push containing multiple commits can omit earlier changed files. Deleted Spanish files are skipped without removing their translations. Concurrent content and translation jobs independently push to the same branch. These are failure paths, not claims that an observed production incident occurred.

The translator overwrites target files, has a fixed 4,096-token output limit, does not inspect completion status for truncation, and parses generated field markers with regular expressions. If translated markers cannot be recognized, the source text can be retained under a target-language filename. Markdown, shortcodes, links, and historical names need preservation checks.

Separate future slices should address multi-commit detection, protection of human corrections, and complete translation output. For correction protection, start with one source revision identifier and a simple rule for retaining reviewed translations. Rich translation management, glossaries across multiple scopes, and automatic mass retranslation can wait.

### Creation is easier than editing

**Verified author journey, medium priority.** Creation starts in a GitHub issue form, but editing and deleting require navigating repository files and committing changes. Galleries and media shortcodes add syntax that is hard to discover. The guide’s promise of automatic success and its suggestion to open a new issue after failure can encourage duplicate attempts.

First improve reliability and the guide together. Then observe the author create one article, correct it, and replace an image. Use that task to decide whether a browser editor is worth maintaining. Prefer a single Spanish article collection as the first editor slice, leaving existing translation files and URLs intact.

## Visitor experience and accessibility

### Search exists, but its relevance and interaction are limited

**Verified code and live interaction.** Search matches a lowercased contiguous string against title and description only. It excludes body text and does not normalize accents. Section bonuses of 20 for articles and 10 for projects outweigh the title-versus-description score of 2 or 1. Consequently, category preference can dominate relevance.

The keyboard listener is attached to the search input. Arrow Down moves focus into the first result, after which subsequent arrow events no longer reach that listener. This was reproduced live. Loading and index-fetch failure also have no explicit feedback. Fix keyboard interaction and understandable loading/error states before replacing the search engine.

For relevance, start with accent normalization and ranking a direct title match ahead of a weaker description match. If readers need terms that occur only inside articles or research abstracts, compare a small custom JSON index with Pagefind. Pagefind operates on generated static HTML and separates languages using the HTML `lang` attribute; it can fit the existing deployment without a search server. Its published bandwidth examples are not a forecast for this site. [2](https://pagefind.app/docs/) [3](https://pagefind.app/docs/multilingual/)

### Image viewing is primarily pointer-operated

**Verified implementation.** Article images receive click handlers but do not become keyboard-focusable controls. Lightbox and help overlays have close buttons and Escape handling, but lack a complete modal focus lifecycle and dialog semantics. An accessible image viewer should let someone focus an image trigger, open it, move among images, close it, and return to the triggering image. WAI’s modal pattern documents focus placement, containment, naming, and return behavior. [4](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

There is also a dormant compatibility defect: [templates/shortcodes/gallery.html](../../templates/shortcodes/gallery.html) calls `openLightbox(galleryId, index)`, while the current function takes one numeric index. Do not advertise this shortcode as a supported authoring option until that route is exercised and fixed. This is not asserted to break every currently published gallery.

### Global single-letter shortcuts need an opt-out or narrower scope

**Verified implementation, accessibility concern.** Keys such as H, D, L, J, and K act globally outside text fields. There is no disable or remapping control. WCAG’s character-shortcut criterion permits alternatives such as turning shortcuts off, remapping to include non-character keys, or activating them only when the relevant component has focus. The smallest improvement is to remove unnecessary global letter shortcuts or make them opt-in. [5](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)

### Mobile reading needs more space

**Visual judgment supported by the 390-pixel sample.** Homepage article cards remain in two narrow columns, with long titles and descriptions wrapping into tall strips. One article per row on small screens would give titles, excerpts, and architectural imagery room to communicate. This is a refinement of the current layout and can ship without a redesign.

The sampled pages did not overflow horizontally. Search and theme buttons have 36-pixel styles in the source; that is not automatically a WCAG 2.2 AA failure. The minimum target criterion is 24 CSS pixels with exceptions, while a larger target can be a useful comfort goal. Measure actual targets and spacing before declaring violations. [6](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

The site already includes focus outlines and a reduced-motion rule. That rule globally shortens animation and transition durations; replace it with intentional state-preserving behavior when modifying the affected components. Contrast, zoom, screen-reader output, and full dark-theme coverage remain future verification work, not certified passes.

### Make the portfolio and research easier to evaluate

**Product opportunities, not established defects.** The homepage leads with a large introductory hero, then articles, a quotation, and projects. That is coherent for a personal writing site. If professional enquiries are a major objective, showing selected projects earlier and making Francisco’s role and specialism explicit would support that audience better.

Choose one existing project and develop a case study around the initial condition, constraints, Francisco’s contribution, intervention decisions, and documented outcome. Use authentic plans and photographs with captions and credits. Do not invent commercial results, collaborators, project status, or conservation claims. A side-by-side before/after pair may communicate more than an interactive slider.

The publication archive is much larger than the project list. Grouping external publications by year is therefore a more justified discovery improvement than adding complex project filters. Research entries could offer a stable local summary, original title, citation, and verified DOI or external source. Begin with one entry and preserve the value of existing outbound links.

## SEO, language consistency, and sharing

### Alternate-language URLs are malformed on translated pages

**Verified in generated HTML and the live English listing, high priority.** [templates/partials/head.html](../../templates/partials/head.html) removes `/en/` or `/it/` and concatenates the remaining path without restoring a separator. The English article listing emits `https://fco-sandoval-gomez.esarticulos/`, `/enarticulos/`, and `/itarticulos/` variants. The local scan found 288 alternate tags with an incorrect hostname, plus same-host malformed paths that this count does not include.

Generate alternates from actual translated page or section permalinks instead of string surgery. Only publish available counterparts and include reciprocal references. Zola exposes page/section data for this purpose, while Google documents fully qualified URLs and reciprocal language references. Existing visible navigation uses different logic, so this finding is not a claim that every visible language switch is broken. [7](https://www.getzola.org/documentation/templates/pages-sections/) [8](https://developers.google.com/search/docs/specialty/international/localized-versions)

### Page descriptions and sharing titles fall back to the site defaults

**Verified locally and live, high priority.** The head partial uses bare `title` and `description` variables rather than resolving `page` or `section` values. All 220 generated HTML outputs containing Open Graph metadata used the author’s name as `og:title`. Descriptions fell into three repeated language-level site descriptions. The remaining 13 HTML files had no such metadata and include redirect outputs.

A live article had a correct browser document title but generic Open Graph title and description. Resolve page values, then section values, then site defaults in one place. Google recommends descriptive, page-specific descriptions, although it may choose a different search snippet. Fixing metadata is not a guarantee of rankings or a particular snippet. [9](https://developers.google.com/search/docs/appearance/snippet)

Social-image metadata also hardcodes 1200 by 630 dimensions regardless of the selected asset. Separate deliberate social crops from content imagery, or emit truthful dimensions. A designed social-card generator is optional; correct metadata comes first.

### Complete the language experience

**Verified source and live English listing.** Date macros always emit Spanish month names. Pagination and coauthor labels also include hardcoded Spanish. The homepage quotation remains Spanish across languages. Feed discovery points to the root Atom feed rather than selecting the current language’s feed. These inconsistencies make existing translations feel unfinished.

Use the existing translation configuration consistently and keep proper names and original scholarly titles intact. Validate link targets when a translation is unavailable. The missing filename counterparts found in the inventory were four draft templates and the Spanish contact redirect, not evidence that five normal articles lacked translations. Zola’s multilingual documentation explicitly describes language-specific files and the absence of automatic section-language fallback. [10](https://www.getzola.org/documentation/content/multilingual/)

### Structured data needs semantic refinement

**Verified implementation with a preventive recommendation.** JSON-LD already exists and all generated blocks parsed as JSON in the local scan. It should not be described as absent or currently invalid. However, the template treats any `page` as an Article, including legal/about content, and builds JSON strings through template interpolation rather than a dedicated JSON serializer.

Keep Article data for applicable editorial content, use appropriate basic page/person data elsewhere, and make quotation and unusual-character handling robust. Structured data should describe visible, accurate content. The configured `SearchAction` points to a `?q=` URL, but the search script does not read that parameter; implement a real query URL only if useful, otherwise remove that unsupported action. [11](https://developers.google.com/search/docs/appearance/structured-data/article)

## Performance and media ownership

The largest opportunities are images and eager search loading. The site’s small JavaScript files do not justify a blanket runtime rewrite. Local image macros emit originals without responsive variants, while remote images go through `wsrv.nl`. In the live homepage sample, the 44-pixel navigation portrait used a 920-pixel original. The mobile hero used a 2560-pixel source, and a project thumbnail used a 3888-pixel original.

Begin with the shared navigation portrait and homepage image, then extend the same processing path to local project images. Zola provides image processing and metadata functions; check compatibility with the pinned version before copying examples from current documentation. Prefer appropriately sized WebP/JPEG outputs and accurate dimensions, with a clear original asset retained. More formats are optional. [12](https://www.getzola.org/documentation/content/image-processing/)

For new uploads, consider copying approved attachments into site-owned storage during publication and creating derivatives before deploy. This removes a runtime dependency on both an attachment host and image proxy. The first implementation needs bounded file sizes, approved source locations, image-type validation, safe filenames, attribution fields, and a clear error if import fails. Those safeguards are required for a production importer, but a generalized media service is not.

Image visibility currently depends on JavaScript adding a `loaded` class to skeleton wrappers. Make essential imagery visible without JavaScript and give failures a stable fallback. Lazy loading should be in generated HTML for below-the-fold images; adding it later in JavaScript can arrive after requests have started. Keep above-the-fold primary imagery eager, based on the actual route rather than a universal rule.

Load the search index only on demand. If the current index is retained, stop shipping a search structure whose document store is the only part the custom client uses. Compare transferred bytes and user-visible search results before and after, rather than assuming a replacement library is smaller.

Use existing Cronitor data, if available, to establish a baseline before choosing further performance work. Useful field targets are LCP at or below 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1, assessed at the 75th percentile and separated by device class. These are target thresholds, not measured results for this site. Low traffic may make field conclusions inconclusive. [13](https://web.dev/articles/vitals)

## Editing options

| Option | Fit for this site | Cost and complexity judgment | Recommended decision |
| --- | --- | --- | --- |
| Improve current GitHub forms | Familiar entry point; existing automation and history | Lowest migration cost, but editing remains awkward unless separately improved | Do the reliability repairs regardless of future editor choice. |
| Pages CMS | Edits repository content/media; documents TOML frontmatter and configurable delimiters | A focused configuration pilot appears proportionate; hosted account permissions and shortcode round-trip need verification | First candidate if the main problem is finding, editing, and uploading content. |
| Decap CMS | Supports TOML frontmatter and a GitHub editorial workflow using pull requests | More setup around authentication, collections, and editorial behavior | Prefer if draft/review/publish stages become a demonstrated requirement. |
| Bespoke administration interface | Can match any desired author experience | Highest custom maintenance burden: authentication, media, validation, recovery, and editing state | Defer until a small existing editor proves inadequate. |
| Replace generator/hosting/CMS architecture | Potentially useful for a fundamentally different product | Migration risk to content, URLs, deployment, and maintenance | No current evidence justifies a rewrite. |

Pages CMS explicitly supports `toml-frontmatter` and `+++` delimiters, and saves content back to GitHub. This is documentation-level compatibility, not proof that every nested gallery, date field, shortcode, and language filename will survive an edit unchanged. Pilot those details with copies of representative content. [14](https://pagescms.org/docs/configuration/content/) [15](https://pagescms.org/docs/)

Decap requires an explicit TOML frontmatter configuration: its generic `frontmatter` mode can read TOML but saves YAML. Its editorial mode adds a pull-request-backed review path, while its GitHub backend has authentication requirements. Do not assume adding an `/admin` page alone completes the integration. [16](https://decapcms.org/docs/configuration-options/) [17](https://decapcms.org/docs/editorial-workflows/) [18](https://decapcms.org/docs/github-backend/)

No subscription price estimate is included because the hosting choice, account setup, and usage are undecided. Effort estimates in the backlog are engineering judgments, not vendor quotations. Only one editor should be piloted initially. Both an editor and issue forms must feed the same safe content/deployment rules if both remain available.

## Maintenance, privacy, and operational consistency

The deployment workflow runs on main-branch pushes and manual dispatch; it does not provide a pull-request validation gate. Jest tests exist for the content generator but are not run by the shown workflows. A proportionate gate would build the site, run those focused tests, and check the specific content/metadata invariants affected by a change. External link checks should be a separate bounded maintenance task so a temporarily unavailable publication does not block every release.

Align the documented local Zola version with CI before upgrading. Pin important dependencies deliberately and schedule manageable update batches. GitHub recommends least-privilege workflow tokens and documents immutable action references and automated dependency updates. Keep read-only validation separate from jobs that write content or deploy. The existing author allowlist is useful and should remain enforced across any new publishing entry point. [19](https://docs.github.com/en/actions/reference/security/secure-use)

The legal page acknowledges Cronitor and YouTube, but also makes broad claims about anonymous data and not sharing information. The site additionally loads remote images. Audit actual requests, provider settings, retention, and applicable notices before changing the policy. Cronitor states that its RUM service does not use cookies or store visitor IP addresses; this vendor statement does not establish the privacy position of every other integration. [20](https://cronitor.io/docs/rum-faq)

A click-to-load video component can make third-party contact deliberate and reduce initial work. It should have an accessible title and an external fallback link. Whether consent is needed depends on actual behavior and configuration; do not add a banner or declare compliance based solely on the presence or absence of a named analytics product. The AEPD’s audience-measurement guidance describes conditions for a specific exemption, rather than a blanket exemption for analytics. Its January 2024 guidance is a reference to recheck when implementing, not a complete legal assessment. [21](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf)

Document a practical recovery path for a bad post and deployment, and retain copies of original images that currently exist only as remote attachments. Git history helps with content recovery, but it does not by itself establish the availability of external media or the recoverability of domain and provider accounts.

## Recommended order and decision gates

1. **Protect author work:** preserve Markdown bodies, serialize metadata, validate dates, detect collisions, and reject invalid site output before publication.
2. **Restore trustworthy publishing:** replace the retired translation model and separately correct deployment/translation status reporting.
3. **Repair discovery:** fix alternate-language URLs and page-specific metadata, then finish visible language strings.
4. **Remove visitor friction:** repair keyboard search and image viewing, refine mobile article cards, and resize shared images.
5. **Make editing easier:** observe one real authoring session and pilot one browser editor for Spanish articles if the friction warrants it.
6. **Deepen the portfolio:** improve one project case study and one research entry, then decide whether homepage ordering should change.

Each item should ship a complete outcome through the layers it needs. A content form without a valid saved page and deployment path is not a finished feature. Do not create horizontal PRs for the form, generator, and deployment when they only become useful together. Unrelated defects may still be separate deployable fixes.

Previews, scheduling, newsletters, interactive maps, elaborate taxonomies, expanded telemetry, and rich editors remain conditional ideas. Good triggers are an author who cannot confidently approve a post without seeing it, recurring scheduled releases, readers explicitly requesting updates, or an archive large enough that simple browsing fails.

Success measures should be practical: an author can create and correct a complete article without developer rescue; publishing messages match actual output; a reader can find a known page with ordinary queries and keyboard controls; mobile cards are readable; and a collaborator can understand one project’s contribution and contact Francisco. CI passing is necessary supporting evidence, not a substitute for those outcomes.

## Sources

Repository links above refer to the inspected snapshot. External documentation was accessed on 8 September 2026. Unless a date is stated below, the source is maintained documentation without a stable publication date recorded here; verify version-sensitive details before implementation.

1. Anthropic. [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations). Model retirement date: 19 February 2026.
2. Pagefind. [Getting started](https://pagefind.app/docs/).
3. Pagefind. [Multilingual search](https://pagefind.app/docs/multilingual/).
4. W3C WAI. [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
5. W3C WAI. [Understanding SC 2.1.4: Character Key Shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html).
6. W3C WAI. [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
7. Zola. [Sections and Pages](https://www.getzola.org/documentation/templates/pages-sections/).
8. Google Search Central. [Tell Google about localized versions of your page](https://developers.google.com/search/docs/specialty/international/localized-versions).
9. Google Search Central. [Control your snippets in search results](https://developers.google.com/search/docs/appearance/snippet). Updated 20 April 2026.
10. Zola. [Multilingual sites](https://www.getzola.org/documentation/content/multilingual/).
11. Google Search Central. [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article).
12. Zola. [Image processing](https://www.getzola.org/documentation/content/image-processing/).
13. Philip Walton, web.dev. [Web Vitals](https://web.dev/articles/vitals). Published 4 May 2020; updated 31 October 2024.
14. Pages CMS. [Content configuration](https://pagescms.org/docs/configuration/content/).
15. Pages CMS. [Introduction](https://pagescms.org/docs/).
16. Decap CMS. [Configuration options](https://decapcms.org/docs/configuration-options/).
17. Decap CMS. [Editorial workflows](https://decapcms.org/docs/editorial-workflows/).
18. Decap CMS. [GitHub backend](https://decapcms.org/docs/github-backend/).
19. GitHub. [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use).
20. Cronitor. [Common questions for Cronitor RUM](https://cronitor.io/docs/rum-faq).
21. Agencia Española de Protección de Datos. [Guía: Uso de cookies para herramientas de medición de audiencia](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf). January 2024.
