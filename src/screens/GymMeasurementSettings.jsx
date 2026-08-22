import React from 'react';
import { Card, Button, Switch, Spinner, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import s from './screens.module.css';
import g from './GymMeasurementSettings.module.css';

// Qué medidas pide el gimnasio a sus miembros al tomar medidas. Cada compañía activa su propio
// subconjunto del catálogo (peso, % de grasa, circunferencias…); el asistente de medición solo
// recorre las activas. Guardar exige el permiso gym-measurement-config.
export function GymMeasurementSettings() {
  const { toast } = useToast();
  const { can } = usePermissions();
  const canEdit = can('gym-measurement-config');

  const { data, loading, error, reload } = useResource(api.gymMeasurementSettings, [], []);

  const [enabled, setEnabled] = React.useState(null); // Set de ids; null = aún sin hidratar
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  React.useEffect(() => {
    if (data.length) setEnabled(new Set(data.filter((t) => t.enabled).map((t) => t.id)));
  }, [data]);

  const toggle = (id) => setEnabled((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const dirty = enabled && data.length > 0 &&
    (enabled.size !== data.filter((t) => t.enabled).length || data.some((t) => t.enabled !== enabled.has(t.id)));

  const save = async () => {
    if (saving || !enabled) return;
    if (enabled.size === 0) {
      setSaveError('Selecciona al menos una medida.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await api.updateGymMeasurementSettings([...enabled]);
      toast({ tone: 'success', title: 'Medidas actualizadas' });
      reload();
    } catch (e) {
      setSaveError(e?.message || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <p className={g.intro}>
          Estas son las medidas que se piden al tomar medidas a un miembro. Activa solo las que tu
          gimnasio registra: el asistente de medición será igual de corto.
        </p>
      </div>

      {loading ? (
        <Spinner center label="Cargando medidas…" />
      ) : error ? (
        <Alert tone="danger" title="No se pudo cargar la configuración">{error}</Alert>
      ) : (
        <Card padding="0">
          <ul className={g.list}>
            {data.map((t) => (
              <li key={t.id} className={g.row}>
                <div className={g.rowInfo}>
                  <span className={g.rowLabel}>{t.label}</span>
                  <span className={g.rowMeta}>
                    {t.unit}{t.sided ? ' · izquierdo y derecho' : ''}
                  </span>
                </div>
                <Switch checked={!!enabled?.has(t.id)} disabled={!canEdit}
                  onChange={() => toggle(t.id)} aria-label={`Activar ${t.label}`} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {saveError && <Alert tone="danger" onClose={() => setSaveError('')}>{saveError}</Alert>}

      {canEdit && (
        <div className={s.actions}>
          <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}
