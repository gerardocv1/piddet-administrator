import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, IconButton, Input, Select, Textarea, MoneyInput, DatePicker, Badge, Spinner,
} from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { todayIso } from '../../lib/orderLabels.js';
import { reservationMoney } from '../../lib/reservationLabels.js';
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
  const [unit, setUnit] = React.useState(null); // { id, name, base_price_per_night, available }
  const [availability, setAvailability] = React.useState(null); // resultado o null
  const [loadingAvail, setLoadingAvail] = React.useState(false);

  // Paso 2: titular + acompañantes
  const [holder, setHolder] = React.useState(emptyHolder);
  const [companions, setCompanions] = React.useState([]);
  const [guestQuery, setGuestQuery] = React.useState('');
  const [guestResults, setGuestResults] = React.useState(null);

  // Paso 3: servicios
  const { data: serviceTypes } = useResource(React.useCallback(() => api.reservationServiceTypes({ onlyActive: true }), []), [], []);
  const [services, setServices] = React.useState([]); // [{ reservation_service_type_id, name, price, quantity }]

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

  const loadAvailability = async () => {
    if (!checkIn || !checkOut || nights < 1) return;
    setLoadingAvail(true); setError('');
    try {
      setAvailability(await api.unitAvailability({ checkIn, checkOut }));
    } catch (e) {
      setError(e?.message || 'No se pudo consultar la disponibilidad.');
    } finally {
      setLoadingAvail(false);
    }
  };

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
      const found = list.find((x) => x.reservation_service_type_id === st.id);
      if (found) return list.filter((x) => x.reservation_service_type_id !== st.id);
      return [...list, { reservation_service_type_id: st.id, name: st.name, price: st.price, quantity: 1 }];
    });
  };
  const setServiceQty = (id, qty) =>
    setServices((list) => list.map((x) => (x.reservation_service_type_id === id ? { ...x, quantity: Math.max(1, Number(qty) || 1) } : x)));

  const addCompanion = () => setCompanions((c) => [...c, { key: Date.now(), first_name: '', last_name: '', phone_code: '57', phone_number: '', id_number: '' }]);
  const setCompanionField = (key, k, v) => setCompanions((c) => c.map((x) => (x.key === key ? { ...x, [k]: v } : x)));
  const removeCompanion = (key) => setCompanions((c) => c.filter((x) => x.key !== key));

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
        services: services.map((sv) => ({ reservation_service_type_id: sv.reservation_service_type_id, quantity: sv.quantity })),
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
    const link = `${window.location.origin}/checkin/${created.code}`;
    return (
      <div className={s.page}>
        <div className={t.success}>
          <div className={t.successIcon}><i className="fas fa-circle-check" /></div>
          <h2 className={t.title}>Reserva creada</h2>
          <p className={s.muted}>Comparte el código del pre-check-in con el huésped para que complete sus datos.</p>
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
              <div className={s.formGrid}>
                <DatePicker label="Entrada" icon="fas fa-calendar" min={todayIso()} value={checkIn}
                  onChange={(d) => { setCheckIn(d); setUnit(null); setAvailability(null); }} />
                <DatePicker label="Salida" icon="fas fa-calendar" min={checkIn || todayIso()} value={checkOut}
                  onChange={(d) => { setCheckOut(d); setUnit(null); setAvailability(null); }} />
              </div>
              {nights > 0 && <p className={s.muted}>{nights} noche{nights === 1 ? '' : 's'}</p>}
              <Button variant="secondary" icon="fas fa-magnifying-glass" disabled={!checkIn || !checkOut || nights < 1}
                loading={loadingAvail} onClick={loadAvailability}>Ver disponibilidad</Button>

              {availability && (
                <div className={t.unitGrid}>
                  {availability.length === 0 && <p className={s.faint}>No hay unidades registradas.</p>}
                  {availability.map((u) => (
                    <button key={u.id} type="button"
                      className={`${t.unitCard} ${unit?.id === u.id ? t.unitSelected : ''} ${!u.available ? t.unitBusy : ''}`}
                      disabled={!u.available} onClick={() => setUnit(u)}>
                      <span className={t.unitName}>{u.name}</span>
                      <span className={s.muted}>{u.type_name} · {u.capacity} pers.</span>
                      <span className={t.unitPrice}>{reservationMoney(u.base_price_per_night)} / noche</span>
                      {!u.available && <Badge variant="danger" dot>Ocupada</Badge>}
                    </button>
                  ))}
                </div>
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
                  options={[{ value: '1', label: 'Cédula' }, { value: '3', label: 'Cédula de extranjería' }, { value: '4', label: 'Pasaporte' }]} />
                <Input label="Número de documento" icon="fas fa-hashtag" value={holder.id_number} onChange={(e) => setHolderField('id_number', e.target.value)} />
              </div>

              <div className={t.companionsHead}>
                <h4 className={t.subTitle}>Acompañantes</h4>
                <Button variant="secondary" size="sm" icon="fas fa-plus" onClick={addCompanion}>Agregar</Button>
              </div>
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
              {(serviceTypes || []).length === 0 ? (
                <p className={s.faint}>No hay servicios adicionales configurados. Puedes continuar sin ellos.</p>
              ) : (
                serviceTypes.map((st) => {
                  const picked = services.find((x) => x.reservation_service_type_id === st.id);
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
              <SummaryRow label="Acompañantes" value={String(companions.filter((c) => c.first_name.trim()).length)} />
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
