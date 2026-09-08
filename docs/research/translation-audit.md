# Translation audit, 8 September 2026

Acceptance scenario: a visitor can browse every published section and page in Spanish, English and Italian with matching source content, preserved media and links, localized controls, and contact links that retain the selected language.

Non-goals: rewriting the Spanish articles, translating externally hosted publications, changing legal claims, or translating unpublished authoring templates.

## Corrections

- Checked the English and Italian counterparts of all published Spanish content, including section introductions, biography and privacy notice.
- Restored three omitted image placements in each San Miniato translation and corrected two altered Pluribus attachment URLs.
- Restored accents in Italian text and proper names, preserved research coauthors and original publication titles, corrected architectural terminology and translated remaining descriptive image labels.
- Removed external-content placeholder paragraphs from section introductions that are empty in Spanish.
- Localized dates, pagination, coauthor labels, the homepage quotation, structured-data job titles, contact and redirect labels, and Spanish search accessibility labels.
- Added English and Italian contact redirects with the correct biography anchors.
- Added localized 404 pages. GitHub Pages' shared fallback routes English and Italian requests to the corresponding error page, including localized navigation and search. Without JavaScript, explicit language links remain available.

## Regression protection

`python3 .github/scripts/check-translations.py` requires Python 3.11 or later. It checks all 144 translations against 72 source pages and sections, excluding draft templates. Coverage includes metadata presence, dates, publication state, authors, original titles, external URLs, media paths, shortcodes and UI dictionary keys. It does not certify linguistic quality or detect every possible change in meaning.

The translation writer rejects responses that omit or alter protected media, links or shortcodes before saving. Research categories and the legacy contact redirect are localized. The push workflow covers the complete push range, excludes draft templates and reports missing credentials or failed translations as failures.

Validation: 54 unit tests, the pinned Zola 0.21.0 build, translation consistency checks, metadata checks, workflow lint and browser checks. Browser coverage includes English and Italian dates, pagination, contact anchors and 404 navigation alongside existing search and accessibility checks. The build retains its existing warnings for two undated draft templates.

No live translation-provider request or deployment was performed. Future Spanish prose edits still require a successful translation run and editorial review; structural checks cannot replace that review.
