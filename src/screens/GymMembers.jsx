import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card, DataTable, Badge, Button, FilterBar, Pagination, RefreshButton,
  Modal, Input, Textarea, Select, Alert, useToast,
} from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { gymMemberStatusMeta } from '../lib/gymLabels.js';
import { ID_TYPES } from '../lib/reservationLabels.js';
import s from './screens.module.css';

const EMPTY = { items: [], pagination: null };

const STATUS_OPTIONS = [
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
];

const emptyForm = {
  first_name: '', last_name: '', phone_number: '', email: '',
  id_type_id: '1', id_number: '', height_cm: '', goal: '', health_notes: '',
};

// Miembros del gimnasio: personas registradas como usuarios reales de la plataforma (el backend
// las resuelve como "pasivas" al registrarlas — find-or-create por documento o celular — y las
// vincula a la compañía, mismo patrón que los huéspedes de Reservas). Suscripciones y progreso de
// medidas se agregan en fases posteriores; por ahora la ficha solo tiene los datos del gimnasio.
export function GymMembers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setQuery = (next = {}, nextPage = 1) => {
    const q = {};
    const st = 'status' in next ? next.status : status;
    if (st) q.status = st;
    if (nextPage > 1) q.page = String(nextPage);
    setParams(q);
  };

  const [searchInput, setSearchInput] = React.useState(params.get('q') || '');
  const search = params.get('q') || undefined;
  React.useEffect(() => {
    const id = setTimeout(() => {
      if ((searchInput.trim() || undefined) !== search) {
        const q = {}; if (status) q.status = status; if (searchInput.trim()) q.q = searchInput.trim();
        setParams(q);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetcher = React.useCallback(() => api.gymMembers({ status, search, page }), [status, search, page]);
  const { data, loading, error, reload } = useResource(fetcher, EMPTY, [status, search, page]);
  const rows = data.items || [];
  const pg = data.pagination;

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  const openNew = () => { setForm({ ...emptyForm }); setFormError(''); };

  const save = async () => {
    if (saving) return;
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim()) {
      setFormError('Completa nombres, apellidos y celular.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.createGymMember({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim() || null,
        id_type_id: form.id_type_id ? Number(form.id_type_id) : null,
        id_number: form.id_number.trim() || null,
        height_cm: form.height_cm || null,
        goal: form.goal.trim() || null,
        health_notes: form.health_notes.trim() || null,
      });
      toast({ tone: 'success', title: 'Miembro registrado' });
      setForm(null);
      reload();
    } catch (e) {
      setFormError(e?.message || 'No se pudo registrar el miembro.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'member_code', header: 'Código', width: 110, render: (r) => <span className={s.cellStrong}>{r.member_code}</span> },
    { key: 'member_name', header: 'Miembro', ellipsis: true, render: (r) => r.member_name },
    { key: 'document_snapshot', header: 'Documento', width: 150, render: (r) => r.document_snapshot || <span className={s.faint}>—</span> },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => {
        const m = gymMemberStatusMeta(r.status);
        return <Badge variant={m.variant} dot>{m.label}</Badge>;
      },
    },
  ];

  const filterDefs = [
    { key: 'status', type: 'select', label: 'Estado', icon: 'fas fa-circle-check', options: STATUS_OPTIONS },
  ];

  return (
    <div className={s.page}>
      <FilterBar
        searchable
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Buscar por nombre, código o documento"
        filters={filterDefs}
        values={{ status }}
        onChange={(next) => setQuery({ status: next.status })}
        inlineThreshold={0}
        resultCount={pg?.total}
        actions={
          <>
            {pg != null && (
              <p className={s.toolbarText}>
                {pg.total === 0 ? 'Sin miembros' : `${pg.total} miembro${pg.total === 1 ? '' : 's'}`}
              </p>
            )}
            <RefreshButton loading={loading} onClick={reload} />
            <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>
              Nuevo miembro
            </Button>
          </>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          empty="No hay miembros registrados."
          onRowClick={(r) => navigate(`/gym/members/${r.id}?${params.toString()}`)}
        />
      </Card>

      {pg && pg.last_page > 1 && (
        <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
          onChange={(p) => setQuery({}, p)} disabled={loading} />
      )}

      <Modal open={!!form} title="Nuevo miembro" onClose={() => setForm(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Registrar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <p className={s.faint}>
              Si la persona ya está registrada (mismo documento o celular), se reutiliza su cuenta en vez de duplicarla.
            </p>
            <div className={s.formGrid}>
              <Input label="Nombres" icon="fas fa-user" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label="Apellidos" icon="fas fa-user" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className={s.formGrid}>
              <Input label="Celular" icon="fas fa-phone" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              <Input label="Correo (opcional)" icon="fas fa-envelope" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className={s.formGrid}>
              <Select label="Tipo de documento" icon="fas fa-id-card" value={form.id_type_id}
                onChange={(e) => setForm({ ...form, id_type_id: e.target.value })} options={ID_TYPES} />
              <Input label="Número de documento" icon="fas fa-hashtag" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
            </div>
            <div className={s.formGrid}>
              <Input label="Talla (cm, opcional)" type="number" min="0" icon="fas fa-ruler-vertical"
                value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
              <Input label="Objetivo (opcional)" icon="fas fa-bullseye" placeholder="Ej. Pérdida de grasa"
                value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
            </div>
            <Textarea label="Notas de salud (opcional)" placeholder="Lesiones, condiciones a tener en cuenta…"
              value={form.health_notes} onChange={(e) => setForm({ ...form, health_notes: e.target.value })} />
            {formError && <Alert tone="danger" onClose={() => setFormError('')}>{formError}</Alert>}
          </div>
        )}
      </Modal>
    </div>
  );
}
