import React from 'react';
import { Badge } from '../components';
import { Button } from '../components';
import { IconButton } from '../components';
import { Switch } from '../components';
import { Input } from '../components';
import { Modal } from '../components';
import { Card } from '../components';
import { api } from '../lib/api.js';

export function Categorias() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  React.useEffect(() => { api.categorias().then(setRows).catch(() => {}); }, []);

  const toggle = (id) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, activa: !r.activa } : r));
  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 'var(--text-base)' }}>Organiza el menú en categorías. Arrastra para reordenar.</p>
        <div style={{ flex: 1 }} />
        <Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nueva categoría</Button>
      </div>

      <Card>
        <div className="pd-table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
          <thead><tr>
            {['Orden', 'Categoría', 'Productos', 'Activa', ''].map((h, i) => (
              <th key={i} style={{ textAlign: i === 2 ? 'right' : 'left', padding: '0.8rem 1.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
                <td style={{ padding: '0.9rem 1.5rem', color: 'var(--gray-400)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-grip-vertical" style={{ cursor: 'grab' }} />{r.orden}
                  </span>
                </td>
                <td style={{ padding: '0.9rem 1.5rem', fontWeight: 700, color: 'var(--gray-800)' }}>{r.name}</td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}><Badge variant="neutral">{r.productos}</Badge></td>
                <td style={{ padding: '0.9rem 1.5rem' }}><Switch checked={r.activa} onChange={() => toggle(r.id)} /></td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" />
                    <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(r)} />
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>Aún no hay categorías</td></tr>}
          </tbody>
        </table>
        </div>
      </Card>

      <Modal open={open} title="Nueva categoría" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
