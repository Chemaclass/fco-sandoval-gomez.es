/**
 * Translator - Uses Claude API to translate Zola markdown content
 */

const { tomlString } = require('./content-creator');

const LANGUAGE_NAMES = {
  en: 'English',
  it: 'Italian'
};

const CATEGORY_TRANSLATIONS = {
  en: {
    'ARTÍCULO': 'Article',
    'CAPÍTULO DE LIBRO': 'Book Chapter',
    'LIBRO': 'Book',
    'PONENCIA': 'Paper',
    'CONFERENCIA': 'Lecture',
    'PATRIMONIO': 'HERITAGE',
    'REFLEXIONES': 'REFLECTIONS',
    'REHABILITACIÓN': 'RENOVATION',
    'INVESTIGACIÓN': 'RESEARCH',
    'ARQUITECTURA': 'ARCHITECTURE',
    'URBANISMO': 'URBANISM'
  },
  it: {
    'ARTÍCULO': 'Articolo',
    'CAPÍTULO DE LIBRO': 'Capitolo di Libro',
    'LIBRO': 'Libro',
    'PONENCIA': 'Relazione',
    'CONFERENCIA': 'Conferenza',
    'PATRIMONIO': 'PATRIMONIO',
    'REFLEXIONES': 'RIFLESSIONI',
    'REHABILITACIÓN': 'RECUPERO',
    'INVESTIGACIÓN': 'RICERCA',
    'ARQUITECTURA': 'ARCHITETTURA',
    'URBANISMO': 'URBANISTICA'
  }
};

/**
 * Parse Zola markdown file into frontmatter and body
 * @param {string} content - Raw markdown content
 * @returns {Object} { frontmatter: string, body: string }
 */
function parseMarkdown(content) {
  const match = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid Zola markdown format');
  }
  return {
    frontmatter: match[1],
    body: match[2].trim()
  };
}

/**
 * Extract translatable fields from TOML frontmatter
 * @param {string} frontmatter - TOML frontmatter
 * @returns {Object} { title, description, category }
 */
function extractFields(frontmatter) {
  const titleMatch = frontmatter.match(/^title\s*=\s*"(.*)"/m);
  const descMatch = frontmatter.match(/^description\s*=\s*"(.*)"/m);
  const categoryMatch = frontmatter.match(/^category\s*=\s*"(.*)"/m);

  return {
    title: titleMatch ? JSON.parse(titleMatch[0].slice(titleMatch[0].indexOf('=') + 1).trim()) : '',
    description: descMatch ? JSON.parse(descMatch[0].slice(descMatch[0].indexOf('=') + 1).trim()) : '',
    category: categoryMatch ? categoryMatch[1] : ''
  };
}

/**
 * Replace field in frontmatter
 * @param {string} frontmatter - TOML frontmatter
 * @param {string} field - Field name
 * @param {string} newValue - New value
 * @returns {string} Updated frontmatter
 */
function replaceField(frontmatter, field, newValue) {
  const regex = new RegExp(`^(${field}\\s*=\\s*)".*"`, 'm');
  return frontmatter.replace(regex, (_match, prefix) => prefix + tomlString(newValue));
}

// Default model - can be overridden via workflow env
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

/**
 * Call Claude API to translate text
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (en/it)
 * @param {string} apiKey - Anthropic API key
 * @param {string} model - Claude model to use
 * @returns {Promise<string>} Translated text
 */
async function callClaudeAPI(text, targetLang, apiKey, model = DEFAULT_MODEL) {
  const langName = LANGUAGE_NAMES[targetLang];
  if (!langName) throw new Error(`Unsupported translation language: ${targetLang}`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(60000),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Translate the following Spanish text to ${langName}.
Keep the same tone and style. Preserve Markdown, every image and URL, code fences and Zola shortcodes exactly.
Preserve proper names and their accents. Use correct diacritics in the target language.
Translate image alt text, but never replace images with placeholders.
Keep the field markers TITLE:, DESCRIPTION: and BODY: unchanged, on their own field boundaries.
Translate the values after these markers. Never omit any part of the body.
Only respond with the translation, nothing else.

Text to translate:
${text}`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (data.stop_reason !== 'end_turn') throw new Error(`Incomplete translation: ${data.stop_reason}`);
  const translatedText = data.content?.filter(block => block.type === 'text').map(block => block.text).join('\n').trim();
  if (!translatedText) throw new Error('Empty translation response');
  return translatedText;
}

// Reject missing or altered assets before a translation can overwrite a file.
function protectedTokens(body) {
  return (body.match(/https?:\/\/[^\s\)"<>]+|\/?images\/[^\s\)"<>]+|\{%.*?%\}|\{\{.*?\}\}/g) || []).sort();
}

/**
 * Translate markdown content to target language
 * @param {string} content - Original markdown content
 * @param {string} targetLang - Target language code (en/it)
 * @param {string} apiKey - Anthropic API key
 * @param {string} model - Claude model to use
 * @returns {Promise<string>} Translated markdown content
 */
async function translateContent(content, targetLang, apiKey, model = DEFAULT_MODEL) {
  const { frontmatter, body } = parseMarkdown(content);
  const fields = extractFields(frontmatter);

  // Translate title and description together for efficiency
  const toTranslate = [];
  if (fields.title) toTranslate.push(`TITLE: ${fields.title}`);
  if (fields.description) toTranslate.push(`DESCRIPTION: ${fields.description}`);
  if (body) toTranslate.push(`BODY:\n${body}`);

  let translated = {};

  if (toTranslate.length > 0) {
    const combinedText = toTranslate.join('\n\n');
    const translatedText = await callClaudeAPI(combinedText, targetLang, apiKey, model);

    // Parse the translated response
    const titleMatch = translatedText.match(/TITLE:\s*(.+?)(?=\n\n|DESCRIPTION:|BODY:|$)/s);
    const descMatch = translatedText.match(/DESCRIPTION:\s*(.+?)(?=\n\n|BODY:|$)/s);
    const bodyMatch = translatedText.match(/BODY:\s*([\s\S]+)$/);

    if ((fields.title && !titleMatch) || (fields.description && !descMatch) || (body && !bodyMatch)) {
      throw new Error('Translation is missing required fields');
    }
    translated.title = titleMatch ? titleMatch[1].trim() : fields.title;
    translated.description = descMatch ? descMatch[1].trim() : fields.description;
    translated.body = bodyMatch ? bodyMatch[1].trim() : body;
  }

  // Translate category using predefined translations
  const categoryTranslations = CATEGORY_TRANSLATIONS[targetLang] || {};
  const translatedCategory = categoryTranslations[fields.category.toUpperCase()] || fields.category;

  // Build translated frontmatter
  let newFrontmatter = frontmatter;
  if (translated.title) {
    newFrontmatter = replaceField(newFrontmatter, 'title', translated.title);
  }
  if (translated.description) {
    newFrontmatter = replaceField(newFrontmatter, 'description', translated.description);
  }
  if (fields.category && translatedCategory) {
    newFrontmatter = replaceField(newFrontmatter, 'category', translatedCategory);
  }

  // The legacy contact route points to a language-specific heading.
  const contactRedirect = frontmatter.match(/^redirect_to\s*=\s*"\/sobre-mi\/#contacto"$/m);
  if (contactRedirect) {
    const anchor = targetLang === 'en' ? 'contact' : 'contatto';
    newFrontmatter = replaceField(newFrontmatter, 'redirect_to', `/${targetLang}/sobre-mi/#${anchor}`);
  }

  // Assemble final content
  const translatedBody = translated.body || body;
  if (JSON.stringify(protectedTokens(body)) !== JSON.stringify(protectedTokens(translatedBody))) {
    throw new Error('Translation changed URLs, media or shortcodes');
  }
  return `+++\n${newFrontmatter}\n+++\n\n${translatedBody}\n`;
}

/**
 * Get translated filename from Spanish filename
 * @param {string} filename - Spanish filename (e.g., content/articulos/post.md)
 * @param {string} targetLang - Target language code (en/it)
 * @returns {string} Translated filename (e.g., content/articulos/post.en.md)
 */
function getTranslatedFilename(filename, targetLang) {
  return filename.replace(/\.md$/, `.${targetLang}.md`);
}

/**
 * Translate a file and save the translation
 * @param {string} filename - Path to Spanish markdown file
 * @param {string} targetLang - Target language code (en/it)
 * @param {string} apiKey - Anthropic API key
 * @param {Object} fs - Node.js fs module
 * @param {string} model - Claude model to use
 * @returns {Promise<string>} Path to translated file
 */
async function translateAndSave(filename, targetLang, apiKey, fs, model = DEFAULT_MODEL) {
  const content = fs.readFileSync(filename, 'utf8');
  const translated = await translateContent(content, targetLang, apiKey, model);
  const translatedFilename = getTranslatedFilename(filename, targetLang);
  fs.writeFileSync(translatedFilename, translated);
  console.log(`Translated: ${filename} -> ${translatedFilename}`);
  return translatedFilename;
}

module.exports = {
  DEFAULT_MODEL,
  parseMarkdown,
  extractFields,
  replaceField,
  translateContent,
  getTranslatedFilename,
  translateAndSave,
  CATEGORY_TRANSLATIONS
};
