// Servicio: importación de carta desde fotos (agente IA) — company-scoped como menus.js.
//
// El agente no escribe nada: procesa las fotos de forma asíncrona (job + webhook en el backend)
// y devuelve un JSON que el panel muestra en una pantalla de revisión editable. `status` es un
// polling ligero ({status, failure_reason}); `detail` trae el resultado completo del agente una
// vez `completed`. `confirm` envía la revisión editada y crea items + menú en el backend.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

export const menuImportsService = {
  // Crea la importación: sube antes las fotos con MultiImageUpload.uploadAll() y pasa sus `name`.
  createMenuImport: ({ fileNames, menuName }) =>
    http.post(`${base()}/menu-imports`, { file_names: fileNames, menu_name: menuName }),
  // Polling ligero de estado: { status: pending|running|completed|failed|confirmed|cancelled, failure_reason }.
  // Sondeo de fondo del asistente: `silent` para que no encienda el indicador global cada 4 s
  // (la pantalla ya explica que la IA está analizando).
  menuImportStatus: (id) => http.get(`${base()}/menu-imports/${id}/status`, { silent: true }),
  // Detalle completo, con el resultado del agente una vez `completed` (forma del output schema).
  menuImport: (id) => http.get(`${base()}/menu-imports/${id}`),
  // Confirma la revisión editada: crea items + menú y devuelve { created_menu_id }.
  confirmMenuImport: (id, payload) => http.post(`${base()}/menu-imports/${id}/confirm`, payload),
  // Reintenta una importación fallida (nueva ejecución del agente).
  retryMenuImport: (id) => http.post(`${base()}/menu-imports/${id}/retry`),
  // Cancela una importación en curso.
  cancelMenuImport: (id) => http.del(`${base()}/menu-imports/${id}`),
};
