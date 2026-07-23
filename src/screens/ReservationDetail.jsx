import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, IconButton, Avatar, Spinner, Modal, Input, Select, MoneyInput } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { reservationMoney, reservationStatusMeta, arrivalSlotLabel, idTypeLabel, RESERVATION_STATUS } from '../lib/reservationLabels.js';
import s from './screens.module.css';
import t from './ReservationDetail.module.css';

// Detalle de una reserva: datos de la unidad y fechas, huéspedes (con su pre-check-in), servicios
// adicionales (agregar/quitar), pagos/adelantos (agregar/anular) y el resumen de saldo. Las acciones
// de estado (confirmar, check-in, cancelar) dependen del estado y de los permisos.
export function ReservationDetail() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = usePermissions();

  const fetcher = React.useCallback(() => api.reservation(reservationId), [reservationId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [reservationId]);

  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState('');
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [payOpen, setPayOpen] = React.useState(false);
  const [payment, setPayment] = React.useState({ payment_method: '', value: '' });
  const [serviceOpen, setServiceOpen] = React.useState(false);
  const [serviceSel, setServiceSel] = React.useState({ id: '', quantity: 1 });
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutPay, setCheckoutPay] = React.useState({ payment_method: '', value: '' });
  const [guestOpen, setGuestOpen] = React.useState(null);
  const [guestDetail, setGuestDetail] = React.useState(null);
  const [guestLoading, setGuestLoading] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const { data: serviceItems } = useResource(React.useCallback(() => api.serviceItems(), []), [], []);
  const ordersFetcher = React.useCallback(() => api.reservationOrders(reservationId), [reservationId]);
  const { data: linkedOrders, reload: reloadOrders } = useResource(ordersFetcher, [], [reservationId]);

  const goBack = () => navigate(`/reservations${params.toString() ? `?${params.toString()}` : ''}`);

  const run = async (fn, errMsg) => {
    if (busy) return;
    setBusy(true); setActionError('');
    try {
      setData(await fn());
      return true;
    } catch (e) {
      setActionError(e?.message || errMsg);
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner center label="Cargando reserva…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error || 'No se encontró la reserva.'}</div>
      </div>
    );
  }

  const status = Number(data.status);
  const meta = reservationStatusMeta(status);
  const isPending = status === RESERVATION_STATUS.PENDING;
  const isConfirmed = status === RESERVATION_STATUS.CONFIRMED;
  const isCheckedIn = status === RESERVATION_STATUS.CHECKED_IN;
  const isOpen = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN].includes(status);
  const checkinLink = `${window.location.origin}/checkin/${data.code}`;

  const addPayment = async () => {
    if (!payment.payment_method || !payment.value) return;
    const ok = await run(() => api.addReservationPayment(reservationId, payment), 'No se pudo registrar el pago.');
    if (ok) { setPayOpen(false); setPayment({ payment_method: '', value: '' }); }
  };
  const annulPayment = (paymentId) => run(() => api.annulReservationPayment(reservationId, paymentId), 'No se pudo anular el pago.');

  const addService = async () => {
    if (!serviceSel.id) return;
    const ok = await run(() => api.addReservationService(reservationId, { item_id: Number(serviceSel.id), quantity: serviceSel.quantity }), 'No se pudo agregar el servicio.');
    if (ok) { setServiceOpen(false); setServiceSel({ id: '', quantity: 1 }); }
  };
  const removeService = (lineId) => run(() => api.removeReservationService(reservationId, lineId), 'No se pudo quitar el servicio.');

  const doCancel = async () => {
    const ok = await run(() => api.cancelReservation(reservationId, cancelReason.trim() || null), 'No se pudo cancelar la reserva.');
    if (ok) setCancelOpen(false);
  };

  const doCheckout = async () => {
    const payment = checkoutPay.payment_method && checkoutPay.value ? checkoutPay : null;
    const ok = await run(() => api.checkoutReservation(reservationId, payment), 'No se pudo hacer el checkout.');
    if (ok) { setCheckoutOpen(false); setCheckoutPay({ payment_method: '', value: '' }); reloadOrders(); }
  };

  const consumptions = (linkedOrders || []).filter((o) => !o.is_lodging);

  const openGuest = async (g) => {
    setGuestOpen(g);
    setGuestDetail(null);
    if (!g.user_id) return;
    setGuestLoading(true);
    try {
      setGuestDetail(await api.guest(g.user_id));
    } catch {
      // El modal muestra los datos básicos de la reserva si el perfil no carga.
    } finally {
      setGuestLoading(false);
    }
  };

  const copyCheckinLink = async () => {
    try {
      await navigator.clipboard.writeText(checkinLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano */ }
  };

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a reservas" onClick={goBack} />
        <div className={t.headText}>
          <h2 className={t.title}>Reserva {data.code}</h2>
          <span className={s.muted}>{data.rentable_unit_name} · {data.check_in_date} → {data.check_out_date}</span>
        </div>
        <div className={t.headActions}>
          <Badge variant={meta.variant} dot>{meta.label}</Badge>
          {isPending && <Button variant="secondary" size="sm" icon="fas fa-circle-check" loading={busy} onClick={() => run(() => api.confirmReservation(reservationId), 'No se pudo confirmar.')}>Confirmar</Button>}
          {isConfirmed && <Button variant="primary" size="sm" icon="fas fa-door-open" loading={busy} onClick={() => run(() => api.checkInReservation(reservationId), 'No se pudo hacer check-in.')}>Check-in</Button>}
          {isCheckedIn && can('reservation-checkout') && (
            <Button variant="primary" size="sm" icon="fas fa-file-invoice-dollar" onClick={() => setCheckoutOpen(true)}>Checkout</Button>
          )}
          {isOpen && !isCheckedIn && can('reservation-cancel') && (
            <Button variant="danger" size="sm" icon="fas fa-ban" onClick={() => setCancelOpen(true)}>Cancelar</Button>
          )}
        </div>
      </div>

      {status === RESERVATION_STATUS.CANCELLED && (
        <div className={t.banner}>
          <i className="fas fa-ban" /> Reserva cancelada
          {data.cancelled_by_name ? <> por <strong>{data.cancelled_by_name}</strong></> : null}
          {data.cancellation_reason ? <> · {data.cancellation_reason}</> : null}
        </div>
      )}

      {actionError && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {actionError}</div>}

      <div className={t.grid}>
        <div className={t.mainCol}>
          {/* Datos de la estadía */}
          <Card>
            <Card.Header title="Estadía" />
            <Card.Body>
              <div className={t.stayStrip}>
                <div className={t.stayDate}>
                  <span className={t.stayLabel}>Check-in</span>
                  <strong>{data.check_in_date}</strong>
                </div>
                <div className={t.stayNights}>
                  <span className={t.stayNightsNum}>{data.nights}</span>
                  <span className={t.stayLabel}>{Number(data.nights) === 1 ? 'noche' : 'noches'}</span>
                </div>
                <div className={`${t.stayDate} ${t.stayDateEnd}`}>
                  <span className={t.stayLabel}>Check-out</span>
                  <strong>{data.check_out_date}</strong>
                </div>
              </div>
              <dl className={t.meta}>
                <div><dt><i className="fas fa-house-chimney" /> Unidad</dt><dd>{data.rentable_unit_name}</dd></div>
                <div><dt><i className="fas fa-moon" /> Tarifa / noche</dt><dd>{reservationMoney(data.price_per_night)}</dd></div>
                <div><dt><i className="fas fa-clock" /> Llegada estimada</dt><dd>{arrivalSlotLabel(data.expected_arrival_time)}</dd></div>
                <div><dt><i className="fas fa-user" /> Registró</dt><dd>{data.created_by_name || '—'}</dd></div>
              </dl>
              {data.notes && <p className={t.notes}>{data.notes}</p>}
            </Card.Body>
          </Card>

          {/* Huéspedes */}
          <Card>
            <Card.Header title={`Huéspedes (${data.guests.length})`} />
            <Card.Body>
              <ul className={t.guests}>
                {data.guests.map((g) => (
                  <li key={g.id}>
                    <button type="button" className={t.guest} title="Ver información del huésped" onClick={() => openGuest(g)}>
                      <Avatar name={g.name} size="sm" />
                      <div className={t.guestText}>
                        <span className={t.guestName}>{g.name}</span>
                        <span className={s.muted}>{g.document_number || 'Documento pendiente'}</span>
                      </div>
                      {g.is_holder && <Badge variant="info" dot>Titular</Badge>}
                      <i className={`fas fa-chevron-right ${t.guestChevron}`} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>

          {/* Servicios adicionales */}
          <Card>
            <Card.Header title="Servicios adicionales" action={
              isOpen ? <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => setServiceOpen(true)}>Agregar</Button> : null
            } />
            <Card.Body>
              {data.services.length === 0 ? <p className={s.faint}>Sin servicios adicionales.</p> : (
                <ul className={t.lines}>
                  {data.services.map((sv) => (
                    <li key={sv.id} className={t.line}>
                      <span className={t.lineName}>{sv.name} {sv.quantity > 1 && <span className={s.muted}>×{sv.quantity}</span>}</span>
                      <span className={t.linePrice}>{reservationMoney(sv.total)}</span>
                      {isOpen && <IconButton icon="fas fa-trash" variant="light" title="Quitar" onClick={() => removeService(sv.id)} />}
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>

          {/* Consumos POS vinculados */}
          {consumptions.length > 0 && (
            <Card>
              <Card.Header title="Consumos durante la estadía" />
              <Card.Body>
                <ul className={t.lines}>
                  {consumptions.map((o) => (
                    <li key={o.id} className={t.line}>
                      <span className={t.lineName}>
                        {o.order_number ? `#${o.order_number}` : 'Consumo'}
                        <span className={s.muted}> · {String(o.date).slice(0, 10)}</span>
                      </span>
                      <span className={t.linePrice}>{reservationMoney(o.total)}</span>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {/* Pagos */}
          <Card>
            <Card.Header title="Pagos y adelantos" action={
              isOpen ? <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => setPayOpen(true)}>Registrar pago</Button> : null
            } />
            <Card.Body>
              {data.payments.length === 0 ? <p className={s.faint}>Sin pagos registrados.</p> : (
                <ul className={t.lines}>
                  {data.payments.map((p) => {
                    const active = Number(p.status) === 1;
                    return (
                      <li key={p.id} className={`${t.line} ${!active ? t.lineAnnulled : ''}`}>
                        <span className={t.lineName}>
                          {p.payment_method_name || p.payment_method}
                          <span className={s.muted}> · {p.payment_date}</span>
                          {!active && <Badge variant="danger" dot>Anulado</Badge>}
                        </span>
                        <span className={t.linePrice}>{reservationMoney(p.value)}</span>
                        {active && isOpen && can('reservation-payment-annul') && (
                          <IconButton icon="fas fa-ban" variant="light" title="Anular pago" onClick={() => annulPayment(p.id)} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className={t.sideCol}>
          {/* Resumen consolidado: reserva + consumos POS de la estadía */}
          <Card>
            <Card.Header title="Resumen" />
            <Card.Body>
              <div className={t.summary}>
                <SummaryRow label="Hospedaje" value={reservationMoney(data.summary.lodging_subtotal)} />
                <SummaryRow label="Servicios" value={reservationMoney(data.summary.services_total)} />
                <SummaryRow label="Total reserva" value={reservationMoney(data.summary.total)} strong />
                <div className={t.summaryDivider} />
                <SummaryRow label="Pagado" value={reservationMoney(data.summary.paid)} />
                <SummaryRow label="Saldo reserva" value={reservationMoney(data.summary.balance)} strong />
                {Number(data.summary.consumptions?.count) > 0 && (
                  <>
                    <div className={t.summaryDivider} />
                    <SummaryRow label={`Consumos (${data.summary.consumptions.count})`} value={reservationMoney(data.summary.consumptions.total)} />
                    <SummaryRow label="Consumos pagados" value={reservationMoney(data.summary.consumptions.paid)} />
                    <SummaryRow label="Total estadía" value={reservationMoney(data.summary.stay_grand_total)} />
                    <SummaryRow label="Por cobrar" value={reservationMoney(data.summary.pending_total)} strong />
                  </>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Pre-check-in */}
          <Card>
            <Card.Header title="Pre-check-in" action={
              data.precheckin_completed_at
                ? <Badge variant="success" dot>Completado</Badge>
                : <Badge variant="warning" dot>Pendiente</Badge>
            } />
            <Card.Body>
              <div className={t.linkBox}>
                <div className={t.linkRow}>
                  <span className={t.code}>{data.code}</span>
                  <IconButton icon={linkCopied ? 'fas fa-check' : 'fas fa-copy'} variant="light"
                    title={linkCopied ? 'Enlace copiado' : 'Copiar enlace'} onClick={copyCheckinLink} />
                </div>
                <a className={t.link} href={checkinLink} target="_blank" rel="noreferrer">{checkinLink}</a>
              </div>
              <p className={t.linkHint}>
                {data.precheckin_completed_at
                  ? `El huésped completó sus datos el ${String(data.precheckin_completed_at).slice(0, 10)}.`
                  : 'Comparte el enlace para que el huésped complete sus datos.'}
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <Modal open={cancelOpen} size="sm" title="Cancelar reserva" onClose={() => setCancelOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>Volver</Button>
          <Button variant="danger" icon="fas fa-ban" loading={busy} onClick={doCancel}>Cancelar reserva</Button>
        </>}>
        <div className={s.formCol}>
          <p>Se liberan las fechas de la unidad. Esta acción no se puede deshacer.</p>
          <Input label="Motivo (opcional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </Modal>

      <Modal open={payOpen} size="sm" title="Registrar pago" onClose={() => setPayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy} onClick={addPayment}>Registrar</Button>
        </>}>
        <div className={s.formCol}>
          <Select label="Método de pago" icon="fas fa-wallet" value={payment.payment_method}
            onChange={(e) => setPayment((p) => ({ ...p, payment_method: e.target.value }))}
            options={[{ value: '', label: 'Selecciona…' }, ...(paymentMethods || []).map((m) => ({ value: m.id, label: m.name }))]} />
          <MoneyInput label="Valor" icon="fas fa-dollar-sign" placeholder="0"
            value={payment.value} onChange={(v) => setPayment((p) => ({ ...p, value: v }))} />
        </div>
      </Modal>

      <Modal open={checkoutOpen} size="sm" title="Checkout de la reserva" onClose={() => setCheckoutOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-file-invoice-dollar" loading={busy} onClick={doCheckout}>Cerrar y facturar</Button>
        </>}>
        <div className={s.formCol}>
          <p>Se generará la factura de hospedaje (noches + servicios). El saldo debe quedar en cero.</p>
          <div className={t.summary}>
            <SummaryRow label="Total" value={reservationMoney(data.summary.total)} />
            <SummaryRow label="Pagado" value={reservationMoney(data.summary.paid)} />
            <SummaryRow label="Saldo" value={reservationMoney(data.summary.balance)} strong />
          </div>
          {Number(data.summary.balance) > 0 && (
            <>
              <p className={s.muted}>Registra el pago final para saldar:</p>
              <Select label="Método de pago" icon="fas fa-wallet" value={checkoutPay.payment_method}
                onChange={(e) => setCheckoutPay((p) => ({ ...p, payment_method: e.target.value }))}
                options={[{ value: '', label: 'Selecciona…' }, ...(paymentMethods || []).map((m) => ({ value: m.id, label: m.name }))]} />
              <MoneyInput label="Valor" icon="fas fa-dollar-sign" placeholder={data.summary.balance}
                value={checkoutPay.value} onChange={(v) => setCheckoutPay((p) => ({ ...p, value: v }))} />
            </>
          )}
        </div>
      </Modal>

      <Modal open={serviceOpen} size="sm" title="Agregar servicio" onClose={() => setServiceOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setServiceOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy} onClick={addService}>Agregar</Button>
        </>}>
        <div className={s.formCol}>
          <Select label="Servicio" icon="fas fa-champagne-glasses" value={serviceSel.id}
            onChange={(e) => setServiceSel((x) => ({ ...x, id: e.target.value }))}
            options={[{ value: '', label: 'Selecciona…' }, ...(serviceItems || []).map((st) => ({ value: String(st.id), label: `${st.name} · ${reservationMoney(st.price)}` }))]} />
          <Input label="Cantidad" type="number" min="1" value={serviceSel.quantity}
            onChange={(e) => setServiceSel((x) => ({ ...x, quantity: Math.max(1, Number(e.target.value) || 1) }))} />
        </div>
      </Modal>

      <Modal open={!!guestOpen} title="Información del huésped" onClose={() => setGuestOpen(null)}>
        {guestOpen && <GuestProfile guest={guestOpen} detail={guestDetail} loading={guestLoading} />}
      </Modal>
    </div>
  );
}

function GuestProfile({ guest, detail, loading }) {
  const name = detail?.name || guest.name;
  const phone = detail?.phone_number
    ? `${detail.phone_code ? `+${detail.phone_code} ` : ''}${detail.phone_number}`
    : null;
  const documentNumber = detail?.id_number || guest.document_number;

  return (
    <div className={t.guestProfile}>
      <div className={t.guestProfileHead}>
        <Avatar name={name} size="lg" />
        <div>
          <span className={t.guestProfileName}>{name}</span>
          {guest.is_holder && <Badge variant="info" dot>Titular</Badge>}
        </div>
      </div>

      {loading ? <Spinner center label="Cargando perfil…" /> : (
        <>
          <dl className={t.meta}>
            <div>
              <dt><i className="fas fa-id-card" /> {detail?.id_type_id ? idTypeLabel(detail.id_type_id) : 'Documento'}</dt>
              <dd>{documentNumber || 'Pendiente'}</dd>
            </div>
            <div><dt><i className="fas fa-phone" /> Celular</dt><dd>{phone || '—'}</dd></div>
            <div><dt><i className="fas fa-envelope" /> Correo</dt><dd>{detail?.email || '—'}</dd></div>
            <div><dt><i className="fas fa-cake-candles" /> Nacimiento</dt><dd>{detail?.birthdate || '—'}</dd></div>
            <div><dt><i className="fas fa-plane-departure" /> Ciudad de origen</dt><dd>{detail?.origin_city || '—'}</dd></div>
            <div><dt><i className="fas fa-plane-arrival" /> Ciudad de destino</dt><dd>{detail?.destination_city || '—'}</dd></div>
          </dl>

          {detail?.id_document_url ? (
            <div className={t.guestDocument}>
              <span className={t.stayLabel}>Fotografía del documento</span>
              <a href={detail.id_document_url} target="_blank" rel="noreferrer" title="Ver en tamaño completo">
                <img src={detail.id_document_url} alt={`Documento de ${name}`} />
              </a>
            </div>
          ) : (
            <p className={s.faint}><i className="fas fa-id-card" /> Sin fotografía del documento (se captura en el pre-check-in).</p>
          )}
        </>
      )}
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className={t.summaryRow}>
      <span className={s.muted}>{label}</span>
      <span className={strong ? t.summaryStrong : ''}>{value}</span>
    </div>
  );
}
