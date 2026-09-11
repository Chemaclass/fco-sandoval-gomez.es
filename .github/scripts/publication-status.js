function publicationStatus({ deployed, pageUrl, runUrl }) {
  if (!deployed) return {
    state: 'open',
    body: `No se ha confirmado la publicación. El contenido guardado se conserva. [Revisa la ejecución](${runUrl}) y vuelve a ejecutarla cuando se haya corregido el error.`,
  };
  return {
    state: 'closed',
    body: `Contenido publicado: [ver la página](${pageUrl}).\n\n[Detalles de la publicación](${runUrl})`,
  };
}
module.exports = { publicationStatus };
