import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconButton, RefreshButton, Switch, Spinner, Pagination, Card, DataTable, Badge, Avatar, Modal, Alert, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { AdminUserPicker } from './AdminUserPicker.jsx';
import s from './screens.module.css';
import t from './AdminCompanies.module.css';

const EMPTY_USERS = { items: [], pagination: null };

// Detalle de una compañía desde la administración MAESTRA (permiso `company-master`): datos
// básicos, estado y —lo importante— quién pertenece a ella. Permite vincular y desvincular
// usuarios de CUALQUIER compañía sin cambiar de compañía activa.
export function AdminCompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCompany = React.useCallback(() => api.masterCompany(companyId), [companyId]);
  const { data: company, setData: setCompany, loading, error, reload } = useResource(fetchCompany, null, [companyId]);

  const [statusError, setStatusError] = React.useState('');

  const toggleStatus = async () => {
    const prev = company.status;
    setCompany({ ...company, status: !prev });
    setStatusError('');
    try {
      await api.setMasterCompanyStatus(companyId, !prev);
      toast({ tone: 'neutral', title: !prev ? 'Compañía activada' : 'Compañía inactivada' });
    } catch (e) {
      setCompany({ ...company, status: prev });
      setStatusError(e?.message || 'No se pudo cambiar el estado de la compañía.');
    }
  };

  if (loading) return <div className={s.page}><Spinner center label="Cargando compañía…" /></div>;
  if (error || !company) {
    return (
      <div className={s.page}>
        <Alert tone="danger" title="No se pudo cargar la compañía">{error || 'No se encontró la compañía.'}</Alert>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <Button variant="secondary" size="sm" icon="fas fa-arrow-left" onClick={() => navigate('/admin/companies')}>
          Compañías
        </Button>
        <div className={s.spacer} />
        <RefreshButton loading={loading} onClick={reload} />
      </div>

      {statusError && <Alert tone="danger" onClose={() => setStatusError('')}>{statusError}</Alert>}

      <Card>
        <Card.Body>
          <div className={t.detailHead}>
            <div className={t.detailInfo}>
              <h2 className={t.detailName}>{company.name}</h2>
              <span className={t.username}>/{company.username}</span>
              <div className={t.detailMeta}>
                <Badge variant="neutral">{company.code}</Badge>
                {company.company_type_name
                  ? <Badge variant="info">{company.company_type_name}</Badge>
                  : <span className={s.faint}>Tipo sin definir</span>}
              </div>
            </div>
            <div className={t.detailStatus}>
              <span className={[s.status, company.status ? s.on : s.off].join(' ')}>
                <span className={s.statusDot} />{company.status ? 'Activa' : 'Inactiva'}
              </span>
              <Switch label="Activa" checked={!!company.status} onChange={toggleStatus} />
            </div>
          </div>
          <p className={t.detailHint}>
            El resto del perfil —ubicación, identidad visual y módulos contratados— se edita desde
            el perfil de esa compañía, cambiando a ella con el selector de empresa.
          </p>
        </Card.Body>
      </Card>

      <CompanyUsersCard companyId={companyId} companyName={company.name} />
    </div>
  );
}

// ── Tarjeta: usuarios vinculados a la compañía ──
function CompanyUsersCard({ companyId, companyName }) {
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);

  const fetcher = React.useCallback(() => api.masterCompanyUsers(companyId, { page }), [companyId, page]);
  const { data, loading, error, reload } = useResource(fetcher, EMPTY_USERS, [companyId, page]);
  const users = data.items || [];
  const pg = data.pagination;

  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState(null);

  const columns = [
    { key: 'name', header: 'Usuario', ellipsis: true, render: (r) => (
      <div className={s.user}><Avatar name={r.name} size="sm" />{r.name}</div>
    ) },
    { key: 'phone_number', header: 'Teléfono', width: 150, nowrap: true,
      render: (r) => r.phone_number ? `+${r.phone_code} ${r.phone_number}` : <span className={s.faint}>—</span> },
    { key: 'roles', header: 'Roles', render: (r) => (
      r.roles?.length
        ? <span className={t.roles}>{r.roles.map((x) => <Badge key={x.name} variant="neutral">{x.label}</Badge>)}</span>
        : <span className={s.faint}>Sin roles</span>
    ) },
    {
      key: 'actions', header: '', width: 60, align: 'right',
      render: (r) => (
        <IconButton icon="fas fa-user-minus" variant="danger" size="sm" title="Quitar de la compañía"
          onClick={() => setRemoving(r)} />
      ),
    },
  ];

  return (
    <Card padding="0">
      <Card.Header title="Usuarios de la compañía"
        action={<>
          <RefreshButton loading={loading} onClick={reload} />
          <Button size="sm" icon="fas fa-user-plus" onClick={() => setAdding(true)}>Agregar usuario</Button>
        </>} />

      <DataTable columns={columns} rows={users} loading={loading}
        error={error ? 'No se pudieron cargar los usuarios.' : null}
        empty="Esta compañía aún no tiene usuarios." />

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total} onChange={setPage} disabled={loading} />
      )}

      {adding && (
        <AddUserModal companyId={companyId} companyName={companyName}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); reload(); }} />
      )}

      {removing && (
        <RemoveUserModal companyId={companyId} user={removing} companyName={companyName}
          onClose={() => setRemoving(null)}
          onRemoved={() => { setRemoving(null); reload(); toast({ tone: 'neutral', title: 'Usuario desvinculado' }); }} />
      )}
    </Card>
  );
}

// ── Modal: vincular un usuario a la compañía (buscándolo por teléfono) ──
function AddUserModal({ companyId, companyName, onClose, onAdded }) {
  const fetchRoles = React.useCallback(() => api.masterAssignableRoles(companyId), [companyId]);
  const { data: roles } = useResource(fetchRoles, [], [companyId]);

  const [picked, setPicked] = React.useState({ valid: false, payload: null });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const { toast } = useToast();

  const onPick = React.useCallback((next) => {
    setPicked((prev) => (prev.valid === next.valid && JSON.stringify(prev.payload) === JSON.stringify(next.payload)
      ? prev : next));
  }, []);

  const search = React.useCallback((phone) => api.masterSearchUserByPhone(companyId, phone), [companyId]);

  const submit = async () => {
    if (!picked.valid) return;
    setSaving(true);
    setErr(null);
    try {
      await api.addMasterCompanyUser(companyId, picked.payload);
      toast({ tone: 'success', title: 'Usuario vinculado' });
      onAdded();
    } catch (e) {
      setErr(e?.message || 'No se pudo vincular el usuario.');
    } finally { setSaving(false); }
  };

  return (
    <Modal open title="Agregar usuario" subtitle={companyName} size="lg" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" loading={saving} disabled={!picked.valid} onClick={submit}>Vincular</Button>
      </>}>
      <div className={s.formCol}>
        <span className={s.muted}>
          Busca a la persona por su teléfono: si ya usa Piddet se vincula a esta compañía; si no,
          se crea el usuario.
        </span>
        <AdminUserPicker search={search} onChange={onPick} roles={roles || []} showUserType />
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}

// ── Modal: desvincular un usuario (no borra el usuario global) ──
function RemoveUserModal({ companyId, user, companyName, onClose, onRemoved }) {
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const remove = async () => {
    setSaving(true);
    setErr(null);
    try {
      await api.removeMasterCompanyUser(companyId, user.id);
      onRemoved();
    } catch (e) {
      setErr(e?.message || 'No se pudo desvincular el usuario.');
      setSaving(false);
    }
  };

  return (
    <Modal open title="Quitar usuario" subtitle={user.name} size="sm" onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" icon="fas fa-user-minus" loading={saving} onClick={remove}>Quitar</Button>
      </>}>
      <div className={s.formCol}>
        <p>
          <strong>{user.name}</strong> perderá el acceso a <strong>{companyName}</strong>. Su
          cuenta de Piddet se conserva, junto con el acceso a otras compañías.
        </p>
        {err && <Alert tone="danger" onClose={() => setErr(null)}>{err}</Alert>}
      </div>
    </Modal>
  );
}
