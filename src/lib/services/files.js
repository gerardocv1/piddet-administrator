// Servicio: archivos (subida a S3) de la compañía activa.
//
// Company-scoped. Sube imágenes/documentos a S3 vía multipart/form-data y devuelve el `name`
// (nombre de referencia) que luego se guarda en la entidad correspondiente (p. ej. items.image).
// Soporta visibilidad pública o privada: las privadas se sirven con URL firmada temporal.
//
// Respuesta de upload (ya desempaquetada): { name, original_name, visibility, ext, size, url,
//   thumbnail_url, expires_at? }.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}`;
};

export const filesService = {
  // Sube un archivo a S3. folder ∈ {general, items, menus, categories, documents, expenses}; visibility ∈ {public, private}.
  uploadFile: (file, { folder = 'general', visibility = 'private' } = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    if (folder) fd.append('folder', folder);
    if (visibility) fd.append('visibility', visibility);
    return http.post(`${base()}/files`, fd);
  },
  // URL (firmada si es privada) de un archivo por su `name`.
  fileUrl: (name) => http.get(`${base()}/files/url?name=${encodeURIComponent(name)}`),
  deleteFile: (name) => http.del(`${base()}/files?name=${encodeURIComponent(name)}`),
};
