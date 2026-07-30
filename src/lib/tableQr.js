// Códigos QR de mesa.
//
// El QR se pega en la mesa y lo escanea el POS para asignarla a la orden. El contenido es el
// JSON que el POS espera literalmente: { "company": "<username>", "table_id": <id> } — si cambia
// el formato, hay que cambiarlo también en el escáner del POS (TableSelectionModal).
//
// Se genera en el navegador (librería `qrcode`), así descargar o imprimir no depende del backend.

import QRCode from 'qrcode';

// Nivel H de corrección: el QR sigue leyéndose con el logo pegado encima o con desgaste.
const QR_OPTIONS = { errorCorrectionLevel: 'H', margin: 1 };

export const tableQrPayload = (companyUsername, tableId) =>
  JSON.stringify({ company: companyUsername, table_id: tableId });

export const tableQrDataUrl = (companyUsername, tableId, options = {}) =>
  QRCode.toDataURL(tableQrPayload(companyUsername, tableId), { ...QR_OPTIONS, width: 512, ...options });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const fileSafe = (name = 'mesa') => name.trim().replace(/\s+/g, '-').toLowerCase();

/** Descarga el QR de una mesa como PNG, con el nombre de la mesa y de la empresa debajo. */
export async function downloadTableQrPng(company, table) {
  const dataUrl = await tableQrDataUrl(company.username, table.id, { width: 600 });
  const qr = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 820;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qr, 50, 50, 600, 600);

  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(table.name, canvas.width / 2, 720);
  ctx.fillStyle = '#666666';
  ctx.font = '28px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(company.name || company.username, canvas.width / 2, 768);

  const link = document.createElement('a');
  link.download = `qr-${fileSafe(table.name)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Abre una ventana con la hoja de QR de todas las mesas (4 por página) y lanza el diálogo de
 * impresión: desde ahí se imprime o se guarda como PDF con el propio navegador.
 * Devuelve false si el navegador bloqueó la ventana emergente.
 */
export async function printTablesQrSheet(company, tables) {
  const sheet = window.open('', '_blank');
  if (!sheet) return false;

  sheet.document.write('<!doctype html><html><head><title>Códigos QR</title></head><body><p>Generando códigos…</p></body></html>');
  sheet.document.close();

  const cards = await Promise.all(
    tables.map(async (table) => {
      const dataUrl = await tableQrDataUrl(company.username, table.id, { width: 420 });
      return `
        <figure class="card">
          <img src="${dataUrl}" alt="QR ${table.name}" />
          <figcaption>
            <strong>${table.name}</strong>
            <span>${company.name || company.username}</span>
          </figcaption>
        </figure>`;
    })
  );

  sheet.document.open();
  sheet.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Códigos QR · ${company.name || company.username}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; }
    .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
    .card { margin: 0; padding: 6mm; border: 1px solid #ddd; border-radius: 6mm; text-align: center;
            break-inside: avoid; page-break-inside: avoid; }
    .card img { width: 100%; max-width: 78mm; height: auto; }
    figcaption { margin-top: 4mm; display: flex; flex-direction: column; gap: 1mm; }
    figcaption strong { font-size: 16pt; }
    figcaption span { font-size: 10pt; color: #666; }
    /* Cada 4 tarjetas empieza página nueva (2 columnas × 2 filas). */
    .card:nth-child(4n + 1) { page-break-before: always; }
    .card:first-child { page-break-before: auto; }
  </style>
</head>
<body>
  <div class="sheet">${cards.join('')}</div>
  <script>window.onload = function () { window.focus(); window.print(); };<\/script>
</body>
</html>`);
  sheet.document.close();
  return true;
}
