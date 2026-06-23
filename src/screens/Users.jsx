import React from 'react';
import { Avatar, Badge, Button, IconButton, Select, Input, Modal, Card, DataTable } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';

const ROLE = { Administrador: 'primary', Cajero: 'info', Mesero: 'neutral', Cocina: 'warning' };

export function Users() {
  const { data: rows, setData: setRows, loading, error } = useResource(api.users, []);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  const columns = [
    { key: 'name', header: 'Usuario', render: (r) => (
      <span className={s.user}><Avatar name={r.name} size="sm" />{r.name}</span>
    ) },
    { key: 'tel', header: 'Teléfono', render: (r) => <span className={s.muted}>{r.tel}</span> },
    { key: 'rol', header: 'Rol', render: (r) => <Badge variant={ROLE[r.rol] || 'neutral'}>{r.rol}</Badge> },
    { key: 'activo', header: 'Estado', render: (r) => (
      <span className={[s.status, r.activo ? s.on : s.off].join(' ')}>
        <span className={s.statusDot} />{r.activo ? 'Activo' : 'Inactivo'}
      </span>
    ) },
    { key: 'acc', header: '', align: 'right', render: (r) => (
      <span className={s.actions}>
        <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" />
        <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(r)} />
      </span>
    ) },
  ];

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <p className={s.toolbarText}>Personas con acceso al panel y a la operación.</p>
        <div className={s.spacer} />
        <Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nuevo usuario</Button>
      </div>

      <Card>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="Aún no hay usuarios" />
      </Card>

      <Modal open={open} title="Nuevo usuario" subtitle="Da acceso a una persona del equipo" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <Input label="Nombre completo" icon="fas fa-user" placeholder="Ej. Laura Gómez" />
          <div className={s.formGrid}>
            <Input label="Teléfono" icon="fas fa-phone" placeholder="300 000 0000" />
            <Select label="Rol" options={['Administrador', 'Cajero', 'Mesero', 'Cocina']} />
          </div>
        </div>
      </Modal>

      <Modal open={!!del} size="sm" title="Eliminar usuario" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" icon="fas fa-trash" onClick={() => { remove(del.id); setDel(null); }}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas quitar el acceso de <strong>{del?.name}</strong>?
      </Modal>
    </div>
  );
}
