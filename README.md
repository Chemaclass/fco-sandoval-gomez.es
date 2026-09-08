# Francisco Sandoval Gómez - Portfolio

Portfolio personal de arquitectura y conservación del patrimonio.

## Tech

### Prerequisites

- [Zola](https://www.getzola.org/documentation/getting-started/installation/) (0.21.0 or higher)

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Chemaclass/fco-sandoval-gomez.es.git
cd fco-sandoval-gomez.es
```

2. Run the development server:
```bash
zola serve
```

Open http://127.0.0.1:1111/ in your browser.

### Translations

The issue and content workflows use the shared model default in
`.github/scripts/translator.js`. Set the GitHub repository variable `CLAUDE_MODEL`
only to override that default, and configure `ANTHROPIC_API_KEY` as a repository
secret. Incomplete responses are rejected instead of being saved as translations.
The model lifecycle is documented in [Anthropic's model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations).

### Checks

Use Zola 0.21.0 to match CI. From the repository root:

```bash
npm ci --prefix .github/scripts
npm test --prefix .github/scripts -- --runInBand
zola build
python3 .github/scripts/check-metadata.py
```

For browser checks, install Chromium with `npx playwright install chromium` from
`.github/scripts`, then run `node .github/scripts/browser-checks.cjs public` from
the repository root. Alternatively set `BROWSER_EXECUTABLE` to a local Chrome
binary. The checks serve the build locally and block third-party requests.
They cover keyboard search, image dialogs, shortcut preferences, mobile layout,
responsive local images, image visibility without JavaScript, and search failures.
