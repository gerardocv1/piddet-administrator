import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, IconButton, RefreshButton, Badge, Modal, Spinner, PageHeader } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { formatStayRange } from '../lib/dates.js';
import { reservationMoney, reservationStatusMeta, RESERVATION_STATUS } from '../lib/reservationLabels.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import t from './ReservationsCalendar.module.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
// Lunes = 0 … domingo = 6 (la semana arranca en lunes).
const weekdayIndex = (date) => (date.getDay() + 6) % 7;

// Estilo del evento por estado (color del punto y de la barra).
const STATUS_CLASS = {
  [RESERVATION_STATUS.PENDING]: t.evPending,
  [RESERVATION_STATUS.CONFIRMED]: t.evConfirmed,
  [RESERVATION_STATUS.CHECKED_IN]: t.evCheckedIn,
  [RESERVATION_STATUS.CHECKED_OUT]: t.evCheckedOut,
};

const MAX_CHIPS = 3;

// Vista de calendario mensual de las reservas. Cada noche ocupada aparece como un chip en su día;
// al hacer clic se abre un resumen con la opción de ir al detalle completo.
export function ReservationsCalendar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  useSetPageTitle('Calendario de reservas');

  const today = React.useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);
  const [cursor, setCursor] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = React.useState(null);

  // Rejilla de 6 semanas que arranca el lunes de la semana del día 1 del mes.
  const grid = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - weekdayIndex(first));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const gridFrom = iso(grid[0]);
  const gridTo = iso(grid[41]);

  const fetcher = React.useCallback(
    () => api.reservationsCalendar({ from: gridFrom, to: gridTo }),
    [gridFrom, gridTo],
  );
  const { data: reservations, loading, error, reload } = useResource(fetcher, [], [gridFrom, gridTo]);

  // Reservas que ocupan cada día (check_in <= día < check_out), indexadas por fecha ISO.
  const byDay = React.useMemo(() => {
    const map = {};
    (reservations || []).forEach((r) => {
      grid.forEach((d) => {
        const key = iso(d);
        if (r.check_in_date <= key && key < r.check_out_date) {
          (map[key] ||= []).push(r);
        }
      });
    });
    return map;
  }, [reservations, grid]);

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const shift = (delta) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className={s.page}>
      <PageHeader
        onBack={() => navigate(`/reservations${params.toString() ? `?${params.toString()}` : ''}`)}
        backTitle="Volver a reservas"
        subtitle="Calendario de reservas"
        actions={
          <>
            <div className={t.monthNav}>
              <IconButton icon="fas fa-chevron-left" variant="light" title="Mes anterior" onClick={() => shift(-1)} />
              <span className={t.monthLabel}>{monthLabel}</span>
              <IconButton icon="fas fa-chevron-right" variant="light" title="Mes siguiente" onClick={() => shift(1)} />
            </div>
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="secondary" size="sm" icon="fas fa-calendar-day" onClick={goToday}>Hoy</Button>
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => navigate('/reservations/new')}>Nueva reserva</Button>
          </>
        }
      />

      <Card>
        <Card.Body>
          {error ? (
            <div className={s.stateError}><i className="fas fa-triangle-exclamation" /> {error}</div>
          ) : (
            <div className={t.calendar}>
              {loading && <div className={t.loadingOverlay}><Spinner label="Cargando reservas…" /></div>}
              <div className={t.weekHead}>
                {WEEKDAYS.map((w) => <span key={w} className={t.weekName}>{w}</span>)}
              </div>
              <div className={t.gridBody}>
                {grid.map((d) => {
                  const key = iso(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = key === iso(today);
                  const events = byDay[key] || [];
                  return (
                    <div key={key} className={[t.cell, inMonth ? '' : t.cellOut, isToday ? t.cellToday : ''].filter(Boolean).join(' ')}>
                      <span className={t.dayNum}>{d.getDate()}</span>
                      <div className={t.events}>
                        {events.slice(0, MAX_CHIPS).map((r) => (
                          <button key={r.id} type="button"
                            className={[t.event, STATUS_CLASS[r.status] || ''].filter(Boolean).join(' ')}
                            title={`${r.holder_user_name} · ${r.rentable_unit_name}`}
                            onClick={() => setSelected(r)}>
                            <span className={t.eventDot} />
                            <span className={t.eventText}>{r.holder_user_name}</span>
                          </button>
                        ))}
                        {events.length > MAX_CHIPS && (
                          <button type="button" className={t.eventMore} onClick={() => setSelected(events[MAX_CHIPS])}>
                            +{events.length - MAX_CHIPS} más
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <EventModal reservation={selected} onClose={() => setSelected(null)}
        onOpen={(id) => navigate(`/reservations/${id}`)} />
    </div>
  );
}

function EventModal({ reservation, onClose, onOpen }) {
  if (!reservation) return null;
  const meta = reservationStatusMeta(reservation.status);
  const services = Number(reservation.services_count) || 0;
  const guests = Number(reservation.guests_count) || 1;

  return (
    <Modal open size="sm" title={reservation.holder_user_name} subtitle={`Reserva ${reservation.code}`} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        <Button variant="primary" icon="fas fa-eye" onClick={() => onOpen(reservation.id)}>Ver reserva</Button>
      </>}>
      <div className={t.modalBody}>
        <div className={t.modalRow}><span className={s.muted}>Estado</span><Badge variant={meta.variant} dot>{meta.label}</Badge></div>
        <div className={t.modalRow}><span className={s.muted}>Unidad</span><strong>{reservation.rentable_unit_name}</strong></div>
        <div className={t.modalRow}><span className={s.muted}>Estadía</span><span>{formatStayRange(reservation.check_in_date, reservation.check_out_date)} · {reservation.nights} {reservation.nights === 1 ? 'noche' : 'noches'}</span></div>
        <div className={t.modalRow}><span className={s.muted}>Personas</span><span>{guests} (titular incluido)</span></div>
        <div className={t.modalRow}><span className={s.muted}>Servicios adicionales</span><span>{services > 0 ? `${services} ${services === 1 ? 'servicio' : 'servicios'}` : 'Sin servicios'}</span></div>
        <div className={t.modalRow}><span className={s.muted}>Total</span><strong>{reservationMoney(reservation.total)}</strong></div>
      </div>
    </Modal>
  );
}
