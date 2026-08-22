import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Textarea, DatePicker, Spinner, Alert } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { formatShortDate } from '../../lib/dates.js';
import t from './GymCheckinWizard.module.css';

const todayIso = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Asistente móvil de toma de medidas (/gym/members/:memberId/checkin). Una medida por paso —
// solo las que la compañía configuró en /gym/measurements — con input grande de teclado
// decimal y el valor de la medición anterior como referencia. Dejar un paso vacío = omitir esa
// medida hoy. El último paso resume lo capturado y guarda (fecha + notas opcionales).
export function GymCheckinWizard() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const { data: member } = useResource(React.useCallback(() => api.gymMember(memberId), [memberId]), null, [memberId]);
  const { data: types, loading: loadingTypes } = useResource(api.gymMeasurementTypes, [], []);
  // Última medición registrada de cada medida (referencia "Anterior: …").
  const { data: progress } = useResource(React.useCallback(() => api.gymMemberProgress(memberId), [memberId]), {}, [memberId]);

  const [stepIndex, setStepIndex] = React.useState(0); // índice en `types`; types.length = resumen
  const [values, setValues] = React.useState({});      // { [typeId] | [`${typeId}_L`] | [`${typeId}_R`]: '' }
  const [form, setForm] = React.useState({ measured_at: todayIso(), notes: '' });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [created, setCreated] = React.useState(null);

  const total = types.length;
  const onSummary = total > 0 && stepIndex >= total;
  const type = !onSummary ? types[stepIndex] : null;

  const setValue = (field, v) => setValues((prev) => ({ ...prev, [field]: v }));

  const lastOf = (key, side = null) => {
    const points = progress?.[key]?.points || [];
    const filtered = side ? points.filter((p) => p.side === side) : points.filter((p) => !p.side);
    return filtered.length ? filtered[filtered.length - 1] : null;
  };

  const capturedList = React.useMemo(() => {
    const out = [];
    types.forEach((tp) => {
      if (tp.sided) {
        const l = values[`${tp.id}_L`];
        const r = values[`${tp.id}_R`];
        if (l) out.push({ label: `${tp.label} izq.`, value: `${l} ${tp.unit}` });
        if (r) out.push({ label: `${tp.label} der.`, value: `${r} ${tp.unit}` });
      } else if (values[tp.id]) {
        out.push({ label: tp.label, value: `${values[tp.id]} ${tp.unit}` });
      }
    });
    return out;
  }, [types, values]);

  const goBack = () => {
    if (onSummary) { setStepIndex(total - 1); return; }
    if (stepIndex > 0) { setStepIndex(stepIndex - 1); return; }
    navigate(`/gym/members/${memberId}`);
  };
  const goNext = () => setStepIndex((i) => i + 1);

  const submit = async () => {
    if (saving) return;
    const payloadValues = [];
    types.forEach((tp) => {
      if (tp.sided) {
        if (values[`${tp.id}_L`]) payloadValues.push({ measurement_type_id: tp.id, side: 'L', value: values[`${tp.id}_L`] });
        if (values[`${tp.id}_R`]) payloadValues.push({ measurement_type_id: tp.id, side: 'R', value: values[`${tp.id}_R`] });
      } else if (values[tp.id]) {
        payloadValues.push({ measurement_type_id: tp.id, value: values[tp.id] });
      }
    });
    if (!payloadValues.length) {
      setErr('Registra al menos una medida.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const checkin = await api.createGymCheckin(memberId, {
        measured_at: form.measured_at || undefined,
        notes: form.notes.trim() || undefined,
        values: payloadValues,
      });
      setCreated(checkin);
    } catch (e) {
      setErr(e?.message || 'No se pudo registrar la medición.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCreated(null);
    setValues({});
    setForm({ measured_at: todayIso(), notes: '' });
    setErr(null);
    setStepIndex(0);
  };

  if (loadingTypes) {
    return <div className={t.wizard}><Spinner center label="Cargando medidas…" /></div>;
  }

  if (created) {
    return (
      <div className={t.wizard}>
        <div className={t.success}>
          <span className={t.successIcon}><i className="fas fa-check" /></span>
          <h2 className={t.successTitle}>Medición registrada</h2>
          <p className={t.successMeta}>
            {capturedList.length} medida{capturedList.length === 1 ? '' : 's'}
            {member?.member_name ? ` · ${member.member_name}` : ''} · {formatShortDate(created.measured_at)}
          </p>
          <div className={t.successActions}>
            <Button variant="primary" icon="fas fa-user" onClick={() => navigate(`/gym/members/${memberId}`)}>
              Ver afiliado
            </Button>
            <Button variant="secondary" icon="fas fa-plus" onClick={reset}>
              Tomar otras medidas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={t.wizard}>
        <Alert tone="warning" title="No hay medidas configuradas">
          Configura qué medidas pide el gimnasio en la pantalla «Medidas» del menú.
        </Alert>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={() => navigate(`/gym/members/${memberId}`)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className={t.wizard}>
      {/* Cabecera: para quién es la medición + progreso del asistente */}
      <div className={t.header}>
        {member?.member_name && <span className={t.memberName}>{member.member_name}</span>}
        <span className={t.progressText}>
          {onSummary ? 'Confirmar' : `Medida ${stepIndex + 1} de ${total}`}
        </span>
        <div className={t.progressTrack}>
          <div className={t.progressFill}
            style={{ width: `${Math.round(((onSummary ? total : stepIndex) / total) * 100)}%` }} />
        </div>
      </div>

      <div className={t.body}>
        {!onSummary && (
          <div className={t.stepPane}>
            <h3 className={t.measureLabel}>{type.label}</h3>
            <p className={t.measureHint}>Déjalo vacío si hoy no se toma esta medida.</p>
            {type.sided ? (
              <div className={t.sidedGrid}>
                {[['L', 'Izquierdo'], ['R', 'Derecho']].map(([side, label]) => {
                  const last = lastOf(type.key, side);
                  return (
                    <div key={side} className={t.bigField}>
                      <Input label={`${label} (${type.unit})`} type="text" inputMode="decimal"
                        autoFocus={side === 'L'} placeholder="0" wrapClassName={t.bigWrap} className={t.bigInput}
                        value={values[`${type.id}_${side}`] || ''}
                        onChange={(e) => setValue(`${type.id}_${side}`, e.target.value.replace(',', '.'))} />
                      {last && <span className={t.lastValue}>Anterior: {last.value} {type.unit} · {formatShortDate(last.date)}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={t.bigField}>
                <Input label={`Valor (${type.unit})`} type="text" inputMode="decimal"
                  autoFocus placeholder="0" wrapClassName={t.bigWrap} className={t.bigInput}
                  value={values[type.id] || ''}
                  onChange={(e) => setValue(type.id, e.target.value.replace(',', '.'))} />
                {(() => {
                  const last = lastOf(type.key);
                  return last
                    ? <span className={t.lastValue}>Anterior: {last.value} {type.unit} · {formatShortDate(last.date)}</span>
                    : null;
                })()}
              </div>
            )}
          </div>
        )}

        {onSummary && (
          <div className={t.summaryPane}>
            <h3 className={t.measureLabel}>Resumen</h3>
            {capturedList.length === 0 ? (
              <Alert tone="warning" title="No capturaste ninguna medida">
                Vuelve atrás y registra al menos una para poder guardar.
              </Alert>
            ) : (
              <ul className={t.summaryList}>
                {capturedList.map((row) => (
                  <li key={row.label} className={t.summaryRow}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </li>
                ))}
              </ul>
            )}
            <DatePicker label="Fecha de la medición" icon="fas fa-calendar" max={todayIso()}
              value={form.measured_at} onChange={(d) => setForm((f) => ({ ...f, measured_at: d }))} />
            <Textarea label="Notas (opcional)" placeholder="Condiciones de la toma, observaciones…"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
          </div>
        )}
      </div>

      <div className={t.actionBar}>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={goBack} disabled={saving}>
          Atrás
        </Button>
        {!onSummary ? (
          <Button variant="primary" icon="fas fa-arrow-right" onClick={goNext}>
            {stepIndex === total - 1 ? 'Resumen' : 'Siguiente'}
          </Button>
        ) : (
          <Button variant="primary" icon="fas fa-check" loading={saving} disabled={capturedList.length === 0} onClick={submit}>
            Guardar medición
          </Button>
        )}
      </div>
    </div>
  );
}
