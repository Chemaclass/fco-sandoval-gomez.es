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
