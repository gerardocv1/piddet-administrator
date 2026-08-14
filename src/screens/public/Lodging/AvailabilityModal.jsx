import React from 'react';
import { Modal, Button, Spinner } from '../../../components';
import { api } from '../../../lib/api.js';
import { whatsappHref } from '../whatsapp.js';
import s from './AvailabilityModal.module.css';

const todayStr = () => new Date().toISOString().slice(0, 10);
const nextDay = (date) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const dateText = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

// Consulta de disponibilidad de una unidad (sin sesión): el visitante elige fechas y ve si está
// libre. NO reserva: la reserva se cierra por WhatsApp, así que el resultado termina siempre en
// el botón para escribir con la unidad y las fechas ya consultadas.
export function AvailabilityModal({ companyUsername, unit, whatsappNumber, onClose }) {
  const [checkIn, setCheckIn] = React.useState(todayStr());
  const [checkOut, setCheckOut] = React.useState(nextDay(todayStr()));
  const [checking, setChecking] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const validRange = !!checkIn && !!checkOut && checkOut > checkIn;

  // Cambiar las fechas invalida el resultado anterior: no debe quedar un "disponible" de otro rango.
  const setDates = (nextIn, nextOut) => {
    setResult(null);
    setError('');
    setCheckIn(nextIn);
    setCheckOut(nextOut);
  };

  const check = async () => {
    if (!validRange || checking) return;
    setChecking(true);
    setError('');
    try {
      setResult(await api.publicRentableUnitAvailability(companyUsername, unit.id, { checkIn, checkOut }));
    } catch {
      setError('No pudimos consultar la disponibilidad. Intenta de nuevo.');
    } finally {
      setChecking(false);
    }
  };

  const stay = `${dateText(checkIn)} al ${dateText(checkOut)}`;
  const bookHref = whatsappHref(
    whatsappNumber,
    `Hola, quiero reservar ${unit.name} del ${stay}. Ya consulté y aparece disponible.`,
  );
  const askHref = whatsappHref(
    whatsappNumber,
    `Hola, quería ${unit.name} del ${stay}, pero aparece ocupada. ¿Qué fechas tienen libres?`,
  );

  return (
    // Anclado arriba y sin hoja inferior a propósito: el calendario nativo de los campos de fecha
    // se despliega hacia abajo, y pegado al borde inferior de la pantalla quedaba cortado.
    <Modal open title="Consultar disponibilidad" subtitle={unit.name} size="md" onClose={onClose}
      sheet={false} style={{ alignSelf: 'flex-start' }}
      footer={
        <Button variant="primary" block loading={checking} disabled={!validRange} onClick={check}>
          {result ? 'Consultar de nuevo' : 'Consultar'}
        </Button>
      }>
      <div className={s.body}>
        <div className={s.dates}>
          <label className={s.field}>
            <span className={s.label}>Llegada</span>
            <input type="date" value={checkIn} min={todayStr()}
              onChange={(e) => {
                const v = e.target.value;
                setDates(v, v && checkOut <= v ? nextDay(v) : checkOut);
              }} />
          </label>
          <label className={s.field}>
            <span className={s.label}>Salida</span>
            <input type="date" value={checkOut} min={nextDay(checkIn || todayStr())}
              onChange={(e) => setDates(checkIn, e.target.value)} />
          </label>
        </div>

        {!validRange && <p className={s.hint}>La salida debe ser posterior a la llegada.</p>}
        {error && <p className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</p>}

        {checking && <Spinner center label="Consultando…" />}

        {result && !checking && (
          <div className={[s.result, result.available ? s.resultYes : s.resultNo].join(' ')}>
            <p className={s.resultTitle}>
              <i className={result.available ? 'fas fa-circle-check' : 'fas fa-circle-xmark'} />
              {result.available ? 'Disponible en esas fechas' : 'No está disponible en esas fechas'}
            </p>
            <p className={s.resultStay}>
              {stay} · {result.nights} noche{result.nights === 1 ? '' : 's'}
            </p>
            <p className={s.resultNote}>
              {result.available
                ? 'Para reservar escríbenos por WhatsApp: confirmamos el cupo y el pago por ahí.'
                : 'Escríbenos por WhatsApp y te contamos qué fechas tenemos libres.'}
            </p>
            {(result.available ? bookHref : askHref) && (
              <a className={s.whatsapp} href={result.available ? bookHref : askHref}
                target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp" />
                {result.available ? 'Reservar por WhatsApp' : 'Consultar otras fechas'}
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
