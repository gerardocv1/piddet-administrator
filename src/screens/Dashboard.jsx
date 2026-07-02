import React from 'react';
import { StatStrip, SalesComparisonChart, Card, Input, Select, IconButton, Spinner } from '../components';
import { useResource } from '../lib/useResource.js';
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

export function Dashboard() {
  // ── Comparación de ventas (período actual vs. anterior) + KPIs ──
  const [endDate, setEndDate] = React.useState(todayStr);
  const [weeks, setWeeks] = React.useState(1);
  const days = weeks * 7;
  const forceRef = React.useRef(false); // lo lee cada fetcher; el long-press lo pone en true

  const kpisFetcher = React.useCallback(() => {
    const force = forceRef.current;
    return api.salesByType({ days, endDate, force }).finally(() => { forceRef.current = false; });
  }, [days, endDate]);
  const kpisRes = useResource(kpisFetcher, null, [days, endDate]);

  const cmpFetcher = React.useCallback(() => {
    const force = forceRef.current;
    return api.salesComparison({ days, endDate, force }).finally(() => { forceRef.current = false; });
  }, [days, endDate]);
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

  const totals = kpisRes.data?.totals;
  const deltas = kpisRes.data?.deltas;
  const salesKpis = totals ? [
    { label: 'Ventas totales', value: totals.total_formatted, ...kpiDelta(deltas?.total) },
    { label: 'Productos', value: totals.products_formatted, ...kpiDelta(deltas?.products) },
    { label: 'Servicios', value: totals.services_formatted, ...kpiDelta(deltas?.services) },
    { label: 'Ticket promedio', value: totals.avg_ticket_formatted, ...kpiDelta(deltas?.avg_ticket) },
  ] : [];

  const cmp = cmpRes.data;
  const loadingKpis = kpisRes.loading;
  const loadingCmp = cmpRes.loading;
  const refreshing = (loadingKpis || loadingCmp) && (!!totals || !!cmp); // recarga con datos ya presentes

  return (
    <div className={s.page}>
      <Card>
        <Card.Header title="Ventas" />
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
              <StatStrip stats={salesKpis} loading={loadingKpis && !totals} />

              {cmpRes.error ? (
                <div className={s.panelState}><i className="fas fa-triangle-exclamation" /> {cmpRes.error}</div>
              ) : (
                <div className={s.chartWrap}>
                  <SalesComparisonChart data={cmp} loading={loadingCmp && !cmp} />
                </div>
              )}
            </div>
            {refreshing && (
              <div className={s.refreshOverlay}><Spinner label="Actualizando…" /></div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
