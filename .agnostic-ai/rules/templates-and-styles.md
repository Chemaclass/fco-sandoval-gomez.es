---
name: templates-and-styles
description: Conventions for Tera templates and SCSS.
globs: "templates/**/*.html,sass/**/*.scss"
alwaysApply: false
---

## Templates (Tera)

- `templates/base.html` is the shared shell; pages extend it.
- Reusable pieces go in `templates/partials/` and `templates/macros/`; content-embeddable snippets in `templates/shortcodes/`.
- Never hardcode user-facing text in templates — read it from `config.extra.i18n` so all three locales stay in sync.
- Language-aware links must respect the current `lang` (ES at `/`, EN at `/en/`, IT at `/it/`).

## Styles

- All styles live in `sass/style.scss`, compiled by Zola (`compile_sass = true`). No inline styles in templates.
- Site uses view transitions for navigation and minified HTML output; verify visual changes with `zola serve` before committing.
- When debugging CSS, find the root-cause rule first (check global selectors like `a:hover`, `*`) — no surface patches.
