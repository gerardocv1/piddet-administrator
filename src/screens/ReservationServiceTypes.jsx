import React from 'react';
import { Card, DataTable, Badge, Button, IconButton, Modal, Input, Textarea, MoneyInput, Switch } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import { reservationMoney } from '../lib/reservationLabels.js';
import s from './screens.module.css';

// Catálogo de servicios adicionales de hospedaje (cena romántica, decoración…) con su precio. Se
// agregan a una reserva desde su detalle. Reusa el permiso api-module-rentable-units.
export function ReservationServiceTypes() {
  const fetcher = React.useCallback(() => api.reservationServiceTypes(), []);
  const { data, loading, error, setData, reload } = useResource(fetcher, [], []);

  const [editing, setEditing] = React.useState(null); // { id?, name, description, price }
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const openNew = () => { setErr(null); setEditing({ name: '', description: '', price: '' }); };
  const openEdit = (row) => { setErr(null); setEditing({ id: row.id, name: row.name, description: row.description || '', price: row.price }); };

  const submit = async () => {
    if (saving || !editing.name.trim() || editing.price === '') {
      setErr('Completa nombre y precio.');
      return;
    }
    setSaving(true); setErr(null);
    try {
      const payload = { name: editing.name.trim(), description: editing.description.trim() || null, price: editing.price };
      if (editing.id) await api.updateReservationServiceType(editing.id, payload);
      else await api.createReservationServiceType(payload);
      setEditing(null);
      reload();
    } catch (e) {
      setErr(e?.message || 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row) => {
    const next = Number(row.status) === 1 ? 0 : 1;
    const updated = await api.setReservationServiceTypeStatus(row.id, next);
    setData((rows) => rows.map((r) => (r.id === row.id ? { ...r, status: updated.status } : r)));
  };

  const columns = [
    { key: 'name', header: 'Servicio', render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'description', header: 'Descripción', render: (r) => r.description || <span className={s.faint}>—</span> },
    { key: 'price', header: 'Precio', align: 'right', render: (r) => <span className={s.priceCell}>{reservationMoney(r.price)}</span> },
    {
      key: 'status', header: 'Estado', width: 120,
      render: (r) => (Number(r.status) === 1 ? <Badge variant="success" dot>Activo</Badge> : <Badge variant="neutral" dot>Inactivo</Badge>),
    },
    {
      key: 'actions', header: '', width: 110, align: 'right',
      render: (r) => (
        <div className={s.actions}>
          <Switch checked={Number(r.status) === 1} onChange={() => toggle(r)} />
          <IconButton icon="fas fa-pen" variant="light" title="Editar" onClick={(e) => { e.stopPropagation(); openEdit(r); }} />
        </div>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <p className={s.toolbarText}>Servicios adicionales que se pueden agregar a una reserva.</p>
        <Button variant="primary" size="sm" icon="fas fa-plus" onClick={openNew}>Nuevo servicio</Button>
      </div>

      <Card>
        <DataTable columns={columns} rows={data || []} loading={loading} error={error}
          empty="No hay servicios adicionales. Crea el primero." />
      </Card>

      <Modal open={!!editing} size="sm" title={editing?.id ? 'Editar servicio' : 'Nuevo servicio'}
        onClose={() => setEditing(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" icon="fas fa-check" loading={saving} onClick={submit}>Guardar</Button>
        </>}>
        {editing && (
          <div className={s.formCol}>
            <Input label="Nombre" placeholder="Ej. Cena romántica"
              value={editing.name} onChange={(e) => setEditing((ed) => ({ ...ed, name: e.target.value }))} />
            <MoneyInput label="Precio" icon="fas fa-dollar-sign" placeholder="0"
              value={editing.price} onChange={(v) => setEditing((ed) => ({ ...ed, price: v }))} />
            <Textarea label="Descripción" placeholder="Detalle del servicio (opcional)"
              value={editing.description} onChange={(e) => setEditing((ed) => ({ ...ed, description: e.target.value }))} />
            {err && <div className={s.formError}><i className="fas fa-triangle-exclamation" /> {err}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
