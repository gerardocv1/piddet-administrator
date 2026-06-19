import React from 'react';
import { Badge, Button, IconButton, Switch, Select, Input, Modal, Card, FilterBar, DataTable } from '../components';
import { api } from '../lib/api.js';
import { useResource } from '../lib/useResource.js';
import s from './screens.module.css';

const FILTERS = [
  { key: 'cat', label: 'Categoría', icon: 'fas fa-tags', type: 'multi', options: [
    { value: 'Hamburguesas', label: 'Hamburguesas' }, { value: 'Pizzas', label: 'Pizzas' },
    { value: 'Entradas', label: 'Entradas' }, { value: 'Bebidas', label: 'Bebidas' },
    { value: 'Postres', label: 'Postres' }, { value: 'Acompañamientos', label: 'Acompañamientos' },
  ] },
  { key: 'estado', label: 'Disponibilidad', icon: 'fas fa-circle-check', type: 'select', options: [
    { value: 'disp', label: 'Disponible' }, { value: 'agotado', label: 'Agotado' },
  ] },
  { key: 'precio', label: 'Precio', icon: 'fas fa-dollar-sign', type: 'select', options: [
    { value: 'lt10', label: 'Menos de $10.000' }, { value: '10-20', label: '$10.000 – $20.000' },
    { value: 'gt20', label: 'Más de $20.000' },
  ] },
  { key: 'destacado', label: 'Solo destacados', icon: 'fas fa-star', type: 'toggle', onLabel: 'Destacados' },
];

function priceNum(p) { return Number(String(p).replace(/[^0-9]/g, '')) || 0; }

export function Products() {
  const { data: rows, setData: setRows, loading, error } = useResource(api.products, []);
  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState({ cat: [], estado: undefined, precio: undefined, destacado: false });
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  const filtered = rows.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filters.cat && filters.cat.length && !filters.cat.includes(r.cat)) return false;
    if (filters.estado === 'disp' && !r.avail) return false;
    if (filters.estado === 'agotado' && r.avail) return false;
    if (filters.precio) {
      const n = priceNum(r.price);
      if (filters.precio === 'lt10' && n >= 10000) return false;
      if (filters.precio === '10-20' && (n < 10000 || n > 20000)) return false;
      if (filters.precio === 'gt20' && n <= 20000) return false;
    }
    if (filters.destacado && !r.destacado) return false;
    return true;
  });
  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, avail: !r.avail } : r));
  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  const columns = [
    { key: 'name', header: 'Producto', render: (r) => <span className={s.cellStrong}>{r.name}</span> },
    { key: 'cat', header: 'Categoría', render: (r) => <Badge variant="neutral">{r.cat}</Badge> },
    { key: 'price', header: 'Precio', align: 'right', render: (r) => <span className={s.priceCell}>{r.price}</span> },
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
      <FilterBar
        filters={FILTERS}
        values={filters}
        onChange={setFilters}
        searchable
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Buscar producto"
        resultCount={filtered.length}
        actions={<Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nuevo producto</Button>}
      />

      <Card>
        <DataTable columns={columns} rows={filtered} loading={loading} error={error} empty="No se encontraron productos" />
      </Card>

      <Modal open={open} title="Nuevo producto" subtitle="Crea un ítem para el menú" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div className={s.formCol}>
          <Input label="Nombre del producto" icon="fas fa-burger" placeholder="Ej. Hamburguesa Doble" />
          <div className={s.formGrid}>
            <Select label="Categoría" options={['Hamburguesas', 'Pizzas', 'Bebidas', 'Postres']} />
            <Input label="Precio" icon="fas fa-dollar-sign" placeholder="0" />
          </div>
          <Switch label="Disponible al publicar" defaultChecked />
        </div>
      </Modal>

      <Modal open={!!del} size="sm" title="Eliminar producto" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" icon="fas fa-trash" onClick={() => { remove(del.id); setDel(null); }}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas eliminar <strong>{del?.name}</strong>? Esta acción no se puede deshacer.
      </Modal>
    </div>
  );
}
