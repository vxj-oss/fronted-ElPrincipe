import { descargarArchivoPost } from '../../utils/descargas';

const slug = (texto) =>
  (texto || 'grafico')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 50) || 'grafico';

export function descargarGraficoPdf(datos) {
  const cuerpo = {
    titulo: datos.titulo || 'Gráfico',
    grafico: datos.grafico || 'bar',
    labels: datos.labels || [],
    series: datos.series || [],
    prefijo: datos.prefijo || '',
    horizontal: Boolean(datos.horizontal),
    explicacion: datos.explicacion || null,
  };
  return descargarArchivoPost('/agent/grafico/pdf', cuerpo, `${slug(datos.titulo)}.pdf`);
}

export function descargarInformePdf(informe) {
  return descargarArchivoPost('/agent/informe/pdf', informe, `${slug(informe.titulo)}.pdf`);
}

export function descargarCanvasPng(canvas, titulo) {
  return new Promise((resolver, rechazar) => {
    const fondo = document.createElement('canvas');
    fondo.width = canvas.width;
    fondo.height = canvas.height;
    const ctx = fondo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fondo.width, fondo.height);
    ctx.drawImage(canvas, 0, 0);
    fondo.toBlob((blob) => {
      if (!blob) {
        rechazar(new Error('No se pudo generar la imagen.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${slug(titulo)}.png`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
      resolver();
    }, 'image/png');
  });
}
