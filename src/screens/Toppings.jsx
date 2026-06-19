import React from 'react';
import { Badge, Button, IconButton, Switch, Select, Input, Modal, Card, DataTable } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';

export function Toppings() {
  const { data: rows, setData: setRows, loading, error } = useResource(api.toppings, []);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, avail: !r.avail } : r));
  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  const columns = [
    { key: 'name', header: 'Topping', render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'grupo', header: 'Grupo', render: (r) => <Badge variant="neutral">{r.grupo}</Badge> },
    { key: 'price', header: 'Precio extra', align: 'right', render: (r) => <span className={s.priceCell}>{r.price}</span> },
    { key: 'avail', header: 'Disponible', render: (r) => <Switch checked={r.avail} onChange={() => toggle(r.id)} /> },
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
        <p className={s.toolbarText}>Adiciones que el cliente puede agregar a un producto.</p>
        <div className={s.spacer} />
        <Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nuevo topping</Button>
      </div>

      <Card>
        <DataTable columns={columns} rows={rows} loading={loading} error={error} empty="Aún no hay toppings" />
      </Card>

      <Modal open={open} title="Nuevo topping" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <Input label="Nombre del topping" icon="fas fa-bacon" placeholder="Ej. Queso extra" />
          <div className={s.formGrid}>
            <Select label="Grupo" options={['General', 'Hamburguesas', 'Pizzas']} />
            <Input label="Precio extra" icon="fas fa-dollar-sign" placeholder="0" />
          </div>
          <Switch label="Disponible al crear" defaultChecked />
        </div>
      </Modal>

      <Modal open={!!del} size="sm" title="Eliminar topping" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" icon="fas fa-trash" onClick={() => { remove(del.id); setDel(null); }}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>?
      </Modal>
    </div>
  );
}
