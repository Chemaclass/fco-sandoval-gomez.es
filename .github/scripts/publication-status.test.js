const { publicationStatus } = require('./publication-status');
const options = { pageUrl: 'https://example.com/article/', runUrl: 'https://github.com/example/actions/runs/1' };
test('never closes a failed deployment', () => {
  const result = publicationStatus({ ...options, deployed: false });
  expect(result.state).toBe('open');
  expect(result.body).not.toContain('Contenido publicado');
  expect(result.body).toContain(options.runUrl);
});
test('closes a confirmed deployment and links the page', () => {
  const result = publicationStatus({ ...options, deployed: true });
  expect(result.state).toBe('closed');
  expect(result.body).toContain(options.pageUrl);
  expect(result.body).not.toMatch(/traducci|idiomas/i);
});
