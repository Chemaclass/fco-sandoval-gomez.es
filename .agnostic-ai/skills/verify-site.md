---
name: verify-site
description: Validate the site before pushing — build, link check, and locale parity. Trigger on "verify site", "check the site", "validate before push", "i18n check".
---

# verify-site

Pre-push validation for this Zola site.

## Steps

1. `zola check` — validates content, frontmatter, and internal links.
2. `zola build` — must succeed; output goes to `public/` (gitignored).
3. Locale parity:
   - Every `content/**/name.md` should have matching `name.en.md` and `name.it.md` (missing ones are fine if the file was just created — CI generates them on push).
   - Every key in `config.toml` `[extra.i18n.es]` must exist in `[extra.i18n.en]` and `[extra.i18n.it]`.
4. Report failures with file paths; do not auto-fix translations by hand — flag them for the CI pipeline instead.
