const {
  parseIssueBody,
  slugify,
  extractImageUrl,
  cleanDescription,
  formatDate,
  createContent,
} = require('./content-creator');

describe('parseIssueBody', () => {
  it('parses GitHub form sections', () => {
    const body = `### Título

Mi título

### Descripción

Mi descripción`;

    const result = parseIssueBody(body);
    expect(result.titulo).toBe('Mi título');
    expect(result.descripcion).toBe('Mi descripción');
  });

  it('normalizes accented characters in keys', () => {
    const body = `### Año

2025`;

    const result = parseIssueBody(body);
    expect(result.ano).toBe('2025');
  });

  it('handles _No response_ as empty', () => {
    const body = `### Campo

_No response_`;

    const result = parseIssueBody(body);
    expect(result.campo).toBe('');
  });
});

describe('slugify', () => {
  it('creates URL-friendly slugs', () => {
    expect(slugify('Mi Título con Acentos')).toBe('mi-titulo-con-acentos');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! World? Test.')).toBe('hello-world-test');
  });

  it('trims leading/trailing dashes', () => {
    expect(slugify('--test--')).toBe('test');
  });
});

describe('extractImageUrl', () => {
  it('extracts URL from markdown image', () => {
    const text = '![image](https://example.com/image.jpg)';
    expect(extractImageUrl(text)).toBe('https://example.com/image.jpg');
  });

  it('extracts plain URL', () => {
    const text = 'https://example.com/image.jpg';
    expect(extractImageUrl(text)).toBe('https://example.com/image.jpg');
  });

  it('strips trailing quotes', () => {
    const text = 'https://example.com/image.jpg"';
    expect(extractImageUrl(text)).toBe('https://example.com/image.jpg');
  });

  it('strips trailing parentheses', () => {
    const text = 'https://example.com/image.jpg)';
    expect(extractImageUrl(text)).toBe('https://example.com/image.jpg');
  });

  it('returns empty for null/undefined', () => {
    expect(extractImageUrl(null)).toBe('');
    expect(extractImageUrl(undefined)).toBe('');
  });

  it('handles GitHub user-attachments URL', () => {
    const text = '![image](https://github.com/user-attachments/assets/12fd43cb-ad03-440f-8bc1-8203936b9166)';
    expect(extractImageUrl(text)).toBe('https://github.com/user-attachments/assets/12fd43cb-ad03-440f-8bc1-8203936b9166');
  });
});

describe('cleanDescription', () => {
  it('removes markdown images', () => {
    const text = 'Hello ![image](url) world';
    expect(cleanDescription(text)).toBe('Hello world');
  });

  it('replaces newlines with spaces', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    expect(cleanDescription(text)).toBe('Line 1 Line 2 Line 3');
  });

  it('preserves quotes for the serializer', () => {
    const text = 'He said "hello"';
    expect(cleanDescription(text)).toBe(text);
  });

  it('collapses multiple spaces', () => {
    const text = 'Too    many   spaces';
    expect(cleanDescription(text)).toBe('Too many spaces');
  });
});

describe('formatDate', () => {
  it('pads single-digit month and day', () => {
    expect(formatDate('2025-1-5')).toBe('2025-01-05');
  });

  it('keeps already padded dates', () => {
    expect(formatDate('2025-12-25')).toBe('2025-12-25');
  });

  it('returns null for invalid dates', () => {
    expect(formatDate('invalid')).toBe(null);
    expect(formatDate('')).toBe(null);
    expect(formatDate(null)).toBe(null);
  });
});

describe('createContent', () => {
  const mockDate = '2025-01-15';

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('creates articulo content', () => {
    const body = `### Título

Test Article

### Descripción

Test description

### Fecha

2025-01-15

### Categoría

Patrimonio

### Imagen destacada

https://example.com/image.jpg

### Contenido

Article body here`;

    const result = createContent(body, ['nuevo-articulo']);

    expect(result.contentType).toBe('articulos');
    expect(result.filename).toBe('content/articulos/2025-01-15-test-article.md');
    expect(result.content).toContain('title = "Test Article"');
    expect(result.content).toContain('category = "Patrimonio"');
    expect(result.content).toContain('image = "https://example.com/image.jpg"');
  });

  it('creates investigacion content with optional fields', () => {
    const body = `### Título

Research Title

### Título original

Original Research Title

### Descripción

Research abstract

### Fecha

2025-01-15

### Tipo de publicación

Article

### Año

2025

### Coautores

John Doe, Jane Doe

### Enlace

https://researchgate.net/123`;

    const result = createContent(body, ['nueva-investigacion']);

    expect(result.contentType).toBe('investigacion');
    expect(result.content).toContain('original_title = "Original Research Title"');
    expect(result.content).toContain('coauthors = "John Doe, Jane Doe"');
    expect(result.content).toContain('url = "https://researchgate.net/123"');
  });

  it('creates investigacion without optional fields', () => {
    const body = `### Título

Research Title

### Descripción

Research abstract

### Tipo de publicación

Book

### Año

2024`;

    const result = createContent(body, ['nueva-investigacion']);

    expect(result.contentType).toBe('investigacion');
    expect(result.content).not.toContain('original_title');
    expect(result.content).not.toContain('coauthors');
    expect(result.content).not.toContain('[[extra.links]]');
  });

  it('creates publicacion content', () => {
    const body = `### Título

News Article

### Descripción

Short description

### Fecha

2025-01-15

### Fuente

El Noroeste Digital

### URL

https://news.com/article`;

    const result = createContent(body, ['nueva-publicacion']);

    expect(result.contentType).toBe('publicaciones');
    expect(result.content).toContain('source = "El Noroeste Digital"');
    expect(result.content).toContain('url = "https://news.com/article"');
  });

  it('throws for unknown content type', () => {
    expect(() => createContent('body', ['unknown-label'])).toThrow('Unknown content type');
  });
});

describe('publishing safeguards', () => {
  const { saveContent, tomlString } = require('./content-creator');
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  const form = (date = '2026-09-08') => `### Título\n\nLa casa "Azul"\\Nueva\n\n### Descripción\n\nUna descripción con "comillas"\n\n### Fecha\n\n${date}\n\n### Categoría\n\nPatrimonio\n\n### Contenido\n\nIntroducción\n\n### Historia\n\nTexto histórico\n\n### Título\n\nEste título pertenece al artículo.\n\n\`\`\`md\n### Contenido\n\nEjemplo\n\`\`\``;

  it('preserves the entire body including headings resembling form labels', () => {
    const result = createContent(form(), ['nuevo-articulo']);
    expect(result.content.split('+++')[2].trim()).toBe(form().split('### Contenido\n\n').slice(1).join('### Contenido\n\n'));
    expect(result.content).toContain(`title = ${tomlString('La casa "Azul"\\Nueva')}`);
    expect(parseIssueBody(form().replace(/\n/g, '\r\n')).contenido).toContain('### Historia');
  });

  it.each(['2026-02-29', '2026-99-99', '../../escape', '2026-01-32', '0000-01-01'])('rejects invalid date %s', date => {
    expect(() => createContent(form(date), ['nuevo-articulo'])).toThrow('Fecha no válida');
  });

  it('accepts a real leap day', () => expect(formatDate('2024-2-29')).toBe('2024-02-29'));

  it('rejects missing required data and ambiguous content types', () => {
    expect(() => createContent('### Título\n\nSolo título', ['nuevo-articulo'])).toThrow('descripcion');
    expect(() => createContent(form(), ['nuevo-articulo', 'nuevo-trabajo'])).toThrow('único');
  });

  it('does not overwrite an existing file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-save-'));
    const filename = path.join(dir, 'article.md');
    try {
      saveContent({ filename, content: 'Original' });
      expect(() => saveContent({ filename, content: 'Replacement' })).toThrow('Ya existe');
      expect(fs.readFileSync(filename, 'utf8')).toBe('Original');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
