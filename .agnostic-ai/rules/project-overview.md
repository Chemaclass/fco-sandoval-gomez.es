---
name: project-overview
description: What this project is and how to build/run it.
globs: "**/*"
alwaysApply: true
---

Personal portfolio site for Francisco Sandoval Gómez (architecture & heritage conservation), built with [Zola](https://www.getzola.org/) (>= 0.21.0), deployed to GitHub Pages via `.github/workflows/main.yml` on every push to `main`.

## Commands

- `zola serve` — dev server at http://127.0.0.1:1111/
- `zola build` — production build into `public/` (gitignored)
- `zola check` — validate content and internal links

## Layout

- `config.toml` — site config, multilingual setup (ES default, EN, IT), and all UI translations under `[extra.i18n.*]`
- `content/` — Markdown content: `articulos/`, `investigacion/`, `trabajos/`, `publicaciones/`, plus top-level pages
- `templates/` — Tera templates (`base.html`, `section.html`, `page.html`, ...) with `macros/`, `partials/`, `shortcodes/`
- `sass/style.scss` — single compiled stylesheet
- `static/` — static assets (`static/processed_images/` is generated, gitignored)
- `GUIA.md` — Spanish end-user guide for creating content via GitHub issue forms
