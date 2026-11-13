import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, DataTable, Badge, Button, IconButton, Modal, Input, Select, Alert, ConfirmDialog, PageHeader, useToast } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { formatShortDate, formatStayRange, formatStayRangeShort } from '../lib/dates.js';
import { useSetPageTitle } from '../lib/pageTitle.jsx';
import s from './screens.module.css';
import b from './ReservationDateBlocks.module.css';

const EMPTY_UNITS = { items: [], pagination: null };
const ALL_UNITS_LABEL = 'Todas las unidades';

// Rango del bloqueo (ambas fechas incluidas): un solo día se dice una vez; si cruza de año van
// los dos extremos completos con flecha, y si no, el rango abreviado.
export function formatBlockRange(start, end) {
  if (!end || start === end) return formatShortDate(start);
  if (String(start).slice(0, 4) !== String(end).slice(0, 4)) return formatStayRange(start, end);
  return formatStayRangeShort(start, end);
}

// Mensaje del servidor tal como llega, con el detalle por campo si lo trae (422 de validación).
const apiError = (e, fallback) => {
  const detail = e?.errors ? Object.values(e.errors).flat().join(' ') : '';
  return [e?.message || fallback, detail].filter(Boolean).join(' ');
};

const emptyForm = () => ({ id: null, startDate: '', endDate: '', unitId: '', reason: '' });

// Días bloqueados del calendario de reservas: noches que la compañía no ofrece (31 de diciembre,
// mantenimiento…), para una unidad o para todas. Las reglas (rango válido, unidad de la compañía)
// las decide el backend; aquí solo se muestran sus errores. Quien consulta disponibilidad ve esos
// días ocupados sin saber si es reserva o bloqueo: el motivo es una nota interna.
export function ReservationDateBlocks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  useSetPageTitle('Días bloqueados');

  const fetcher = React.useCallback(() => api.reservationDateBlocks(), []);
  const { data: blocks, loading, error, reload } = useResource(fetcher, [], []);

  const { data: units } = useResource(React.useCallback(() => api.rentableUnits({ perPage: 100 }), []), EMPTY_UNITS, []);
  const unitOptions = units.items || [];

  const [form, setForm] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState(null);

  const [deleting, setDeleting] = React.useState(null);
  const [removing, setRemoving] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState(null);

  const openNew = () => { setFormError(null); setForm(emptyForm()); };
  const openEdit = (row) => {
    setFormError(null);
    setForm({
      id: row.id,
      startDate: row.start_date || '',
      endDate: row.end_date || '',
      unitId: row.rentable_unit_id != null ? String(row.rentable_unit_id) : '',
      reason: row.reason || '',
    });
  };
  const closeForm = () => { if (!saving) setForm(null); };

  const save = async () => {
    if (!form || saving) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      start_date: form.startDate,
      end_date: form.endDate,
      rentable_unit_id: form.unitId === '' ? null : Number(form.unitId),
      reason: form.reason.trim() || null,
    };
    try {
      if (form.id) await api.updateReservationDateBlock(form.id, payload);
      else await api.createReservationDateBlock(payload);
      toast({ tone: 'success', title: form.id ? 'Bloqueo actualizado' : 'Bloqueo creado' });
      setForm(null);
      reload();
    } catch (e) {
      setFormError(apiError(e, 'No se pudo guardar el bloqueo.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting || removing) return;
    setRemoving(true);
    setDeleteError(null);
    try {
      await api.deleteReservationDateBlock(deleting.id);
      toast({ tone: 'success', title: 'Bloqueo eliminado' });
      setDeleting(null);
      reload();
    } catch (e) {
      setDeleteError(apiError(e, 'No se pudo eliminar el bloqueo.'));
    } finally {
      setRemoving(false);
    }
  };

  const columns = [
    { key: 'dates', header: 'Fechas', width: '30%', nowrap: true, render: (r) => formatBlockRange(r.start_date, r.end_date) },
    {
      key: 'unit', header: 'Unidad', width: '25%', ellipsis: true,
      render: (r) => (r.applies_to_all || r.rentable_unit_id == null
        ? <Badge variant="danger">{ALL_UNITS_LABEL}</Badge>
        : r.rentable_unit_name || `Unidad ${r.rentable_unit_id}`),
    },
    { key: 'reason', header: 'Motivo', width: '33%', ellipsis: true, render: (r) => r.reason || <span className={s.faint}>—</span> },
    {
      key: 'actions', header: '', width: '12%', align: 'right',
      render: (r) => (
        <span className={s.actions}>
          <IconButton icon="fas fa-pen" variant="light" size="sm" title="Editar bloqueo" onClick={() => openEdit(r)} />
          <IconButton icon="fas fa-trash" variant="light" size="sm" title="Eliminar bloqueo"
            onClick={() => { setDeleteError(null); setDeleting(r); }} />
        </span>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <PageHeader
        onBack={() => navigate('/reservations')}
        title="Días bloqueados"
        action={<Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>Nuevo bloqueo</Button>}
        menu={[
          { label: 'Actualizar', icon: 'fas fa-rotate-right', disabled: loading, onClick: reload },
        ]}
      />

      <Card>
        <DataTable
          columns={columns}
          rows={blocks || []}
          loading={loading}
          error={error}
          empty="No hay días bloqueados. Crea uno para dejar de ofrecer esas noches."
        />
      </Card>

      <Modal open={!!form} size="sm"
        title={form?.id ? 'Editar bloqueo' : 'Nuevo bloqueo'}
        onClose={closeForm}
        footer={<>
          <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
          <Button variant="primary" loading={saving} disabled={!form?.startDate || !form?.endDate} onClick={save}>Guardar</Button>
        </>}>
        {form && (
          <div className={s.formCol}>
            <div className={s.formGrid}>
              <Input label="Fecha inicio" type="date" required value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="Fecha fin" type="date" required value={form.endDate} min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <Select label="Unidad" value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
              <option value="">{ALL_UNITS_LABEL}</option>
              {unitOptions.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </Select>
            <Input label="Motivo (opcional)" placeholder="Ej. Cierre de fin de año" maxLength={255}
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <p className={`${s.faint} ${b.note}`}>
              Las dos fechas quedan bloqueadas. El motivo es interno: quien consulte disponibilidad
              solo verá el día ocupado.
            </p>
            {formError && <Alert tone="danger" onClose={() => setFormError(null)}>{formError}</Alert>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar bloqueo"
        confirmLabel="Eliminar"
        icon="fas fa-trash"
        loading={removing}
        error={deleteError}
        onConfirm={remove}
        onClose={() => { if (!removing) setDeleting(null); }}>
        {deleting && (
          <>
            Se volverán a ofrecer las noches de <strong>{formatBlockRange(deleting.start_date, deleting.end_date)}</strong>
            {' '}en {deleting.rentable_unit_id == null ? 'todas las unidades' : <strong>{deleting.rentable_unit_name || `la unidad ${deleting.rentable_unit_id}`}</strong>}.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
