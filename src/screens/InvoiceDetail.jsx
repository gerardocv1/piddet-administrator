import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, IconButton, Spinner } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { orderStatusOf, paymentStatusOf, serviceTypeLabel, originLabel, paymentMethodLabel } from '../lib/orderLabels.js';
import s from './screens.module.css';
import t from './InvoiceDetail.module.css';

// Detalle completo de una factura (orden): ítems con opciones, impuestos, pagos, totales,
// cliente (OWNER) y quién la creó (CREATOR). Solo lectura.
export function InvoiceDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const fetcher = React.useCallback(() => api.order(orderId), [orderId]);
  const { data, loading, error } = useResource(fetcher, null, [orderId]);

  // Conserva la consulta del listado (?date=&page=) al volver.
  const goBack = () => navigate(`/invoices${params.toString() ? `?${params.toString()}` : ''}`);

  if (loading) return <Spinner center label="Cargando factura…" />;
  if (error || !data?.order) {
    return (
      <div className={s.page}>
        <div className={s.stateError}>
          <i className="fas fa-triangle-exclamation" /> {error || 'No se encontró la factura.'}
        </div>
      </div>
    );
  }

  const { order, customer, creator, items = [], taxes = [], status, payments = [] } = data;
  const st = orderStatusOf(order.status);
  const pay = paymentStatusOf(order.status_payment);

  const personCard = (title, person, name, emptyText) => (
    <Card>
      <Card.Header title={title} />
      <Card.Body>
        {person ? (
          <div className={t.person}>
            <div className={t.personName}>{name?.trim() || `${person.first_name || ''} ${person.last_name || ''}`.trim() || '—'}</div>
            <div className={t.personMeta}>
              {person.email && <span><i className="fas fa-envelope" /> {person.email}</span>}
              {person.phone_number && <span><i className="fas fa-phone" /> {person.phone_code ? `+${person.phone_code} ` : ''}{person.phone_number}</span>}
            </div>
          </div>
        ) : (
          <p className={s.faint}>{emptyText}</p>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a facturas" onClick={goBack} />
        <div className={t.headText}>
          <h2 className={t.title}>Factura {order.order_number || order.id}</h2>
          <span className={s.muted}>{order.created_date}</span>
        </div>
        <div className={t.headBadges}>
          <Badge variant={st.variant} dot>{status?.name || st.label}</Badge>
          <Badge variant={pay.variant}>{pay.label}</Badge>
        </div>
      </div>

      <p className={t.metaLine}>
        <span><i className="fas fa-cash-register" /> Origen: {originLabel(order.origin_code)}</span>
        <span><i className="fas fa-utensils" /> Servicio: {serviceTypeLabel(order.service_type)}</span>
        {order.table_id != null && <span><i className="fas fa-chair" /> Mesa: {order.table_id}</span>}
      </p>

      <div className={t.mainGrid}>
        <Card>
          <Card.Header title="Ítems" />
          <Card.Body>
            {items.length === 0 ? (
              <p className={s.faint}>Sin ítems.</p>
            ) : (
              <ul className={t.items}>
                {items.map((it) => (
                  <li key={it.id} className={t.item}>
                    <div className={t.itemRow}>
                      <span className={t.itemName}>
                        <strong>{it.quantity}×</strong> {it.name}
                        {it.reference && <span className={t.itemRef}>{it.reference}</span>}
                      </span>
                      <span className={t.itemPrice}>{it.subtotal_formatted}</span>
                    </div>
                    <div className={t.itemUnit}>{it.unit_price_formatted} c/u</div>
                    {(it.options || []).length > 0 && (
                      <ul className={t.options}>
                        {it.options.map((op) => (
                          <li key={op.id}>
                            <span>+ {op.name}{op.quantity > 1 ? ` (${op.quantity}×)` : ''}</span>
                            <span>{op.total_formatted}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Resumen" />
          <Card.Body>
            <dl className={t.summary}>
              <div><dt>Subtotal</dt><dd>{order.subtotal_formatted}</dd></div>
              <div><dt>Impuestos</dt><dd>{order.tax_formatted}</dd></div>
              <div><dt>Descuento</dt><dd>{order.discount_formatted}</dd></div>
              <div className={t.summaryTotal}><dt>Total</dt><dd>{order.total_formatted}</dd></div>
            </dl>
          </Card.Body>
        </Card>
      </div>

      <div className={t.sideGrid}>
        <Card>
          <Card.Header title="Impuestos" />
          <Card.Body>
            {taxes.length === 0 ? (
              <p className={s.faint}>Sin impuestos aplicados.</p>
            ) : (
              <ul className={t.lines}>
                {taxes.map((tx) => (
                  <li key={tx.tax_id}>
                    <span>{tx.name || 'Impuesto'} {tx.percentage != null ? `${tx.percentage}%` : ''}</span>
                    <span>{tx.value_formatted}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Pagos" />
          <Card.Body>
            {payments.length === 0 ? (
              <p className={s.faint}>Sin pagos registrados.</p>
            ) : (
              <ul className={t.lines}>
                {payments.map((p, i) => (
                  <li key={p.id ?? i}>
                    <span>{paymentMethodLabel(p.payment_method_name)}</span>
                    <span>{p.value_formatted}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className={t.sideGrid}>
        {personCard('Cliente (solicitó)', customer, customer?.customer_name, 'Sin datos del cliente.')}
        {personCard('Creada por', creator, creator?.creator_name, 'Sin datos del creador.')}
      </div>
    </div>
  );
}
