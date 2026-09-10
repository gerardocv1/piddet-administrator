import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, FilterBar, Pagination, RefreshButton, Alert, Modal, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import {
  runStatusOf, RUN_STATUS_OPTIONS, commandOf, COMMAND_OPTIONS,
  summaryLabel, formatDuration, formatDateTime,
} from '../lib/scheduledTaskLabels.js';
import s from './screens.module.css';
import t from './ScheduledTasks.module.css';

const EMPTY = { items: [], pagination: null };
const EMPTY_STATUS = { commands: [], retention_days: null };

// Bitácora del scheduler: qué tarea corrió, cuándo, cuánto tardó y qué hizo. Los filtros y la
// página viven en la URL para que compartir el enlace lleve a la misma consulta.
//
// Lo que se ve NO es de la compañía activa: los comandos recorren todas. Por eso la ruta va
// gateada con `api-module-scheduled-tasks`, que solo tiene el super-admin.
export function ScheduledTasks() {
  const [params, setParams] = useSearchParams();
  const command = params.get('command') || '';
  const status = params.get('status') || '';
  const dateFrom = params.get('date_from') || '';
  const dateTo = params.get('date_to') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [selected, setSelected] = React.useState(null);

  const setQuery = (next, nextPage = 1) => {
    const q = { command, status, date_from: dateFrom, date_to: dateTo, ...next };
    const clean = {};
    Object.entries(q).forEach(([k, v]) => { if (v) clean[k] = v; });
    if (nextPage > 1) clean.page = String(nextPage);
    setParams(clean);
  };

  const statusFetcher = React.useCallback(() => api.getScheduledTasksStatus(), []);
  const { data: taskStatus, loading: statusLoading } = useResource(statusFetcher, EMPTY_STATUS, []);

  const fetcher = React.useCallback(
    () => api.getScheduledTaskRuns({ command, status, dateFrom, dateTo, page }),
    [command, status, dateFrom, dateTo, page]
  );
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [command, status, dateFrom, dateTo, page]);
  const rows = data.items || [];
  const pg = data.pagination;

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
      {statusLoading ? (
        <Spinner center label="Cargando estado de las tareas…" />
      ) : (
        <div className={t.status}>
          {(taskStatus.commands || []).map((c) => <TaskStatusCard key={c.command} run={c} />)}
        </div>
      )}

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
    </div>
  );
}

// Última corrida de una tarea. Sin corridas, la tarjeta lo dice: eso es "nunca ha corrido",
// que es justo lo que hay que ver de un vistazo cuando el cron del servidor no está puesto.
function TaskStatusCard({ run }) {
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
    </div>
  );
}

// Contadores del `summary` en una línea. La fecha procesada se omite: ya está en la columna
// de ejecución y aquí solo compite con lo que interesa.
function SummaryCell({ summary }) {
  const pairs = Object.entries(summary || {}).filter(([key]) => key !== 'date');
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
  const summaryPairs = Object.entries(run.summary || {});
  const optionPairs = Object.entries(run.options || {});

  return (
    <Modal open title={meta.label} subtitle={run.command} onClose={onClose} size="lg">
      <div className={t.detail}>
        <div className={t.detailGrid}>
          <Field label="Resultado"><Badge variant={st.variant} dot>{st.label}</Badge></Field>
          <Field label="Duración">{formatDuration(run.duration_ms)}</Field>
          <Field label="Inicio">{formatDateTime(run.started_at)}</Field>
          <Field label="Fin">{run.finished_at ? formatDateTime(run.finished_at) : '—'}</Field>
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
