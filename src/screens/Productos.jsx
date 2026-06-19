import React from 'react';
import { Badge } from '../components';
import { Button } from '../components';
import { IconButton } from '../components';
import { Switch } from '../components';
import { Select } from '../components';
import { Input } from '../components';
import { Modal } from '../components';
import { Card } from '../components';
import { FilterBar } from '../components';
import { api } from '../lib/api.js';

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

function precioNum(p) { return Number(String(p).replace(/[^0-9]/g, '')) || 0; }

export function Productos() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState({ cat: [], estado: undefined, precio: undefined, destacado: false });
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  React.useEffect(() => { api.productos().then(setRows).catch(() => {}); }, []);

  const filtered = rows.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (filters.cat && filters.cat.length && !filters.cat.includes(r.cat)) return false;
    if (filters.estado === 'disp' && !r.avail) return false;
    if (filters.estado === 'agotado' && r.avail) return false;
    if (filters.precio) {
      const n = precioNum(r.price);
      if (filters.precio === 'lt10' && n >= 10000) return false;
      if (filters.precio === '10-20' && (n < 10000 || n > 20000)) return false;
      if (filters.precio === 'gt20' && n <= 20000) return false;
    }
    if (filters.destacado && !r.destacado) return false;
    return true;
  });
  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, avail: !r.avail } : r));
  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 18 }}>
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
        <div className="pd-table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
          <thead><tr>
            {['Producto', 'Categoría', 'Precio', 'Disponible', ''].map((h, i) => (
              <th key={i} style={{ textAlign: i === 2 ? 'right' : 'left', padding: '0.8rem 1.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
                <td style={{ padding: '0.9rem 1.5rem', fontWeight: 700, color: 'var(--gray-800)' }}>{r.name}</td>
                <td style={{ padding: '0.9rem 1.5rem' }}><Badge variant="neutral">{r.cat}</Badge></td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', color: 'var(--gray-800)', fontWeight: 600 }}>{r.price}</td>
                <td style={{ padding: '0.9rem 1.5rem' }}><Switch checked={r.avail} onChange={() => toggle(r.id)} /></td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" />
                    <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(r)} />
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>No se encontraron productos</td></tr>}
          </tbody>
        </table>
        </div>
      </Card>

      <Modal open={open} title="Nuevo producto" subtitle="Crea un ítem para el menú" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Nombre del producto" icon="fas fa-burger" placeholder="Ej. Hamburguesa Doble" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
