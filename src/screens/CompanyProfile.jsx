import React from 'react';
import { Button, IconButton, Card, Badge, Input, Textarea, Modal, Spinner, FileUpload } from '../components';
import { api } from '../lib/api.js';
import { auth as authLib } from '../lib/auth/index.js';
import { useResource } from '../lib/useResource.js';
import { usePermissions } from '../lib/permissions/usePermissions.js';
import s from './screens.module.css';
import t from './CompanyProfile.module.css';

// Tweak: muestra u oculta la barra de resumen (solo aparece si hay conteos disponibles).
const SHOW_RESUMEN = true;

const RESUMEN = [
  { key: 'stores_count', label: 'Tiendas' },
  { key: 'menus_count', label: 'Menús' },
  { key: 'items_count', label: 'Productos' },
  { key: 'users_count', label: 'Usuarios' },
];

const DATA_FIELDS = [
  { key: 'identification', label: 'Identificación' },
  { key: 'address', label: 'Dirección' },
  { key: 'city', label: 'Ciudad' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'email', label: 'Correo' },
  { key: 'website', label: 'Sitio web', primary: true },
];

const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();
const href = (url = '') => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

export function CompanyProfile() {
  const { data: company, loading, error, reload, setData } = useResource(api.companyProfile, null, []);
  const { can } = usePermissions();
  const editable = can('api-module-company');
  const [editing, setEditing] = React.useState(false);

  const onSaved = (updated) => {
    setData(updated);
    setEditing(false);
    authLib.setCompany({ ...authLib.getCompany(), name: updated.name, icon: updated.icon });
    reload();
  };

  if (loading) return <div className={t.page}><Spinner /></div>;
  if (error || !company) {
    return <div className={t.page}><div className={s.stateError}><i className="fas fa-triangle-exclamation" /> No se pudo cargar la empresa.</div></div>;
  }

  const stats = RESUMEN.filter((r) => company[r.key] != null);
  const edit = editable ? () => setEditing(true) : undefined;

  return (
    <div className={t.page}>
      <Card className={t.identity}>
        {editable && (
          <IconButton className={t.cornerEdit} icon="fas fa-pen" variant="ghost" size="sm"
            title="Editar empresa" onClick={edit} />
        )}
        <div className={t.identityMain}>
          <span className={t.logo}>
            {company.icon
              ? <img src={company.icon} alt={company.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              : initial(company.name)}
          </span>
          <div className={t.identityInfo}>
            <div className={t.nameRow}>
              <h2 className={t.name}>{company.name}</h2>
              {company.plan && <Badge variant="primary">Plan {company.plan}</Badge>}
            </div>
            {(company.legal_name || company.description) && (
              <p className={t.legal}>{company.legal_name || company.description}</p>
            )}
          </div>
        </div>

        {SHOW_RESUMEN && stats.length > 0 && (
          <div className={t.resumen}>
            {stats.map((r) => (
              <div key={r.key} className={t.stat}>
                <span className={t.statValue}>{company[r.key]}</span>
                <span className={t.statLabel}>{r.label}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Card.Header title="Datos de la empresa"
          action={editable && (
            <IconButton icon="fas fa-pen" variant="ghost" size="sm" title="Editar datos" onClick={edit} />
          )} />
        <Card.Body>
          <dl className={t.facts}>
            {DATA_FIELDS.map((f) => (
              <div key={f.key} className={t.fact}>
                <dt className={t.factLabel}>{f.label}</dt>
                <dd className={[t.factValue, f.primary && company[f.key] ? t.factLink : ''].filter(Boolean).join(' ')}>
                  {company[f.key]
                    ? (f.primary
                        ? <a href={href(company[f.key])} target="_blank" rel="noopener noreferrer">{company[f.key]}</a>
                        : company[f.key])
                    : <span className={t.empty}>—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Card.Body>
      </Card>

      {editing && <CompanyEditModal company={company} onClose={() => setEditing(false)} onSaved={onSaved} />}
    </div>
  );
}

// ── Modal: editar datos + logo de la empresa ──
// El logo se edita (recorte/giro) y solo al Guardar se sube a S3 (público); su `name` se manda
// como `icon` junto al resto de campos.
function CompanyEditModal({ company, onClose, onSaved }) {
  const uploaderRef = React.useRef(null);
  const [form, setForm] = React.useState(() => ({
    name: company.name || '',
    identification: company.identification || '',
    description: company.description || '',
    address: company.address || '',
    phone: company.phone || '',
    email: company.email || '',
    website: company.website || '',
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const name = form.name.trim();
    if (!name) { setErr('El nombre de la empresa es obligatorio.'); return; }
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name,
        identification: form.identification.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
      };
      const logo = await uploaderRef.current?.upload();
      if (logo?.name) payload.icon = logo.name;
      const updated = await api.updateCompanyProfile(payload);
      onSaved(updated || { ...company, ...payload, icon: logo?.url || company.icon });
    } catch (e) {
      setErr(e?.message || 'No se pudieron guardar los cambios.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Editar empresa" subtitle={company.name} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} onClick={submit}>Guardar cambios</Button>
      </>}>
      <div className={s.formCol}>
        <FileUpload ref={uploaderRef} folder="logos" visibility="public" aspect={1}
          value={company.icon}
          hint="Logo de la empresa · JPG, PNG o WEBP. Recorta o gira la imagen; se subirá al guardar." />
        <Input label="Nombre comercial" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className={s.formGrid}>
          <Input label="Identificación" value={form.identification} onChange={(e) => set('identification', e.target.value)} />
          <Input label="Teléfono" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Correo" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="Sitio web" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>
        <Input label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} />
        <Textarea label="Descripción" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
      </div>
    </Modal>
  );
}
