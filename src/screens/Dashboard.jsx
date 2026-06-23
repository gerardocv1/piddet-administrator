import React from 'react';
import { StatStrip, SalesByTypeChart, Card, Input, Select, IconButton, Spinner } from '../components';
import { useResource } from '../lib/useResource.js';
import { api } from '../lib/api.js';
import s from './Dashboard.module.css';

const PERIOD_OPTIONS = [5, 10, 15, 30].map((n) => ({ value: String(n), label: `Últimos ${n} días` }));
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function Dashboard() {
  // ── Reporte de ventas por tipo (controles + cache/force) ──
  const [endDate, setEndDate] = React.useState(todayStr);
  const [days, setDays] = React.useState(15);
  const forceRef = React.useRef(false); // lo lee el fetcher; el long-press lo pone en true

  const salesFetcher = React.useCallback(() => {
    const force = forceRef.current;
    return api.salesByType({ days, endDate, force }).finally(() => { forceRef.current = false; });
  }, [days, endDate]);
  const { data: report, loading: loadingSales, error: errorSales, reload: reloadSales } =
    useResource(salesFetcher, null, [days, endDate]);

  // Botón refresh: click corto → con cache; mantener ~2s → fuerza recálculo (force).
  const holdTimer = React.useRef(null);
  const firedForce = React.useRef(false);
  const [holding, setHolding] = React.useState(false);

  React.useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);

  const startHold = () => {
    firedForce.current = false;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      firedForce.current = true;
      forceRef.current = true;
      setHolding(false);
      holdTimer.current = null;
      reloadSales();
    }, 2000);
  };
  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (!firedForce.current) { forceRef.current = false; reloadSales(); } // click corto → con cache
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  };

  const totals = report?.totals;
  const salesKpis = totals ? [
    { label: 'Ventas totales', value: totals.total_formatted },
    { label: 'Productos', value: totals.products_formatted },
    { label: 'Servicios', value: totals.services_formatted },
    { label: 'Ticket promedio', value: totals.avg_ticket_formatted },
  ] : [];

  const refreshing = loadingSales && !!report; // recarga con datos ya presentes

  return (
    <div className={s.page}>
      <Card>
        <Card.Header title="Ventas por tipo" />
        <Card.Body className={s.cardBody}>
          <div className={s.toolbar}>
            <Input type="date" value={endDate} max={todayStr()} onChange={(e) => setEndDate(e.target.value)} wrapClassName={s.ctrl} />
            <Select value={String(days)} options={PERIOD_OPTIONS} onChange={(e) => setDays(Number(e.target.value))} wrapClassName={s.ctrl} />
            <IconButton
              icon={(holding || loadingSales) ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'}
              variant="light"
              title="Toca: refrescar · Mantén pulsado 2s: forzar sin caché"
              className={[s.refreshBtn, holding ? s.holding : ''].filter(Boolean).join(' ')}
              disabled={loadingSales}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={cancelHold}
            />
          </div>

          <div className={s.reportBody}>
            <div className={refreshing ? s.refreshing : ''}>
              <StatStrip stats={salesKpis} loading={loadingSales && !totals} />
              {errorSales ? (
                <div className={s.panelState}><i className="fas fa-triangle-exclamation" /> {errorSales}</div>
              ) : (
                <div className={s.chartWrap}>
                  <SalesByTypeChart daily={report?.daily || []} loading={loadingSales && !report} />
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
