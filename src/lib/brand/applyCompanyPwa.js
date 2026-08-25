// Identidad INSTALABLE de la app (nombre e icono en la pantalla de inicio) para los cambios en
// caliente: cambiar de compañía, guardar el perfil o cerrar sesión.
//
// La lógica NO vive aquí, sino en el script en línea del <head> de index.html, que la expone en
// `window.__piddetPwa`. El motivo es de tiempo, no de gusto: Safari toma el nombre de «Agregar a
// Inicio» del web app manifest y lo fija al cargar el documento, así que el <link rel="manifest">
// tiene que ser ya el de la compañía cuando el navegador lo mira por primera vez. Este bundle es
// un módulo y va diferido: llegaría tarde. Ver el comentario largo en index.html.
//
// Este archivo solo reenvía, para no duplicar la construcción del manifest en dos sitios.

/**
 * Reaplica la identidad de la compañía. Con `null` (sin sesión) restaura la de Piddet.
 * No hace nada si el script del <head> no llegó a correr: en ese caso el documento se queda con
 * la identidad por defecto, que es el comportamiento correcto.
 */
export function applyCompanyPwa(company) {
  window.__piddetPwa?.apply(company || null);
}
