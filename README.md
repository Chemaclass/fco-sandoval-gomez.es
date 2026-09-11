# Francisco Sandoval Gómez - Portfolio

Portfolio personal de arquitectura y conservación del patrimonio.

## Tech

### Prerequisites

- [Zola](https://www.getzola.org/documentation/getting-started/installation/) (0.21.0 or higher)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/chemasites/fco-sandoval-gomez.es.git
cd fco-sandoval-gomez.es
```

2. Run the development server:
```bash
zola serve
```

Open http://127.0.0.1:1111/ in your browser.

### Languages

Spanish is the main language, served at `/`. Posts (`articulos`, `investigacion`,
`trabajos`, `publicaciones`) are published in Spanish only. Static pages and the
UI also exist in English (`/en/`) and Italian (`/it/`). The EN and IT section
pages list the Spanish posts. Search and the Atom feed are Spanish.

No workflow calls an AI or translation service. Translate static pages by hand.
Posts published before September 2026 keep `aliases` for their old `/en/` and
`/it/` URLs, so shared links still land on the Spanish post.

### Checks

Use Zola 0.21.0 to match CI. From the repository root:

```bash
npm ci --prefix .github/scripts
npm test --prefix .github/scripts -- --runInBand
python3 .github/scripts/check-translations.py  # Python 3.11+
zola build
python3 .github/scripts/check-metadata.py
```

`check-translations.py` fails when a post gains an `.en.md` or `.it.md` file, or
when a static page loses one.

For browser checks, install Chromium with `npx playwright install chromium` from
`.github/scripts`, then run `node .github/scripts/browser-checks.cjs public` from
the repository root. Alternatively set `BROWSER_EXECUTABLE` to a local Chrome
binary. The checks serve the build locally and block third-party requests.
They cover keyboard search, image dialogs, shortcut preferences, mobile layout,
responsive local images, image visibility without JavaScript, search failures,
Spanish-only posts in the EN/IT sections, and old post URL redirects.
