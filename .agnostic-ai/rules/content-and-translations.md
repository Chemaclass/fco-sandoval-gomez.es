---
name: content-and-translations
description: How content files and the auto-translation pipeline work.
globs: "content/**/*.md"
alwaysApply: true
---

## Content model

Spanish is the source language. Each page exists as `name.md` (ES), `name.en.md`, and `name.it.md`.

Content types and their sections:
- `content/articulos/` — opinion articles (category: "Patrimonio" or "Reflexiones")
- `content/investigacion/` — academic research (type, year, co-authors, optional link)
- `content/trabajos/` — architecture projects (category, location, year)
- `content/publicaciones/` — links to external articles (source, URL)

Content is normally created through GitHub issue forms processed by `.github/workflows/crear-contenido.yml`; field semantics are documented in `GUIA.md`.

## Translation pipeline

`.github/workflows/traducir-contenido.yml` auto-translates any pushed `content/**/*.md` (excluding `*.en.md` / `*.it.md`) into EN and IT using the Claude API, then commits with `[skip-translate]`.

Rules:
- Edit the Spanish `.md` file only; never hand-edit `.en.md` / `.it.md` — the pipeline overwrites them.
- When committing generated translations manually, include `[skip-translate]` in the commit message to avoid a translation loop.
- New top-level pages need all three language variants to appear in every locale.

## UI strings

Navigation/buttons/footer text live in `config.toml` under `[extra.i18n.es]`, `[extra.i18n.en]`, `[extra.i18n.it]`. Adding a UI string means adding the key to all three blocks.
