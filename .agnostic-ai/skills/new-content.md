---
name: new-content
description: Scaffold a new content file (artículo, trabajo, investigación, or publicación) with correct frontmatter. Trigger on "new article", "nuevo artículo", "new content", "add a trabajo/investigación/publicación".
---

# new-content

Create a new Spanish content file with the right structure for its section.

## Steps

1. Ask (or infer from the request) the content type: `articulos`, `trabajos`, `investigacion`, or `publicaciones` — and the required fields for that type (see `GUIA.md` for field semantics).
2. Read one recent `.md` file in the target section and mirror its exact frontmatter shape (TOML between `+++`).
3. Write `content/<section>/YYYY-MM-DD-kebab-slug.md` — Spanish only, no `.en.md`/`.it.md` (CI generates translations on push).
4. Validate with `zola check`.
5. Offer to preview with `zola serve`.

## Required fields per type

- **articulos**: title, description, category (`Patrimonio`|`Reflexiones`); optional image, body
- **trabajos**: title, description, category (`Rehabilitación`|`Investigación`), location; optional image, body
- **investigacion**: title, description/abstract, category (publication type), optional coauthors and `[[extra.links]]`
- **publicaciones**: title, description, source, url; fixed body pointing to the external link
