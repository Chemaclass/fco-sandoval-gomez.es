---
name: verify-site
description: Validate the site before pushing — build, link check, and locale parity. Trigger on "verify site", "check the site", "validate before push", "i18n check".
---

# verify-site

Pre-push validation for this Zola site.

## Steps

1. `zola check` — validates content, frontmatter, and internal links.
2. `zola build` — must succeed; output goes to `public/` (gitignored).
3. Locale parity: `python3 .github/scripts/check-translations.py` (Python 3.11+).
   - Static pages and section `_index.md` files need matching `name.en.md` and `name.it.md`.
   - Posts (`articulos`, `investigacion`, `trabajos`, `publicaciones`) must have no `.en.md`/`.it.md`.
   - Every key in `config.toml` `[extra.i18n.es]` must exist in `[extra.i18n.en]` and `[extra.i18n.it]`.
4. `python3 .github/scripts/check-metadata.py` — generated metadata and hreflang links.
5. Report failures with file paths.
