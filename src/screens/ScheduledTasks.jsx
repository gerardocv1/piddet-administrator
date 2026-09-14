import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, FilterBar, Pagination, RefreshButton, Alert, Modal, Spinner, Button, Input, Checkbox, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import {
  runStatusOf, RUN_STATUS_OPTIONS, commandOf, COMMAND_OPTIONS,
  summaryLabel, formatDuration, formatDateTime, originLabel, isRunActive,
} from '../lib/scheduledTaskLabels.js';
import s from './screens.module.css';
import t from './ScheduledTasks.module.css';

const EMPTY = { items: [], pagination: null };
const EMPTY_STATUS = { commands: [], retention_days: null, dry_run_commands: [], force_commands: [] };

// Mientras haya una corrida en cola o en curso, la pantalla se refresca sola: es el seguimiento de
// la tarea que acaban de lanzar, que no responde al instante (puede tardar minutos).
const POLL_MS = 4000;

// Cuánto tiempo se sigue una tarea lanzada desde aquí. Pasado ese rato, a actualizar a mano: hay
// tareas que tardan más, pero nadie se queda mirando la pantalla cinco minutos.
const POLL_WINDOW_MS = 5 * 60 * 1000;

// Bitácora del scheduler: qué tarea corrió, cuándo, cuánto tardó y qué hizo, y el botón para
// lanzarla a mano cuando el cron no corrió o la hora se pasó. Los filtros y la página viven en la
// URL para que compartir el enlace lleve a la misma consulta.
//
// Lo que se ve NO es de la compañía activa: los comandos recorren todas. Por eso la ruta va
// gateada con `api-module-scheduled-tasks`, que solo tiene el super-admin, y por eso lanzar una
// tarea desde aquí afecta a todas las compañías salvo que se acote.
export function ScheduledTasks() {
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const command = params.get('command') || '';
  const status = params.get('status') || '';
  const dateFrom = params.get('date_from') || '';
  const dateTo = params.get('date_to') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [selected, setSelected] = React.useState(null);
  // Tarea que se va a lanzar: { command, dryRun }. El modal pide las opciones antes de correr.
  const [launching, setLaunching] = React.useState(null);
  // Las tarjetas de estado por tarea viven en un modal: en la página ocupaban media pantalla y
  // lo que se viene a mirar casi siempre es la bitácora.
  const [tasksOpen, setTasksOpen] = React.useState(false);
  // Hasta cuándo seguir releyendo sola la pantalla tras lanzar una tarea (ver el efecto de abajo).
  const [pollUntil, setPollUntil] = React.useState(0);

  const setQuery = (next, nextPage = 1) => {
    const q = { command, status, date_from: dateFrom, date_to: dateTo, ...next };
    const clean = {};
    Object.entries(q).forEach(([k, v]) => { if (v) clean[k] = v; });
    if (nextPage > 1) clean.page = String(nextPage);
    setParams(clean);
  };

  const statusFetcher = React.useCallback(() => api.getScheduledTasksStatus(), []);
  const { data: taskStatus, setData: setTaskStatus, loading: statusLoading, reload: reloadStatus } = useResource(statusFetcher, EMPTY_STATUS, []);

  const fetcher = React.useCallback(
    () => api.getScheduledTaskRuns({ command, status, dateFrom, dateTo, page }),
    [command, status, dateFrom, dateTo, page]
  );
  const { data, setData, loading, error, reload } = useResource(fetcher, EMPTY, [command, status, dateFrom, dateTo, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  // Una corrida recién lanzada pasa de "en cola" a "en curso" y a su resultado sin avisar: hasta
  // que no quede ninguna viva, la pantalla se relee sola en vez de dejar al usuario dándole a
  // actualizar. Se mira también el estado de las tarjetas por si la corrida viva cayó fuera de la
  // página o del filtro que está mirando.
  //
  // El sondeo dura un rato acotado desde que se lanzó (POLL_WINDOW_MS) y no arranca solo: una
  // corrida que murió a mitad se queda "en curso" para siempre, y no puede dejar la pantalla
  // releyendo sin fin a quien solo vino a mirar la bitácora.
  const hasActiveRun = rows.some((r) => isRunActive(r.status))
    || (taskStatus.commands || []).some((c) => isRunActive(c.status));

  // Relee en silencio: `reload` pondría la tabla en "Cargando…" cada cuatro segundos y el usuario
  // vería parpadear la bitácora en vez de ver avanzar su corrida.
  const silentRefresh = React.useCallback(() => {
    api.getScheduledTaskRuns({ command, status, dateFrom, dateTo, page }).then(setData).catch(() => {});
    api.getScheduledTasksStatus().then(setTaskStatus).catch(() => {});
  }, [command, status, dateFrom, dateTo, page, setData, setTaskStatus]);

  React.useEffect(() => {
    if (!hasActiveRun || pollUntil <= Date.now()) return undefined;
    const id = setInterval(() => {
      if (Date.now() > pollUntil) { clearInterval(id); return; }
      silentRefresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [hasActiveRun, pollUntil, silentRefresh]);

  const canTest = (cmd) => (taskStatus.dry_run_commands || []).includes(cmd);
  const canForce = (cmd) => (taskStatus.force_commands || []).includes(cmd);

  const launch = async (values) => {
    const meta = commandOf(launching.command);
    try {
      await api.runScheduledTask({ command: launching.command, dryRun: launching.dryRun, ...values });
      setLaunching(null);
      // Se cierra también la lista de tareas: lo que sigue es ver avanzar la corrida en la bitácora.
      setTasksOpen(false);
      setPollUntil(Date.now() + POLL_WINDOW_MS);
      toast({
        tone: 'success',
        title: launching.dryRun
          ? `Prueba de «${meta.label}» en cola: aparece abajo al terminar`
          : `«${meta.label}» en cola: aparece abajo al terminar`,
      });
      reload();
      reloadStatus();
    } catch (e) {
      // 409 (ya está corriendo) y 400 (opción inválida) traen su propio mensaje del backend.
      toast({ tone: 'danger', title: e?.message || 'No se pudo lanzar la tarea.' });
      throw e;
    }
  };

  const columns = [
    { key: 'started_at', header: 'Ejecución', width: 150, render: (r) => formatDateTime(r.started_at) },
    {
      key: 'command', header: 'Tarea', width: 200,
      render: (r) => <span className={s.cellStrong}>{commandOf(r.command).label}</span>,
    },
    {
      key: 'status', header: 'Resultado', width: 120,
      render: (r) => { const st = runStatusOf(r.status); return <Badge variant={st.variant} dot>{st.label}</Badge>; },
    },
    { key: 'duration_ms', header: 'Duración', width: 120, align: 'right', render: (r) => formatDuration(r.duration_ms) },
    {
      // En el teléfono la tabla hace scroll horizontal (patrón de DataTable) y esta columna
      // queda cortada; el detalle completo está a un toque, en el modal de la fila.
      key: 'summary', header: 'Qué hizo', ellipsis: true,
      render: (r) => (r.status === 3
        ? <span title={r.error || ''}>{r.error || <span className={s.faint}>—</span>}</span>
        : <SummaryCell summary={r.summary} />),
    },
  ];

  const filters = [
    { key: 'command', type: 'select', label: 'Tarea', icon: 'fas fa-clock', options: COMMAND_OPTIONS },
    { key: 'status', type: 'select', label: 'Resultado', icon: 'fas fa-filter', options: RUN_STATUS_OPTIONS },
    { key: 'range', type: 'daterange', label: 'Fechas', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to' },
  ];

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <Button variant="primary" icon="fas fa-list-check" onClick={() => setTasksOpen(true)} disabled={statusLoading}>
          Tareas y ejecución manual
        </Button>
        <TasksHealthText commands={taskStatus.commands} loading={statusLoading} />
      </div>

      <FilterBar
        filters={filters}
        values={{ command, status, date_from: dateFrom, date_to: dateTo }}
        onChange={(next) => setQuery({
          command: next.command || '',
          status: next.status || '',
          date_from: next.date_from || '',
          date_to: next.date_to || '',
        })}
        actions={
          <>
            <RefreshButton loading={loading} onClick={reload} />
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin ejecuciones' : `${pg.total} ejecución${pg.total === 1 ? '' : 'es'}`}
              </p>
            )}
          </>
        }
      />

      {error ? (
        <Alert tone="danger" title="No se pudieron cargar las ejecuciones">{error}</Alert>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            empty="No hay ejecuciones con el filtro actual."
            onRowClick={(r) => setSelected(r)}
          />
        </Card>
      )}

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}

      {taskStatus.retention_days ? (
        <p className={s.toolbarText}>
          Se conservan las ejecuciones de los últimos {taskStatus.retention_days} días.
        </p>
      ) : null}

      {selected && <RunDetailModal run={selected} onClose={() => setSelected(null)} />}
      {tasksOpen && (
        <TasksModal
          commands={taskStatus.commands || []}
          loading={statusLoading}
          canTest={canTest}
          onLaunch={(command, dryRun) => setLaunching({ command, dryRun })}
          onClose={() => setTasksOpen(false)}
        />
      )}
      {launching && (
        <LaunchModal
          command={launching.command}
          dryRun={launching.dryRun}
          canForce={canForce(launching.command)}
          onSubmit={launch}
          onClose={() => setLaunching(null)}
        />
      )}
    </div>
  );
}

// De un vistazo, sin abrir el modal: cuántas tareas fallaron en su última corrida o nunca han
// corrido, que es lo que delata un cron sin poner o un worker caído.
function TasksHealthText({ commands, loading }) {
  if (loading) return <p className={s.toolbarText}>Cargando estado de las tareas…</p>;
  const list = commands || [];
  if (!list.length) return null;
  const never = list.filter((c) => c.status == null).length;
  const failed = list.filter((c) => c.status === 3).length;
  const running = list.filter((c) => isRunActive(c.status)).length;
  const parts = [];
  if (running) parts.push(`${running} en curso`);
  if (failed) parts.push(`${failed} fallida${failed === 1 ? '' : 's'} en su última corrida`);
  if (never) parts.push(`${never} nunca ${never === 1 ? 'ha' : 'han'} corrido`);
  return (
    <p className={s.toolbarText}>
      {list.length} tareas{parts.length ? ` · ${parts.join(' · ')}` : ' · todas bien en su última corrida'}
    </p>
  );
}

// Las tarjetas de estado por tarea, con sus botones de lanzar. Sin corridas, la tarjeta lo dice:
// eso es "nunca ha corrido", que es justo lo que hay que ver cuando el cron no está puesto.
function TasksModal({ commands, loading, canTest, onLaunch, onClose }) {
  return (
    <Modal open title="Tareas programadas" subtitle="Última corrida de cada una y ejecución manual" onClose={onClose} size="lg">
      {loading ? (
        <Spinner center label="Cargando estado de las tareas…" />
      ) : (
        <div className={t.status}>
          {commands.map((c) => (
            <TaskStatusCard
              key={c.command}
              run={c}
              canTest={canTest(c.command)}
              busy={isRunActive(c.status)}
              onLaunch={(dryRun) => onLaunch(c.command, dryRun)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function TaskStatusCard({ run, canTest, busy, onLaunch }) {
  const meta = commandOf(run.command);
  const st = runStatusOf(run.status);

  return (
    <div className={t.statusCard}>
      <div className={t.statusHead}>
        <div>
          <p className={t.statusName}>{meta.label}</p>
          <p className={t.statusDetail}>{meta.detail}</p>
        </div>
        <Badge variant={st.variant} dot>{st.label}</Badge>
      </div>
      <div className={t.statusFoot}>
        {meta.schedule && <span className={t.schedule}><i className="fas fa-clock" />{meta.schedule}</span>}
        <span>{run.started_at ? `Última: ${formatDateTime(run.started_at)}` : 'Nunca ha corrido'}</span>
      </div>
      {/* Lanzarla a mano: para cuando el cron no corrió o la hora se pasó. Mientras hay una
          corrida viva los botones se apagan, porque el backend rechaza la segunda. */}
      <div className={t.statusActions}>
        <Button size="sm" variant="secondary" icon="fas fa-play" disabled={busy}
          onClick={() => onLaunch(false)}>Ejecutar ahora</Button>
        {canTest && (
          <Button size="sm" variant="link" icon="fas fa-flask" disabled={busy}
            onClick={() => onLaunch(true)}>Probar</Button>
        )}
      </div>
    </div>
  );
}

// Opciones antes de lanzar. Se abre siempre —incluso sin opciones que llenar— porque estas tareas
// corren sobre TODAS las compañías: el modal es la pausa que convierte un clic en una decisión.
function LaunchModal({ command, dryRun, canForce, onSubmit, onClose }) {
  const meta = commandOf(command);
  const [date, setDate] = React.useState('');
  const [companyId, setCompanyId] = React.useState('');
  const [days, setDays] = React.useState('');
  const [force, setForce] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const supportsDays = command === 'sales:aggregate-item-stats';

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({ date, companyId, days: supportsDays ? days : '', force: canForce && force });
    } catch {
      // El error ya se mostró como toast; el modal se queda abierto para corregir y reintentar.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={dryRun ? `Probar «${meta.label}»` : `Ejecutar «${meta.label}»`}
      subtitle={command}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" icon={dryRun ? 'fas fa-flask' : 'fas fa-play'}
            loading={saving} onClick={submit}>
            {dryRun ? 'Probar' : 'Ejecutar ahora'}
          </Button>
        </>
      )}
    >
      <div className={t.launch}>
        {dryRun ? (
          <Alert tone="info" title="Modo prueba">
            Calcula a quién le llegaría el aviso y con qué texto, pero <b>no envía nada</b> y no
            marca a nadie como avisado: puedes repetirla y después ejecutarla de verdad.
          </Alert>
        ) : (
          <Alert tone="warning" title="Se ejecuta de verdad">
            {meta.detail}. Corre sobre <b>todas las compañías</b> salvo que acotes una abajo.
          </Alert>
        )}

        <Input label="Fecha (opcional)" type="date" icon="fas fa-calendar" value={date}
          onChange={(e) => setDate(e.target.value)}
          hint="Vacío: la fecha que usa la tarea por su cuenta." />
        <Input label="Compañía (opcional)" type="number" icon="fas fa-building" value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="Id de la compañía"
          hint="Vacío: todas, como el cron." />
        {supportsDays && (
          <Input label="Días hacia atrás (opcional)" type="number" icon="fas fa-clock-rotate-left"
            value={days} onChange={(e) => setDays(e.target.value)}
            hint="Reprocesa los N días anteriores a la fecha (cargas históricas)." />
        )}

        {/* La tarea marca "avisado" ANTES de enviar; si el SMS no salió (pasarela caída, llave mal
            puesta), la siguiente corrida ve "ya avisadas" y no manda nada. Forzar salta esa guarda. */}
        {canForce && (
          <div className={t.force}>
            <Checkbox
              label={dryRun ? 'Incluir en la prueba a quien ya figura como avisado' : 'Volver a avisar a quien ya figura como avisado (forzar)'}
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
            />
            <p className={t.forceHint}>
              {dryRun
                ? 'Muestra también los mensajes que la tarea daría por ya enviados.'
                : 'Para cuando la corrida anterior contó «ya avisadas» pero los mensajes nunca salieron. El destinatario que sí lo recibió lo recibirá otra vez.'}
            </p>
            {force && !dryRun && (
              <Alert tone="danger" title="Se repiten envíos">
                Todo lo que hoy figura como avisado vuelve a salir y se cobra de nuevo. Si dudas,
                pruébalo primero con «Probar» y esta misma casilla.
              </Alert>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Contadores del `summary` en una línea. La fecha procesada se omite: ya está en la columna
// de ejecución y aquí solo compite con lo que interesa.
function SummaryCell({ summary }) {
  // `preview` (la lista de mensajes de una prueba) se ve en el detalle, no en una celda.
  const pairs = Object.entries(summary || {}).filter(([key]) => key !== 'date' && key !== 'preview');
  if (!pairs.length) return <span className={s.faint}>—</span>;

  return (
    <span className={t.summaryCell}>
      {pairs.map(([key, value]) => (
        <span key={key} className={t.summaryPair}>{summaryLabel(key)} <b>{value}</b></span>
      ))}
    </span>
  );
}

function RunDetailModal({ run, onClose }) {
  const meta = commandOf(run.command);
  const st = runStatusOf(run.status);
  // La previsualización de una prueba es una lista de mensajes: se muestra aparte, no como campo.
  const preview = Array.isArray(run.summary?.preview) ? run.summary.preview : [];
  const summaryPairs = Object.entries(run.summary || {}).filter(([key]) => key !== 'preview');
  // `--dry-run` y `--force` no se repiten como opción: «Modo» y «Forzada» ya lo dicen con letras.
  const optionPairs = Object.entries(run.options || {}).filter(([key]) => key !== 'dry-run' && key !== 'force');

  return (
    <Modal open title={meta.label} subtitle={run.command} onClose={onClose} size="lg">
      <div className={t.detail}>
        <div className={t.detailGrid}>
          <Field label="Resultado"><Badge variant={st.variant} dot>{st.label}</Badge></Field>
          <Field label="Duración">{formatDuration(run.duration_ms)}</Field>
          <Field label="Inicio">{formatDateTime(run.started_at)}</Field>
          <Field label="Fin">{run.finished_at ? formatDateTime(run.finished_at) : '—'}</Field>
          <Field label="Origen">
            {originLabel(run.origin)}{run.triggered_by_name ? ` · ${run.triggered_by_name}` : ''}
          </Field>
          {run.dry_run ? <Field label="Modo"><Badge variant="info">Prueba (no se envió nada)</Badge></Field> : null}
          {run.options?.force ? <Field label="Forzada"><Badge variant="warning">Volvió a avisar lo ya marcado</Badge></Field> : null}
          {run.company_id ? <Field label="Compañía acotada">{run.company_id}</Field> : null}
          {run.host ? <Field label="Servidor">{run.host}</Field> : null}
        </div>

        {optionPairs.length > 0 && (
          <div className={t.detailGrid}>
            {optionPairs.map(([key, value]) => (
              <Field key={key} label={`Opción --${key}`}>{String(value)}</Field>
            ))}
          </div>
        )}

        {summaryPairs.length > 0 && (
          <div className={t.detailGrid}>
            {summaryPairs.map(([key, value]) => (
              <Field key={key} label={summaryLabel(key)}>{String(value)}</Field>
            ))}
          </div>
        )}

        {preview.length > 0 && (
          <div className={t.field}>
            <span className={t.fieldLabel}>Mensajes que habrían salido</span>
            <ul className={t.preview}>
              {preview.map((item, i) => (
                <li key={i} className={t.previewItem}>
                  <span className={t.previewTo}>{item.name || '—'}{item.to ? ` · ${item.to}` : ''}</span>
                  <span className={t.previewMessage}>{item.message}</span>
                </li>
              ))}
            </ul>
            {run.summary?.preview_total > preview.length && (
              <span className={t.previewMore}>
                y {run.summary.preview_total - preview.length} más (se listan los primeros {preview.length}).
              </span>
            )}
          </div>
        )}

        {run.error && (
          <div className={t.field}>
            <span className={t.fieldLabel}>Error</span>
            <pre className={t.errorBox}>{run.error}</pre>
          </div>
        )}

        {run.status === 1 && (
          <Alert tone="warning" title="Ejecución sin cerrar">
            La tarea arrancó y nunca registró su final: o sigue corriendo, o el proceso se
            interrumpió a mitad.
          </Alert>
        )}

        {run.status === 4 && (
          <Alert tone="warning" title="Esperando al worker">
            La tarea está pedida pero nadie la ha recogido todavía. Si se queda así, el worker de
            colas no está corriendo en el servidor.
          </Alert>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div className={t.field}>
      <span className={t.fieldLabel}>{label}</span>
      <span className={t.fieldValue}>{children}</span>
    </div>
  );
}
