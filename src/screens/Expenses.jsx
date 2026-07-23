import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, DataTable, Badge, Button, FilterBar, Pagination } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import { todayIso } from '../lib/orderLabels.js';
import { expenseMoney, monthStartIso } from '../lib/expenseLabels.js';
import { formatShortDate } from '../lib/dates.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Anulado' },
];

// Listado de gastos de la compañía activa. Las fechas van inline (rango, mes actual por
// defecto); el resto de filtros usa el modal del FilterBar con chips (patrón del listado de
// productos, inlineThreshold=0): categoría (árbol completo como selector, filtra incluyendo
// su subárbol), método de pago y estado. Todo vive en la URL para que volver desde el
// detalle conserve la consulta.
export function Expenses() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const dateFrom = params.get('date_from') || monthStartIso();
  const dateTo = params.get('date_to') || todayIso();
  const categoryId = params.get('category_id') || undefined;
  const paymentMethod = params.get('payment_method') || undefined;
  const status = params.get('status') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const from = next.date_from ?? dateFrom;
    const to = next.date_to ?? dateTo;
    if (from && from !== monthStartIso()) q.date_from = from;
    if (to && to !== todayIso()) q.date_to = to;
    const cat = 'category_id' in next ? next.category_id : categoryId;
    const pay = 'payment_method' in next ? next.payment_method : paymentMethod;
    const st = 'status' in next ? next.status : status;
    if (cat) q.category_id = cat;
    if (pay) q.payment_method = pay;
    if (st) q.status = st;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const fetcher = React.useCallback(
    () => api.expenses({ dateFrom, dateTo, categoryId, paymentMethod, status, page }),
    [dateFrom, dateTo, categoryId, paymentMethod, status, page],
  );
  const { data, loading, error } = useResource(fetcher, EMPTY, [dateFrom, dateTo, categoryId, paymentMethod, status, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  // Árbol completo de categorías aplanado e indentado: son muchas opciones, así que el
  // FilterBar lo pinta como selector dentro del modal (y el backend filtra por subárbol).
  const treeFetcher = React.useCallback(() => api.expenseCategoriesTree(), []);
  const { data: tree } = useResource(treeFetcher, [], []);

  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const paymentOptions = React.useMemo(
    () => paymentMethods.map((m) => ({ value: m.id, label: m.name })),
    [paymentMethods],
  );
  const categoryOptions = React.useMemo(() => {
    const out = [];
    const walk = (nodes, depth) => {
      for (const n of nodes) {
        // Indentación con NBSP (los espacios normales se colapsan dentro de <option>).
        out.push({ value: String(n.id), label: `${'   '.repeat(depth)}${n.name}` });
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(tree || [], 0);
    return out;
  }, [tree]);

  const columns = [
    { key: 'expense_date', header: 'Fecha', width: 120, nowrap: true, render: (r) => <span className={s.cellStrong}>{formatShortDate(r.expense_date)}</span> },
    { key: 'supplier_name', header: 'Proveedor', ellipsis: true, render: (r) => r.supplier_name || <span className={s.faint}>—</span> },
    { key: 'payment_method', header: 'Pago', width: 150, ellipsis: true, render: (r) => r.payment_method_name || <span className={s.faint}>—</span> },
    {
      key: 'status', header: 'Estado', width: 110,
      render: (r) => (Number(r.status) === 1
        ? <Badge variant="success" dot>Activo</Badge>
        : <Badge variant="danger" dot>Anulado</Badge>),
    },
    { key: 'total', header: 'Total', width: 130, align: 'right', render: (r) => <span className={s.priceCell}>{expenseMoney(r.total)}</span> },
  ];

  const filterDefs = [
    { key: 'range', type: 'daterange', label: 'Fecha', icon: 'fas fa-calendar', fromKey: 'date_from', toKey: 'date_to', max: todayIso() },
    { key: 'category_id', type: 'select', label: 'Categoría', icon: 'fas fa-tags', options: categoryOptions, placeholder: 'Todas las categorías' },
    { key: 'payment_method', type: 'select', label: 'Método de pago', icon: 'fas fa-wallet', options: paymentOptions },
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
  ];

  const onFilters = (next) => {
    let from = next.date_from || dateFrom;
    let to = next.date_to || dateTo;
    if (from > to) [from, to] = [to, from];
    setQuery({
      date_from: from,
      date_to: to,
      category_id: next.category_id,
      payment_method: next.payment_method,
      status: next.status,
    });
  };

  return (
    <div className={s.page}>
      <FilterBar
        filters={filterDefs}
        values={{ date_from: dateFrom, date_to: dateTo, category_id: categoryId, payment_method: paymentMethod, status }}
        onChange={onFilters}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin gastos en el rango' : `${pg.total} gasto${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
            {/* En móvil abre el asistente paso a paso; en desktop, el formulario clásico. */}
            <Button variant="primary" size="sm" icon="fas fa-plus"
              onClick={() => navigate(isMobile ? '/expenses/quick' : '/expenses/new')}>
              Nuevo gasto
            </Button>
          </>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay gastos para el rango seleccionado."
          onRowClick={(r) => navigate(`/expenses/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}
    </div>
  );
}
