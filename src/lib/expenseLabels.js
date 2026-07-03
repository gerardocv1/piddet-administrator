// Helpers del módulo de gastos: formato de moneda y límites de fecha por defecto. Los métodos
// de pago se cargan del catálogo del backend (GET /payment-methods), no se queman aquí.

// Formato de moneda local (los montos llegan canónicos: "295000.00").
export const expenseMoney = (value) =>
  '$ ' + Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

// Primer día del mes actual en ISO local (rango por defecto del listado y el resumen).
export const monthStartIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
