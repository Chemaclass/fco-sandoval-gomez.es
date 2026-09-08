const { translateContent, translateAndSave, DEFAULT_MODEL } = require('./translator');
const source = '+++\ntitle = "La casa \\"Azul\\""\ndescription = "Resumen"\ndate = 2026-09-08\n[extra]\ncategory = "Patrimonio"\n+++\n\n### Historia\n\nTexto [fuente](https://example.com).';
const responseText = 'TITLE: The "Blue" house\n\nDESCRIPTION: Summary $1\n\nBODY:\n### History\n\nText [source](https://example.com).';
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function mockResponse(text = responseText, stop = 'end_turn') {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ stop_reason: stop, content: [{ type: 'text', text }] }) });
}

test.each(['en', 'it'])('uses the shared supported model for %s and safely saves translated metadata', async lang => {
  mockResponse();
  const translated = await translateContent(source, lang, 'test-key');
  const request = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(request.model).toBe(DEFAULT_MODEL);
  expect(request.messages[0].content).toContain('La casa "Azul"');
  expect(translated).toContain('title = "The \\"Blue\\" house"');
  expect(translated).toContain('description = "Summary $1"');
  expect(translated).toContain('https://example.com');
});

test.each([
  ['truncated response', responseText, 'max_tokens'],
  ['missing body', 'TITLE: Translation\n\nDESCRIPTION: Summary', 'end_turn'],
  ['empty response', '', 'end_turn'],
])('never writes %s', async (_name, text, stop) => {
  mockResponse(text, stop);
  const fs = { readFileSync: () => source, writeFileSync: jest.fn() };
  await expect(translateAndSave('content/articulos/post.md', 'en', 'test-key', fs)).rejects.toThrow();
  expect(fs.writeFileSync).not.toHaveBeenCalled();
});

test('reports provider failures without saving a translation', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, text: async () => 'Rate limit' });
  await expect(translateContent(source, 'en', 'test-key')).rejects.toThrow('429');
});

test.each([
  ['missing image', '![](https://example.com/photo.jpg)', '[images remain the same]'],
  ['changed image URL', '![](https://example.com/photo.jpg)', '![](https://example.com/other.jpg)'],
  ['missing repeated image', '![](https://example.com/a.jpg)\n![](https://example.com/a.jpg)', '![](https://example.com/a.jpg)'],
  ['changed gallery path', '{% gallery(id="a") %}\nimages/a.jpg\n{% end %}', '{% gallery(id="a") %}\nimages/b.jpg\n{% end %}'],
  ['changed shortcode', '{{ youtube(id="original") }}', '{{ youtube(id="changed") }}'],
])('never saves a translation with %s', async (_name, body, translatedBody) => {
  const content = `+++\ntitle = "Título"\n+++\n\n${body}`;
  mockResponse(`TITLE: Title\n\nBODY:\n${translatedBody}`);
  const fs = { readFileSync: () => content, writeFileSync: jest.fn() };
  await expect(translateAndSave('post.md', 'en', 'test-key', fs)).rejects.toThrow('Translation changed');
  expect(fs.writeFileSync).not.toHaveBeenCalled();
});

test('preserves media while translating its alternative text', async () => {
  mockResponse('TITLE: Title\n\nBODY:\n![Restored interior](/images/interior.jpg)');
  await expect(translateContent('+++\ntitle = "Título"\n+++\n\n![Interior restaurado](/images/interior.jpg)', 'en', 'test-key')).resolves.toContain('![Restored interior]');
});

test.each([['Artículo', 'en', 'Article'], ['Capítulo de Libro', 'it', 'Capitolo di Libro'], ['Rehabilitación', 'it', 'RECUPERO']])('localizes category %s into %s', async (category, lang, expected) => {
  mockResponse('TITLE: Title');
  await expect(translateContent(`+++\ntitle = "Título"\n[extra]\ncategory = "${category}"\n+++\n`, lang, 'test-key')).resolves.toContain(`category = "${expected}"`);
});

test.each([['en', 'contact'], ['it', 'contatto']])('keeps the contact redirect in %s', async (lang, anchor) => {
  mockResponse('TITLE: Contact');
  const content = '+++\ntitle = "Contacto"\ntemplate = "redirect.html"\n[extra]\nredirect_to = "/sobre-mi/#contacto"\n+++\n';
  await expect(translateContent(content, lang, 'test-key')).resolves.toContain(`redirect_to = "/${lang}/sobre-mi/#${anchor}"`);
});
