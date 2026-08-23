import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, IconButton, RefreshButton, Avatar, Spinner, Modal, ConfirmDialog, Alert, useToast, Input, Select, MoneyInput, Autocomplete, PageHeader, Dropdown, DatePicker, DateRangePicker } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import { reservationMoney, reservationStatusMeta, arrivalSlotLabel, idTypeLabel, RESERVATION_STATUS } from '../lib/reservationLabels.js';
import { formatStayRange } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import t from './ReservationDetail.module.css';

// Detalle de una reserva en dos secciones:
//  - Reserva: estadía, huéspedes, servicios adicionales y pre-check-in.
//  - Cuenta: la parte monetaria — cargos/consumos (agregables desde el catálogo), pagos y abonos
//    (cada abono genera su factura), facturas vinculadas y el resumen de saldo. El checkout factura
//    toda la cuenta aplicando los anticipos como descuento y salda los consumos POS pendientes.
export function ReservationDetail() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = usePermissions();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.reservation(reservationId), [reservationId]);
  const { data, setData, loading, error, reload } = useResource(fetcher, null, [reservationId]);

  const [tab, setTab] = React.useState('reservation');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState('');
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [priceOpen, setPriceOpen] = React.useState(false);
  const [newPrice, setNewPrice] = React.useState('');
  const [stayOpen, setStayOpen] = React.useState(false);
  const [stay, setStay] = React.useState({ check_in_date: '', check_out_date: '', guests_count: 1 });
  const [stayAvail, setStayAvail] = React.useState(null);
  const [stayAvailLoading, setStayAvailLoading] = React.useState(false);
  const [checkInOpen, setCheckInOpen] = React.useState(false);
  const [forceCheckInOpen, setForceCheckInOpen] = React.useState(false);
  const [reopenOpen, setReopenOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [payment, setPayment] = React.useState({ payment_method: '', value: '' });
  const [serviceOpen, setServiceOpen] = React.useState(false);
  const [serviceSel, setServiceSel] = React.useState({ id: '', quantity: 1 });
  const [chargeOpen, setChargeOpen] = React.useState(false);
  const [chargeSel, setChargeSel] = React.useState({ item: null, quantity: 1 });
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

  useSetPageTitle(data?.code ? `Reserva ${data.code}` : null);

  // Disponibilidad de la unidad para las fechas del modal de estadía: se consulta mientras se
  // edita (excluyendo esta reserva) para decir QUIÉN ocupa esas fechas antes de intentar guardar.
  React.useEffect(() => {
    const { check_in_date: from, check_out_date: to } = stay;
    if (!stayOpen || !from || !to || new Date(to) <= new Date(from)) {
      setStayAvail(null);
      setStayAvailLoading(false);
      return undefined;
    }
    let cancelled = false;
    setStayAvailLoading(true);
    const timer = setTimeout(() => {
      api.reservationAvailability(reservationId, { checkIn: from, checkOut: to })
        .then((r) => { if (!cancelled) setStayAvail(r); })
        .catch(() => { if (!cancelled) setStayAvail(null); })
        .finally(() => { if (!cancelled) setStayAvailLoading(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [stayOpen, stay.check_in_date, stay.check_out_date, reservationId]);

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
        <Alert tone="danger" title="No se pudo abrir la reserva">{error || 'No se encontró la reserva.'}</Alert>
      </div>
    );
  }

  const status = Number(data.status);
  const meta = reservationStatusMeta(status);
  const isPending = status === RESERVATION_STATUS.PENDING;
  const isConfirmed = status === RESERVATION_STATUS.CONFIRMED;
  const isCheckedIn = status === RESERVATION_STATUS.CHECKED_IN;
  const isCheckedOut = status === RESERVATION_STATUS.CHECKED_OUT;
  const isOpen = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.CHECKED_IN].includes(status);
  const checkinLink = `${window.location.origin}/checkin?code=${data.code}`;
  // Sin pre-check-in del huésped no se puede registrar la entrada (regla del backend).
  const precheckinDone = !!data.precheckin_completed_at;
  const guestsCount = Number(data.guests_count) || data.guests.length;

  // Modal "Modificar estadía": el backend recalcula, pero el resumen se previsualiza aquí con la
  // misma fórmula (tarifa pactada × noches + servicios) para que el cambio sea explícito.
  const unitCapacity = Number(data.rentable_unit_capacity) || 0;
  const stayNights = stay.check_in_date && stay.check_out_date
    ? Math.round((new Date(stay.check_out_date) - new Date(stay.check_in_date)) / 86400000)
    : 0;
  const stayLodging = Number(data.price_per_night || 0) * Math.max(0, stayNights);
  const stayGuests = Number(stay.guests_count) || 0;
  const stayGuestsInvalid = stayGuests < data.guests.length
    || stayGuests < 1
    || (unitCapacity > 0 && stayGuests > unitCapacity);

  // Personas adicionales: las que superan las que cubre la tarifa de la unidad. Se cobran por
  // persona Y por noche, con el item que designa la unidad. El backend mantiene esa línea de
  // servicio solo; aquí se previsualiza con la misma fórmula.
  const extraInfo = data.extra_guests || {};
  const includedGuests = Number(data.rentable_unit_included_guests) || 1;
  const extraPrice = Number(extraInfo.item_price || 0);
  const extraCharges = extraInfo.configured && extraPrice > 0;
  const stayExtras = Math.max(0, stayGuests - includedGuests);
  const stayExtraQty = stayExtras * Math.max(0, stayNights);
  const stayExtraTotal = extraCharges ? stayExtraQty * extraPrice : 0;
  // Los servicios que NO son el adicional: el adicional se recalcula, el resto se conserva.
  const otherServices = Number(data.services_total || 0) - Number(extraInfo.total || 0);
  const stayTotal = stayLodging + otherServices + stayExtraTotal;
  const stayConflicts = stayAvail?.conflicts || [];
  const stayUnavailable = stayAvail ? stayAvail.available === false : false;
  // Un error del servidor se queda en pantalla junto a la acción que falló (nunca es un toast).
  // El banner vive fuera de los modales y queda tapado cuando uno está abierto, así que el mismo
  // Alert se repite dentro de cada formulario.
  const errorBlock = actionError
    ? <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setActionError('')}>{actionError}</Alert>
    : null;
  // Con la entrada ya registrada solo se mueve la salida: el check-in ya ocurrió.
  const stayCheckInLocked = isCheckedIn;
  const minCheckOut = stay.check_in_date
    ? new Date(new Date(stay.check_in_date).getTime() + 86400000).toISOString().slice(0, 10)
    : undefined;

  const summary = data.summary || {};
  const accountTotal = summary.account_total ?? summary.total;
  const chargesTotal = Number(summary.charges_total || 0);
  const pendingTotal = Number(summary.pending_total ?? summary.balance ?? 0);
  const charges = data.charges || [];

  const orderKind = (o) => o.type ?? (o.is_lodging ? 'checkout' : 'consumption');
  const consumptions = (linkedOrders || []).filter((o) => orderKind(o) === 'consumption');

  const addPayment = async () => {
    if (!payment.payment_method || !payment.value) return;
    const ok = await run(() => api.addReservationPayment(reservationId, payment), 'No se pudo registrar el pago.');
    if (ok) {
      setPayOpen(false); setPayment({ payment_method: '', value: '' }); reloadOrders();
      toast({ tone: 'success', title: 'Pago registrado' });
    }
  };
  const annulPayment = async (paymentId) => {
    const ok = await run(() => api.annulReservationPayment(reservationId, paymentId), 'No se pudo anular el pago.');
    if (ok) reloadOrders();
  };

  const addService = async () => {
    if (!serviceSel.id) return;
    const ok = await run(() => api.addReservationService(reservationId, { item_id: Number(serviceSel.id), quantity: serviceSel.quantity }), 'No se pudo agregar el servicio.');
    if (ok) {
      setServiceOpen(false); setServiceSel({ id: '', quantity: 1 });
      toast({ tone: 'success', title: 'Servicio agregado' });
    }
  };
  const removeService = (lineId) => run(() => api.removeReservationService(reservationId, lineId), 'No se pudo quitar el servicio.');

  const addCharge = async () => {
    if (!chargeSel.item) return;
    const ok = await run(() => api.addReservationCharge(reservationId, { item_id: Number(chargeSel.item.id), quantity: chargeSel.quantity }), 'No se pudo agregar el cargo.');
    if (ok) {
      setChargeOpen(false); setChargeSel({ item: null, quantity: 1 });
      toast({ tone: 'success', title: 'Cargo agregado a la cuenta' });
    }
  };
  const removeCharge = (chargeId) => run(() => api.removeReservationCharge(reservationId, chargeId), 'No se pudo quitar el cargo.');

  const doCancel = async (reason) => {
    const ok = await run(() => api.cancelReservation(reservationId, reason), 'No se pudo cancelar la reserva.');
    if (ok) { setCancelOpen(false); reloadOrders(); toast({ tone: 'neutral', title: 'Reserva cancelada' }); }
  };

  const openPriceModal = () => {
    setActionError('');
    setNewPrice(String(Number(data.price_per_night) || ''));
    setPriceOpen(true);
  };
  const doUpdatePrice = async () => {
    if (newPrice === '' || Number(newPrice) < 0) return;
    const ok = await run(() => api.updateReservationPrice(reservationId, Number(newPrice)), 'No se pudo modificar el precio.');
    if (ok) { setPriceOpen(false); toast({ tone: 'success', title: 'Tarifa actualizada' }); }
  };

  const openStayModal = () => {
    setActionError('');
    setStayAvail(null);
    setStay({
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      guests_count: guestsCount,
    });
    setStayOpen(true);
  };
  const doUpdateStay = async () => {
    if (!stay.check_in_date || !stay.check_out_date || stayNights < 1) return;
    if (stayGuestsInvalid) return;
    const ok = await run(() => api.rescheduleReservation(reservationId, {
      check_in_date: stay.check_in_date,
      check_out_date: stay.check_out_date,
      guests_count: Number(stay.guests_count),
    }), 'No se pudo modificar la estadía.');
    if (ok) { setStayOpen(false); toast({ tone: 'success', title: 'Estadía actualizada' }); }
  };

  // `force` salta la regla del pre-check-in (check-in forzado): el backend registra la entrada
  // sin los datos del huésped. Cada modal confirma lo suyo antes de llegar aquí.
  const doCheckIn = async (force = false) => {
    const ok = await run(() => api.checkInReservation(reservationId, { force }), 'No se pudo hacer check-in.');
    if (ok) {
      setCheckInOpen(false); setForceCheckInOpen(false);
      toast({ tone: 'success', title: 'Entrada registrada' });
    }
  };

  const doConfirm = async () => {
    const ok = await run(() => api.confirmReservation(reservationId), 'No se pudo confirmar.');
    if (ok) toast({ tone: 'success', title: 'Reserva confirmada' });
  };

  const doReopen = async () => {
    const ok = await run(() => api.reopenReservation(reservationId), 'No se pudo reabrir la reserva.');
    if (ok) { setReopenOpen(false); reloadOrders(); toast({ tone: 'success', title: 'Reserva reabierta' }); }
  };

  const doCheckout = async () => {
    const finalPay = checkoutPay.payment_method && checkoutPay.value ? checkoutPay : null;
    const ok = await run(() => api.checkoutReservation(reservationId, finalPay), 'No se pudo hacer el checkout.');
    if (ok) {
      setCheckoutOpen(false); setCheckoutPay({ payment_method: '', value: '' }); reloadOrders();
      toast({ tone: 'success', title: 'Checkout realizado' });
    }
  };

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
      toast({ tone: 'success', title: 'Enlace de pre-check-in copiado' });
    } catch {
      // Sin permiso de portapapeles el enlace sigue visible para copiarlo a mano: es un aviso
      // que el usuario debe leer, no una confirmación.
      setActionError('No se pudo copiar el enlace. Cópialo a mano desde la pestaña Reserva.');
    }
  };

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        backTitle="Volver a reservas"
        subtitle={`${formatStayRange(data.check_in_date, data.check_out_date)} · ${data.nights} ${Number(data.nights) === 1 ? 'noche' : 'noches'}`}
        actions={<>
          <RefreshButton loading={loading} onClick={() => { reload(); reloadOrders(); }} />
          {isPending &&<Button variant="secondary" size="sm" icon="fas fa-circle-check" loading={busy} onClick={() => doConfirm()}>Confirmar</Button>}
          {isConfirmed && (
            <Button variant="outline-primary" size="sm" icon="fas fa-door-open" disabled={!precheckinDone}
              title={precheckinDone ? 'Registrar la entrada del huésped' : 'El huésped debe completar su pre-check-in antes de la entrada (o usa el check-in forzado del menú de acciones)'}
              onClick={() => setCheckInOpen(true)}>Check-in</Button>
          )}
          {isCheckedIn && can('reservation-checkout') && (
            <Button variant="outline-primary" size="sm" icon="fas fa-file-invoice-dollar" onClick={() => setCheckoutOpen(true)}>Checkout</Button>
          )}
          {isCheckedOut && can('reservation-checkout') && (
            <Button variant="secondary" size="sm" icon="fas fa-rotate-left" onClick={() => setReopenOpen(true)}>Reabrir</Button>
          )}
          {status !== RESERVATION_STATUS.CANCELLED && (
            <Dropdown
              trigger={<IconButton icon="fas fa-ellipsis-vertical" variant="light" size="sm" title="Más acciones" />}
              items={[
                { label: 'Modificar estadía', icon: 'fas fa-calendar-days', disabled: !isOpen, onClick: openStayModal },
                { label: 'Modificar precio', icon: 'fas fa-tag', disabled: !isOpen, onClick: openPriceModal },
                // Salida de emergencia del pre-check-in: cuando conseguir los datos del huésped
                // no es viable, la entrada se registra igual (previa confirmación en su modal).
                ...(isConfirmed && !precheckinDone
                  ? [{ label: 'Check-in forzado', icon: 'fas fa-person-walking-arrow-right', onClick: () => { setActionError(''); setForceCheckInOpen(true); } }]
                  : []),
                ...(can('reservation-cancel') ? [{ label: 'Cancelar esta reserva', icon: 'fas fa-ban', variant: 'danger', onClick: () => setCancelOpen(true) }] : []),
              ]}
            />
          )}
        </>}
        meta={[
          { label: 'Estado', value: <Badge variant={meta.variant} dot>{meta.label}</Badge> },
          { label: 'Unidad', value: data.rentable_unit_name },
          {
            label: 'Personas',
            value: Number(extraInfo.count) > 0
              ? `${guestsCount} · ${includedGuests} en tarifa + ${extraInfo.count} adicional${Number(extraInfo.count) === 1 ? '' : 'es'}`
              : `${guestsCount} (titular incluido)`,
          },
          { label: 'Llegada estimada', value: arrivalSlotLabel(data.expected_arrival_time) },
          { label: 'Registró', value: data.created_by_name || '—' },
        ]}
        note={status === RESERVATION_STATUS.CANCELLED ? (
          <><i className="fas fa-ban" /> Reserva cancelada
            {data.cancelled_by_name ? <> por <strong>{data.cancelled_by_name}</strong></> : null}
            {data.cancellation_reason ? <> · {data.cancellation_reason}</> : null}</>
        ) : null}
      />

      {errorBlock}

      {isOpen && Number(extraInfo.count) > 0 && !extraInfo.configured && (
        <Alert tone="warning" title={`${extraInfo.count} ${Number(extraInfo.count) === 1 ? 'persona' : 'personas'} sobre la tarifa sin cobrar`}
          action={<Button size="sm" variant="secondary" icon="fas fa-gear"
            onClick={() => navigate(`/rentable-units/${data.rentable_unit_id}`)}>Configurar unidad</Button>}>
          {data.rentable_unit_name} cubre {includedGuests} {includedGuests === 1 ? 'persona' : 'personas'} en
          su tarifa y no tiene item de persona adicional, así que el excedente no se está facturando.
        </Alert>
      )}

      {isConfirmed && !precheckinDone && (
        <Alert tone="warning" title="Pre-check-in pendiente"
          action={<Button size="sm" variant="secondary" icon="fas fa-link" onClick={copyCheckinLink}>Copiar enlace</Button>}>
          El huésped debe registrar sus datos y los de sus acompañantes antes de que puedas
          registrar la entrada.
        </Alert>
      )}

      <div className={t.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'reservation'}
          className={`${t.tab} ${tab === 'reservation' ? t.tabActive : ''}`} onClick={() => setTab('reservation')}>
          <i className="fas fa-house-chimney" /> Reserva
        </button>
        <button type="button" role="tab" aria-selected={tab === 'account'}
          className={`${t.tab} ${tab === 'account' ? t.tabActive : ''}`} onClick={() => setTab('account')}>
          <i className="fas fa-file-invoice-dollar" /> Cuenta
          {pendingTotal > 0 && <span className={t.tabAmount}>{reservationMoney(pendingTotal)}</span>}
        </button>
      </div>

      {tab === 'reservation' && (
        <div className={t.grid}>
          <div className={t.mainCol}>
            {/* Datos de la estadía */}
            <Card>
              <Card.Header title="Estadía" action={
                isOpen ? <Button variant="secondary" size="sm" icon="fas fa-pen" onClick={openStayModal}>Modificar</Button> : null
              } />
              <Card.Body>
                <div className={t.stayStrip}>
                  <div className={t.stayDate}>
                    <span className={t.stayLabel}>Check-in</span>
                    <strong>{data.check_in_date}</strong>
                    {data.check_in_time && <span className={t.stayTime}>desde {data.check_in_time}</span>}
                  </div>
                  <div className={t.stayNights}>
                    <span className={t.stayNightsNum}>{data.nights}</span>
                    <span className={t.stayLabel}>{Number(data.nights) === 1 ? 'noche' : 'noches'}</span>
                  </div>
                  <div className={`${t.stayDate} ${t.stayDateEnd}`}>
                    <span className={t.stayLabel}>Check-out</span>
                    <strong>{data.check_out_date}</strong>
                    {data.check_out_time && <span className={t.stayTime}>hasta {data.check_out_time}</span>}
                  </div>
                </div>
                <dl className={t.meta}>
                  <div><dt><i className="fas fa-moon" /> Tarifa / noche</dt><dd>{reservationMoney(data.price_per_night)}</dd></div>
                  {/* El dinero también se ve aquí, en moneda: quien mira la estadía quiere saber
                      qué se abonó sin cambiar de pestaña (y así nadie lo anota en la nota). */}
                  <div><dt><i className="fas fa-file-invoice-dollar" /> Total de la cuenta</dt><dd>{reservationMoney(accountTotal)}</dd></div>
                  <div><dt><i className="fas fa-hand-holding-dollar" /> Abonado</dt><dd>{reservationMoney(summary.paid)}</dd></div>
                  <div>
                    <dt><i className="fas fa-scale-balanced" /> Por cobrar</dt>
                    <dd className={pendingTotal > 0 ? t.metaDue : t.metaSettled}>{reservationMoney(pendingTotal)}</dd>
                  </div>
                  <div><dt><i className="fas fa-users" /> Personas</dt><dd>{guestsCount} (titular incluido)</dd></div>
                </dl>
                {/* Texto libre de quien registró la reserva. Va rotulado: suelto se lee como un
                    dato del sistema (y alguien ya escribió aquí un monto creyendo que era el abono). */}
                {data.notes && (
                  <div className={t.noteBlock}>
                    <span className={t.noteLabel}><i className="fas fa-note-sticky" /> Nota de la reserva</span>
                    <p className={t.notes}>{data.notes}</p>
                  </div>
                )}
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
                        {g.is_holder && <span className={t.roleTag}>Titular</span>}
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
                        <span className={t.lineName}>
                          {sv.name} {sv.quantity > 1 && <span className={s.muted}>×{sv.quantity}</span>}
                          {sv.is_extra_guest && <span className={s.muted}> · personas adicionales</span>}
                        </span>
                        <span className={t.linePrice}>{reservationMoney(sv.total)}</span>
                        {/* La línea de adicionales la calcula el sistema: se cambia el número de
                            personas, no se borra a mano. */}
                        {isOpen && !sv.is_extra_guest && (
                          <IconButton icon="fas fa-trash" variant="light" title="Quitar" onClick={() => removeService(sv.id)} />
                        )}
                        {isOpen && sv.is_extra_guest && (
                          <IconButton icon="fas fa-lock" variant="light" disabled
                            title="La calcula el sistema — cambia el número de personas de la reserva" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className={t.sideCol}>
            {/* Pre-check-in */}
            <Card>
              <Card.Header title="Pre-check-in" action={
                data.precheckin_completed_at
                  ? <span className={t.statusDone}>Completado</span>
                  : <span className={t.statusPending}>Pendiente</span>
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
                    : 'Comparte el enlace para que el huésped complete sus datos. Para entrar le pedimos este código y su nombre.'}
                </p>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className={t.grid}>
          <div className={t.mainCol}>
            {/* Cargos agregados desde el panel (productos o servicios del catálogo) */}
            <Card>
              <Card.Header title="Consumos y cargos" action={
                isOpen ? <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={() => setChargeOpen(true)}>Agregar ítem</Button> : null
              } />
              <Card.Body>
                {charges.length === 0 ? (
                  <p className={s.faint}>Sin cargos en la cuenta. Agrega los platos, productos o servicios que consuma el huésped; se facturan en el checkout.</p>
                ) : (
                  <ul className={t.lines}>
                    {charges.map((ch) => (
                      <li key={ch.id} className={t.line}>
                        <span className={t.lineName}>{ch.name} {ch.quantity > 1 && <span className={s.muted}>×{ch.quantity}</span>}</span>
                        <span className={t.linePrice}>{reservationMoney(ch.total)}</span>
                        {isOpen && <IconButton icon="fas fa-trash" variant="light" title="Quitar" onClick={() => removeCharge(ch.id)} />}
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

            {/* Consumos POS vinculados */}
            {consumptions.length > 0 && (
              <Card>
                <Card.Header title="Consumos desde el POS" />
                <Card.Body>
                  <ul className={t.lines}>
                    {consumptions.map((o) => (
                      <li key={o.id} className={t.line}>
                        <span className={t.lineName}>
                          {o.order_number ? `#${o.order_number}` : 'Consumo'}
                          <span className={s.muted}> · {String(o.date).slice(0, 10)}</span>
                          {o.status_payment !== 'PAID' && <span className={`${t.lineStatus} ${t.lineStatusWarn}`}>Por pagar</span>}
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
              <Card.Header title="Pagos y abonos" action={
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
                            {p.order_id && <i className="fas fa-file-invoice" title="Abono con factura" />}
                            {!active && <span className={`${t.lineStatus} ${t.lineStatusOff}`}>Anulado</span>}
                          </span>
                          <span className={t.linePrice}>{reservationMoney(p.value)}</span>
                          {active && isOpen && !p.consolidated_at && can('reservation-payment-annul') && (
                            <IconButton icon="fas fa-ban" variant="light" title="Anular pago (cancela su factura de abono)" onClick={() => annulPayment(p.id)} />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card.Body>
            </Card>

            {/* Facturas vinculadas (abonos, consumos POS y cierre) */}
            <Card>
              <Card.Header title="Facturas de la reserva" />
              <Card.Body>
                {(linkedOrders || []).length === 0 ? (
                  <p className={s.faint}>Aún no hay facturas. Los abonos, los consumos POS y el checkout generan las facturas de la reserva.</p>
                ) : (
                  <ul className={t.lines}>
                    {(linkedOrders || []).map((o) => {
                      const kind = orderKind(o);
                      const label = kind === 'checkout' ? 'Factura de cierre' : kind === 'advance' ? 'Factura de abono' : 'Consumo POS';
                      const row = (
                        <>
                          <span className={t.lineName}>
                            {label}
                            {o.order_number ? <span className={s.muted}> · #{o.order_number}</span> : null}
                            <span className={s.muted}> · {String(o.date).slice(0, 10)}</span>
                            {o.status === 'CANCELLED'
                              ? <span className={`${t.lineStatus} ${t.lineStatusOff}`}>Cancelada</span>
                              : o.status_payment === 'PAID'
                                ? <span className={`${t.lineStatus} ${t.lineStatusMuted}`}>Pagada</span>
                                : <span className={`${t.lineStatus} ${t.lineStatusWarn}`}>Por pagar</span>}
                          </span>
                          <span className={t.linePrice}>{reservationMoney(o.total)}</span>
                        </>
                      );
                      return (
                        <li key={o.id} className={t.line}>
                          {can('api-module-orders') ? (
                            <button type="button" className={t.invoiceLink} title="Ver factura" onClick={() => navigate(`/invoices/${o.id}`)}>
                              {row}
                              <i className={`fas fa-chevron-right ${t.guestChevron}`} />
                            </button>
                          ) : row}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className={t.sideCol}>
            {/* Resumen consolidado de la cuenta */}
            <Card>
              <Card.Header title="Resumen de la cuenta" />
              <Card.Body>
                <div className={t.summary}>
                  <SummaryRow label="Hospedaje" value={reservationMoney(summary.lodging_subtotal)} />
                  <SummaryRow label="Servicios" value={reservationMoney(summary.services_total)} />
                  {chargesTotal > 0 && <SummaryRow label="Consumos y cargos" value={reservationMoney(summary.charges_total)} />}
                  <SummaryRow label="Total cuenta" value={reservationMoney(accountTotal)} strong />
                  <SummaryRow label="Pagado" value={reservationMoney(summary.paid)} />
                  <SummaryRow label="Saldo cuenta" value={reservationMoney(summary.balance)} strong />
                  {Number(summary.consumptions?.count) > 0 && (
                    <>
                      <SummaryRow label={`Consumos POS (${summary.consumptions.count})`} value={reservationMoney(summary.consumptions.total)} />
                      <SummaryRow label="Consumos POS pagados" value={reservationMoney(summary.consumptions.paid)} />
                      <SummaryRow label="Total estadía" value={reservationMoney(summary.stay_grand_total)} />
                    </>
                  )}
                  <SummaryRow label="Por cobrar" value={reservationMoney(pendingTotal)} strong />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Modales */}
      <ConfirmDialog open={cancelOpen} title="Cancelar reserva"
        confirmLabel="Cancelar reserva" loading={busy}
        reason="optional" reasonLabel="Motivo"
        onConfirm={doCancel} onClose={() => setCancelOpen(false)}>
        <p>Se liberan las fechas de la unidad y se cancelan también todas las facturas de la reserva (abonos, consumos POS y cierre). Esta acción no se puede deshacer.</p>
      </ConfirmDialog>

      <Modal open={stayOpen} size="sm" title="Modificar estadía" onClose={() => setStayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setStayOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy}
            disabled={stayNights < 1 || stayGuestsInvalid || stayUnavailable || stayAvailLoading}
            onClick={doUpdateStay}>Guardar estadía</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p className={s.muted}>Se recalcula con la tarifa pactada: {reservationMoney(data.price_per_night)} / noche.</p>

          {stayCheckInLocked ? (
            <>
              <div className={t.summary}>
                <SummaryRow label="Entrada (ya registrada)" value={data.check_in_date} />
              </div>
              <DatePicker label="Salida" icon="fas fa-calendar" min={minCheckOut}
                value={stay.check_out_date}
                onChange={(iso) => setStay((x) => ({ ...x, check_out_date: iso }))} />
            </>
          ) : (
            <DateRangePicker label="Fechas de la estadía" icon="fas fa-calendar"
              value={{ from: stay.check_in_date, to: stay.check_out_date }}
              onChange={({ from, to }) => setStay((x) => ({ ...x, check_in_date: from, check_out_date: to }))} />
          )}

          {stayAvailLoading && <p className={s.faint}><i className="fas fa-circle-notch fa-spin" /> Consultando disponibilidad…</p>}
          {!stayAvailLoading && stayAvail && stayAvail.available && (
            <Alert tone="success">{data.rentable_unit_name} está libre en esas fechas.</Alert>
          )}
          {/* Ocupada: bloquea el guardado, así que va tintado y dice QUIÉN tiene esas fechas. */}
          {!stayAvailLoading && stayUnavailable && (
            <Alert tone="warning" variant="tint" title={`${data.rentable_unit_name} ya está reservada`}>
              <ul className={t.conflicts}>
                {stayConflicts.map((c) => (
                  <li key={c.id}>
                    {formatStayRange(c.check_in_date, c.check_out_date)} · reserva {c.code}
                    {c.holder_user_name ? ` · ${c.holder_user_name}` : ''}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <Input label="Personas (titular incluido)" icon="fas fa-users" type="number" min="1"
            max={unitCapacity || undefined}
            value={stay.guests_count}
            onChange={(e) => setStay((x) => ({ ...x, guests_count: e.target.value }))} />
          {unitCapacity > 0 && (
            <p className={s.faint}>
              La unidad admite máximo {unitCapacity} {unitCapacity === 1 ? 'persona' : 'personas'} y su
              tarifa cubre {includedGuests}.
            </p>
          )}
          {stayGuests < data.guests.length && (
            <Alert tone="warning">
              Hay {data.guests.length} huéspedes registrados: quita alguno antes de bajar el número.
            </Alert>
          )}
          {unitCapacity > 0 && stayGuests > unitCapacity && (
            <Alert tone="warning" variant="tint">
              La unidad no admite más de {unitCapacity} {unitCapacity === 1 ? 'persona' : 'personas'}.
            </Alert>
          )}

          {/* Excedente sobre las personas incluidas en la tarifa. */}
          {stayExtras > 0 && extraCharges && (
            <Alert tone="info" title={`${stayExtras} ${stayExtras === 1 ? 'persona adicional' : 'personas adicionales'}`}>
              {extraInfo.item_name} · {reservationMoney(extraPrice)} por persona y noche.
              Se agregan a la cuenta como {stayExtraQty} {stayExtraQty === 1 ? 'unidad' : 'unidades'}
              {' '}({reservationMoney(stayExtraTotal)}).
            </Alert>
          )}
          {stayExtras > 0 && !extraCharges && (
            <Alert tone="warning" title={`${stayExtras} ${stayExtras === 1 ? 'persona' : 'personas'} por encima de la tarifa`}>
              {data.rentable_unit_name} no tiene item de persona adicional configurado, así que no se
              cobrará nada por {stayExtras === 1 ? 'ella' : 'ellas'}. Configúralo en la unidad, o agrega
              el servicio a mano desde la reserva.
            </Alert>
          )}

          <div className={t.summary}>
            <SummaryRow label="Estadía actual"
              value={`${data.nights} ${Number(data.nights) === 1 ? 'noche' : 'noches'} · ${reservationMoney(data.lodging_subtotal)}`} />
            <SummaryRow label={`Hospedaje (${Math.max(0, stayNights)} ${stayNights === 1 ? 'noche' : 'noches'})`}
              value={reservationMoney(stayLodging)} />
            {stayExtraTotal > 0 && (
              <SummaryRow
                label={`Personas adicionales (${stayExtras} × ${Math.max(0, stayNights)} ${stayNights === 1 ? 'noche' : 'noches'})`}
                value={reservationMoney(stayExtraTotal)} />
            )}
            {otherServices > 0 && (
              <SummaryRow label="Servicios adicionales" value={reservationMoney(otherServices)} />
            )}
            <SummaryRow label="Nuevo total de la reserva" value={reservationMoney(stayTotal)} strong />
          </div>
        </div>
      </Modal>

      <Modal open={priceOpen} size="sm" title="Modificar precio de la reserva" onClose={() => setPriceOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPriceOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy} onClick={doUpdatePrice}>Guardar precio</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p className={s.muted}>
            Cambia la tarifa por noche pactada con el huésped (por ejemplo, si la tarifa de la unidad
            subió después de vender la reserva). El hospedaje y el total de la cuenta se recalculan.
          </p>
          <MoneyInput label="Tarifa por noche" icon="fas fa-dollar-sign" placeholder="0"
            value={newPrice} onChange={setNewPrice} />
          <div className={t.summary}>
            <SummaryRow label="Tarifa actual" value={reservationMoney(data.price_per_night)} />
            <SummaryRow label={`Hospedaje (${data.nights} ${Number(data.nights) === 1 ? 'noche' : 'noches'})`}
              value={reservationMoney(Number(newPrice || 0) * Number(data.nights))} strong />
          </div>
        </div>
      </Modal>

      <Modal open={checkInOpen} size="sm" title="Registrar entrada" onClose={() => setCheckInOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setCheckInOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-door-open" loading={busy} onClick={() => doCheckIn()}>Iniciar estadía</Button>
        </>}>
        <p>
          Vas a registrar la entrada de <strong>{data.holder_user_name}</strong> en {data.rentable_unit_name},
          por {data.nights} {Number(data.nights) === 1 ? 'noche' : 'noches'} y {guestsCount} {guestsCount === 1 ? 'persona' : 'personas'}.
          La reserva pasa a “En estadía” y podrás agregar consumos a su cuenta.
        </p>
      </Modal>

      {/* Check-in forzado: registra la entrada sin el pre-check-in del huésped. Se advierte qué
          se está saltando y con qué datos queda la reserva, pero se permite pasar igual. */}
      <Modal open={forceCheckInOpen} size="sm" title="Check-in forzado" onClose={() => setForceCheckInOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setForceCheckInOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-person-walking-arrow-right" loading={busy} onClick={() => doCheckIn(true)}>Forzar check-in</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <Alert tone="warning" variant="tint" title="Pre-check-in sin completar">
            Vas a registrar la entrada <strong>sin los datos del pre-check-in</strong>: la reserva
            quedará en estadía sin los documentos del huésped ni la información de sus
            acompañantes. Úsalo solo cuando no sea viable conseguir esa información.
          </Alert>
          <p>
            Se registrará la entrada de <strong>{data.holder_user_name}</strong> en {data.rentable_unit_name},
            por {data.nights} {Number(data.nights) === 1 ? 'noche' : 'noches'} y {guestsCount} {guestsCount === 1 ? 'persona' : 'personas'}.
            La reserva pasa a “En estadía” y podrás agregar consumos a su cuenta.
          </p>
          <p className={s.muted}>
            El enlace de pre-check-in sigue activo: puedes compartirlo durante la estadía para que
            el huésped complete sus datos.
          </p>
        </div>
      </Modal>

      <Modal open={reopenOpen} size="sm" title="Reabrir reserva" onClose={() => setReopenOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setReopenOpen(false)}>Volver</Button>
          <Button variant="primary" icon="fas fa-rotate-left" loading={busy} onClick={doReopen}>Reabrir</Button>
        </>}>
        <p>La cuenta vuelve a operar: podrás agregar cargos, registrar pagos y hacer un nuevo checkout. Los pagos y facturas existentes se conservan (los pagos ya consolidados no se pueden anular) y las facturas previas quedan aplicadas como abonos de la cuenta.</p>
      </Modal>

      <Modal open={payOpen} size="sm" title="Registrar pago" onClose={() => setPayOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy} onClick={addPayment}>Registrar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <p className={s.muted}>El abono genera su factura en la fecha del pago y queda aplicado a la cuenta.</p>
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
          {errorBlock}
          <p>Se factura toda la cuenta (hospedaje, servicios y consumos) aplicando los abonos como anticipo, y se saldan los consumos POS pendientes. El total por cobrar debe quedar en cero.</p>
          <div className={t.summary}>
            <SummaryRow label="Total cuenta" value={reservationMoney(accountTotal)} />
            <SummaryRow label="Pagado" value={reservationMoney(summary.paid)} />
            {Number(summary.consumptions?.pending) > 0 && (
              <SummaryRow label="Consumos POS por pagar" value={reservationMoney(summary.consumptions.pending)} />
            )}
            <SummaryRow label="Por cobrar" value={reservationMoney(pendingTotal)} strong />
          </div>
          {pendingTotal > 0 && (
            <>
              <p className={s.muted}>Registra el pago final para saldar:</p>
              <Select label="Método de pago" icon="fas fa-wallet" value={checkoutPay.payment_method}
                onChange={(e) => setCheckoutPay((p) => ({ ...p, payment_method: e.target.value }))}
                options={[{ value: '', label: 'Selecciona…' }, ...(paymentMethods || []).map((m) => ({ value: m.id, label: m.name }))]} />
              <MoneyInput label="Valor" icon="fas fa-dollar-sign" placeholder={String(pendingTotal)}
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
          {errorBlock}
          <Select label="Servicio" icon="fas fa-champagne-glasses" value={serviceSel.id}
            onChange={(e) => setServiceSel((x) => ({ ...x, id: e.target.value }))}
            options={[{ value: '', label: 'Selecciona…' }, ...(serviceItems || []).map((st) => ({ value: String(st.id), label: `${st.name} · ${reservationMoney(st.price)}` }))]} />
          <Input label="Cantidad" type="number" min="1" value={serviceSel.quantity}
            onChange={(e) => setServiceSel((x) => ({ ...x, quantity: Math.max(1, Number(e.target.value) || 1) }))} />
        </div>
      </Modal>

      <Modal open={chargeOpen} size="sm" title="Agregar ítem a la cuenta" onClose={() => setChargeOpen(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setChargeOpen(false)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={busy} onClick={addCharge}>Agregar</Button>
        </>}>
        <div className={s.formCol}>
          {errorBlock}
          <Autocomplete label="Producto o servicio" icon="fas fa-burger" minChars={2}
            placeholder="Busca en el catálogo…"
            fetcher={(q) => api.consumableItems(q)}
            value={chargeSel.item}
            onChange={(item) => setChargeSel((x) => ({ ...x, item }))}
            getOptionLabel={(it) => `${it.name} · ${reservationMoney(it.price)}`} />
          <Input label="Cantidad" type="number" min="1" value={chargeSel.quantity}
            onChange={(e) => setChargeSel((x) => ({ ...x, quantity: Math.max(1, Number(e.target.value) || 1) }))} />
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
          {guest.is_holder && <span className={t.roleTag}>Titular</span>}
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
    <div className={`${t.summaryRow} ${strong ? t.summaryRowStrong : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
