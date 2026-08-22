import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Badge, Button, Spinner, Alert, PageHeader, StatStrip, BodyMeasuresChart, BodyMap, BODY_MAP_KEYS, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { GYM_SEX_OPTIONS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import p from './GymMemberProgress.module.css';

const EMPTY_TYPES = [];
const SIDE_LABEL = { L: 'Izquierdo', R: 'Derecho' };

// Antes/después de una serie: primer y último punto, por lado si la medida es bilateral.
function beforeAfter(serie) {
  if (!serie?.points?.length) return [];
  const bySide = {};
  serie.points.forEach((pt) => {
    const k = pt.side || '';
    (bySide[k] = bySide[k] || []).push(pt);
  });
  return Object.entries(bySide).map(([side, pts]) => ({
    side: side || null,
    first: pts[0],
    prev: pts.length > 1 ? pts[pts.length - 2] : null,
    last: pts[pts.length - 1],
    count: pts.length,
  }));
}

const fmtDelta = (delta, unit) => `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit ? ` ${unit}` : ''}`;

const fmtPct = (delta, base) => (base ? ` (${delta > 0 ? '+' : ''}${((delta / base) * 100).toFixed(1)}%)` : '');

// KPIs de la medida seleccionada: valor actual (con su cambio desde la medición anterior),
// cambio total desde la primera y cuántas mediciones hay. En medidas bilaterales, un KPI por lado.
function kpisFor(groups, unit) {
  if (!groups.length) return [];
  if (groups.length === 1 && !groups[0].side) {
    const g = groups[0];
    const last = Number(g.last.value);
    const total = last - Number(g.first.value);
    const sincePrev = g.prev ? last - Number(g.prev.value) : null;
    return [
      {
        label: 'Actual', value: `${g.last.value} ${unit}`,
        delta: sincePrev != null ? fmtDelta(sincePrev, '') : undefined,
        up: sincePrev != null ? sincePrev >= 0 : undefined,
      },
      g.count > 1 && {
        label: 'Cambio total', value: fmtDelta(total, unit),
        delta: fmtPct(total, Number(g.first.value)).trim() || undefined,
        up: total >= 0,
      },
      { label: 'Mediciones', value: String(g.count) },
    ].filter(Boolean);
  }
  const stats = groups.map((g) => {
    const total = Number(g.last.value) - Number(g.first.value);
    return {
      label: g.side === 'L' ? 'Izquierdo' : 'Derecho',
      value: `${g.last.value} ${unit}`,
      delta: g.count > 1 ? fmtDelta(total, '') : undefined,
      up: total >= 0,
    };
  });
  stats.push({ label: 'Mediciones', value: String(Math.max(...groups.map((g) => g.count))) });
  return stats;
}

// Vista de progreso físico del miembro: figura corporal (hombre/mujer según su ficha) donde se
// toca la parte del cuerpo a revisar — solo las medidas configuradas por la compañía —, con el
// antes/después animado de esa medida y su gráfica. Las medidas que no viven en el cuerpo
// (peso, % de grasa, masa muscular) se eligen como chips.
export function GymMemberProgress() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.gymMember(memberId), [memberId]);
  const { data: member, setData: setMember, loading, error } = useResource(fetcher, null, [memberId]);

  const { data: types } = useResource(api.gymMeasurementTypes, EMPTY_TYPES, []);
  const typeByKey = React.useMemo(() => Object.fromEntries((types || []).map((t) => [t.key, t])), [types]);
  const bodyKeys = React.useMemo(() => (types || []).map((t) => t.key).filter((k) => BODY_MAP_KEYS.includes(k)), [types]);
  const generalKeys = React.useMemo(() => (types || []).map((t) => t.key).filter((k) => !BODY_MAP_KEYS.includes(k)), [types]);

  const progressFetcher = React.useCallback(() => api.gymMemberProgress(memberId), [memberId]);
  const { data: progress, loading: progressLoading } = useResource(progressFetcher, {}, [memberId]);
  const withData = React.useMemo(
    () => (types || []).map((t) => t.key).filter((k) => (progress[k]?.points || []).length > 0),
    [types, progress],
  );

  // Medida seleccionada: por defecto la primera con datos (del orden del catálogo), o la primera.
  const [picked, setPicked] = React.useState('');
  const selectedKey = picked || withData[0] || (types[0]?.key ?? '');

  useSetPageTitle(member?.member_name ? `Progreso · ${member.member_name}` : null);

  // Sexo: define la silueta. Si el miembro no lo tiene, se elige aquí y se guarda en su ficha.
  const [savingSex, setSavingSex] = React.useState(false);
  const [sexError, setSexError] = React.useState('');
  const pickSex = async (sex) => {
    if (savingSex) return;
    setSavingSex(true);
    setSexError('');
    try {
      const updated = await api.updateGymMember(member.id, { sex });
      setMember(updated);
      toast({ tone: 'success', title: 'Sexo guardado en la ficha' });
    } catch (e) {
      setSexError(e?.message || 'No se pudo guardar.');
    } finally {
      setSavingSex(false);
    }
  };

  if (loading) return <Spinner center label="Cargando progreso…" />;
  if (error || !member) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el progreso">{error || 'No se encontró el miembro.'}</Alert>
      </div>
    );
  }

  const serie = progress[selectedKey];
  const unit = serie?.unit || typeByKey[selectedKey]?.unit || '';
  const groups = beforeAfter(serie);
  const label = typeByKey[selectedKey]?.label || selectedKey;
  const kpis = kpisFor(groups, unit);
  const typesWithData = (types || []).filter((t) => withData.includes(t.key));

  return (
    <div className={s.page}>
      <PageHeader
        onBack={() => navigate(`/gym/members/${memberId}`)}
        subtitle={member.member_name}
        meta={[
          { label: 'Código', value: member.member_code },
          { label: 'Vista', value: 'Progreso físico' },
        ]}
      />

      <Card>
        <Card.Header title="Análisis corporal"
          action={
            <Button variant="primary" size="sm" icon="fas fa-plus"
              onClick={() => navigate(`/gym/members/${memberId}/checkin`)}>
              Tomar medidas
            </Button>
          } />
        <Card.Body>
          {!member.sex ? (
            <div className={p.sexPrompt}>
              <p className={p.sexPromptText}>
                ¿El miembro es hombre o mujer? Define la silueta de esta vista y queda guardado en su ficha.
              </p>
              <div className={p.sexPromptActions}>
                {GYM_SEX_OPTIONS.map((o) => (
                  <Button key={o.value} variant="secondary" loading={savingSex}
                    icon={o.value === 'M' ? 'fas fa-person' : 'fas fa-person-dress'}
                    onClick={() => pickSex(o.value)}>
                    {o.label}
                  </Button>
                ))}
              </div>
              {sexError && <Alert tone="danger" onClose={() => setSexError('')}>{sexError}</Alert>}
            </div>
          ) : (
            <div className={p.layout}>
              <div className={p.figureCol}>
                <BodyMap
                  sex={member.sex}
                  zones={bodyKeys}
                  selected={selectedKey}
                  withData={withData}
                  onSelect={setPicked}
                  labelFor={(k) => typeByKey[k]?.label || k}
                />
                <p className={p.figureHint}>Toca el punto del músculo que quieres revisar.</p>
              </div>

              <div className={p.panelCol}>
                {generalKeys.length > 0 && (
                  <div className={p.chips}>
                    {generalKeys.map((k) => (
                      <button key={k} type="button"
                        className={[p.chip, selectedKey === k ? p.chipActive : ''].filter(Boolean).join(' ')}
                        onClick={() => setPicked(k)}>
                        {typeByKey[k]?.label || k}
                      </button>
                    ))}
                  </div>
                )}

                <h3 className={p.measureTitle}>
                  {label}{unit ? <span className={p.measureUnit}> · {unit}</span> : null}
                </h3>

                {kpis.length > 0 && <StatStrip stats={kpis} />}

                {groups.length === 0 ? (
                  <p className={s.faint}>Aún no hay mediciones de esta medida. Regístrala con "Tomar medidas".</p>
                ) : groups.map((grp) => {
                  const first = Number(grp.first.value);
                  const last = Number(grp.last.value);
                  const max = Math.max(first, last) || 1;
                  const delta = last - first;
                  const single = grp.count === 1;

                  // Con una sola medición no existe un "antes": se muestra solo esa línea.
                  if (single) {
                    return (
                      <div key={`${selectedKey}-${grp.side || ''}`} className={p.compare}>
                        {grp.side && <span className={p.compareSide}>{SIDE_LABEL[grp.side] || grp.side}</span>}
                        <div className={p.compareRow}>
                          <span className={p.compareLabel}>Medición</span>
                          <div className={p.barTrack}>
                            <div className={`${p.bar} ${p.barAfter}`} style={{ width: '100%' }} />
                          </div>
                          <span className={p.compareValue}>{grp.last.value} {unit}</span>
                          <span className={p.compareDate}>{formatShortDate(grp.last.date)}</span>
                        </div>
                        <p className={s.faint}>Con la próxima medición verás el antes y el después.</p>
                      </div>
                    );
                  }

                  return (
                    // key con la medida: al cambiar de zona se re-monta y la animación se repite.
                    <div key={`${selectedKey}-${grp.side || ''}`} className={p.compare}>
                      {grp.side && <span className={p.compareSide}>{SIDE_LABEL[grp.side] || grp.side}</span>}
                      <div className={p.compareRow}>
                        <span className={p.compareLabel}>Antes</span>
                        <div className={p.barTrack}>
                          <div className={p.bar} style={{ width: `${(first / max) * 100}%` }} />
                        </div>
                        <span className={p.compareValue}>{grp.first.value} {unit}</span>
                        <span className={p.compareDate}>{formatShortDate(grp.first.date)}</span>
                      </div>
                      <div className={p.compareRow}>
                        <span className={p.compareLabel}>Después</span>
                        <div className={p.barTrack}>
                          <div className={`${p.bar} ${p.barAfter}`} style={{ width: `${(last / max) * 100}%` }} />
                        </div>
                        <span className={p.compareValue}>{grp.last.value} {unit}</span>
                        <span className={p.compareDate}>{formatShortDate(grp.last.date)}</span>
                      </div>
                      <Badge variant="neutral" dot>
                        {fmtDelta(delta, unit)}{fmtPct(delta, first)} desde la primera medición
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* La evolución solo aparece con dos o más mediciones: con una, la gráfica no dice nada. */}
      {member.sex && groups.some((g) => g.count > 1) && (
        <Card>
          <Card.Header title={`Evolución · ${label}`} />
          <Card.Body>
            <BodyMeasuresChart series={progress} selectedKeys={selectedKey ? [selectedKey] : []} loading={progressLoading}
              labelFor={(k) => typeByKey[k]?.label || k}
              emptyLabel="Aún no hay mediciones de esta medida." />
          </Card.Body>
        </Card>
      )}

      {/* Resumen de todas las medidas con historia: valor actual + cambio total. Tocar una fila
          la selecciona (misma selección que la figura y los chips). */}
      {member.sex && typesWithData.length > 0 && (
        <Card>
          <Card.Header title="Resumen de medidas" />
          <Card.Body>
            <ul className={p.summaryList}>
              {typesWithData.map((t) => {
                const grs = beforeAfter(progress[t.key]);
                const u = progress[t.key]?.unit || t.unit || '';
                const lastText = grs.map((g) => g.last.value).join(' / ');
                const deltas = grs
                  .filter((g) => g.count > 1)
                  .map((g) => fmtDelta(Number(g.last.value) - Number(g.first.value), ''));
                const totalDelta = grs.length === 1 && grs[0].count > 1
                  ? Number(grs[0].last.value) - Number(grs[0].first.value)
                  : null;
                return (
                  <li key={t.key}>
                    <button type="button"
                      className={[p.summaryRow, selectedKey === t.key ? p.summaryRowActive : ''].filter(Boolean).join(' ')}
                      onClick={() => setPicked(t.key)}>
                      <span className={p.summaryLabel}>{t.label}</span>
                      <span className={p.summaryValue}>{lastText} {u}</span>
                      <span className={p.summaryDelta}>
                        {deltas.length > 0 && (
                          <>
                            <i className={totalDelta != null && totalDelta < 0 ? 'fas fa-arrow-trend-down' : 'fas fa-arrow-trend-up'} aria-hidden="true" />
                            {' '}{deltas.join(' / ')}{grs.length === 1 ? ` ${u}` : ''}
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
