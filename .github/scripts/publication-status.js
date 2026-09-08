function publicationStatus({ deployed, languages, pageUrl, runUrl }) {
  const available = ['es', 'en', 'it'].filter(lang => languages.split(',').includes(lang));
  if (!deployed) return {
    state: 'open',
    body: `No se ha confirmado la publicación. El contenido guardado se conserva. [Revisa la ejecución](${runUrl}) y vuelve a ejecutarla cuando se haya corregido el error.`,
  };
  const complete = available.length === 3;
  return {
    state: complete ? 'closed' : 'open',
    body: `Contenido publicado: [ver la página](${pageUrl}).\n\nIdiomas disponibles: ${available.map(lang => lang.toUpperCase()).join(', ')}.${complete ? '' : '\n\nQuedan traducciones pendientes. Revisa la ejecución y vuelve a ejecutarla para reintentarlas; no abras otro formulario.'}\n\n[Detalles de la publicación](${runUrl})`,
  };
}
module.exports = { publicationStatus };
