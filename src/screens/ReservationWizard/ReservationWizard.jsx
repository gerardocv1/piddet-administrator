import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, IconButton, Input, Select, Textarea, MoneyInput, DateRangePicker, Badge, Spinner,
} from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { todayIso } from '../../lib/orderLabels.js';
import { reservationMoney, ID_TYPES } from '../../lib/reservationLabels.js';
import s from '../screens.module.css';
import t from './ReservationWizard.module.css';

const STEPS = ['Fechas y unidad', 'Titular', 'Servicios', 'Adelanto', 'Confirmar'];

const emptyHolder = { first_name: '', last_name: '', phone_code: '57', phone_number: '', email: '', id_type_id: '1', id_number: '' };

// Asistente paso a paso para crear una reserva desde el panel: fechas + unidad disponible, titular
// (buscando huésped existente o capturando uno nuevo), servicios adicionales, adelanto opcional y
// confirmación. Al crear muestra el código del pre-check-in para compartir con el huésped.
export function ReservationWizard() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);

  // Paso 1: fechas + unidad
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [unit, setUnit] = React.useState(null); // { id, name, base_price_per_night, capacity, available }
  const [guestsCount, setGuestsCount] = React.useState(1); // total de personas, titular incluido
  const [availability, setAvailability] = React.useState(null); // resultado o null
  const [loadingAvail, setLoadingAvail] = React.useState(false);

  // Paso 2: titular + acompañantes
  const [holder, setHolder] = React.useState(emptyHolder);
  const [companions, setCompanions] = React.useState([]);
  const [guestQuery, setGuestQuery] = React.useState('');
  const [guestResults, setGuestResults] = React.useState(null);

  // Paso 3: servicios
  const { data: serviceItems } = useResource(React.useCallback(() => api.serviceItems({ reservable: true }), []), [], []);
  const [services, setServices] = React.useState([]); // [{ item_id, name, price, quantity }]

  // Paso 4: adelanto
  const { data: paymentMethods } = useResource(api.paymentMethods, [], []);
  const [payment, setPayment] = React.useState({ payment_method: '', value: '' });

  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [created, setCreated] = React.useState(null);

  const nights = React.useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const d = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return d >= 1 ? Math.round(d) : 0;
  }, [checkIn, checkOut]);

  const pricePerNight = unit ? Number(unit.base_price_per_night) : 0;
  const lodgingSubtotal = pricePerNight * nights;
  const servicesTotal = services.reduce((sum, sv) => sum + Number(sv.price) * sv.quantity, 0);
  const total = lodgingSubtotal + servicesTotal;

  // Al completar el rango se consulta la disponibilidad automáticamente (sin botón). Un token de
  // petición evita que una respuesta lenta de un rango anterior pise a la del rango vigente.
  const availReq = React.useRef(0);
  React.useEffect(() => {
    setUnit(null);
    setAvailability(null);
    if (!checkIn || !checkOut || nights < 1) return;
    const reqId = ++availReq.current;
    setLoadingAvail(true); setError('');
    api.unitAvailability({ checkIn, checkOut })
      .then((res) => { if (reqId === availReq.current) setAvailability(res); })
      .catch((e) => { if (reqId === availReq.current) setError(e?.message || 'No se pudo consultar la disponibilidad.'); })
      .finally(() => { if (reqId === availReq.current) setLoadingAvail(false); });
  }, [checkIn, checkOut, nights]);

  const searchGuest = async () => {
    if (!guestQuery.trim()) return;
    setGuestResults(await api.guestsSearch(guestQuery.trim()));
  };

  const pickGuest = (g) => {
    setHolder({
      first_name: g.first_name, last_name: g.last_name, phone_code: g.phone_code || '57',
      phone_number: g.phone_number || '', email: g.email || '',
      id_type_id: String(g.id_type_id || '1'), id_number: g.id_number || '',
    });
    setGuestResults(null);
    setGuestQuery('');
  };

  const setHolderField = (k, v) => setHolder((h) => ({ ...h, [k]: v }));

  const toggleService = (st) => {
    setServices((list) => {
      const found = list.find((x) => x.item_id === st.id);
      if (found) return list.filter((x) => x.item_id !== st.id);
      return [...list, { item_id: st.id, name: st.name, price: st.price, quantity: 1 }];
    });
  };
  const setServiceQty = (id, qty) =>
    setServices((list) => list.map((x) => (x.item_id === id ? { ...x, quantity: Math.max(1, Number(qty) || 1) } : x)));

  const addCompanion = () => setCompanions((c) => [...c, { key: Date.now(), first_name: '', last_name: '', phone_code: '57', phone_number: '', id_number: '' }]);
  const setCompanionField = (key, k, v) => setCompanions((c) => c.map((x) => (x.key === key ? { ...x, [k]: v } : x)));
  const removeCompanion = (key) => setCompanions((c) => c.filter((x) => x.key !== key));

  // Al elegir unidad, el número de personas arranca en las incluidas en su tarifa (acotado a la
  // capacidad) y los acompañantes que sobren se descartan (el titular ocupa uno de los cupos).
  const pickUnit = (u) => {
    setUnit(u);
    const capacity = Math.max(1, Number(u.capacity) || 1);
    const included = Math.min(Math.max(1, Number(u.included_guests) || 1), capacity);
    setGuestsCount(included);
    setCompanions((c) => c.slice(0, included - 1));
  };

  const changeGuestsCount = (value) => {
    const n = Math.max(1, Number(value) || 1);
    setGuestsCount(n);
    setCompanions((c) => c.slice(0, n - 1));
  };

  const maxCompanions = guestsCount - 1;

  const step1Valid = checkIn && checkOut && nights >= 1 && unit && unit.available;
  const step2Valid = holder.first_name.trim() && holder.last_name.trim() && holder.phone_number.trim();

  const canContinue = () => {
    if (step === 0) return step1Valid;
    if (step === 1) return step2Valid;
    return true;
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = {
        rentable_unit_id: unit.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests_count: guestsCount,
        notes: notes.trim() || null,
        holder: {
          first_name: holder.first_name.trim(),
          last_name: holder.last_name.trim(),
          phone_code: holder.phone_code,
          phone_number: holder.phone_number.trim(),
          email: holder.email.trim() || null,
          id_type_id: holder.id_type_id ? Number(holder.id_type_id) : null,
          id_number: holder.id_number.trim() || null,
        },
        companions: companions
          .filter((c) => c.first_name.trim() && c.last_name.trim() && c.phone_number.trim())
          .map((c) => ({
            first_name: c.first_name.trim(), last_name: c.last_name.trim(),
            phone_code: c.phone_code, phone_number: c.phone_number.trim(),
            id_number: c.id_number.trim() || null,
          })),
        services: services.map((sv) => ({ item_id: sv.item_id, quantity: sv.quantity })),
      };
      if (payment.payment_method && payment.value) {
        payload.payment = { payment_method: payment.payment_method, value: payment.value };
      }
      setCreated(await api.createReservation(payload));
    } catch (e) {
      setError(e?.message || 'No se pudo crear la reserva.');
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    const link = `${window.location.origin}/checkin?code=${created.code}`;
    return (
      <div className={s.page}>
        <div className={t.success}>
          <div className={t.successIcon}><i className="fas fa-circle-check" /></div>
          <h2 className={t.title}>Reserva creada</h2>
          <p className={s.muted}>Comparte el enlace con el huésped para que complete sus datos. Para entrar necesita este código y su nombre.</p>
          <div className={t.codeBox}>
            <span className={t.code}>{created.code}</span>
            <span className={t.codeLink}>{link}</span>
          </div>
          <div className={t.successActions}>
            <Button variant="secondary" icon="fas fa-list" onClick={() => navigate('/reservations')}>Ir a reservas</Button>
            <Button variant="primary" icon="fas fa-eye" onClick={() => navigate(`/reservations/${created.id}`)}>Ver reserva</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={t.header}>
        <IconButton icon="fas fa-arrow-left" variant="light" title="Volver a reservas" onClick={() => navigate('/reservations')} />
        <h2 className={t.title}>Nueva reserva</h2>
      </div>

      <div className={t.stepper}>
        {STEPS.map((label, i) => (
          <div key={label} className={`${t.stepDot} ${i === step ? t.stepActive : ''} ${i < step ? t.stepDone : ''}`}>
            <span>{i + 1}</span> {label}
          </div>
        ))}
      </div>

      <Card>
        <Card.Body>
          {step === 0 && (
            <div className={s.formCol}>
              <DateRangePicker label="Fechas de la estadía" icon="fas fa-calendar" min={todayIso()}
                value={{ from: checkIn, to: checkOut }}
                onChange={({ from, to }) => { setCheckIn(from); setCheckOut(to); }} />
              {nights > 0 && <p className={s.muted}>{nights} noche{nights === 1 ? '' : 's'} · elige la unidad disponible</p>}

              {loadingAvail && <Spinner center label="Consultando disponibilidad…" />}

              {availability && !loadingAvail && (
                <div className={t.unitGrid}>
                  {availability.length === 0 && <p className={s.faint}>No hay unidades registradas.</p>}
                  {availability.map((u) => (
                    <button key={u.id} type="button"
                      className={`${t.unitCard} ${unit?.id === u.id ? t.unitSelected : ''} ${!u.available ? t.unitBusy : ''}`}
                      disabled={!u.available} onClick={() => pickUnit(u)}>
                      <span className={t.unitName}>{u.name}</span>
                      <span className={s.muted}>{u.type_name} · {u.capacity} pers.</span>
                      <span className={t.unitPrice}>{reservationMoney(u.base_price_per_night)} / noche</span>
                      {!u.available && <Badge variant="danger" dot>Ocupada</Badge>}
                    </button>
                  ))}
                </div>
              )}

              {unit && (
                <Select label="Número de personas" icon="fas fa-users" value={String(guestsCount)}
                  onChange={(e) => changeGuestsCount(e.target.value)}
                  hint={`${unit.name} admite hasta ${unit.capacity} ${Number(unit.capacity) === 1 ? 'persona' : 'personas'}. El titular cuenta como una.`}
                  options={Array.from({ length: Math.max(1, Number(unit.capacity) || 1) }, (_, i) => ({
                    value: String(i + 1), label: `${i + 1} ${i === 0 ? 'persona' : 'personas'}`,
                  }))} />
              )}
            </div>
          )}

          {step === 1 && (
            <div className={s.formCol}>
              <div className={t.guestSearch}>
                <Input label="Buscar huésped existente" icon="fas fa-magnifying-glass"
                  placeholder="Cédula, nombre o celular" value={guestQuery}
                  onChange={(e) => setGuestQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchGuest(); } }} />
                <Button variant="secondary" size="sm" icon="fas fa-magnifying-glass" onClick={searchGuest}>Buscar</Button>
              </div>
              {guestResults && (
                <div className={t.guestResults}>
                  {guestResults.length === 0 ? <p className={s.faint}>Sin resultados. Captura los datos abajo.</p> : (
                    guestResults.map((g) => (
                      <button key={g.user_id} type="button" className={t.guestResult} onClick={() => pickGuest(g)}>
                        <span className={t.guestName}>{g.name}</span>
                        <span className={s.muted}>{g.id_number || 's/documento'} · {g.phone_number || 's/celular'}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className={s.formGrid}>
                <Input label="Nombres" icon="fas fa-user" value={holder.first_name} onChange={(e) => setHolderField('first_name', e.target.value)} />
                <Input label="Apellidos" icon="fas fa-user" value={holder.last_name} onChange={(e) => setHolderField('last_name', e.target.value)} />
              </div>
              <div className={s.formGrid}>
                <Input label="Celular" icon="fas fa-phone" value={holder.phone_number} onChange={(e) => setHolderField('phone_number', e.target.value)} />
                <Input label="Correo (opcional)" icon="fas fa-envelope" value={holder.email} onChange={(e) => setHolderField('email', e.target.value)} />
              </div>
              <div className={s.formGrid}>
                <Select label="Tipo de documento" icon="fas fa-id-card" value={holder.id_type_id}
                  onChange={(e) => setHolderField('id_type_id', e.target.value)}
                  options={ID_TYPES} />
                <Input label="Número de documento" icon="fas fa-hashtag" value={holder.id_number} onChange={(e) => setHolderField('id_number', e.target.value)} />
              </div>

              <div className={t.companionsHead}>
                <h4 className={t.subTitle}>Acompañantes ({companions.length}/{maxCompanions})</h4>
                <Button variant="secondary" size="sm" icon="fas fa-plus"
                  disabled={companions.length >= maxCompanions} onClick={addCompanion}>Agregar</Button>
              </div>
              <p className={s.muted}>
                {maxCompanions === 0
                  ? 'La reserva es para una sola persona.'
                  : `La reserva es para ${guestsCount} personas: el titular y ${maxCompanions} ${maxCompanions === 1 ? 'acompañante' : 'acompañantes'}. Puedes dejarlos en blanco: el huésped los completa en su pre-check-in.`}
              </p>
              {companions.map((c) => (
                <div key={c.key} className={t.companionRow}>
                  <Input label="Nombres" value={c.first_name} onChange={(e) => setCompanionField(c.key, 'first_name', e.target.value)} />
                  <Input label="Apellidos" value={c.last_name} onChange={(e) => setCompanionField(c.key, 'last_name', e.target.value)} />
                  <Input label="Celular" value={c.phone_number} onChange={(e) => setCompanionField(c.key, 'phone_number', e.target.value)} />
                  <Input label="Documento" value={c.id_number} onChange={(e) => setCompanionField(c.key, 'id_number', e.target.value)} />
                  <IconButton icon="fas fa-trash" variant="light" title="Quitar" onClick={() => removeCompanion(c.key)} />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className={s.formCol}>
              {(serviceItems || []).length === 0 ? (
                <p className={s.faint}>No hay servicios marcados como disponibles para reservas en el catálogo de productos. Puedes continuar sin servicios.</p>
              ) : (
                serviceItems.map((st) => {
                  const picked = services.find((x) => x.item_id === st.id);
                  return (
                    <div key={st.id} className={t.serviceRow}>
                      <label className={t.servicePick}>
                        <input type="checkbox" checked={!!picked} onChange={() => toggleService(st)} />
                        <span className={t.serviceName}>{st.name}</span>
                        <span className={t.servicePrice}>{reservationMoney(st.price)}</span>
                      </label>
                      {picked && (
                        <Input type="number" min="1" value={picked.quantity} wrapClassName={t.qtyInput}
                          onChange={(e) => setServiceQty(st.id, e.target.value)} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {step === 3 && (
            <div className={s.formCol}>
              <p className={s.muted}>Registra el adelanto que dejó el huésped (opcional). Con un pago, la reserva queda confirmada.</p>
              <div className={s.formGrid}>
                <Select label="Método de pago" icon="fas fa-wallet" value={payment.payment_method}
                  onChange={(e) => setPayment((p) => ({ ...p, payment_method: e.target.value }))}
                  options={[{ value: '', label: 'Sin adelanto' }, ...(paymentMethods || []).map((m) => ({ value: m.id, label: m.name }))]} />
                <MoneyInput label="Valor del adelanto" icon="fas fa-dollar-sign" placeholder="0"
                  value={payment.value} onChange={(v) => setPayment((p) => ({ ...p, value: v }))} />
              </div>
              <Textarea label="Nota de la reserva (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}

          {step === 4 && (
            <div className={t.summary}>
              <SummaryRow label="Unidad" value={unit?.name} />
              <SummaryRow label="Fechas" value={`${checkIn} → ${checkOut} (${nights}n)`} />
              <SummaryRow label="Titular" value={`${holder.first_name} ${holder.last_name}`} />
              <SummaryRow label="Personas" value={`${guestsCount} (titular incluido)`} />
              <SummaryRow label="Acompañantes registrados" value={`${companions.filter((c) => c.first_name.trim()).length} de ${maxCompanions}`} />
              <div className={t.summaryDivider} />
              <SummaryRow label="Hospedaje" value={reservationMoney(lodgingSubtotal)} />
              <SummaryRow label="Servicios" value={reservationMoney(servicesTotal)} />
              <SummaryRow label="Total" value={reservationMoney(total)} strong />
              {payment.payment_method && payment.value && (
                <SummaryRow label="Adelanto" value={reservationMoney(payment.value)} />
              )}
            </div>
          )}

          {error && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {error}</div>}
        </Card.Body>
      </Card>

      <div className={t.actions}>
        <Button variant="secondary" icon="fas fa-arrow-left" disabled={step === 0 || saving}
          onClick={() => setStep((x) => Math.max(0, x - 1))}>Atrás</Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" icon="fas fa-arrow-right" disabled={!canContinue()}
            onClick={() => setStep((x) => x + 1)}>Continuar</Button>
        ) : (
          <Button variant="primary" icon="fas fa-check" loading={saving} onClick={submit}>Crear reserva</Button>
        )}
      </div>
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
