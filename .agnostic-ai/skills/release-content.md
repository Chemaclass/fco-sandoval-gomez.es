---
name: release-content
description: Full publish flow — verify, commit, push, watch CI, confirm live. Trigger on "publish", "release content", "push the article live", "publica el artículo".
---

# release-content

Publish pending content changes to production end-to-end.

## Steps

1. **Verify** — run the `verify-site` checks: `zola check`, `zola build` and `check-translations.py` must pass.
2. **Commit** — conventional commit (e.g. `feat: add articulo <slug>`). Posts are Spanish-only; never commit `.en.md`/`.it.md` for a post.
3. **Push** to `main`.
4. **Watch CI** — `Check website` and `Build and deploy GH Pages` fire on the push.
   Poll with `gh run list --limit 5` / `gh run watch <id>` until both succeed.
5. **Confirm live** — check the page exists: `curl -sI https://fco-sandoval-gomez.es/<section>/<slug>/ | head -1` (expect 200). Spot-check that `/en/<section>/` and `/it/<section>/` list it.

## Failure handling

- Check or deploy fails → report the run URL and the failing step; don't retry blindly.
