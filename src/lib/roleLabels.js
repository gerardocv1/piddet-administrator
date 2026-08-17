// Etiqueta corta de un rol para la interfaz.
//
// El catálogo de roles (/permissions/roles) devuelve el nombre técnico (`role-cashier`) y una
// descripción que es una frase larga ("Este role permite facturar…"), no sirve como etiqueta. El
// módulo de usuarios sí recibe `label` del backend; aquí se replica el mismo criterio para las
// pantallas que trabajan contra el catálogo: nombre sin el prefijo `role-` y capitalizado.

const LABELS = {
  'super-admin': 'Superadministrador',
  client: 'Cliente',
  employee: 'Empleado',
  admin: 'Administrador',
  manager: 'Gerente',
  waiter: 'Mesero',
  cashier: 'Cajero',
  cook: 'Cocinero',
  'role-waiter': 'Mesero',
  'role-cashier': 'Cajero',
  'role-cook': 'Cocinero',
};

export function roleLabel(name = '') {
  if (LABELS[name]) return LABELS[name];
  const clean = name.replace(/^role-/, '').replace(/-/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
