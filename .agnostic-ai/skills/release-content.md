---
name: release-content
description: Full publish flow — verify, commit, push, watch CI, confirm live. Trigger on "publish", "release content", "push the article live", "publica el artículo".
---

# release-content

Publish pending content changes to production end-to-end.

## Steps

1. **Verify** — run the `verify-site` checks: `zola check` and `zola build` must pass.
2. **Commit** — conventional commit (e.g. `feat: add articulo <slug>`), Spanish source files only. Never commit `.en.md`/`.it.md` by hand unless they carry `[skip-translate]` in the message.
3. **Push** to `main`.
4. **Watch CI** — two workflows fire:
   - `Traducir Contenido` (only if a Spanish `content/**/*.md` changed) — generates `.en.md`/`.it.md` and pushes a `[skip-translate]` commit, which re-triggers deploy.
   - `Build and deploy GH Pages` — deploys the site.
   Poll with `gh run list --limit 5` / `gh run watch <id>` until both succeed.
5. **Confirm live** — `git pull` to fetch the translation commit, then check the page exists: `curl -sI https://fco-sandoval-gomez.es/<section>/<slug>/ | head -1` (expect 200). Spot-check `/en/` and `/it/` variants after the translation deploy lands.

## Failure handling

- Translation workflow fails → content is live in Spanish only; report the failed run URL, don't hand-translate.
- Deploy fails → report the run URL and the failing step; don't retry blindly.
