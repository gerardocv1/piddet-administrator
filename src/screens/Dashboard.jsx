import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatStrip, SalesComparisonChart, Card, Input, Select, IconButton, Spinner, Badge, Button, ListCard, Alert } from '../components';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import { api } from '../lib/api.js';
import { shiftMoney } from '../lib/shiftLabels.js';
import {
  reservationStatusMeta, arrivalSlotLabel, checkInProximity, DECORATION_EMOJI, DECORATION_LABEL,
} from '../lib/reservationLabels.js';
import { phrase } from '../lib/terms.js';
import { gymMoney } from '../lib/gymLabels.js';
import { formatDayMonth, monthName, shortMonthName } from '../lib/dates.js';
import { whatsappHref } from './public/whatsapp.js';
import { auth } from '../lib/auth/index.js';
import s from './Dashboard.module.css';

const PERIOD_OPTIONS = [
  { value: '1', label: 'Última semana' },
  { value: '2', label: 'Últimas 2 semanas' },
  { value: '4', label: 'Últimas 4 semanas' },
];
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Variación de un KPI vs. el período anterior en el formato que consume StatStrip.
const kpiDelta = (d) => (d && d.percent != null ? { delta: `${Math.abs(d.percent)}%`, up: d.is_increase } : {});

const money = (v) => {
  const n = Math.round(Number(v) || 0);
  return (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('es-CO');
};

// `desktopOnly` marca el desglose que no se lleva al teléfono: en móvil cada reporte se queda
// con la cifra que se mira de un vistazo (el total y, en ventas, el ticket promedio) y el resto
// del detalle se sigue viendo en escritorio.
const buildSalesKpis = ({ totals, deltas } = {}) => (totals ? [
  { label: phrase('Ventas totales'), value: totals.total_formatted, ...kpiDelta(deltas?.total) },
  { label: 'Productos', value: totals.products_formatted, ...kpiDelta(deltas?.products), desktopOnly: true },
  { label: 'Servicios', value: totals.services_formatted, ...kpiDelta(deltas?.services), desktopOnly: true },
  { label: 'Ticket promedio', value: totals.avg_ticket_formatted, ...kpiDelta(deltas?.avg_ticket) },
] : []);

const buildExpensesKpis = ({ totals, deltas } = {}) => (totals ? [
  { label: 'Gastos totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
  { label: 'Registros', value: String(totals.count), ...kpiDelta(deltas?.count), desktopOnly: true },
  { label: 'Gasto promedio', value: totals.avg_formatted, ...kpiDelta(deltas?.avg), desktopOnly: true },
  { label: 'Mayor gasto', value: totals.max_formatted, ...kpiDelta(deltas?.max), desktopOnly: true },
] : []);

// KPIs de hospedaje. Los deltas del reporte de reservas son diferencias absolutas (no {percent}),
// así que aquí solo se muestran los totales.
// "2 turnos de cajero y 1 de compras abiertos" para la tarjeta del turno global; '' sin ninguno.
const openAssignedShiftsSummary = (current) => {
  const employees = Number(current?.open_employee_count) || 0;
  const purchases = Number(current?.open_purchase_count) || 0;
  const total = employees + purchases;
  if (!total) return '';
  const turnos = (n) => `${n} turno${n === 1 ? '' : 's'}`;
  const parts = [];
  if (employees) parts.push(`${turnos(employees)} de cajero`);
  if (purchases) parts.push(`${employees ? purchases : turnos(purchases)} de compras`);
  return `${parts.join(' y ')} abierto${total === 1 ? '' : 's'}`;
};

const buildReservationsKpis = ({ totals } = {}) => (totals ? [
  { label: 'Ingresos hospedaje', value: money(totals.revenue) },
  { label: 'Reservas', value: String(totals.reservations), desktopOnly: true },
  { label: 'Noches vendidas', value: String(totals.nights_sold), desktopOnly: true },
  { label: 'Ocupación', value: `${totals.occupancy_rate}%` },
] : []);

// Cuántas reservas caben en el widget antes de resumir el resto en una línea.
const ARRIVALS_LIMIT = 6;

/** Widget de reservas: las que siguen pendientes de recibir y entran hoy o mañana — lo que hay
 *  que preparar. Es operación del día, así que no depende de los filtros de período. */
function PendingArrivalsCard({ rows, loading, error, onOpen, onSeeAll }) {
  const shown = rows.slice(0, ARRIVALS_LIMIT);
  const rest = rows.length - shown.length;

  return (
    <Card className={s.widgetCard}>
      {/* En el teléfono el título va al ras del borde, sin filete ni sombra, y la lista a todo
          el ancho, alineada con los accesos rápidos de arriba (ver .widgetCard en el CSS). */}
      <Card.Header title="Reservas" className={s.widgetHead}
        action={<Button variant="link" size="sm" iconRight="fas fa-chevron-right" className={s.widgetSeeAll} onClick={onSeeAll}>Ver todas</Button>} />
      {/* Sin `cardBody`: este widget es una lista, no un reporte. */}
      <Card.Body className={s.widgetBody}>
        {error ? (
          <Alert tone="danger" title="No se pudieron cargar las reservas">{error}</Alert>
        ) : loading && rows.length === 0 ? (
          <Spinner center label="Cargando reservas…" />
        ) : rows.length === 0 ? (
          <p className={s.widgetEmpty}>No hay reservas pendientes para hoy ni mañana.</p>
        ) : (
          <>
            <div className={s.widgetList}>
              {shown.map((r) => {
                const soon = checkInProximity(r.check_in_date, r.status);
                const meta = reservationStatusMeta(r.status);
                return (
                  <ListCard key={r.id}
                    media={<span className={s.arrivalIcon}><i className="fas fa-right-to-bracket" /></span>}
                    title={r.holder_user_name}
                    subtitle={r.expected_arrival_time
                      ? `${r.rentable_unit_name} · ${arrivalSlotLabel(r.expected_arrival_time)}`
                      : r.rentable_unit_name}
                    badge={
                      // Un solo hijo: el pie de la ListCard reparte a sus lados, y dos badges
                      // sueltos se separarían uno del otro.
                      <span className={s.arrivalBadges}>
                        {soon && <Badge variant={soon.variant} dot>{soon.label}</Badge>}
                        {r.has_decoration && (
                          <Badge variant="primary" title={DECORATION_LABEL} aria-label={DECORATION_LABEL}>
                            {DECORATION_EMOJI}
                          </Badge>
                        )}
                      </span>
                    }
                    meta={meta.label}
                    onClick={() => onOpen(r.id)} />
                );
              })}
            </div>
            {rest > 0 && <p className={s.widgetMore}>y {rest} más</p>}
          </>
        )}
      </Card.Body>
    </Card>
  );
}

// Cuántos cumpleaños se ven en el inicio: en un gimnasio grande un mes trae decenas y el inicio
// no es la lista completa; «Ver todos» lleva el total.
const BIRTHDAYS_LIMIT = 3;

// «Ver todos (12)»: el total va en el enlace cuando hay más de los que se muestran.
const seeAllLabel = (label, total, shown) => (total > shown ? `${label} (${total})` : label);

// Badge de cada cumpleaños según qué tan lejos queda de hoy.
const birthdayBadge = (row, today) => {
  if (row.is_today) return { label: 'Hoy', variant: 'primary' };
  if (row.is_past) return { label: 'Ya pasó', variant: 'neutral' };
  const days = Math.round((new Date(row.date) - new Date(today)) / 86400000);
  if (days === 1) return { label: 'Mañana', variant: 'success' };
  return { label: `En ${days} días`, variant: 'neutral' };
};

// Saludo listo para WhatsApp, a nombre de la compañía activa.
const birthdayGreeting = (row) => {
  const company = auth.getCompany()?.name;
  const first = row.member_name.split(' ')[0];
  return company
    ? `¡Feliz cumpleaños, ${first}! 🎉 En ${company} te deseamos un día increíble. ¡Te esperamos para celebrarlo entrenando!`
    : `¡Feliz cumpleaños, ${first}! 🎉 Te deseamos un día increíble.`;
};

/** Widget de cumpleaños: los afiliados activos que cumplen años este mes, en filas de dos líneas
 *  (nombre y años que cumple) con el badge de cuándo y, a la derecha, el saludo por WhatsApp
 *  cuando el afiliado tiene celular. Primero los de hoy, después los que vienen y al final,
 *  atenuados, los que ya pasaron. */
function GymBirthdaysCard({ rows, loading, error, onOpen, onSeeAll }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const today = `${now.getFullYear()}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Hoy → próximos → pasados; dentro de cada grupo, por día.
  const ordered = React.useMemo(() => {
    const rank = (r) => (r.is_today ? 0 : r.is_past ? 2 : 1);
    return rows.slice().sort((a, b) => rank(a) - rank(b) || a.day - b.day || a.member_name.localeCompare(b.member_name));
  }, [rows]);
  const shown = ordered.slice(0, BIRTHDAYS_LIMIT);

  return (
    <Card className={s.widgetCard}>
      <Card.Header title={`Cumpleaños de ${monthName(month)}`} className={s.widgetHead}
        action={<Button variant="link" size="sm" iconRight="fas fa-chevron-right" className={s.widgetSeeAll} onClick={() => onSeeAll(month)}>{seeAllLabel('Ver todos', ordered.length, shown.length)}</Button>} />
      <Card.Body className={s.widgetBody}>
        {error ? (
          <Alert tone="danger" title="No se pudieron cargar los cumpleaños">{error}</Alert>
        ) : loading && rows.length === 0 ? (
          <Spinner center label="Cargando cumpleaños…" />
        ) : rows.length === 0 ? (
          <p className={s.widgetEmpty}>Ningún afiliado activo cumple años en {monthName(month)}.</p>
        ) : (
          <>
            {/* Filas compactas como las del aviso de vencimientos: baldosa del día, nombre y años
                que cumple, el badge de cuándo y el WhatsApp a la derecha (sin chevron: la zona
                de identidad sigue abriendo la ficha). En escritorio van sin recuadro, separadas
                por un filete, para no meter una tarjeta dentro de otra. */}
            <div className={s.expList}>
              {shown.map((r) => {
                const wa = whatsappHref(r.phone_number ? `${r.phone_code || ''}${r.phone_number}` : '', birthdayGreeting(r));
                const b = birthdayBadge(r, today);
                return (
                  <div key={r.gym_member_id} className={[s.expRow, s.bdayRow, r.is_past ? s.bdayPast : ''].filter(Boolean).join(' ')}>
                    <button type="button" className={s.bdayTap} onClick={() => onOpen(r.gym_member_id)}>
                      <span className={[s.bdayTile, r.is_today ? s.bdayTileToday : ''].filter(Boolean).join(' ')}>
                        <strong>{r.day}</strong>
                        <span>{shortMonthName(month)}</span>
                      </span>
                      <span className={s.expText}>
                        <span className={s.expName}>{r.member_name}</span>
                        <span className={s.expMeta}>Cumple {r.turns} años</span>
                      </span>
                    </button>
                    <Badge variant={b.variant} dot={r.is_today}>{b.label}</Badge>
                    {wa ? (
                      <IconButton icon="fab fa-whatsapp" variant="light" size="sm" className={s.waBtn}
                        title="Felicitar por WhatsApp"
                        onClick={() => window.open(wa, '_blank', 'noopener,noreferrer')} />
                    ) : <span className={s.waGap} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

// Cuántas suscripciones se ven en el aviso; el resto vive en el listado de suscripciones y
// «Ver todas» lleva el total.
const EXPIRING_LIMIT = 3;

// Etiqueta de urgencia de cada suscripción: la gracia manda (el corte automático está cerca), y
// entre las que aún no vencen, cuenta cuánto falta.
const expiringBadge = (item) => {
  if (item.alert === 'grace') {
    return item.grace_days_left != null && item.grace_days_left < 0
      ? { label: 'Gracia vencida', variant: 'danger' }
      : { label: 'En gracia', variant: 'warning' };
  }
  if (item.days_left <= 0) return { label: 'Vence hoy', variant: 'danger' };
  if (item.days_left === 1) return { label: 'Vence mañana', variant: 'warning' };
  return { label: `Vence en ${item.days_left} días`, variant: 'warning' };
};

/** Widget-alerta de vencimientos: suscripciones en gracia o que vencen en los próximos días, del
 *  más urgente al más lejano; cada fila abre la suscripción para cobrar o renovar. Sin resumen de
 *  conteos arriba: la urgencia la dice el badge de cada fila y el total va en «Ver todas». */
function GymExpiringCard({ data, loading, error, onOpen, onSeeAll }) {
  const items = data?.items || [];
  const days = data?.days || 7;
  const shown = items.slice(0, EXPIRING_LIMIT);

  return (
    <Card className={s.widgetCard}>
      <Card.Header title="Vencimientos" className={s.widgetHead}
        action={<Button variant="link" size="sm" iconRight="fas fa-chevron-right" className={s.widgetSeeAll} onClick={() => onSeeAll(days)}>{seeAllLabel('Ver todas', items.length, shown.length)}</Button>} />
      <Card.Body className={s.widgetBody}>
        {error ? (
          <Alert tone="danger" title="No se pudieron cargar los vencimientos">{error}</Alert>
        ) : loading && !data ? (
          <Spinner center label="Revisando vencimientos…" />
        ) : items.length === 0 ? (
          <Alert tone="success" title="Todo al día">
            Ninguna suscripción está en gracia ni vence en los próximos {days} días.
          </Alert>
        ) : (
          <>
            {/* Filas compactas: una sola línea de datos bajo el nombre y el estado a la derecha,
                sin el pie de la ListCard — aquí caben más afiliados en menos alto. */}
            <div className={s.expList}>
              {shown.map((it) => {
                const b = expiringBadge(it);
                const grace = it.alert === 'grace';
                const owes = Number(it.pending) > 0;
                const when = grace && it.current_period?.grace_ends_at
                  ? `gracia hasta ${formatDayMonth(it.current_period.grace_ends_at)}`
                  : `vence ${formatDayMonth(it.current_period?.end_date)}`;
                return (
                  <button type="button" key={it.subscription_id} className={s.expRow} onClick={() => onOpen(it.subscription_id)}>
                    <span className={[s.expIcon, grace ? s.expIconGrace : ''].filter(Boolean).join(' ')}>
                      <i className={grace ? 'fas fa-triangle-exclamation' : 'fas fa-hourglass-half'} />
                    </span>
                    <span className={s.expText}>
                      <span className={s.expName}>{it.member_name}</span>
                      <span className={s.expMeta}>
                        {/* El plan solo en escritorio: en el teléfono la fila prioriza fecha y saldo. */}
                        <span className={s.expPlan}>{it.plan_name} · </span>{when}
                        {owes && <span className={s.saldo}> · {gymMoney(it.pending)}</span>}
                      </span>
                    </span>
                    <Badge variant={b.variant} dot>{b.label}</Badge>
                    <i className={`fas fa-chevron-right ${s.expChevron}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

/** Tarjeta presentacional de un dash: KPIs + gráfico comparativo. Los filtros y la carga
 *  de datos viven en el Dashboard (un solo control para todos los reportes). */
function ReportCard({ title, kpis, kpisLoading, cmp, cmpLoading, cmpError, chartLoadingLabel, chartEmptyLabel, chartAccentVar }) {
  const hasKpis = kpis.length > 0;
  const refreshing = (kpisLoading || cmpLoading) && (hasKpis || !!cmp); // recarga con datos ya presentes

  return (
    <Card>
      <Card.Header title={title} />
      <Card.Body className={s.cardBody}>
        <div className={s.reportBody}>
          <div className={refreshing ? s.refreshing : ''}>
            <StatStrip stats={kpis} loading={kpisLoading && !hasKpis} />

            {cmpError ? (
              <div className={s.panelState}><i className="fas fa-triangle-exclamation" /> {cmpError}</div>
            ) : (
              <div className={s.chartWrap}>
                <SalesComparisonChart
                  data={cmp}
                  loading={cmpLoading && !cmp}
                  loadingLabel={chartLoadingLabel}
                  emptyLabel={chartEmptyLabel}
                  accentVar={chartAccentVar}
                />
              </div>
            )}
          </div>
          {refreshing && (
            <div className={s.refreshOverlay}><Spinner label="Actualizando…" /></div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();

  // Cada dash se muestra solo con el permiso de su módulo y, cuando el módulo está gateado, con
  // la funcionalidad activa en la compañía. Con solo api-module-expenses-own el backend limita
  // las métricas a los gastos del usuario.
  const { has } = useFunctionalities();
  const canSales = can('api-module-orders');
  const canExpenses = canAny(['api-module-expenses', 'api-module-expenses-own']) && has('functionality_expenses');
  const canReservations = can('api-module-reservations') && has('functionality_reservations');
  const canShifts = canAny(['api-module-shifts', 'api-module-shifts-own']) && has('functionality_shifts');
  const canGym = can('api-module-gym') && has('functionality_gym');

  // Turnos abiertos relevantes: alimentan la acción rápida de abrir/cerrar turno. El backend
  // ya decide quién ve el global (admin del módulo o shift-global-admin).
  const shiftsFetcher = React.useCallback(
    () => (canShifts ? api.currentShifts() : Promise.resolve(null)),
    [canShifts],
  );
  const { data: currentShifts } = useResource(shiftsFetcher, null, [canShifts]);
  const myShift = currentShifts?.mine || null;
  const globalShift = currentShifts?.global || null;

  // ── Filtros compartidos: una sola fecha fin + rango + refresh para todos los reportes ──
  const [endDate, setEndDate] = React.useState(todayStr);
  const [weeks, setWeeks] = React.useState(1);
  const days = weeks * 7;
  const forceRef = React.useRef(false); // lo lee cada fetcher; el long-press lo pone en true
  const [refreshToken, setRefreshToken] = React.useState(0); // reejecuta los fetch sin cambiar filtros

  // Un recurso por reporte, todos colgados de los mismos filtros. Sin permiso no se consulta.
  const useMetric = (enabled, call) => {
    const fetcher = React.useCallback(() => {
      if (!enabled) return Promise.resolve(null);
      const force = forceRef.current;
      return call({ days, endDate, force }).finally(() => { forceRef.current = false; });
    }, [enabled, call, days, endDate, refreshToken]);
    return useResource(fetcher, null, [enabled, days, endDate, refreshToken]);
  };
  const salesKpisRes = useMetric(canSales, api.salesByType);
  const salesCmpRes = useMetric(canSales, api.salesComparison);
  const expKpisRes = useMetric(canExpenses, api.expensesReport);
  const expCmpRes = useMetric(canExpenses, api.expensesComparison);
  const resKpisRes = useMetric(canReservations, api.reservationsReport);

  // Reservas por llegar: siempre hoy y mañana, al margen del período elegido (es operación, no
  // reporte). Se recarga con el mismo botón de refresco que los reportes.
  const arrivalsFetcher = React.useCallback(
    () => (canReservations ? api.reservationsPendingArrivals() : Promise.resolve([])),
    [canReservations, endDate, refreshToken],
  );
  const arrivalsRes = useResource(arrivalsFetcher, [], [canReservations, endDate, refreshToken]);

  // Widgets del gimnasio: cumpleaños del mes y vencimientos. Operación del día, como las
  // reservas: no dependen del período y se recargan con el mismo botón de refresco.
  const birthdaysFetcher = React.useCallback(
    () => (canGym ? api.gymDashboardBirthdays() : Promise.resolve([])),
    [canGym, endDate, refreshToken],
  );
  const birthdaysRes = useResource(birthdaysFetcher, [], [canGym, endDate, refreshToken]);
  const expiringFetcher = React.useCallback(
    () => (canGym ? api.gymDashboardExpiring() : Promise.resolve(null)),
    [canGym, endDate, refreshToken],
  );
  const expiringRes = useResource(expiringFetcher, null, [canGym, endDate, refreshToken]);

  const anyLoading = salesKpisRes.loading || salesCmpRes.loading || expKpisRes.loading || expCmpRes.loading
    || resKpisRes.loading || arrivalsRes.loading || birthdaysRes.loading || expiringRes.loading;

  // Botón refresh: click corto → con cache; mantener ~2s → fuerza recálculo (force).
  // Re-sincroniza la fecha a "hoy" para no arrastrar un endDate congelado desde el montaje.
  const holdTimer = React.useRef(null);
  const firedForce = React.useRef(false);
  const [holding, setHolding] = React.useState(false);

  React.useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const refresh = (force) => {
    forceRef.current = force;
    const today = todayStr();
    if (today !== endDate) setEndDate(today); // el cambio de dependencia reejecuta todos los fetch
    else setRefreshToken((t) => t + 1);
  };

  const startHold = () => {
    firedForce.current = false;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      firedForce.current = true;
      setHolding(false);
      holdTimer.current = null;
      refresh(true);
    }, 2000);
  };
  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (!firedForce.current) refresh(false); // click corto → con cache
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  // ── Balance del período: ingresos vs. egresos con los reportes ya cargados (sin endpoint extra) ──
  const salesTotal = salesKpisRes.data?.totals?.total;
  const expensesTotal = expKpisRes.data?.totals?.total;
  const showBalance = canSales && canExpenses;
  const balanceLoading = salesKpisRes.loading || expKpisRes.loading;
  const balance = (Number(salesTotal) || 0) - (Number(expensesTotal) || 0);
  const balanceKpis = (salesTotal != null && expensesTotal != null) ? [
    { label: 'Ingresos', value: money(salesTotal) },
    { label: 'Egresos', value: money(expensesTotal) },
    {
      label: 'Balance',
      value: money(balance),
      ...(Number(salesTotal) > 0
        ? { delta: `${Math.round((balance / Number(salesTotal)) * 1000) / 10}%`, up: balance >= 0 }
        : {}),
    },
  ] : [];

  return (
    <div className={s.page}>
      {/* Acción rápida: registrar gasto desde el celular (asistente paso a paso).
          Visible también para el empleado con acceso solo a sus gastos. */}
      {(canExpenses || canShifts || canGym) && (
        <div className={s.quickRow}>
          {canGym && (
            <button type="button" className={s.quickExpense} onClick={() => navigate('/gym/members')}>
              <span className={s.quickIcon}><i className="fas fa-dumbbell" /></span>
              <span className={s.quickText}>
                <strong>Cobrar / renovar membresía</strong>
                <span>Busca al afiliado y renueva en el sitio</span>
              </span>
              <i className={`fas fa-chevron-right ${s.quickChevron}`} />
            </button>
          )}
          {canExpenses && (
            <button type="button" className={s.quickExpense} onClick={() => navigate('/expenses/quick')}>
              <span className={s.quickIcon}><i className="fas fa-receipt" /></span>
              <span className={s.quickText}>
                <strong>Registrar gasto</strong>
                <span>Paso a paso, con foto de la factura</span>
              </span>
              <i className={`fas fa-chevron-right ${s.quickChevron}`} />
            </button>
          )}

          {/* Acción rápida de turnos: cerrar el propio si está abierto; si no, el global
              (según permiso); si no hay ninguno abierto, abrir uno. */}
          {canShifts && (
            myShift ? (
              <button type="button" className={s.quickExpense} onClick={() => navigate(`/shifts/${myShift.id}/close`)}>
                <span className={s.quickIcon}><i className="fas fa-cash-register" /></span>
                <span className={s.quickText}>
                  <strong>Cerrar mi turno{myShift.type === 'PURCHASE' ? ' de compras' : ''}</strong>
                  <span>Abierto con base de {shiftMoney(myShift.base_amount)}</span>
                </span>
                <i className={`fas fa-chevron-right ${s.quickChevron}`} />
              </button>
            ) : globalShift ? (
              <button type="button" className={s.quickExpense} onClick={() => navigate(`/shifts/${globalShift.id}`)}>
                <span className={s.quickIcon}><i className="fas fa-cash-register" /></span>
                <span className={s.quickText}>
                  <strong>Turno global abierto</strong>
                  <span>{openAssignedShiftsSummary(currentShifts) || 'Ver balance y cerrar'}</span>
                </span>
                <i className={`fas fa-chevron-right ${s.quickChevron}`} />
              </button>
            ) : (
              <button type="button" className={s.quickExpense} onClick={() => navigate('/shifts/open')}>
                <span className={s.quickIcon}><i className="fas fa-cash-register" /></span>
                <span className={s.quickText}>
                  <strong>Abrir turno</strong>
                  <span>Entrega la base y controla la caja</span>
                </span>
                <i className={`fas fa-chevron-right ${s.quickChevron}`} />
              </button>
            )
          )}
        </div>
      )}

      {canReservations && (
        <PendingArrivalsCard
          rows={arrivalsRes.data || []}
          loading={arrivalsRes.loading}
          error={arrivalsRes.error}
          onOpen={(id) => navigate(`/reservations/${id}`)}
          onSeeAll={() => navigate('/reservations')}
        />
      )}

      {/* Gimnasio: el aviso de vencimientos va primero (es lo que hay que cobrar hoy) y al
          lado, en escritorio, los cumpleaños del mes. En el teléfono se apilan en ese orden. */}
      {canGym && (
        <div className={s.gymRow}>
          <GymExpiringCard
            data={expiringRes.data}
            loading={expiringRes.loading}
            error={expiringRes.error}
            onOpen={(id) => navigate(`/gym/subscriptions/${id}`)}
            onSeeAll={(days) => navigate(`/gym/subscriptions?expiring_within=${days}`)}
          />
          <GymBirthdaysCard
            rows={birthdaysRes.data || []}
            loading={birthdaysRes.loading}
            error={birthdaysRes.error}
            onOpen={(id) => navigate(`/gym/members/${id}`)}
            onSeeAll={(month) => navigate(`/gym/members?birthday_month=${month}`)}
          />
        </div>
      )}

      {(canSales || canExpenses || canReservations) && (
        <div className={s.toolbar}>
          <Input type="date" value={endDate} max={todayStr()} onChange={(e) => setEndDate(e.target.value)} wrapClassName={s.ctrl} />
          <Select value={String(weeks)} options={PERIOD_OPTIONS} onChange={(e) => setWeeks(Number(e.target.value))} wrapClassName={s.ctrl} />
          <IconButton
            icon={(holding || anyLoading) ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'}
            variant="light"
            title="Toca: refrescar · Mantén pulsado 2s: forzar sin caché"
            className={[s.refreshBtn, holding ? s.holding : ''].filter(Boolean).join(' ')}
            disabled={anyLoading}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={cancelHold}
          />
        </div>
      )}

      {showBalance && (
        <Card>
          <Card.Header title="Balance del período" />
          <Card.Body className={s.cardBody}>
            <StatStrip stats={balanceKpis} loading={balanceLoading && !balanceKpis.length} />
          </Card.Body>
        </Card>
      )}

      {canSales && (
        <ReportCard
          title={phrase('Ventas')}
          kpis={buildSalesKpis(salesKpisRes.data ?? {})}
          kpisLoading={salesKpisRes.loading}
          cmp={salesCmpRes.data}
          cmpLoading={salesCmpRes.loading}
          cmpError={salesCmpRes.error}
          chartLoadingLabel={phrase('Cargando ventas…')}
          chartEmptyLabel={phrase('No hay ventas en el período seleccionado.')}
        />
      )}

      {canExpenses && (
        <ReportCard
          title="Gastos"
          kpis={buildExpensesKpis(expKpisRes.data ?? {})}
          kpisLoading={expKpisRes.loading}
          cmp={expCmpRes.data}
          cmpLoading={expCmpRes.loading}
          cmpError={expCmpRes.error}
          chartLoadingLabel="Cargando gastos…"
          chartEmptyLabel="No hay gastos en el período seleccionado."
          chartAccentVar="--color-danger"
        />
      )}

      {canReservations && (
        <Card>
          <Card.Header title="Hospedaje" />
          <Card.Body className={s.cardBody}>
            <StatStrip
              stats={buildReservationsKpis(resKpisRes.data ?? {})}
              loading={resKpisRes.loading && !resKpisRes.data}
            />
          </Card.Body>
        </Card>
      )}

      {!canSales && !canExpenses && !canGym && (
        <div className={s.emptyDash}>
          <i className="fas fa-hand-peace" />
          <p>¡Hola! Por ahora no tienes reportes disponibles en el inicio.</p>
          <span>Usa el menú lateral para ir a tus módulos.</span>
        </div>
      )}
    </div>
  );
}
