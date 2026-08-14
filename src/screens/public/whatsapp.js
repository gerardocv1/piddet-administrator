// Enlace de WhatsApp para las vistas públicas. Es el canal de contacto que usan las compañías
// (más que la llamada), así que va como acción principal en la portada y en el hospedaje.

/**
 * Construye el enlace wa.me a partir de un número en cualquier formato ("+57 300 123 4567",
 * "573001234567") y un mensaje ya redactado. Devuelve null si no hay número utilizable, para que
 * quien lo use pueda ocultar la acción en vez de pintar un enlace roto.
 */
export function whatsappHref(number, text = '') {
  const digits = String(number || '').replace(/\D+/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
