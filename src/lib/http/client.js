// Singleton del cliente HTTP + cableado con el tokenManager.
//
// Aquí se construye la única instancia de HttpClient y se inyectan mutuamente client y
// tokenManager. Centralizar el wiring en este módulo evita imports circulares: ni HttpClient
// ni tokenManager se importan entre sí, solo se enlazan en tiempo de ejecución.

import { HttpClient } from './HttpClient.js';
import { tokenManager } from '../auth/tokenManager.js';
import { resolveMock } from '../../data/mock.js';

const BASE = import.meta.env.VITE_API_URL || '';
export const USE_MOCK = !BASE;

export const http = new HttpClient({
  baseURL: BASE,
  useMock: USE_MOCK,
  resolveMock,
});

// Cableado bidireccional.
http.attachTokenManager(tokenManager);
tokenManager.attachClient(http);

export { tokenManager };
