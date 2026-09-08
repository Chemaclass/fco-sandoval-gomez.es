const { publicationStatus } = require('./publication-status');
const options = { pageUrl: 'https://example.com/article/', runUrl: 'https://github.com/example/actions/runs/1' };
test('never closes a failed deployment even when all translations exist', () => {
  const result = publicationStatus({ ...options, deployed: false, languages: 'es,en,it' });
  expect(result.state).toBe('open');
  expect(result.body).not.toContain('Contenido publicado');
});
test('reports only successfully deployed languages and keeps partial translation open', () => {
  const result = publicationStatus({ ...options, deployed: true, languages: 'es,it' });
  expect(result.state).toBe('open');
  expect(result.body).toContain('ES, IT');
  expect(result.body).toContain(options.pageUrl);
});
test('closes only confirmed complete publication', () => {
  expect(publicationStatus({ ...options, deployed: true, languages: 'es,en,it' }).state).toBe('closed');
});
