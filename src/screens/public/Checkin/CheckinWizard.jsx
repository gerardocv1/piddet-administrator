import React from 'react';
import { Button, Input, Select, Spinner } from '../../../components';
import { api } from '../../../lib/api.js';
import { reservationMoney, ARRIVAL_SLOTS } from '../../../lib/reservationLabels.js';
import s from './CheckinWizard.module.css';

const emptyPerson = () => ({ first_name: '', last_name: '', phone_code: '57', phone_number: '', email: '', id_type_id: '1', id_number: '', birthdate: '', origin_city: '', id_document_file: null, _uploading: false });

// Pre-check-in del huésped (público, móvil-first). Entra con el código de la reserva, revisa el
// resumen y completa sus datos y los de sus acompañantes (documento con foto), la ciudad de
// procedencia y la hora aproximada de llegada. No requiere sesión.
export function CheckinWizard({ code }) {
  const [summary, setSummary] = React.useState(undefined); // undefined=cargando, null=no encontrada
  const [step, setStep] = React.useState(0); // 0 resumen, 1 titular, 2 acompañantes, 3 llegada, 4 ok
  const [holder, setHolder] = React.useState(emptyPerson);
  const [companions, setCompanions] = React.useState([]);
  const [arrival, setArrival] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    api.checkinSummary(code)
      .then((data) => { if (alive) { setSummary(data); const [fn, ...ln] = (data.holder?.name || '').split(' '); setHolder((h) => ({ ...h, first_name: fn || '', last_name: ln.join(' ') })); } })
      .catch(() => { if (alive) setSummary(null); });
    return () => { alive = false; };
  }, [code]);

  const setHolderField = (k, v) => setHolder((h) => ({ ...h, [k]: v }));
  const addCompanion = () => setCompanions((c) => [...c, { key: Date.now(), ...emptyPerson() }]);
  const setCompanionField = (key, k, v) => setCompanions((c) => c.map((x) => (x.key === key ? { ...x, [k]: v } : x)));
  const removeCompanion = (key) => setCompanions((c) => c.filter((x) => x.key !== key));

  const uploadDoc = async (setter, file) => {
    if (!file) return;
    setter('_uploading', true);
    try {
      const res = await api.checkinUploadDocument(code, file);
      setter('id_document_file', res.name);
    } catch {
      setError('No se pudo subir la foto del documento.');
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
      const data = await api.checkinSubmit(code, {
        expected_arrival_time: arrival || null,
        holder: clean(holder),
        companions: companions.filter((c) => c.first_name.trim() && c.last_name.trim() && c.phone_number.trim()).map(clean),
      });
      setSummary(data);
      setStep(4);
    } catch (e) {
      setError(e?.message || 'No se pudo completar el pre-check-in.');
    } finally {
      setSaving(false);
    }
  };

  if (summary === undefined) return <div className={s.screen}><Spinner center label="Cargando reserva…" /></div>;
  if (summary === null) {
    return (
      <div className={s.screen}>
        <div className={s.card}>
          <div className={s.errorState}>
            <i className="fas fa-triangle-exclamation" />
            <h2>Reserva no encontrada</h2>
            <p>Verifica el código con el alojamiento.</p>
          </div>
        </div>
      </div>
    );
  }

  const holderValid = holder.first_name.trim() && holder.last_name.trim() && holder.phone_number.trim() && holder.id_number.trim() && holder.id_document_file;

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.brand}>piddet</div>

        {step > 0 && step < 4 && (
          <div className={s.progress}>
            {['Titular', 'Acompañantes', 'Llegada'].map((label, i) => (
              <span key={label} className={`${s.progressDot} ${i === step - 1 ? s.progressActive : ''}`}>{label}</span>
            ))}
          </div>
        )}

        {step === 0 && (
          <>
            {summary.unit_photo && <img className={s.photo} src={summary.unit_photo} alt={summary.unit_name} />}
            <h1 className={s.title}>{summary.company_name}</h1>
            <p className={s.subtitle}>{summary.unit_name}</p>
            <div className={s.summaryRows}>
              <Row label="Entrada" value={summary.check_in_date} />
              <Row label="Salida" value={summary.check_out_date} />
              <Row label="Noches" value={String(summary.nights)} />
              <Row label="Total" value={reservationMoney(summary.total)} />
              <Row label="Pagado" value={reservationMoney(summary.paid)} />
              <Row label="Saldo" value={reservationMoney(summary.balance)} strong />
            </div>
            {summary.precheckin_completed ? (
              <div className={s.done}><i className="fas fa-circle-check" /> Ya completaste tu pre-check-in.</div>
            ) : (
              <Button variant="primary" block icon="fas fa-arrow-right" onClick={() => setStep(1)}>Comenzar pre-check-in</Button>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className={s.stepTitle}>Tus datos</h2>
            <PersonForm person={holder} onField={setHolderField} onUpload={(f) => uploadDoc(setHolderField, f)} isHolder />
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!holderValid} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={s.stepTitle}>Acompañantes</h2>
            {companions.length === 0 && <p className={s.hint}>Si viajas solo, continúa.</p>}
            {companions.map((c) => (
              <div key={c.key} className={s.companion}>
                <button type="button" className={s.remove} onClick={() => removeCompanion(c.key)} aria-label="Quitar"><i className="fas fa-times" /></button>
                <PersonForm person={c} onField={(k, v) => setCompanionField(c.key, k, v)} onUpload={(f) => uploadDoc((k, v) => setCompanionField(c.key, k, v), f)} />
              </div>
            ))}
            <Button variant="secondary" block icon="fas fa-plus" onClick={addCompanion}>Agregar acompañante</Button>
            <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className={s.stepTitle}>Hora aproximada de llegada</h2>
            <div className={s.slots}>
              {ARRIVAL_SLOTS.map((slot) => (
                <button key={slot.value} type="button"
                  className={`${s.slot} ${arrival === slot.value ? s.slotActive : ''}`}
                  onClick={() => setArrival(slot.value)}>{slot.label}</button>
              ))}
            </div>
            {error && <div className={s.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
            <StepNav onBack={() => setStep(2)} nextLabel="Enviar" onNext={submit} nextLoading={saving} />
          </>
        )}

        {step === 4 && (
          <div className={s.done}>
            <i className="fas fa-circle-check" />
            <h2 className={s.title}>¡Pre-check-in completado!</h2>
            <p className={s.subtitle}>Te esperamos en {summary.company_name}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonForm({ person, onField, onUpload, isHolder }) {
  return (
    <div className={s.form}>
      <div className={s.formGrid}>
        <Input label="Nombres" value={person.first_name} onChange={(e) => onField('first_name', e.target.value)} />
        <Input label="Apellidos" value={person.last_name} onChange={(e) => onField('last_name', e.target.value)} />
      </div>
      <Input label="Celular" value={person.phone_number} onChange={(e) => onField('phone_number', e.target.value)} />
      {isHolder && <Input label="Correo (opcional)" value={person.email} onChange={(e) => onField('email', e.target.value)} />}
      <div className={s.formGrid}>
        <Select label="Documento" value={person.id_type_id} onChange={(e) => onField('id_type_id', e.target.value)}
          options={[{ value: '1', label: 'Cédula' }, { value: '3', label: 'C. extranjería' }, { value: '4', label: 'Pasaporte' }]} />
        <Input label="Número" value={person.id_number} onChange={(e) => onField('id_number', e.target.value)} />
      </div>
      {isHolder && (
        <div className={s.formGrid}>
          <Input label="Nacimiento" type="date" value={person.birthdate} onChange={(e) => onField('birthdate', e.target.value)} />
          <Input label="Ciudad de origen" value={person.origin_city} onChange={(e) => onField('origin_city', e.target.value)} />
        </div>
      )}
      <label className={s.upload}>
        <input type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => onUpload(e.target.files?.[0])} />
        <span className={s.uploadBtn}>
          {person._uploading ? <><i className="fas fa-spinner fa-spin" /> Subiendo…</>
            : person.id_document_file ? <><i className="fas fa-circle-check" /> Documento cargado</>
              : <><i className="fas fa-camera" /> Foto del documento</>}
        </span>
      </label>
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
