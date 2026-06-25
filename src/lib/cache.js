// Caché en memoria con expiración (TTL) y clave compuesta.
//
// Cada entrada guarda el valor y el instante de vencimiento; al leer una entrada vencida se
// descarta. Pensado para datos que cambian poco y se consultan a menudo (p. ej. opciones de
// filtros por compañía), evitando re-consultar el backend en cada visita a la pantalla.

export function createTtlCache(ttlMs) {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) { store.delete(key); return undefined; }
      return entry.value;
    },
    set(key, value) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    delete(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}
