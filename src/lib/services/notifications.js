// Servicio: avisos / notificaciones.

import { http } from '../http/client.js';

export const notificationsService = {
  notifications: () => http.get('/notificaciones'),
};
