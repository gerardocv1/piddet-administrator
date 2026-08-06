import React from 'react';
import { Button, Input, Select } from '../../../components';
import { api } from '../../../lib/api.js';
import { reservationMoney, ARRIVAL_SLOTS, ID_TYPES } from '../../../lib/reservationLabels.js';
import s from './CheckinWizard.module.css';

const emptyPerson = () => ({ first_name: '', last_name: '', phone_code: '57', phone_number: '', email: '', id_type_id: '1', id_number: '', birthdate: '', origin_city: '', id_document_file: null, _uploading: false });

const STEPS = [
  { title: 'Tus datos', hint: 'Titular de la reserva y foto del documento' },
  { title: 'Acompañantes', hint: 'Datos de quienes te acompañan' },
  { title: 'Llegada', hint: 'Hora aproximada en que llegas' },
];

// Pre-check-in del huésped (público, móvil-first). La entrada es siempre código de reserva +
// nombre del titular: el enlace del alojamiento (/checkin?code=…) solo autocompleta el código,
// nunca abre la reserva por sí solo. Ya dentro, registra al titular con la foto de su documento y
// a todos sus acompañantes, porque la reserva se hizo para un número concreto de personas.
export function CheckinWizard({ code: linkCode }) {
  const [code, setCode] = React.useState('');
  const [summary, setSummary] = React.useState(null);
  const [step, setStep] = React.useState(0); // 0 resumen, 1 titular, 2 acompañantes, 3 llegada, 4 ok
  const [holder, setHolder] = React.useState(emptyPerson);
  const [holderHasPhoto, setHolderHasPhoto] = React.useState(false);
  const [companions, setCompanions] = React.useState([]);
  const [arrival, setArrival] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Precarga al titular y deja tantos acompañantes como personas se reservaron (menos el titular),
  // reusando los que ya estuvieran registrados.
  const applySummary = React.useCallback((data) => {
    setSummary(data);
    const h = data.holder || {};
    setHolder((prev) => ({
      ...prev,
      first_name: h.first_name || (h.name || '').split(' ')[0] || '',
      last_name: h.last_name || (h.name || '').split(' ').slice(1).join(' '),
      phone_code: h.phone_code || '57',
      phone_number: h.phone_number || '',
      email: h.email || '',
      id_type_id: String(h.id_type_id || '1'),
      id_number: h.id_number || '',
      birthdate: h.birthdate || '',
      origin_city: h.origin_city || '',
    }));
    setHolderHasPhoto(!!h.has_document_photo);
    if (data.expected_arrival_time) setArrival(data.expected_arrival_time);

    const registered = Array.isArray(data.companions) ? data.companions : [];
    const slots = Math.max(0, (Number(data.guests_count) || 1) - 1);
    setCompanions(Array.from({ length: slots }, (_, i) => {
      const c = registered[i] || {};
      return {
        key: `c-${i}`, ...emptyPerson(),
        first_name: c.first_name || (c.name || '').split(' ')[0] || '',
        last_name: c.last_name || (c.name || '').split(' ').slice(1).join(' '),
        id_number: c.document_number || '',
      };
    }));
  }, []);

  const setHolderField = (k, v) => setHolder((h) => ({ ...h, [k]: v }));
  const setCompanionField = (key, k, v) => setCompanions((c) => c.map((x) => (x.key === key ? { ...x, [k]: v } : x)));

  const uploadDoc = async (setter, file) => {
    if (!file) return;
    setter('_uploading', true);
    try {
      const res = await api.checkinUploadDocument(code, file);
      setter('id_document_file', res.name);
    } catch {
      setError('No se pudo subir la foto del documento. Intenta de nuevo.');
    } finally {
      setter('_uploading', false);
    }
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      const clean = (p) => ({
        first_name: p.first_name.trim(), last_name: p.last_name.trim(),
        phone_code: p.phone_code, phone_number: p.phone_number.trim(),
        email: p.email?.trim() || null, id_type_id: p.id_type_id ? Number(p.id_type_id) : null,
        id_number: p.id_number.trim() || null, id_document_file: p.id_document_file || null,
        birthdate: p.birthdate || null, origin_city: p.origin_city?.trim() || null,
      });
      // Todos van con sus datos completos; si el celular o el correo ya existen, el backend
      // enlaza a la persona registrada por debajo, sin anticiparlo aquí.
      const data = await api.checkinSubmit(code, {
        expected_arrival_time: arrival || null,
        holder: clean(holder),
        companions: companions.map(clean),
      });
      setSummary(data);
      setStep(4);
    } catch (e) {
      setError(e?.message || 'No se pudo completar el pre-check-in.');
    } finally {
      setSaving(false);
    }
  };

  // Puerta de entrada: sin reserva validada no se muestra nada de ella.
  if (!summary) {
    return (
      <div className={s.screen}>
        <div className={s.card}>
          <AccessForm initialCode={linkCode} onAccess={(data, usedCode) => { setCode(usedCode); applySummary(data); setStep(0); }} />
        </div>
      </div>
    );
  }

  const digits = (v) => String(v || '').replace(/\D+/g, '');
  const personValid = (p) => p.first_name.trim() && p.last_name.trim() && p.phone_number.trim() && p.id_number.trim();
  const holderValid = personValid(holder) && holder.birthdate && holder.origin_city.trim()
    && (holder.id_document_file || holderHasPhoto);
  // Un mismo celular no puede repetirse entre titular y acompañantes (misma persona dos veces).
  const phoneUsedElsewhere = (key, phone) => {
    const d = digits(phone);
    if (!d) return false;
    if (digits(holder.phone_number) === d) return true;
    return companions.some((c) => c.key !== key && digits(c.phone_number) === d);
  };
  const companionsValid = companions.every((c) => personValid(c) && !phoneUsedElsewhere(c.key, c.phone_number));
  const hasCompanions = companions.length > 0;
  const guests = Number(summary.guests_count) || 1;
  // El paso de acompañantes se omite si la reserva es de una sola persona.
  const visibleSteps = hasCompanions ? STEPS : [STEPS[0], STEPS[2]];
  const currentIndex = hasCompanions ? step - 1 : (step === 1 ? 0 : 1);

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <StayHeader summary={summary} guests={guests} />

        {step > 0 && step < 4 && (
          <div className={s.stepper}>
            {visibleSteps.map((st, i) => (
              <div key={st.title} className={`${s.step} ${i === currentIndex ? s.stepActive : ''} ${i < currentIndex ? s.stepDone : ''}`}>
                <span className={s.stepNum}>{i < currentIndex ? <i className="fas fa-check" /> : i + 1}</span>
                <span className={s.stepText}>
                  <strong>{st.title}</strong>
                  <small>{st.hint}</small>
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 0 && (
          <>
            <div className={s.summaryRows}>
              <Row label="Entrada" value={summary.unit_check_in_time ? `${summary.check_in_date} · desde ${summary.unit_check_in_time}` : summary.check_in_date} />
              <Row label="Salida" value={summary.unit_check_out_time ? `${summary.check_out_date} · hasta ${summary.unit_check_out_time}` : summary.check_out_date} />
              <Row label="Noches" value={String(summary.nights)} />
              <Row label="Personas" value={String(guests)} />
              <Row label="Total" value={reservationMoney(summary.total)} />
              <Row label="Pagado" value={reservationMoney(summary.paid)} />
              <Row label="Saldo por pagar" value={reservationMoney(summary.balance)} strong />
            </div>
            {summary.precheckin_completed ? (
              <div className={s.done}><i className="fas fa-circle-check" /> Ya completaste tu pre-check-in.</div>
            ) : (
              <>
                <div className={s.checklist}>
                  <span className={s.checklistTitle}>Vas a necesitar</span>
                  <ul>
                    <li><i className="fas fa-id-card" /> Tu documento de identidad, para tomarle una foto</li>
                    {guests > 1 && <li><i className="fas fa-users" /> Nombre, celular y documento de {guests - 1} {guests - 1 === 1 ? 'acompañante' : 'acompañantes'}</li>}
                    <li><i className="fas fa-clock" /> La hora aproximada a la que llegas</li>
                  </ul>
                </div>
                <Button variant="primary" block size="lg" icon="fas fa-arrow-right" onClick={() => setStep(1)}>Comenzar pre-check-in</Button>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className={s.stepTitle}>Tus datos</h2>
            <p className={s.hint}>Eres el titular de la reserva. Confirma tus datos y sube la foto de tu documento.</p>
            <PersonForm person={holder} onField={setHolderField} onUpload={(f) => uploadDoc(setHolderField, f)} isHolder hasPhoto={holderHasPhoto} />
            {error && <div className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(hasCompanions ? 2 : 3)} nextDisabled={!holderValid} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={s.stepTitle}>Acompañantes</h2>
            <p className={s.hint}>
              La reserva es para {guests} personas. Completa los datos de
              {companions.length === 1 ? ' tu acompañante' : ` cada uno de tus ${companions.length} acompañantes`}.
            </p>
            {companions.map((c, i) => (
              <CompanionCard key={c.key} index={i} companion={c}
                duplicate={phoneUsedElsewhere(c.key, c.phone_number)}
                onField={(k, v) => setCompanionField(c.key, k, v)}
                onUpload={(f) => uploadDoc((k, v) => setCompanionField(c.key, k, v), f)} />
            ))}
            <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!companionsValid} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className={s.stepTitle}>¿A qué hora llegas?</h2>
            <p className={s.hint}>Nos ayuda a tener todo listo para recibirte.</p>
            <div className={s.slots}>
              {ARRIVAL_SLOTS.map((slot) => (
                <button key={slot.value} type="button"
                  className={`${s.slot} ${arrival === slot.value ? s.slotActive : ''}`}
                  onClick={() => setArrival(slot.value)}>
                  <i className="fas fa-clock" /> {slot.label}
                </button>
              ))}
            </div>
            {error && <div className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
            <StepNav onBack={() => setStep(hasCompanions ? 2 : 1)} nextLabel="Enviar" onNext={submit} nextLoading={saving} nextDisabled={!arrival} />
          </>
        )}

        {step === 4 && (
          <div className={s.done}>
            <i className="fas fa-circle-check" />
            <h2 className={s.title}>¡Pre-check-in completado!</h2>
            <p className={s.subtitle}>Registramos a las {guests} {guests === 1 ? 'persona' : 'personas'} de la reserva.</p>
            <div className={s.summaryRows}>
              <Row label="Entrada" value={summary.check_in_date} />
              <Row label="Unidad" value={summary.unit_name} />
              <Row label="Saldo por pagar" value={reservationMoney(summary.balance)} strong />
            </div>
            <p className={s.hint}>Te esperamos en {summary.company_name}. Lleva tu documento el día de la entrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Presentación del alojamiento y la unidad: acompaña todos los pasos para que el huésped sepa
// siempre dónde está haciendo su pre-check-in.
function StayHeader({ summary, guests }) {
  const meta = [
    summary.unit_type_name,
    `${guests} ${guests === 1 ? 'persona' : 'personas'}`,
    `${summary.nights} ${Number(summary.nights) === 1 ? 'noche' : 'noches'}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className={s.stay}>
      {/* Marca del alojamiento: el logo conserva su proporción (los hay cuadrados y apaisados). */}
      <div className={s.brandRow}>
        {summary.company_logo
          ? <img className={s.brandLogo} src={summary.company_logo} alt={summary.company_name} />
          : <span className={s.brandFallback}><i className="fas fa-hotel" /></span>}
        <div className={s.brandText}>
          <h1 className={s.brandName}>{summary.company_name}</h1>
          {summary.company_address && <p className={s.brandAddress}><i className="fas fa-location-dot" /> {summary.company_address}</p>}
        </div>
      </div>

      <div className={s.unitCard}>
        {summary.unit_photo && <img className={s.unitPhoto} src={summary.unit_photo} alt={summary.unit_name} />}
        <div className={s.unitBody}>
          <span className={s.unitLabel}>Tu alojamiento</span>
          <span className={s.unitName}>{summary.unit_name}</span>
          <span className={s.unitMeta}>{meta}</span>
          {summary.unit_description && <p className={s.unitDescription}>{summary.unit_description}</p>}
          {(summary.unit_check_in_time || summary.unit_check_out_time) && (
            <div className={s.times}>
              {summary.unit_check_in_time && (
                <span className={s.timeItem}><i className="fas fa-right-to-bracket" /> Ingreso desde las {summary.unit_check_in_time}</span>
              )}
              {summary.unit_check_out_time && (
                <span className={s.timeItem}><i className="fas fa-right-from-bracket" /> Salida hasta las {summary.unit_check_out_time}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Entrada a la reserva: código (autocompletado desde el enlace) + nombre del titular.
function AccessForm({ initialCode, onAccess }) {
  const [code, setCode] = React.useState((initialCode || '').toUpperCase());
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [closed, setClosed] = React.useState(null); // reserva encontrada pero ya no operable

  const submit = async () => {
    if (loading || !code.trim() || !name.trim()) return;
    setLoading(true); setError('');
    try {
      const cleanCode = code.trim().toUpperCase();
      onAccess(await api.checkinAccess(cleanCode, name.trim()), cleanCode);
    } catch (e) {
      // 409: la reserva es suya pero está cerrada; se explica en vez de mostrarlo como error.
      if (e?.status === 409 && e.data) setClosed(e.data);
      else setError(e?.message || 'No encontramos una reserva con esos datos.');
    } finally {
      setLoading(false);
    }
  };

  if (closed) {
    return (
      <ClosedReservation info={closed} onRetry={() => { setClosed(null); setName(''); }} />
    );
  }

  return (
    <>
      <div className={s.brand}>piddet</div>
      <div className={s.accessIntro}>
        <h1 className={s.title}>Pre-check-in</h1>
        <p className={s.subtitle}>Adelanta tu registro y llega directo a disfrutar.</p>
      </div>
      <div className={s.form}>
        <Input label="Código de la reserva" icon="fas fa-hashtag" placeholder="Ej. K7M2PQ4XTR"
          value={code} autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        <Input label="Tu nombre" icon="fas fa-user" placeholder="Como se lo diste al alojamiento"
          value={name} onChange={(e) => setName(e.target.value)}
          hint="Basta con tu nombre o tu apellido."
          autoFocus={!!initialCode}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      </div>
      {error && <div className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
      <Button variant="primary" block size="lg" icon="fas fa-arrow-right" loading={loading}
        disabled={!code.trim() || !name.trim()} onClick={submit}>Buscar mi reserva</Button>
      <p className={s.accessFoot}>¿No tienes el código? Pídelo al alojamiento donde reservaste.</p>
    </>
  );
}

// Reserva cerrada (finalizada o cancelada): no es un error del huésped, así que se presenta como
// información y no como fallo.
function ClosedReservation({ info, onRetry }) {
  return (
    <>
      <div className={s.brand}>piddet</div>
      <div className={s.closed}>
        <span className={`${s.closedIcon} ${info.cancelled ? s.closedIconCancelled : ''}`}>
          <i className={info.cancelled ? 'fas fa-ban' : 'fas fa-flag-checkered'} />
        </span>
        <h1 className={s.title}>{info.title}</h1>
        <p className={s.subtitle}>{info.detail}</p>
      </div>
      <div className={s.summaryRows}>
        {info.unit_name && <Row label="Unidad" value={info.unit_name} />}
        {info.check_in_date && <Row label="Entrada" value={info.check_in_date} />}
        {info.check_out_date && <Row label="Salida" value={info.check_out_date} />}
      </div>
      {info.company_phone && (
        <a className={s.closedPhone} href={`tel:${info.company_phone}`}>
          <i className="fas fa-phone" /> Llamar a {info.company_name || 'el alojamiento'}
        </a>
      )}
      <Button variant="secondary" block icon="fas fa-arrow-left" onClick={onRetry}>Buscar otra reserva</Button>
    </>
  );
}

// Tarjeta de un acompañante: celular + datos completos. Si la persona ya existe por su celular o
// correo, el backend la enlaza al guardar sin revelarlo aquí (no se expone quién está registrado).
function CompanionCard({ index, companion: c, duplicate, onField, onUpload }) {
  return (
    <div className={s.companion}>
      <span className={s.companionTag}>Acompañante {index + 1}</span>
      <div className={s.form}>
        <Input label="Celular" type="tel" inputMode="tel" value={c.phone_number}
          onChange={(e) => onField('phone_number', e.target.value)} />
        {duplicate ? (
          <p className={s.dupNote}><i className="fas fa-triangle-exclamation" /> Esta persona ya está en la reserva. Usa el celular de otra persona.</p>
        ) : (
          <PersonForm person={c} onField={onField} onUpload={onUpload} hidePhone />
        )}
      </div>
    </div>
  );
}

function PersonForm({ person, onField, onUpload, isHolder, hasPhoto, hidePhone }) {
  return (
    <div className={s.form}>
      <div className={s.formGrid}>
        <Input label="Nombres" value={person.first_name} onChange={(e) => onField('first_name', e.target.value)} />
        <Input label="Apellidos" value={person.last_name} onChange={(e) => onField('last_name', e.target.value)} />
      </div>
      {!hidePhone && <Input label="Celular" type="tel" inputMode="tel" value={person.phone_number} onChange={(e) => onField('phone_number', e.target.value)} />}
      {isHolder && <Input label="Correo (opcional)" type="email" inputMode="email" value={person.email} onChange={(e) => onField('email', e.target.value)} />}

      <span className={s.sectionTitle}>Documento de identidad</span>
      <div className={s.formGrid}>
        <Select label="Tipo" value={person.id_type_id} onChange={(e) => onField('id_type_id', e.target.value)} options={ID_TYPES} />
        <Input label="Número" inputMode="numeric" value={person.id_number} onChange={(e) => onField('id_number', e.target.value)} />
      </div>
      <label className={s.upload}>
        <input type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => onUpload(e.target.files?.[0])} />
        <span className={s.uploadBtn}>
          {person._uploading ? <><i className="fas fa-spinner fa-spin" /> Subiendo…</>
            : person.id_document_file ? <><i className="fas fa-circle-check" /> Documento cargado · toca para cambiarlo</>
              : hasPhoto ? <><i className="fas fa-circle-check" /> Documento ya registrado · toca para cambiarlo</>
                : <><i className="fas fa-camera" /> Sube una foto de tu documento de identidad</>}
        </span>
      </label>
      {isHolder && !person.id_document_file && !hasPhoto && (
        <p className={s.uploadHint}>Toma la foto por el lado de los datos, sobre una superficie plana y sin reflejos.</p>
      )}

      {isHolder && (
        <>
          <span className={s.sectionTitle}>Procedencia</span>
          <div className={s.formGrid}>
            <Input label="Fecha de nacimiento" type="date" value={person.birthdate} onChange={(e) => onField('birthdate', e.target.value)} />
            <Input label="Ciudad de origen" value={person.origin_city} onChange={(e) => onField('origin_city', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel = 'Continuar', nextDisabled, nextLoading }) {
  return (
    <div className={s.nav}>
      <Button variant="secondary" icon="fas fa-arrow-left" onClick={onBack}>Atrás</Button>
      <Button variant="primary" icon="fas fa-arrow-right" onClick={onNext} disabled={nextDisabled} loading={nextLoading}>{nextLabel}</Button>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={s.row}>
      <span className={s.rowLabel}>{label}</span>
      <span className={strong ? s.rowStrong : s.rowValue}>{value}</span>
    </div>
  );
}
