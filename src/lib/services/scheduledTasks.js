// Servicio: bitácora de ejecuciones del scheduler (tareas programadas).
//
// Las rutas cuelgan de /companies/{company}/scheduled-tasks por convención del backend, pero
// lo que devuelven NO es de la compañía activa: los comandos recorren todas. Por eso el
// permiso que las abre (`api-module-scheduled-tasks`) es de plataforma, solo super-admin.

import { http } from '../http/client.js';
import { auth } from '../auth/index.js';

const base = () => {
  const c = auth.getCompany();
  return `/companies/${c?.username ?? c?.id}/scheduled-tasks`;
};

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const scheduledTasksService = {
  // Última corrida de cada comando + días de retención. Encabeza la pantalla.
  getScheduledTasksStatus: () => http.get(`${base()}/status`),
  // Listado paginado, más recientes primero. { command, status, dateFrom, dateTo, page }
  getScheduledTaskRuns: ({ command = '', status = '', dateFrom = '', dateTo = '', page = 1, perPage = 15 } = {}) =>
    http.get(`${base()}/runs${qs({ command, status, date_from: dateFrom, date_to: dateTo, page, per_page: perPage })}`, { paginated: true }),
  // Detalle de una corrida (con el error completo).
  getScheduledTaskRun: (runId) => http.get(`${base()}/runs/${runId}`),
  // Lanza una tarea a mano: cuando el cron no corrió o la hora se pasó. No espera a que termine
  // (puede tardar minutos): devuelve la corrida "en cola" y la bitácora la sigue.
  // { command, dryRun, force, date, companyId, days } — `dryRun` y `force` solo en las tareas que
  // notifican: `force` vuelve a avisar a quien ya figura como avisado (el log lo marcó pero el
  // SMS no salió).
  runScheduledTask: ({ command, dryRun = false, force = false, date = '', companyId = '', days = '' } = {}) =>
    http.post(`${base()}/run`, {
      command,
      ...(dryRun ? { dry_run: true } : {}),
      ...(force ? { force: true } : {}),
      ...(date ? { date } : {}),
      ...(companyId ? { company_id: Number(companyId) } : {}),
      ...(days ? { days: Number(days) } : {}),
    }),
};
