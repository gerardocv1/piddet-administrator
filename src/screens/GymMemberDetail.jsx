import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button, Spinner, Alert, Input, Textarea, Switch, PageHeader, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMemberStatusMeta, GYM_MEMBER_STATUS } from '../lib/gymLabels.js';
import { formatShortDate } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';

// Ficha de un miembro del gimnasio. Por ahora solo los datos propios del gimnasio (talla,
// objetivo, notas de salud, estado); suscripciones, pagos y progreso de medidas se agregan en
// fases posteriores. El nombre y el documento vienen del usuario de la plataforma y no se editan
// aquí (son del perfil del usuario, compartido con el resto de módulos).
export function GymMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const fetcher = React.useCallback(() => api.gymMember(memberId), [memberId]);
  const { data, setData, loading, error } = useResource(fetcher, null, [memberId]);

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  React.useEffect(() => {
    if (data) {
      setForm({
        height_cm: data.height_cm ?? '',
        goal: data.goal || '',
        health_notes: data.health_notes || '',
        active: Number(data.status) === GYM_MEMBER_STATUS.ACTIVE,
      });
    }
  }, [data]);

  useSetPageTitle(data?.member_name ? `Miembro · ${data.member_name}` : null);

  const goBack = () => navigate(`/gym/members${params.toString() ? `?${params.toString()}` : ''}`);

  if (loading) return <Spinner center label="Cargando miembro…" />;
  if (error || !data) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo abrir el miembro">{error || 'No se encontró el miembro.'}</Alert>
      </div>
    );
  }

  const meta = gymMemberStatusMeta(data.status);
  const dirty = form && (
    (form.height_cm || '') !== (data.height_cm ?? '') ||
    form.goal !== (data.goal || '') ||
    form.health_notes !== (data.health_notes || '') ||
    form.active !== (Number(data.status) === GYM_MEMBER_STATUS.ACTIVE)
  );

  const save = async () => {
    if (saving || !form) return;
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateGymMember(data.id, {
        height_cm: form.height_cm === '' ? null : form.height_cm,
        goal: form.goal.trim() || null,
        health_notes: form.health_notes.trim() || null,
        status: form.active ? GYM_MEMBER_STATUS.ACTIVE : GYM_MEMBER_STATUS.INACTIVE,
      });
      setData(updated);
      toast({ tone: 'success', title: 'Miembro actualizado' });
    } catch (e) {
      setSaveError(e?.message || 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <PageHeader
        onBack={goBack}
        subtitle={data.member_name}
        meta={[
          { label: 'Código', value: data.member_code },
          { label: 'Documento', value: data.document_snapshot || '—' },
          { label: 'Ingreso', value: formatShortDate(data.joined_at) },
          { label: 'Estado', value: <Badge variant={meta.variant} dot>{meta.label}</Badge> },
        ]}
      />

      {saveError && <Alert tone="danger" title="No se pudo completar la acción" onClose={() => setSaveError('')}>{saveError}</Alert>}

      <Card>
        <Card.Header title="Datos del gimnasio" />
        <Card.Body>
          {form && (
            <div className={s.formCol}>
              <div className={s.formGrid}>
                <Input label="Talla (cm)" type="number" min="0" icon="fas fa-ruler-vertical"
                  value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                <Input label="Objetivo" icon="fas fa-bullseye" placeholder="Ej. Pérdida de grasa"
                  value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
              </div>
              <Textarea label="Notas de salud" placeholder="Lesiones, condiciones a tener en cuenta…"
                value={form.health_notes} onChange={(e) => setForm({ ...form, health_notes: e.target.value })} />
              <Switch label="Miembro activo" checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <div className={s.actions}>
                <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>Guardar cambios</Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
