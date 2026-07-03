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

/**
 * Tarjeta de reporte del dashboard: toolbar (fecha fin + período + refresh con long-press),
 * franja de KPIs y gráfico comparativo período actual vs. anterior. Cada instancia maneja
 * sus propios filtros; `fetchKpis`/`fetchComparison` reciben { days, endDate, force } y
 * `buildKpis` mapea el payload del reporte a los stats del StatStrip.
 */
function MetricsReportCard({ title, fetchKpis, fetchComparison, buildKpis, chartLoadingLabel, chartEmptyLabel }) {
  const [endDate, setEndDate] = React.useState(todayStr);
  const [weeks, setWeeks] = React.useState(1);
  const days = weeks * 7;
  const forceRef = React.useRef(false); // lo lee cada fetcher; el long-press lo pone en true

  const kpisFetcher = React.useCallback(() => {
    const force = forceRef.current;
    return fetchKpis({ days, endDate, force }).finally(() => { forceRef.current = false; });
  }, [fetchKpis, days, endDate]);
  const kpisRes = useResource(kpisFetcher, null, [days, endDate]);

  const cmpFetcher = React.useCallback(() => {
    const force = forceRef.current;
    return fetchComparison({ days, endDate, force }).finally(() => { forceRef.current = false; });
  }, [fetchComparison, days, endDate]);
  const cmpRes = useResource(cmpFetcher, null, [days, endDate]);

  // Botón refresh: click corto → con cache; mantener ~2s → fuerza recálculo (force).
  // Re-sincroniza la fecha a "hoy" para no arrastrar un endDate congelado desde el montaje.
  const holdTimer = React.useRef(null);
  const firedForce = React.useRef(false);
  const [holding, setHolding] = React.useState(false);

  React.useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const refresh = (force) => {
    forceRef.current = force;
    const today = todayStr();
    if (today !== endDate) setEndDate(today); // el cambio de dependencia reejecuta ambos fetch
    else { kpisRes.reload(); cmpRes.reload(); }
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

  const kpis = kpisRes.data ? buildKpis(kpisRes.data) : [];
  const hasKpis = kpis.length > 0;
  const cmp = cmpRes.data;
  const loadingKpis = kpisRes.loading;
  const loadingCmp = cmpRes.loading;
  const refreshing = (loadingKpis || loadingCmp) && (hasKpis || !!cmp); // recarga con datos ya presentes

  return (
    <Card>
      <Card.Header title={title} />
      <Card.Body className={s.cardBody}>
        <div className={s.toolbar}>
          <Input type="date" value={endDate} max={todayStr()} onChange={(e) => setEndDate(e.target.value)} wrapClassName={s.ctrl} />
          <Select value={String(weeks)} options={PERIOD_OPTIONS} onChange={(e) => setWeeks(Number(e.target.value))} wrapClassName={s.ctrl} />
          <IconButton
            icon={(holding || loadingCmp || loadingKpis) ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'}
            variant="light"
            title="Toca: refrescar · Mantén pulsado 2s: forzar sin caché"
            className={[s.refreshBtn, holding ? s.holding : ''].filter(Boolean).join(' ')}
            disabled={loadingCmp || loadingKpis}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={cancelHold}
          />
        </div>

        <div className={s.reportBody}>
          <div className={refreshing ? s.refreshing : ''}>
            <StatStrip stats={kpis} loading={loadingKpis && !hasKpis} />

            {cmpRes.error ? (
              <div className={s.panelState}><i className="fas fa-triangle-exclamation" /> {cmpRes.error}</div>
            ) : (
              <div className={s.chartWrap}>
                <SalesComparisonChart
                  data={cmp}
                  loading={loadingCmp && !cmp}
                  loadingLabel={chartLoadingLabel}
                  emptyLabel={chartEmptyLabel}
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

const buildSalesKpis = (data) => {
  const { totals, deltas } = data;
  if (!totals) return [];
  return [
    { label: 'Ventas totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
    { label: 'Productos', value: totals.products_formatted, ...kpiDelta(deltas?.products) },
    { label: 'Servicios', value: totals.services_formatted, ...kpiDelta(deltas?.services) },
    { label: 'Ticket promedio', value: totals.avg_ticket_formatted, ...kpiDelta(deltas?.avg_ticket) },
  ];
};

const buildExpensesKpis = (data) => {
  const { totals, deltas } = data;
  if (!totals) return [];
  return [
    { label: 'Gastos totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
    { label: 'Registros', value: String(totals.count), ...kpiDelta(deltas?.count) },
    { label: 'Gasto promedio', value: totals.avg_formatted, ...kpiDelta(deltas?.avg) },
    { label: 'Mayor gasto', value: totals.max_formatted, ...kpiDelta(deltas?.max) },
  ];
};

export function Dashboard() {
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();

  // Cada dash se muestra solo con el permiso de su módulo. Con solo
  // api-module-expenses-own el backend limita las métricas a los gastos del usuario.
  const canSales = can('api-module-orders');
  const canExpenses = canAny(['api-module-expenses', 'api-module-expenses-own']);

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

      {canSales && (
        <MetricsReportCard
          title="Ventas"
          fetchKpis={api.salesByType}
          fetchComparison={api.salesComparison}
          buildKpis={buildSalesKpis}
          chartLoadingLabel="Cargando ventas…"
          chartEmptyLabel="No hay ventas en el período seleccionado."
        />
      )}

      {canExpenses && (
        <MetricsReportCard
          title="Gastos"
          fetchKpis={api.expensesReport}
          fetchComparison={api.expensesComparison}
          buildKpis={buildExpensesKpis}
          chartLoadingLabel="Cargando gastos…"
          chartEmptyLabel="No hay gastos en el período seleccionado."
        />
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
