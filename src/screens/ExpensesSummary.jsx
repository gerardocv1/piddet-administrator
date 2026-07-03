import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, FilterBar, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { todayIso } from '../lib/orderLabels.js';
import { expenseMoney, monthStartIso } from '../lib/expenseLabels.js';
import s from './screens.module.css';
import t from './ExpensesSummary.module.css';

// Resumen de gastos por categoría raíz (¿cuánto se fue en Insumos, en Personal…?) con
// drill-down a subcategorías, para un rango de fechas (mes actual por defecto). Los gastos
// anulados no se incluyen; la agregación la hace el backend.
export function ExpensesSummary() {
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || monthStartIso();
  const dateTo = params.get('date_to') || todayIso();

  const setQuery = (from, to) => {
    const q = {};
    if (from && from !== monthStartIso()) q.date_from = from;
    if (to && to !== todayIso()) q.date_to = to;
    setParams(q);
  };

  const fetcher = React.useCallback(() => api.expensesSummary({ dateFrom, dateTo }), [dateFrom, dateTo]);
  const { data, loading, error } = useResource(fetcher, null, [dateFrom, dateTo]);

  const [expanded, setExpanded] = React.useState(() => new Set());
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const roots = data?.roots || [];
  const grandTotal = Number(data?.total || 0);
  const maxRoot = roots.reduce((mx, r) => Math.max(mx, Number(r.total)), 0);

  const filters = [
    { key: 'range', type: 'daterange', label: 'Fecha', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
  ];

  const onFilters = (next) => {
    setQuery(next.date_from || dateFrom, next.date_to || dateTo);
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filters}
        values={{ date_from: dateFrom, date_to: dateTo }}
        onChange={onFilters}
        actions={
          <div className={t.grandTotal}>
            <span>Total del periodo</span>
            <strong>{expenseMoney(grandTotal)}</strong>
          </div>
        }
      />

      {loading ? (
        <Spinner center label="Calculando resumen…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : roots.length === 0 ? (
        <Card>
          <Card.Body>
            <p className={s.faint}>No hay gastos registrados en el rango seleccionado.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card padding="0">
          <ul className={t.roots}>
            {roots.map((root) => {
              const rootTotal = Number(root.total);
              const pct = grandTotal > 0 ? Math.round((rootTotal / grandTotal) * 100) : 0;
              const barPct = maxRoot > 0 ? (rootTotal / maxRoot) * 100 : 0;
              const hasChildren = (root.children || []).length > 0;
              const isOpen = expanded.has(root.id);
              return (
                <li key={root.id} className={t.root}>
                  <button
                    type="button"
                    className={t.rootRow}
                    onClick={() => hasChildren && toggle(root.id)}
                    disabled={!hasChildren}
                  >
                    <span className={t.chevron}>
                      {hasChildren && <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`} />}
                    </span>
                    <span className={t.rootInfo}>
                      <span className={t.rootName}>{root.name}</span>
                      <span className={t.bar}><span className={t.barFill} style={{ width: `${barPct}%` }} /></span>
                    </span>
                    <span className={t.rootPct}>{pct}%</span>
                    <span className={t.rootTotal}>{expenseMoney(rootTotal)}</span>
                  </button>
                  {isOpen && hasChildren && (
                    <ul className={t.children}>
                      {root.children.map((child) => (
                        <li key={child.id} className={t.child}>
                          <span className={t.childName}>{child.name}</span>
                          <span className={t.childTotal}>{expenseMoney(child.total)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
