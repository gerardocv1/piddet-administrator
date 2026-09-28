import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, MoneyInput, Textarea, Spinner, Alert } from '../../components';
import { api } from '../../lib/api.js';
import { phrase } from '../../lib/terms.js';
import { useResource } from '../../lib/useResource.js';
import { shiftMoney, SHIFT_TYPE_LABELS, shiftAssignedNames, isPurchaseShift } from '../../lib/shiftLabels.js';
import t from './ShiftCloseWizard.module.css';

const STEPS = [
  { n: 1, label: 'Conteo' },
  { n: 2, label: 'Balance' },
  { n: 3, label: 'Confirmar' },
];

// Modos de entrega del efectivo en el arqueo. Por billetes: cuántos hay de cada denominación
// (viaja `cash_count`). Monto total: un solo monto, sin desglosar (viaja `cash_amount`). Son
// excluyentes: al backend solo llega el del modo activo.
const CASH_MODES = [
  { id: 'denominations', label: 'Por billetes', icon: 'fas fa-money-bill-wave', hint: 'Cuenta cuántos billetes hay de cada denominación; el sistema suma.' },
  { id: 'total', label: 'Monto total', icon: 'fas fa-sack-dollar', hint: 'Escribe el efectivo que entregas, sin desglosarlo por billetes.' },
];

// Asistente de cierre de turno (/shifts/:shiftId/close), optimizado para móvil. Paso a paso:
// 1) Conteo — el arqueo: el efectivo, por billetes (cuántos hay de cada denominación; las monedas
//    van por monto) o como un solo monto total —el cajero elige; el turno de compras arranca en
//    monto total porque no maneja caja de ventas—, y cuánto se recibió por cada método de pago
//    distinto al efectivo, con el total de lo contado creciendo debajo.
// 2) Balance — base + ventas (todos los métodos, con desglose) − gastos − entregas de dinero
//    hechas durante el turno = esperado, comparado
//    contra lo contado, partido en efectivo y otros métodos para ver dónde está la diferencia:
//    el sobrante/faltante se resalta antes de confirmar.
// 3) Confirmar — nota opcional y cierre. El backend registra la diferencia como ajuste con su
//    documento contable (el sobrante se factura, el faltante entra como gasto), irreversible;
//    el GLOBAL falla con 409 si hay turnos de cajero o de compras abiertos.
//
// En un turno de compras el balance es base + adiciones − gastos y la diferencia solo queda
// registrada en el turno: no se genera factura ni gasto de respaldo.
//
// El catálogo de denominaciones y el esperado por método vienen del balance del backend: aquí no
// hay lista de billetes quemada. Los subtotales que se ven mientras se teclea son solo eco de lo
// que va sumando el arqueo; el total que se guarda lo suma la API con las cantidades enviadas.
export function ShiftCloseWizard() {
  const { shiftId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = React.useState(1);
  // Lo que se teclea en el arqueo: por código de denominación (cantidad de billetes, o monto en
  // las monedas) y por método de pago (monto recibido).
  const [cash, setCash] = React.useState({});
  // El efectivo como un solo monto (modo "Monto total"), canónico.
  const [cashAmount, setCashAmount] = React.useState('');
  // Modo elegido a mano; null = el que le toca al tipo de turno (se resuelve al cargarlo).
  const [chosenMode, setChosenMode] = React.useState(null);
  const [received, setReceived] = React.useState({});
  const [notes, setNotes] = React.useState('');
  const [closed, setClosed] = React.useState(null); // detalle devuelto por el cierre → éxito
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const shiftFetcher = React.useCallback(() => api.shift(shiftId), [shiftId]);
  const { data: shift, loading, error } = useResource(shiftFetcher, null, [shiftId]);

  // El balance se pide de entrada: el arqueo se arma con su catálogo de denominaciones y con el
  // esperado de cada método distinto al efectivo.
  const balanceFetcher = React.useCallback(() => api.shiftBalance(shiftId), [shiftId]);
  const { data: balance, loading: loadingBalance } = useResource(balanceFetcher, null, [shiftId]);

  const denominations = balance?.cash_denominations || [];
  // Un movimiento sin método de pago no se puede reportar (no es una entidad de pago real), así
  // que no se pregunta por él.
  const methods = (balance?.non_cash?.by_method || []).filter((m) => m.payment_method);

  // Los métodos distintos al efectivo arrancan con lo que el sistema registró: el cajero confirma
  // contra el reporte del datáfono o de la app y corrige si no coincide.
  React.useEffect(() => {
    if (!methods.length) return;
    setReceived((current) => {
      const next = { ...current };
      methods.forEach((m) => {
        if (next[m.payment_method] === undefined) next[m.payment_method] = String(Number(m.expected));
      });
      return next;
    });
  }, [balance]);

  // Renglones del arqueo: el billete se cuenta por cantidad (× su valor) y las monedas por monto.
  const cashRows = denominations.map((d) => {
    const raw = cash[d.code] ?? '';
    const unit = d.value == null ? null : Number(d.value);
    const quantity = unit == null ? null : Math.floor(Number(raw) || 0);
    return { ...d, raw, unit, quantity, amount: unit == null ? Number(raw) || 0 : unit * quantity };
  });
  const methodRows = methods.map((m) => {
    const raw = received[m.payment_method] ?? '';
    return { ...m, raw, amount: Number(raw) || 0 };
  });

  const purchase = isPurchaseShift(shift);
  // El turno de compras arranca en monto total: quien compra entrega lo que le quedó, no arquea
  // una caja de ventas billete por billete. Los demás, por billetes.
  const cashMode = chosenMode ?? (purchase ? 'total' : 'denominations');
  const byTotal = cashMode === 'total';

  const sum = (rows) => rows.reduce((acc, r) => acc + r.amount, 0);
  const cashTotal = byTotal ? Number(cashAmount) || 0 : sum(cashRows);
  const methodsTotal = sum(methodRows);
  const countedNumber = cashTotal + methodsTotal;

  // El arqueo empieza cuando se cuenta el efectivo: contar es un acto, no un campo en blanco.
  const counting = byTotal ? cashAmount !== '' : cashRows.some((r) => r.raw !== '');

  const expected = balance ? Number(balance.expected_amount) : null;
  const difference = expected != null ? countedNumber - expected : null;
  // Esperado partido igual que lo contado, para señalar dónde está la diferencia.
  const expectedCash = balance ? Number(balance.cash?.expected) : null;
  const expectedNonCash = balance ? Number(balance.non_cash?.expected) : null;
  // Entregas de dinero adelantadas (solo turnos de ventas): ya salieron de la caja y el esperado
  // las descuenta; se recuerdan para que nadie las vuelva a contar.
  const handoversTotal = Number(balance?.handovers?.total) || 0;

  const goBack = () => {
    if (step > 1) { setStep(step - 1); return; }
    navigate(`/shifts/${shiftId}`);
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setErr(null);
    try {
      // Del efectivo viaja solo lo del modo activo: por billetes, la CANTIDAD de cada
      // denominación (el monto lo multiplica el backend) y el monto de las monedas; por monto
      // total, ese único monto. Mandar los dos es un error de validación.
      const cashPayload = byTotal
        ? { cash_amount: cashTotal }
        : {
          cash_count: cashRows
            .filter((r) => r.amount > 0)
            .map((r) => (r.unit == null ? { code: r.code, amount: r.amount } : { code: r.code, quantity: r.quantity })),
        };
      const detail = await api.closeShift(shiftId, {
        ...cashPayload,
        // De cada otro método, el monto recibido.
        method_count: methodRows
          .filter((r) => r.amount > 0)
          .map((r) => ({ payment_method: r.payment_method, amount: r.amount })),
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
              : isPurchaseShift(closed)
                ? `${diff > 0 ? 'Sobrante' : 'Faltante'} de ${shiftMoney(Math.abs(diff))} registrado en el turno.`
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

  // Lo contado, partido como se contó: se repite en los tres pasos.
  const countedRows = (
    <ul className={t.methods}>
      <li><span>Efectivo{byTotal ? ' (monto total)' : ''}</span><span>{shiftMoney(cashTotal)}</span></li>
      {methodRows.length > 0 && <li><span>Otros métodos</span><span>{shiftMoney(methodsTotal)}</span></li>}
    </ul>
  );

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
        {/* ---------- Paso 1: Conteo (arqueo) ---------- */}
        {step === 1 && (
          <div className={t.formCol}>
            <h3 className={t.heading}>¿Cuánto dinero hay en la caja?</h3>
            <p className={t.helper}>
              Turno <strong>{SHIFT_TYPE_LABELS[shift.type] || shift.type}</strong>
              {shiftAssignedNames(shift) ? <> de <strong>{shiftAssignedNames(shift)}</strong></> : null} · base
              de {shiftMoney(shift.base_amount)}.
            </p>

            {loadingBalance || !balance ? (
              <Spinner center label="Preparando el arqueo…" />
            ) : (
              <>
                {handoversTotal > 0 && (
                  <Alert tone="info" variant="tint">
                    Durante el turno se entregaron <strong>{shiftMoney(handoversTotal)}</strong>
                    {' '}({balance.handovers.count} {balance.handovers.count === 1 ? 'entrega' : 'entregas'}).
                    Ya están descontados del esperado: cuenta solo lo que quedó en la caja.
                  </Alert>
                )}
                <section className={t.count}>
                  <header className={t.countHead}>
                    <span>Efectivo</span>
                    <strong>{shiftMoney(cashTotal)}</strong>
                  </header>
                  <div className={t.modes} role="radiogroup" aria-label="Cómo entregas el efectivo">
                    {CASH_MODES.map((m) => (
                      <button key={m.id} type="button" role="radio" aria-checked={cashMode === m.id}
                        className={[t.mode, cashMode === m.id ? t.modeActive : ''].filter(Boolean).join(' ')}
                        onClick={() => setChosenMode(m.id)}>
                        <i className={m.icon} /> {m.label}
                      </button>
                    ))}
                  </div>
                  <p className={t.helper}>{CASH_MODES.find((m) => m.id === cashMode)?.hint}</p>
                  {byTotal ? (
                    <MoneyInput label="Efectivo entregado" icon="fas fa-dollar-sign" placeholder="0"
                      className={t.totalField} wrapClassName={t.totalWrap} autoFocus
                      value={cashAmount} onChange={setCashAmount} />
                  ) : (
                    <ul className={t.countRows}>
                      {cashRows.map((r) => (
                        <li key={r.code} className={t.countRow}>
                          <span className={t.countLabel}>{r.label}</span>
                          {r.unit == null ? (
                            <MoneyInput className={t.countField} wrapClassName={t.countWrap} placeholder="0" aria-label={`Monto en ${r.label}`}
                              value={r.raw} onChange={(v) => setCash((c) => ({ ...c, [r.code]: v }))} />
                          ) : (
                            <Input className={t.countField} wrapClassName={t.countWrap} inputMode="numeric" placeholder="0"
                              aria-label={`Cantidad de ${r.label}`} value={r.raw}
                              onChange={(e) => setCash((c) => ({ ...c, [r.code]: e.target.value.replace(/\D/g, '') }))} />
                          )}
                          <span className={[t.countAmount, r.amount > 0 ? '' : t.countEmpty].filter(Boolean).join(' ')}>
                            {r.amount > 0 ? shiftMoney(r.amount) : '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {methodRows.length > 0 && (
                  <section className={t.count}>
                    <header className={t.countHead}>
                      <span>Otros métodos de pago</span>
                      <strong>{shiftMoney(methodsTotal)}</strong>
                    </header>
                    <ul className={t.countRows}>
                      {methodRows.map((m) => (
                        <li key={m.payment_method} className={t.countRowWide}>
                          <span className={t.countLabel}>
                            {m.payment_method_name || m.payment_method}
                            <small>Registrado: {shiftMoney(m.expected)}</small>
                          </span>
                          <MoneyInput className={t.countField} wrapClassName={t.countWrap} placeholder="0"
                            aria-label={`Recibido por ${m.payment_method_name || m.payment_method}`}
                            value={m.raw}
                            onChange={(v) => setReceived((c) => ({ ...c, [m.payment_method]: v }))} />
                        </li>
                      ))}
                    </ul>
                    <p className={t.helper}>
                      Confirma cada método contra su reporte (datáfono, app) y corrige si no coincide.
                    </p>
                  </section>
                )}

                <div className={t.summary}>
                  <div><span>{byTotal ? 'Efectivo entregado' : 'Efectivo contado'}</span><strong>{shiftMoney(cashTotal)}</strong></div>
                  {methodRows.length > 0 && (
                    <div><span>Otros métodos</span><strong>{shiftMoney(methodsTotal)}</strong></div>
                  )}
                  <div className={t.summaryTotal}>
                    <span>Total recibido</span>
                    <strong>{shiftMoney(countedNumber)}</strong>
                  </div>
                </div>

                {!counting && (
                  <p className={t.helper}>
                    <i className="fas fa-circle-info" /> {byTotal
                      ? 'Escribe el efectivo que entregas para continuar (si no quedó nada, escribe 0).'
                      : 'Cuenta el efectivo de la caja para continuar (si no quedó nada, escribe 0 en Monedas).'}
                  </p>
                )}
              </>
            )}
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
                  {purchase ? (
                    <>
                      <div><span>Adiciones ({balance.additions?.count ?? 0})</span><strong className={t.income}>+ {shiftMoney(balance.additions?.total)}</strong></div>
                      <MethodRows rows={balance.additions?.by_method} />
                    </>
                  ) : (
                    <>
                      <div><span>{phrase('Ventas')} ({balance.sales?.count ?? 0})</span><strong className={t.income}>+ {shiftMoney(balance.sales?.total)}</strong></div>
                      <MethodRows rows={balance.sales?.by_method} />
                    </>
                  )}
                  <div><span>Gastos ({balance.expenses?.count ?? 0})</span><strong className={t.outcome}>− {shiftMoney(balance.expenses?.total)}</strong></div>
                  <MethodRows rows={balance.expenses?.by_method} />
                  {!purchase && (balance.handovers?.count ?? 0) > 0 && (
                    <>
                      <div><span>Entregas ({balance.handovers.count})</span><strong className={t.outcome}>− {shiftMoney(balance.handovers.total)}</strong></div>
                      <MethodRows rows={balance.handovers.by_method} />
                    </>
                  )}
                  <div className={t.summaryTotal}><span>Esperado en caja</span><strong>{shiftMoney(balance.expected_amount)}</strong></div>
                  <div><span>Contado</span><strong>{shiftMoney(countedNumber)}</strong></div>
                  {countedRows}
                </div>
                <DifferenceBanner difference={difference} />
                {/* Esperado contra contado, renglón por renglón: la diferencia casi siempre está en
                    el efectivo; si está en un método, es el reporte del datáfono o de la app. */}
                <CompareTable rows={[
                  { label: 'Efectivo', expected: expectedCash, counted: cashTotal },
                  ...(methodRows.length > 0 || expectedNonCash > 0
                    ? [{ label: 'Otros métodos', expected: expectedNonCash, counted: methodsTotal }]
                    : []),
                ]} />
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
              {countedRows}
              <div className={t.summaryTotal}>
                <span>Diferencia</span>
                <strong className={difference > 0 ? t.income : difference < 0 ? t.outcome : ''}>
                  {difference === 0 ? 'Exacta' : shiftMoney(difference)}
                </strong>
              </div>
            </div>
            {difference !== 0 && (
              <p className={t.helper}>
                {purchase
                  ? 'La diferencia quedará registrada en el turno, sin factura ni gasto de respaldo: se concilia con quien entregó la base.'
                  : difference > 0
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
          <Button variant="primary" icon="fas fa-arrow-right" disabled={!counting || loadingBalance || !balance} onClick={() => setStep(2)}>
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

// Esperado · contado · diferencia por naturaleza del dinero (efectivo y otros métodos).
function CompareTable({ rows }) {
  return (
    <div className={t.compare} role="table" aria-label="Esperado contra contado">
      <div className={[t.compareRow, t.compareHead].join(' ')} role="row">
        <span role="columnheader" />
        <span role="columnheader">Esperado</span>
        <span role="columnheader">Contado</span>
        <span role="columnheader">Diferencia</span>
      </div>
      {rows.map((r) => {
        const diff = Number.isFinite(r.expected) ? r.counted - r.expected : null;
        return (
          <div key={r.label} className={t.compareRow} role="row">
            <span role="cell">{r.label}</span>
            <span role="cell">{Number.isFinite(r.expected) ? shiftMoney(r.expected) : '—'}</span>
            <span role="cell">{shiftMoney(r.counted)}</span>
            <strong role="cell" className={diff > 0 ? t.income : diff < 0 ? t.outcome : ''}>
              {diff == null ? '—' : diff === 0 ? 'Exacta' : shiftMoney(diff)}
            </strong>
          </div>
        );
      })}
    </div>
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
