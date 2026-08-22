// Servicio: administración de gimnasio de la compañía activa (planes de membresía; miembros y
// suscripciones se agregan en fases posteriores).
//
// Company-scoped: las rutas cuelgan de /companies/{company}/gym. Requiere la funcionalidad
// `functionality_gym` activa en la compañía y los permisos `api-module-gym-plans` (ver) /
// `gym-plans-create` / `gym-plans-edit`. Los métodos van prefijados `gym*` para no colisionar
// con otros servicios en el barril de src/lib/api.js.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/gym`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const gymService = {
  // ── Planes de membresía ─────────────────────────────────────────────────
  gymPlans: ({ status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/plans${qs({ status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymPlan: (planId) => http.get(`${base()}/plans/${planId}`),

  createGymPlan: (data) => http.post(`${base()}/plans`, data),

  updateGymPlan: (planId, data) => http.put(`${base()}/plans/${planId}`, data),

  // Activa/desactiva el plan (nunca se borra: las suscripciones ya creadas mantienen su snapshot).
  setGymPlanStatus: (planId, status) => http.put(`${base()}/plans/${planId}/status`, { status }),

  // ── Miembros ─────────────────────────────────────────────────────────────
  // Los miembros son usuarios reales de la plataforma (resueltos como "pasivos" al registrarlos,
  // mismo patrón que los huéspedes de Reservas): el backend hace find-or-create por documento o
  // celular, así que crear con los datos de alguien ya existente lo reutiliza en vez de duplicarlo.
  gymMembers: ({ status = '', search = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/members${qs({ status, _search: search, page, per_page: perPage })}`, { paginated: true }),

  gymMember: (memberId) => http.get(`${base()}/members/${memberId}`),

  createGymMember: (data) => http.post(`${base()}/members`, data),

  // Solo los datos propios del gimnasio (altura, objetivo, notas, estado); nombre y documento se
  // editan desde el perfil del usuario.
  updateGymMember: (memberId, data) => http.put(`${base()}/members/${memberId}`, data),
};
