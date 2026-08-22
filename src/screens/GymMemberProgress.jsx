import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Badge, Button, Spinner, Alert, PageHeader, BodyMeasuresChart, BodyFigure, BODY_FIGURE_KEYS, useToast,
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
    last: pts[pts.length - 1],
  }));
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
  const bodyKeys = React.useMemo(() => (types || []).map((t) => t.key).filter((k) => BODY_FIGURE_KEYS.includes(k)), [types]);
  const generalKeys = React.useMemo(() => (types || []).map((t) => t.key).filter((k) => !BODY_FIGURE_KEYS.includes(k)), [types]);

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
                <BodyFigure
                  sex={member.sex}
                  zones={bodyKeys}
                  selected={selectedKey}
                  withData={withData}
                  onSelect={setPicked}
                  labelFor={(k) => typeByKey[k]?.label || k}
                />
                <p className={p.figureHint}>Toca la parte del cuerpo que quieres revisar.</p>
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

                {groups.length === 0 ? (
                  <p className={s.faint}>Aún no hay mediciones de esta medida. Regístrala con "Tomar medidas".</p>
                ) : groups.map((grp) => {
                  const first = Number(grp.first.value);
                  const last = Number(grp.last.value);
                  const max = Math.max(first, last) || 1;
                  const delta = last - first;
                  const single = grp.first === grp.last;
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
                      {!single && (
                        <Badge variant={delta === 0 ? 'neutral' : (delta < 0 ? 'info' : 'success')} dot>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit} desde la primera medición
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {member.sex && (
        <Card>
          <Card.Header title={`Evolución · ${label}`} />
          <Card.Body>
            <BodyMeasuresChart series={progress} selectedKeys={selectedKey ? [selectedKey] : []} loading={progressLoading}
              labelFor={(k) => typeByKey[k]?.label || k}
              emptyLabel="Aún no hay mediciones de esta medida." />
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
