import React from 'react';
import { Button, Card, Badge, Modal, Switch, Spinner, Alert, useToast } from '../components';
import { auth as authLib } from '../lib/auth/index.js';
import { useFunctionalities } from '../lib/permissions/useFunctionalities.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import s from './screens.module.css';
import t from './CompanyProfile.module.css';

const FALLBACK_ICON = 'fas fa-puzzle-piece';

const isOn = (f) => f?.is_active === true || f?.is_active === 1;
// El catálogo trae `label` legible; `name` (la clave técnica) es el último recurso.
const labelOf = (f) => f?.label || f?.name || 'Funcionalidad';

// Tarjeta del perfil de empresa: módulos de la plataforma habilitados para ESTA compañía.
// Son independientes de los permisos del usuario: definen qué capacidades existen en la
// compañía (mesas, impuestos, cocina, reservas) y las consumen el panel, el POS y la API.
export function FunctionalitiesCard() {
  const { functionalities, ready } = useFunctionalities();
  const { can } = usePermissions();
  const editable = can('company-edit-functionalities');
  const [editing, setEditing] = React.useState(false);

  const sorted = React.useMemo(
    () => [...(functionalities || [])].sort((a, b) => labelOf(a).localeCompare(labelOf(b), 'es')),
    [functionalities]
  );

  return (
    <Card>
      <Card.Header title="Funcionalidades"
        action={editable && sorted.length > 0 && (
          <Button size="sm" icon="fas fa-sliders" onClick={() => setEditing(true)}>Administrar</Button>
        )} />
      <Card.Body>
        <p className={t.funcHint}>
          Módulos de la plataforma habilitados para esta empresa. Al desactivar uno, deja de verse
          en el panel y en el POS de todos sus usuarios.
        </p>

        {!ready && <Spinner />}
        {ready && sorted.length === 0 && (
          <p className={t.funcEmpty}>No hay funcionalidades disponibles.</p>
        )}

        <ul className={t.funcList}>
          {sorted.map((f) => (
            <li key={f.id} className={t.funcRow}>
              <span className={[t.funcIcon, isOn(f) ? t.funcIconOn : ''].filter(Boolean).join(' ')}>
                <i className={f.icon || FALLBACK_ICON} aria-hidden="true" />
              </span>
              <div className={t.funcInfo}>
                <span className={t.funcLabel}>{labelOf(f)}</span>
                {f.description && <span className={t.funcDesc}>{f.description}</span>}
              </div>
              <Badge variant={isOn(f) ? 'success' : 'neutral'} dot>
                {isOn(f) ? 'Activa' : 'Inactiva'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card.Body>

      {editing && <FunctionalitiesModal functionalities={sorted} onClose={() => setEditing(false)} />}
    </Card>
  );
}

// ── Modal: activar/desactivar funcionalidades de la empresa ──
// Solo se envían las que cambiaron; el backend responde con el catálogo actualizado y la
// fachada `auth` refresca su caché para que las pantallas gateadas reaccionen.
function FunctionalitiesModal({ functionalities, onClose }) {
  const [draft, setDraft] = React.useState(() =>
    Object.fromEntries(functionalities.map((f) => [f.id, isOn(f)]))
  );
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  const toggle = (id) => setDraft((d) => ({ ...d, [id]: !d[id] }));

  const changes = functionalities
    .filter((f) => draft[f.id] !== isOn(f))
    .map((f) => ({ id: f.id, is_active: draft[f.id] }));

  const submit = async () => {
    if (!changes.length) { onClose(); return; }
    setSaving(true);
    setErr(null);
    try {
      await authLib.saveFunctionalities(changes);
      toast({ tone: 'success', title: 'Funcionalidades actualizadas' });
      onClose();
    } catch (e) {
      setErr(e?.message || 'No se pudieron guardar las funcionalidades.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Funcionalidades" subtitle="Actívalas o desactívalas para esta empresa"
      size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!changes.length} onClick={submit}>
          Guardar cambios
        </Button>
      </>}>
      <div className={s.formCol}>
        <ul className={t.funcList}>
          {functionalities.map((f) => (
            <li key={f.id} className={t.funcRow}>
              <span className={[t.funcIcon, draft[f.id] ? t.funcIconOn : ''].filter(Boolean).join(' ')}>
                <i className={f.icon || FALLBACK_ICON} aria-hidden="true" />
              </span>
              <div className={t.funcInfo}>
                <span className={t.funcLabel}>{labelOf(f)}</span>
                {f.description && <span className={t.funcDesc}>{f.description}</span>}
              </div>
              <Switch checked={!!draft[f.id]} onChange={() => toggle(f.id)}
                aria-label={labelOf(f)} disabled={saving} />
            </li>
          ))}
        </ul>
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
