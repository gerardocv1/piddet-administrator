// Servicio: cuenta del usuario autenticado.
//
// Endpoints sobre el propio usuario (perfil, historial de sesiones, contraseña).
// Para el flujo de auth (login/refresh/sesión) usa la fachada auth (../auth/index.js), no esto.

import { http } from '../http/client.js';

export const accountService = {
  // Perfil del usuario autenticado.
  me: () => http.get('/me'),

  // Historial de sesiones del usuario autenticado (paginado → { items, pagination }).
  loginHistory: ({ page = 1, perPage = 10 } = {}) =>
    http.get(`/auth/me/login-history?page=${page}&per_page=${perPage}`, { paginated: true }),

  // Cambio de contraseña del usuario autenticado.
  changePassword: ({ currentPassword, newPassword }) =>
    http.post('/auth/me/password', { current_password: currentPassword, new_password: newPassword }),
};
