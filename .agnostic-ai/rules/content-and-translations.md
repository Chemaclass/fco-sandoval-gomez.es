---
name: content-and-translations
description: How content files and languages work. Posts are Spanish-only; static pages exist in ES, EN and IT.
globs: "content/**/*.md"
alwaysApply: true
---

## Content model

Spanish is the main language, served at `/`. EN lives at `/en/`, IT at `/it/`.

Posts are Spanish-only: one `name.md` per post, never `.en.md` / `.it.md`. `.github/scripts/check-translations.py` fails if one appears.
- `content/articulos/`: opinion articles (category: "Patrimonio" or "Reflexiones")
- `content/investigacion/`: academic research (type, year, co-authors, optional link)
- `content/trabajos/`: architecture projects (category, location, year)
- `content/publicaciones/`: links to external articles (source, URL)

Static pages (`_index.md`, `sobre-mi.md`, `contacto.md`, `legal.md`, `404.md`) and the four section `_index.md` files exist as `name.md`, `name.en.md` and `name.it.md`. EN/IT section pages list the Spanish posts under the `spanish_only_note` UI string. They do not sort or paginate.

Posts published before September 2026 carry `aliases` for their retired `/en/` and `/it/` URLs. Keep them.

Content is normally created through GitHub issue forms processed by `.github/workflows/crear-contenido.yml`; field semantics are documented in `GUIA.md`.

## Translations

No workflow calls an AI or translation service. Static page translations are maintained by hand.

Rules:
- When a static page changes in Spanish, update its `.en.md` and `.it.md` in the same commit.
- New top-level pages need all three language variants to appear in every locale.

## UI strings

Navigation/buttons/footer text live in `config.toml` under `[extra.i18n.es]`, `[extra.i18n.en]`, `[extra.i18n.it]`. Adding a UI string means adding the key to all three blocks.
