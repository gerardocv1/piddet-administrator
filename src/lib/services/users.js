// Servicio: usuarios.

import { http } from '../http/client.js';

export const usersService = {
  users: () => http.get('/usuarios'),
  createUser: (data) => http.post('/usuarios', data),
};
