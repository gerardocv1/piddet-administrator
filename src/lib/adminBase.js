// Prefijo bajo el que se monta el panel administrativo (ver `basename` en App.jsx). Las URLs que
// NO pasan por el router de React (p. ej. `window.open`) deben anteponerlo manualmente, porque el
// `basename` solo lo aplica la navegación interna del router.
export const ADMIN_BASE = '/admin';
