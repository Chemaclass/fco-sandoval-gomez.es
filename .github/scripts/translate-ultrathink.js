#!/usr/bin/env node
/**
 * Translate-Ultrathink - High-quality translation using Claude Opus with extended thinking
 *
 * Usage: ANTHROPIC_API_KEY=xxx node translate-ultrathink.js file1.md file2.md ...
 */

const fs = require('fs');
const path = require('path');
const { parseMarkdown, extractFields, replaceField, getTranslatedFilename, CATEGORY_TRANSLATIONS } = require('./translator.js');

const LANGUAGE_NAMES = {
  en: 'English',
  it: 'Italian'
};

const MODEL = 'claude-opus-4-20250514';
const THINKING_BUDGET = 10000;

/**
 * Call Claude API with extended thinking for high-quality translation
 */
async function callClaudeWithThinking(text, targetLang, apiKey) {
  const langName = LANGUAGE_NAMES[targetLang];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: THINKING_BUDGET
      },
      messages: [{
        role: 'user',
        content: `You are a professional translator specializing in architecture, heritage, and academic content.

Translate the following Spanish text to ${langName}.

Requirements:
- Maintain the same tone, style, and register as the original
- Preserve all markdown formatting exactly
- Keep technical architecture and heritage terms accurate
- Ensure the translation reads naturally in ${langName}
- Only respond with the translation, nothing else

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

  // Extract text from response (extended thinking returns multiple content blocks)
  const textBlock = data.content.find(block => block.type === 'text');
  if (!textBlock) {
    throw new Error('No text response from Claude API');
  }

  return textBlock.text.trim();
}

/**
 * Translate markdown content to target language using extended thinking
 */
async function translateContent(content, targetLang, apiKey) {
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
    console.log(`  Calling Claude Opus with extended thinking...`);
    const translatedText = await callClaudeWithThinking(combinedText, targetLang, apiKey);

    // Parse the translated response
    const titleMatch = translatedText.match(/TITLE:\s*(.+?)(?=\n\n|DESCRIPTION:|BODY:|$)/s);
    const descMatch = translatedText.match(/DESCRIPTION:\s*(.+?)(?=\n\n|BODY:|$)/s);
    const bodyMatch = translatedText.match(/BODY:\s*([\s\S]+)$/);

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

  // Assemble final content
  const translatedBody = translated.body || body;
  return `+++\n${newFrontmatter}\n+++\n\n${translatedBody}\n`;
}

/**
 * Translate a file and save the translation
 */
async function translateAndSave(filename, targetLang, apiKey) {
  const content = fs.readFileSync(filename, 'utf8');
  const translated = await translateContent(content, targetLang, apiKey);
  const translatedFilename = getTranslatedFilename(filename, targetLang);
  fs.writeFileSync(translatedFilename, translated);
  console.log(`  Saved: ${translatedFilename}`);
  return translatedFilename;
}

/**
 * Main function
 */
async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: ANTHROPIC_API_KEY=xxx node translate-ultrathink.js file1.md file2.md ...');
    process.exit(1);
  }

  console.log(`\nTranslating ${files.length} file(s) using Claude Opus with extended thinking...\n`);
  console.log(`Model: ${MODEL}`);
  console.log(`Thinking budget: ${THINKING_BUDGET} tokens\n`);

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`File not found: ${file}`);
      continue;
    }

    // Skip already-translated files
    if (file.endsWith('.en.md') || file.endsWith('.it.md')) {
      console.log(`Skipping already-translated file: ${file}`);
      continue;
    }

    console.log(`\nProcessing: ${file}`);

    try {
      // Translate to English
      console.log(`  Translating to English...`);
      await translateAndSave(file, 'en', apiKey);

      // Translate to Italian
      console.log(`  Translating to Italian...`);
      await translateAndSave(file, 'it', apiKey);

      console.log(`  Done!`);
    } catch (error) {
      console.error(`  Error translating ${file}: ${error.message}`);
    }
  }

  console.log('\nAll translations complete!');
}

main().catch(console.error);
