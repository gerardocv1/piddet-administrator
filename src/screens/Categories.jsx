import React from 'react';
import { Badge, Button, IconButton, Switch, Input, Modal, Card, DataTable } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';

export function Categories() {
  const { data: rows, setData: setRows, loading, error } = useResource(api.categories, []);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, activa: !r.activa } : r));
  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  const columns = [
    { key: 'orden', header: 'Orden', render: (r) => (
      <span className={s.order}><i className="fas fa-grip-vertical" />{r.orden}</span>
    ) },
    { key: 'name', header: 'Categoría', render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'productos', header: 'Productos', align: 'right', render: (r) => <Badge variant="neutral">{r.productos}</Badge> },
    { key: 'activa', header: 'Activa', render: (r) => <Switch checked={r.activa} onChange={() => toggle(r.id)} /> },
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
        <p className={s.toolbarText}>Organiza el menú en categorías. Arrastra para reordenar.</p>
        <div className={s.spacer} />
        <Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nueva categoría</Button>
      </div>

      <Card>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="Aún no hay categorías" />
      </Card>

      <Modal open={open} title="Nueva categoría" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <Input label="Nombre de la categoría" icon="fas fa-tags" placeholder="Ej. Promociones" />
          <Switch label="Activa al crear" defaultChecked />
        </div>
      </Modal>

      <Modal open={!!del} size="sm" title="Eliminar categoría" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" icon="fas fa-trash" onClick={() => { remove(del.id); setDel(null); }}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Los productos asociados quedarán sin categoría.
      </Modal>
    </div>
  );
}
