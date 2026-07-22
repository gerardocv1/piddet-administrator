import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatStrip, SalesComparisonChart, Card, Input, Select, IconButton, Spinner } from '../components';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { api } from '../lib/api.js';
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

const buildSalesKpis = ({ totals, deltas } = {}) => (totals ? [
  { label: 'Ventas totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
  { label: 'Productos', value: totals.products_formatted, ...kpiDelta(deltas?.products) },
  { label: 'Servicios', value: totals.services_formatted, ...kpiDelta(deltas?.services) },
  { label: 'Ticket promedio', value: totals.avg_ticket_formatted, ...kpiDelta(deltas?.avg_ticket) },
] : []);

const buildExpensesKpis = ({ totals, deltas } = {}) => (totals ? [
  { label: 'Gastos totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
  { label: 'Registros', value: String(totals.count), ...kpiDelta(deltas?.count) },
  { label: 'Gasto promedio', value: totals.avg_formatted, ...kpiDelta(deltas?.avg) },
  { label: 'Mayor gasto', value: totals.max_formatted, ...kpiDelta(deltas?.max) },
] : []);

// KPIs de hospedaje. Los deltas del reporte de reservas son diferencias absolutas (no {percent}),
// así que aquí solo se muestran los totales.
const buildReservationsKpis = ({ totals } = {}) => (totals ? [
  { label: 'Ingresos hospedaje', value: money(totals.revenue) },
  { label: 'Reservas', value: String(totals.reservations) },
  { label: 'Noches vendidas', value: String(totals.nights_sold) },
  { label: 'Ocupación', value: `${totals.occupancy_rate}%` },
] : []);

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

  // Cada dash se muestra solo con el permiso de su módulo. Con solo
  // api-module-expenses-own el backend limita las métricas a los gastos del usuario.
  const canSales = can('api-module-orders');
  const canExpenses = canAny(['api-module-expenses', 'api-module-expenses-own']);
  const canReservations = can('api-module-reservations');

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

  const anyLoading = salesKpisRes.loading || salesCmpRes.loading || expKpisRes.loading || expCmpRes.loading || resKpisRes.loading;

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
          title="Ventas"
          kpis={buildSalesKpis(salesKpisRes.data ?? {})}
          kpisLoading={salesKpisRes.loading}
          cmp={salesCmpRes.data}
          cmpLoading={salesCmpRes.loading}
          cmpError={salesCmpRes.error}
          chartLoadingLabel="Cargando ventas…"
          chartEmptyLabel="No hay ventas en el período seleccionado."
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

      {!canSales && !canExpenses && (
        <div className={s.emptyDash}>
          <i className="fas fa-hand-peace" />
          <p>¡Hola! Por ahora no tienes reportes disponibles en el inicio.</p>
          <span>Usa el menú lateral para ir a tus módulos.</span>
        </div>
      )}
    </div>
  );
}
