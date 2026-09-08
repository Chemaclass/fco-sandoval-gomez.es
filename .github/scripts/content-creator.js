/**
 * Content Creator - Parses GitHub issue forms and generates Zola markdown files
 */

/**
 * Parse issue body from GitHub forms format
 * @param {string} body - Raw issue body text
 * @returns {Object} Parsed key-value pairs
 */
function parseIssueBody(body) {
  if (typeof body !== 'string') throw new Error('El formulario está vacío.');
  const sections = {};
  const normalized = body.replace(/\r\n/g, '\n');
  // Contenido is the final field in both long-form templates. Its headings
  // belong to the article, even when they have the same name as a form field.
  const contentHeading = /^### Contenido\n\n/m.exec(normalized);
  const envelope = contentHeading ? normalized.slice(0, contentHeading.index) : normalized;
  const regex = /^### (.+?)\n\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm;
  let match;
  while ((match = regex.exec(envelope)) !== null) {
    const key = match[1].trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');
    if (Object.hasOwn(sections, key)) throw new Error(`Campo repetido: ${match[1]}`);
    const value = match[2].trim();
    sections[key] = value === '_No response_' ? '' : value;
  }
  if (contentHeading) {
    const value = normalized.slice(contentHeading.index + contentHeading[0].length).trim();
    sections.contenido = value === '_No response_' ? '' : value;
  }
  return sections;
}

// JSON string escapes are valid in a TOML basic string. Serialize once, at
// the output boundary, so quotes, backslashes and control characters survive.
function tomlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function saveContent(result, fs = require('fs')) {
  try {
    fs.writeFileSync(result.filename, result.content, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Ya existe contenido con este título y fecha. Edita el existente o cambia el título o la fecha.');
    }
    throw error;
  }
}

/**
 * Create URL-friendly slug from text
 * @param {string} text - Input text
 * @returns {string} URL slug
 */
function slugify(text) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract image URL from markdown image or direct URL
 * @param {string} text - Text containing image
 * @returns {string} Extracted URL or empty string
 */
function extractImageUrl(text) {
  if (!text) return '';
  const imgMatch = text.match(/!\[.*?\]\((.*?)\)/);
  if (imgMatch) return imgMatch[1].trim();
  const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+)/);
  if (urlMatch) return urlMatch[1].replace(/[)\]"']+$/, '').trim();
  return '';
}

/**
 * Clean description: remove images and normalize whitespace
 * @param {string} text - Raw description text
 * @returns {string} Cleaned description
 */
function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format date to YYYY-MM-DD with zero-padded month/day
 * @param {string} dateStr - Date string in YYYY-M-D format
 * @returns {string|null} Formatted date or null
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr.trim());
  if (!match || Number(match[1]) < 1) return null;
  const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}

/**
 * Generate content for articulos
 */
function generateArticulo(data, date) {
  const slug = slugify(data.titulo);
  const filename = `content/articulos/${date}-${slug}.md`;
  const imageUrl = extractImageUrl(data.imagen_destacada);

  const content = `+++
title = ${tomlString(data.titulo)}
description = ${tomlString(cleanDescription(data.descripcion))}
date = ${date}

[extra]
category = ${tomlString(data.categoria)}
image = ${tomlString(imageUrl)}
+++

${data.contenido || ''}
`;

  return { filename, content, contentType: 'articulos' };
}

/**
 * Generate content for investigacion
 */
function generateInvestigacion(data, date) {
  const slug = slugify(data.titulo);
  const filename = `content/investigacion/${date}-${slug}.md`;

  let extraFields = `category = ${tomlString(data.tipo_de_publicacion)}
year = ${tomlString(data.ano)}`;

  if (data.titulo_original) {
    extraFields += `\noriginal_title = ${tomlString(data.titulo_original)}`;
  }

  if (data.coautores) {
    extraFields += `\ncoauthors = ${tomlString(data.coautores)}`;
  }

  let links = '';
  if (data.enlace) {
    links = `
[[extra.links]]
name = "ResearchGate"
url = ${tomlString(data.enlace)}`;
  }

  const content = `+++
title = ${tomlString(data.titulo)}
description = ${tomlString(cleanDescription(data.descripcion))}
date = ${date}

[extra]
${extraFields}${links}
+++
`;

  return { filename, content, contentType: 'investigacion' };
}

/**
 * Generate content for trabajos
 */
function generateTrabajo(data, date) {
  const slug = slugify(data.titulo);
  const filename = `content/trabajos/${date}-${slug}.md`;
  const imageUrl = extractImageUrl(data.imagen_destacada);

  const content = `+++
title = ${tomlString(data.titulo)}
description = ${tomlString(cleanDescription(data.descripcion))}
date = ${date}

[extra]
category = ${tomlString(data.categoria)}
location = ${tomlString(data.ubicacion)}
year = ${tomlString(data.ano)}
image = ${tomlString(imageUrl)}
+++

${data.contenido || ''}
`;

  return { filename, content, contentType: 'trabajos' };
}

/**
 * Generate content for publicaciones
 */
function generatePublicacion(data, date) {
  const slug = slugify(data.titulo);
  const filename = `content/publicaciones/${date}-${slug}.md`;

  const content = `+++
title = ${tomlString(data.titulo)}
description = ${tomlString(cleanDescription(data.descripcion))}
date = ${date}

[extra]
source = ${tomlString(data.fuente)}
url = ${tomlString(data.url)}
+++
`;

  return { filename, content, contentType: 'publicaciones' };
}

/**
 * Main function to create content from issue
 * @param {string} body - Issue body
 * @param {string[]} labels - Issue labels
 * @returns {Object} { filename, content, contentType, title }
 */
function createContent(body, labels) {
  const types = {
    'nuevo-articulo': ['categoria'],
    'nuevo-trabajo': ['categoria', 'ubicacion', 'ano'],
    'nueva-investigacion': ['tipo_de_publicacion', 'ano'],
    'nueva-publicacion': ['fuente', 'url'],
  };
  const selected = labels.filter(label => Object.hasOwn(types, label));
  if (selected.length !== 1) throw new Error('Unknown content type: selecciona un único tipo de contenido.');
  const data = parseIssueBody(body);
  for (const field of ['titulo', 'descripcion', ...types[selected[0]]]) {
    if (!data[field]?.trim()) throw new Error(`Falta un campo obligatorio: ${field}`);
  }
  if (!slugify(data.titulo)) throw new Error('El título debe contener letras o números.');
  if (!cleanDescription(data.descripcion)) throw new Error('La descripción debe contener texto.');
  const today = new Date().toISOString().split('T')[0];
  const date = data.fecha ? formatDate(data.fecha) : today;
  if (!date) throw new Error('Fecha no válida. Usa una fecha real en formato AAAA-MM-DD.');
  for (const field of ['enlace', 'url']) {
    if (data[field]) {
      let url;
      try { url = new URL(data[field]); } catch { /* rejected below */ }
      if (!url || !['https:', 'http:'].includes(url.protocol)) throw new Error(`URL no válida: ${field}`);
    }
  }

  let result;

  if (labels.includes('nuevo-articulo')) {
    result = generateArticulo(data, date);
  } else if (labels.includes('nueva-investigacion')) {
    result = generateInvestigacion(data, date);
  } else if (labels.includes('nuevo-trabajo')) {
    result = generateTrabajo(data, date);
  } else if (labels.includes('nueva-publicacion')) {
    result = generatePublicacion(data, date);
  } else {
    throw new Error('Unknown content type');
  }

  return { ...result, title: data.titulo };
}

module.exports = {
  parseIssueBody,
  tomlString,
  saveContent,
  slugify,
  extractImageUrl,
  cleanDescription,
  formatDate,
  generateArticulo,
  generateInvestigacion,
  generateTrabajo,
  generatePublicacion,
  createContent,
};
