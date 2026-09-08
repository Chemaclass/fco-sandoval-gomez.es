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
