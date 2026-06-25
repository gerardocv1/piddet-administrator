// Normaliza un texto a un identificador legible para URLs (mismo criterio que el backend con
// Str::slug($valor, '_')): minúsculas, sin diacríticos y con cada secuencia de caracteres no
// alfanuméricos colapsada a un guion bajo. Ej: "Carta Principal" → "carta_principal".
export function slugifyUsername(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita los diacríticos separados por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
