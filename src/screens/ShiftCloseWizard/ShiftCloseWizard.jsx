import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, MoneyInput, Textarea, Spinner, Alert } from '../../components';
import { api } from '../../lib/api.js';
import { useResource } from '../../lib/useResource.js';
import { shiftMoney, SHIFT_TYPE_LABELS } from '../../lib/shiftLabels.js';
import t from './ShiftCloseWizard.module.css';

const STEPS = [
  { n: 1, label: 'Conteo' },
  { n: 2, label: 'Balance' },
  { n: 3, label: 'Confirmar' },
];

// Asistente de cierre de turno (/shifts/:shiftId/close), optimizado para móvil. Paso a paso:
// 1) Conteo — cuánto dinero hay físicamente en la caja.
// 2) Balance — base + ventas (todos los métodos, con desglose) − gastos = esperado, comparado
//    contra lo contado: el sobrante/faltante se resalta antes de confirmar.
// 3) Confirmar — nota opcional y cierre. El backend registra la diferencia como ajuste con su
//    documento contable (el sobrante se factura, el faltante entra como gasto), irreversible;
//    el GLOBAL falla con 409 si hay turnos de cajero abiertos.
export function ShiftCloseWizard() {
  const { shiftId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = React.useState(1);
  const [counted, setCounted] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [closed, setClosed] = React.useState(null); // detalle devuelto por el cierre → éxito
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const shiftFetcher = React.useCallback(() => api.shift(shiftId), [shiftId]);
  const { data: shift, loading, error } = useResource(shiftFetcher, null, [shiftId]);

  // El balance se pide al entrar al paso 2, para que sea lo más fresco posible.
  const balanceFetcher = React.useCallback(
    () => (step >= 2 ? api.shiftBalance(shiftId) : Promise.resolve(null)),
    [shiftId, step >= 2],
  );
  const { data: balance, loading: loadingBalance } = useResource(balanceFetcher, null, [shiftId, step >= 2]);

  const countedNumber = Number(counted) || 0;
  const expected = balance ? Number(balance.expected_amount) : null;
  const difference = expected != null ? countedNumber - expected : null;

  const goBack = () => {
    if (step > 1) { setStep(step - 1); return; }
    navigate(`/shifts/${shiftId}`);
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);
    try {
      const detail = await api.closeShift(shiftId, {
        counted_amount: countedNumber,
        notes: notes.trim() || undefined,
      });
      setClosed(detail);
    } catch (e) {
      setErr(e?.message || 'No se pudo cerrar el turno.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center label="Cargando turno…" />;
  if (error || !shift) {
    return (
      <div className={t.wizard}>
        <Alert tone="danger" title="No se pudo cargar el turno">{error || 'No se encontró el turno.'}</Alert>
      </div>
    );
  }

  if (shift.status !== 'OPEN' && !closed) {
    return (
      <div className={t.wizard}>
        <Alert tone="warning" variant="tint" title="Este turno ya está cerrado">
          No se puede volver a cerrar: el cierre es definitivo.
        </Alert>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={() => navigate(`/shifts/${shiftId}`)}>
          Ver turno
        </Button>
      </div>
    );
  }

  if (closed) {
    const diff = Number(closed.difference || 0);
    return (
      <div className={t.wizard}>
        <div className={t.success}>
          <span className={t.successIcon}><i className="fas fa-check" /></span>
          <h2 className={t.successTitle}>Turno cerrado</h2>
          <p className={t.successTotal}>{shiftMoney(closed.counted_amount)}</p>
          <p className={t.successMeta}>
            {diff === 0
              ? 'La caja cuadró exacta.'
              : diff > 0
                ? `Sobrante de ${shiftMoney(diff)} registrado como factura de ingreso.`
                : `Faltante de ${shiftMoney(Math.abs(diff))} registrado como gasto.`}
          </p>
          <div className={t.successActions}>
            <Button variant="primary" icon="fas fa-cash-register" onClick={() => navigate(`/shifts/${closed.id}`, { replace: true })}>
              Ver turno
            </Button>
            <Button variant="secondary" icon="fas fa-list" onClick={() => navigate('/shifts', { replace: true })}>
              Ir a turnos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={t.wizard}>
      <ol className={t.stepper}>
        {STEPS.map((s2) => (
          <li key={s2.n}
            className={[t.step, step === s2.n ? t.stepActive : '', step > s2.n ? t.stepDone : ''].filter(Boolean).join(' ')}>
            <span className={t.stepDot}>{step > s2.n ? <i className="fas fa-check" /> : s2.n}</span>
            <span className={t.stepLabel}>{s2.label}</span>
          </li>
        ))}
      </ol>

      <div className={t.body}>
        {/* ---------- Paso 1: Conteo ---------- */}
        {step === 1 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>¿Cuánto dinero hay en la caja?</h3>
            <p className={t.helper}>
              Turno <strong>{SHIFT_TYPE_LABELS[shift.type] || shift.type}</strong>
              {shift.assigned_user_name ? <> de <strong>{shift.assigned_user_name}</strong></> : null} · base
              de {shiftMoney(shift.base_amount)}.
            </p>
            <MoneyInput label="Dinero contado" icon="fas fa-dollar-sign" placeholder="0" autoFocus
              value={counted} onChange={setCounted}
              hint="Cuenta todo el efectivo físico de la caja antes de continuar." />
          </div>
        )}

        {/* ---------- Paso 2: Balance ---------- */}
        {step === 2 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Balance del turno</h3>
            {loadingBalance || !balance ? (
              <Spinner center label="Calculando balance…" />
            ) : (
              <>
                <div className={t.summary}>
                  <div><span>Base</span><strong>{shiftMoney(balance.base_amount)}</strong></div>
                  <div><span>Ventas ({balance.sales?.count ?? 0})</span><strong className={t.income}>+ {shiftMoney(balance.sales?.total)}</strong></div>
                  <MethodRows rows={balance.sales?.by_method} />
                  <div><span>Gastos ({balance.expenses?.count ?? 0})</span><strong className={t.outcome}>− {shiftMoney(balance.expenses?.total)}</strong></div>
                  <MethodRows rows={balance.expenses?.by_method} />
                  <div className={t.summaryTotal}><span>Esperado en caja</span><strong>{shiftMoney(balance.expected_amount)}</strong></div>
                  <div><span>Contado</span><strong>{shiftMoney(countedNumber)}</strong></div>
                </div>
                <DifferenceBanner difference={difference} />
              </>
            )}
          </div>
        )}

        {/* ---------- Paso 3: Confirmar ---------- */}
        {step === 3 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>Confirmar cierre</h3>
            <div className={t.summary}>
              <div><span>Esperado</span><strong>{expected != null ? shiftMoney(expected) : '—'}</strong></div>
              <div><span>Contado</span><strong>{shiftMoney(countedNumber)}</strong></div>
              <div className={t.summaryTotal}>
                <span>Diferencia</span>
                <strong className={difference > 0 ? t.income : difference < 0 ? t.outcome : ''}>
                  {difference === 0 ? 'Exacta' : shiftMoney(difference)}
                </strong>
              </div>
            </div>
            {difference !== 0 && (
              <p className={t.helper}>
                {difference > 0
                  ? 'El sobrante se registrará como una factura de ingreso, para que la contabilidad cuadre con la plata contada.'
                  : 'El faltante se registrará como un gasto, para que la contabilidad cuadre con la plata contada.'}
              </p>
            )}
            <Textarea label="Nota de cierre" placeholder="Comentario del arqueo (opcional)"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
            <p className={t.helper}><i className="fas fa-lock" /> El cierre es definitivo: el turno queda como foto contable y no se puede reabrir.</p>
            {err && <Alert tone="danger" title="No se pudo cerrar el turno" onClose={() => setErr(null)}>{err}</Alert>}
          </div>
        )}
      </div>

      {/* Barra de acciones sticky */}
      <div className={t.actionBar}>
        <Button variant="secondary" icon="fas fa-arrow-left" onClick={goBack} disabled={saving}>
          Atrás
        </Button>
        {step === 1 && (
          <Button variant="primary" icon="fas fa-arrow-right" disabled={counted === ''} onClick={() => setStep(2)}>
            Ver balance
          </Button>
        )}
        {step === 2 && (
          <Button variant="primary" icon="fas fa-arrow-right" disabled={loadingBalance || !balance} onClick={() => setStep(3)}>
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button variant="primary" icon="fas fa-lock" loading={saving} onClick={submit}>
            Cerrar turno
          </Button>
        )}
      </div>
    </div>
  );
}

// Desglose informativo por método de pago, indentado bajo su renglón del resumen.
function MethodRows({ rows }) {
  if (!rows?.length) return null;
  return (
    <ul className={t.methods}>
      {rows.map((m) => (
        <li key={m.payment_method || 'none'}>
          <span>{m.payment_method_name || m.payment_method || 'Sin método'}</span>
          <span>{shiftMoney(m.total)}</span>
        </li>
      ))}
    </ul>
  );
}

// Banner del resultado del arqueo: cuadre exacto, sobrante o faltante.
function DifferenceBanner({ difference }) {
  if (difference == null) return null;
  if (difference === 0) {
    return <Alert tone="success">La caja cuadra exacta.</Alert>;
  }
  if (difference > 0) {
    return <Alert tone="info">Sobrante de <strong>{shiftMoney(difference)}</strong></Alert>;
  }
  return <Alert tone="warning">Faltante de <strong>{shiftMoney(Math.abs(difference))}</strong></Alert>;
}
