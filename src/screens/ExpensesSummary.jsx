import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, FilterBar, RefreshButton, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { todayIso } from '../lib/orderLabels.js';
import { expenseMoney, monthStartIso } from '../lib/expenseLabels.js';
import { formatShortDate } from '../lib/dates.js';
import s from './screens.module.css';
import t from './ExpensesSummary.module.css';

// Reporte de gastos del rango (mes actual por defecto), filtrable por quién registró y por
// categoría (incluye su subárbol): tablero con totales del periodo (total, conteo, promedio,
// gasto más alto), distribución por método de pago y por usuario, y top de categorías raíz
// con drill-down. Los anulados no se incluyen; la agregación la hace el backend a nivel de
// línea para que todas las cards cuadren entre sí aun filtrando por categoría.
export function ExpensesSummary() {
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || monthStartIso();
  const dateTo = params.get('date_to') || todayIso();
  const createdBy = params.get('created_by') || undefined;
  const categoryId = params.get('category_id') || undefined;

  const setQuery = (next = {}) => {
    const q = {};
    let from = next.date_from || dateFrom;
    let to = next.date_to || dateTo;
    if (from > to) [from, to] = [to, from];
    if (from !== monthStartIso()) q.date_from = from;
    if (to !== todayIso()) q.date_to = to;
    const creator = 'created_by' in next ? next.created_by : createdBy;
    const cat = 'category_id' in next ? next.category_id : categoryId;
    if (creator) q.created_by = creator;
    if (cat) q.category_id = cat;
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.expensesSummary({ dateFrom, dateTo, createdBy, categoryId }),
    [dateFrom, dateTo, createdBy, categoryId],
  );
  const { data, loading, error, reload } = useResource(fetcher, null, [dateFrom, dateTo, createdBy, categoryId]);

  const treeFetcher = React.useCallback(() => api.expenseCategoriesTree(), []);
  const { data: tree } = useResource(treeFetcher, [], []);
  const categoryOptions = React.useMemo(() => {
    const out = [];
    const walk = (nodes, depth) => {
      for (const n of nodes) {
        // Indentación con NBSP (los espacios normales se colapsan dentro de <option>).
        out.push({ value: String(n.id), label: `${'   '.repeat(depth)}${n.name}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(tree || [], 0);
    return out;
  }, [tree]);

  const { data: creators } = useResource(api.expenseCreators, [], []);
  const creatorOptions = React.useMemo(
    () => (creators || []).map((c) => ({ value: String(c.user_id), label: c.name })),
    [creators],
  );

  const [expanded, setExpanded] = React.useState(() => new Set());
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const roots = data?.roots || [];
  const grandTotal = Number(data?.total || 0);
  const count = Number(data?.count || 0);
  const average = Number(data?.average || 0);
  const topExpense = data?.top_expense || null;
  const byPayment = data?.by_payment_method || [];
  const byCreator = data?.by_creator || [];
  const maxRoot = roots.reduce((mx, r) => Math.max(mx, Number(r.total)), 0);

  const filters = [
    { key: 'range', type: 'daterange', label: 'Fecha', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
    { key: 'category_id', type: 'select', label: 'Categoría', icon: 'fas fa-tags', options: categoryOptions, placeholder: 'Todas las categorías' },
    { key: 'created_by', type: 'select', label: 'Registró', icon: 'fas fa-user', options: creatorOptions, placeholder: 'Todos los usuarios' },
  ];

  const onFilters = (next) => setQuery({
    date_from: next.date_from,
    date_to: next.date_to,
    created_by: next.created_by,
    category_id: next.category_id,
  });

  const distributionCard = (title, icon, rows, keyOf) => {
    const maxTotal = rows.reduce((mx, r) => Math.max(mx, Number(r.total)), 0);
    return (
      <Card padding="0">
        <Card.Header title={title} />
        {rows.length === 0 ? (
          <p className={`${s.faint} ${t.distEmpty}`}>Sin datos en el rango.</p>
        ) : (
          <ul className={t.dist}>
            {rows.map((row) => {
              const total = Number(row.total);
              const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
              return (
                <li key={keyOf(row)} className={t.distRow}>
                  <span className={t.distIcon}><i className={icon} /></span>
                  <span className={t.distInfo}>
                    <span className={t.distName}>
                      {row.name}
                      <span className={t.distCount}>{row.count} gasto{row.count === 1 ? '' : 's'}</span>
                    </span>
                    <span className={t.bar}>
                      <span className={t.barFill} style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }} />
                    </span>
                  </span>
                  <span className={t.rootPct}>{pct}%</span>
                  <span className={t.distTotal}>{expenseMoney(total)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filters}
        values={{ date_from: dateFrom, date_to: dateTo, category_id: categoryId, created_by: createdBy }}
        onChange={onFilters}
        inlineThreshold={0}
        actions={
          <>
            <RefreshButton loading={loading} onClick={reload} />
            <div className={t.grandTotal}>
              <span>Total del periodo</span>
              <strong>{expenseMoney(grandTotal)}</strong>
            </div>
          </>
        }
      />

      {loading ? (
        <Spinner center label="Calculando resumen…" />
      ) : error ? (
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
      ) : count === 0 && roots.length === 0 ? (
        <Card>
          <Card.Body>
            <p className={s.faint}>No hay gastos registrados para los filtros seleccionados.</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Card padding="0">
            <Card.Header title="Resumen del periodo" />
            <div className={t.tiles}>
              <div className={t.tile}>
                <span className={t.tileLabel}>Total gastado</span>
                <span className={t.tileValue}>{expenseMoney(grandTotal)}</span>
                <span className={t.tileHint}>{formatShortDate(dateFrom)} — {formatShortDate(dateTo)}</span>
              </div>
              <div className={t.tile}>
                <span className={t.tileLabel}>Gastos registrados</span>
                <span className={t.tileValue}>{count}</span>
                <span className={t.tileHint}>sin incluir anulados</span>
              </div>
              <div className={t.tile}>
                <span className={t.tileLabel}>Gasto promedio</span>
                <span className={t.tileValue}>{expenseMoney(average)}</span>
                <span className={t.tileHint}>por gasto registrado</span>
              </div>
              <div className={t.tile}>
                <span className={t.tileLabel}>Gasto más alto</span>
                <span className={t.tileValue}>{topExpense ? expenseMoney(topExpense.total) : '—'}</span>
                {topExpense && (
                  <span className={t.tileHint}>
                    {[topExpense.supplier_name, formatShortDate(topExpense.expense_date)].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </Card>

          <div className={t.cardsGrid}>
            {distributionCard('Métodos de pago', 'fas fa-wallet', byPayment, (r) => r.id ?? 'none')}
            {distributionCard('Registrado por', 'fas fa-user', byCreator, (r) => r.user_id ?? 'none')}
          </div>

          <Card padding="0">
            <Card.Header title="Top de categorías" />
            {roots.length === 0 ? (
              <p className={`${s.faint} ${t.distEmpty}`}>Sin datos en el rango.</p>
            ) : (
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
            )}
          </Card>
        </>
      )}
    </div>
  );
}
