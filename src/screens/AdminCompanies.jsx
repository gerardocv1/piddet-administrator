import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, RefreshButton, Switch, Spinner, Pagination, Card, DataTable, Input, Select, Modal, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { AdminUserPicker } from './AdminUserPicker.jsx';
import s from './screens.module.css';
import t from './AdminCompanies.module.css';

const EMPTY = { items: [], pagination: null };

// Sugerencia de dirección web a partir del nombre; el usuario puede cambiarla.
const slugify = (name) => name.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

// Administración MAESTRA de compañías de la plataforma ("elite"). Solo visible para
// administradores con el permiso `company-master`. Desde aquí se dan de alta compañías, se
// activan/inactivan y se entra a cada una para administrar sus usuarios, sin tener que cambiar
// de compañía activa.
export function AdminCompanies() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const id = setTimeout(() => { setSearch(q); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const fetcher = React.useCallback(() => api.masterCompanies({ page, search }), [page, search]);
  const { data, setData, loading, error, reload } = useResource(fetcher, EMPTY, [page, search]);
  const companies = data.items || [];
  const pg = data.pagination;

  const [creating, setCreating] = React.useState(false);
  const [actionError, setActionError] = React.useState('');

  const patchCompany = (id, patch) =>
    setData((d) => ({ ...d, items: (d.items || []).map((x) => x.id === id ? { ...x, ...patch } : x) }));

  const toggleStatus = async (company) => {
    const prev = company.status;
    patchCompany(company.id, { status: !prev });
    setActionError('');
    try {
      await api.setMasterCompanyStatus(company.id, !prev);
    } catch (e) {
      patchCompany(company.id, { status: prev });
      setActionError(e?.message || 'No se pudo cambiar el estado de la compañía.');
    }
  };

  const columns = [
    { key: 'name', header: 'Compañía', ellipsis: true, render: (r) => (
      <div className={t.name}>
        <span>{r.name}</span>
        <span className={t.username}>/{r.username}</span>
      </div>
    ) },
    { key: 'company_type_name', header: 'Tipo', width: 150, render: (r) => r.company_type_name || <span className={s.faint}>Sin definir</span> },
    { key: 'code', header: 'Código', width: 120, nowrap: true },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => (
        <span className={[s.status, r.status ? s.on : s.off].join(' ')}>
          <span className={s.statusDot} />{r.status ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', width: 110, align: 'right',
      render: (r) => (
        <span className={s.actions} onClick={(e) => e.stopPropagation()}>
          <Switch size="sm" checked={!!r.status} onChange={() => toggleStatus(r)} />
          <IconButton icon="fas fa-users" variant="ghost" size="sm" title="Administrar usuarios"
            onClick={() => navigate(`/admin/companies/${r.id}`)} />
        </span>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={t.search}>
          <i className="fas fa-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar compañía" />
        </div>
        <div className={s.spacer} />
        <RefreshButton loading={loading} onClick={reload} />
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={() => setCreating(true)}>
          Nueva compañía
        </Button>
      </div>

      {actionError && <Alert tone="danger" onClose={() => setActionError('')}>{actionError}</Alert>}

      {loading ? (
        <Spinner center label="Cargando compañías…" />
      ) : error ? (
        <Alert tone="danger" title="No se pudieron cargar las compañías">{error}</Alert>
      ) : (
        <Card padding="0">
          <DataTable columns={columns} rows={companies} onRowClick={(r) => navigate(`/admin/companies/${r.id}`)}
            empty={search ? 'No hay compañías que coincidan con la búsqueda.' : 'Aún no hay compañías registradas.'} />
        </Card>
      )}

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
      )}

      {creating && (
        <NewCompanyModal onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            // Entra directo a la compañía nueva: lo siguiente suele ser sumarle usuarios.
            if (created?.id) navigate(`/admin/companies/${created.id}`); else reload();
          }} />
      )}
    </div>
  );
}

// ── Modal: alta de compañía (datos básicos + su usuario administrador) ──
function NewCompanyModal({ onClose, onCreated }) {
  const { data: companyTypes } = useResource(api.companyTypes, [], []);
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [usernameTouched, setUsernameTouched] = React.useState(false);
  const [companyTypeId, setCompanyTypeId] = React.useState('');
  const [admin, setAdmin] = React.useState({ valid: false, payload: null });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  // Mientras no la editen a mano, la dirección web sigue al nombre.
  const onNameChange = (v) => {
    setName(v);
    if (!usernameTouched) setUsername(slugify(v));
  };

  const onAdminChange = React.useCallback((next) => {
    setAdmin((prev) => (prev.valid === next.valid && JSON.stringify(prev.payload) === JSON.stringify(next.payload)
      ? prev : next));
  }, []);

  const valid = name.trim() && username.trim() && admin.valid;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr(null);
    try {
      const created = await api.createMasterCompany({
        name: name.trim(),
        username: username.trim(),
        company_type_id: companyTypeId ? Number(companyTypeId) : null,
        ...admin.payload,
      });
      toast({ tone: 'success', title: 'Compañía creada' });
      onCreated(created);
    } catch (e) {
      // El backend devuelve los errores de validación campo a campo (username duplicado…).
      const detail = e?.errors ? Object.values(e.errors).flat().join(' ') : null;
      setErr(detail || e?.message || 'No se pudo crear la compañía.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Nueva compañía" subtitle="Datos básicos y su usuario administrador" size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!valid} onClick={submit}>Crear compañía</Button>
      </>}>
      <div className={s.formCol}>
        <span className={s.muted}>
          Lo demás —ubicación, identidad visual y módulos contratados— se configura después, ya
          dentro de la compañía.
        </span>

        <Input label="Nombre de la compañía" icon="fas fa-building" placeholder="Ej. Cocinas del Norte"
          value={name} onChange={(e) => onNameChange(e.target.value)} />
        <Input label="Dirección web" icon="fas fa-link" placeholder="cocinas_del_norte"
          hint="Identifica a la compañía en sus páginas públicas. Solo letras, números, guion y guion bajo."
          value={username}
          onChange={(e) => { setUsernameTouched(true); setUsername(e.target.value); }} />
        <Select label="Tipo de negocio (opcional)" icon="fas fa-shapes"
          value={companyTypeId} onChange={(e) => setCompanyTypeId(e.target.value)}>
          <option value="">Sin definir</option>
          {(companyTypes || []).map((ct) => <option key={ct.id} value={String(ct.id)}>{ct.name}</option>)}
        </Select>

        <span className={t.sectionTitle}>Usuario administrador</span>
        <span className={s.muted}>
          Búscalo por teléfono: si ya usa Piddet se vincula a la compañía nueva; si no, se crea.
          Recibirá el rol de administrador de la compañía.
        </span>
        <AdminUserPicker search={api.masterSearchUser} onChange={onAdminChange} />

        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
