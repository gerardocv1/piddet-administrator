import React from 'react';
import { Avatar } from '../components';
import { Badge } from '../components';
import { Button } from '../components';
import { IconButton } from '../components';
import { Select } from '../components';
import { Input } from '../components';
import { Modal } from '../components';
import { Card } from '../components';
import { api } from '../lib/api.js';

const ROL = { Administrador: 'primary', Cajero: 'info', Mesero: 'neutral', Cocina: 'warning' };

export function Usuarios() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState(null);

  React.useEffect(() => { api.usuarios().then(setRows).catch(() => {}); }, []);

  const remove = (id) => setRows((rs) => rs.filter((x) => x.id !== id));

  return (
    <div style={{ maxWidth: 'var(--container-max)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 'var(--text-base)' }}>Personas con acceso al panel y a la operación.</p>
        <div style={{ flex: 1 }} />
        <Button variant="primary" icon="fas fa-plus" onClick={() => setOpen(true)}>Nuevo usuario</Button>
      </div>

      <Card>
        <div className="pd-table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }}>
          <thead><tr>
            {['Usuario', 'Teléfono', 'Rol', 'Estado', ''].map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '0.8rem 1.5rem', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-500)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: i ? '1px solid var(--gray-100)' : 'none' }}>
                <td style={{ padding: '0.85rem 1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'var(--gray-800)' }}><Avatar name={r.name} size="sm" />{r.name}</span>
                </td>
                <td style={{ padding: '0.85rem 1.5rem', color: 'var(--gray-600)' }}>{r.tel}</td>
                <td style={{ padding: '0.85rem 1.5rem' }}><Badge variant={ROL[r.rol] || 'neutral'}>{r.rol}</Badge></td>
                <td style={{ padding: '0.85rem 1.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', fontWeight: 600, color: r.activo ? '#1aae6f' : 'var(--gray-400)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.activo ? 'var(--color-success)' : 'var(--gray-400)' }} />{r.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <IconButton icon="fas fa-pen" variant="light" title="Editar" size="sm" />
                    <IconButton icon="fas fa-trash" variant="danger" title="Eliminar" size="sm" onClick={() => setDel(r)} />
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gray-400)' }}>Aún no hay usuarios</td></tr>}
          </tbody>
        </table>
        </div>
      </Card>

      <Modal open={open} title="Nuevo usuario" subtitle="Da acceso a una persona del equipo" onClose={() => setOpen(false)} size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Guardar</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Nombre completo" icon="fas fa-user" placeholder="Ej. Laura Gómez" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Teléfono" icon="fas fa-phone" placeholder="300 000 0000" />
            <Select label="Rol" options={['Administrador', 'Cajero', 'Mesero', 'Cocina']} />
          </div>
        </div>
      </Modal>

      <Modal open={!!del} size="sm" title="Eliminar usuario" onClose={() => setDel(null)}
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" icon="fas fa-trash" onClick={() => { remove(del.id); setDel(null); }}>Eliminar</Button>
        </>}>
        ¿Seguro que deseas quitar el acceso de <strong>{del?.name}</strong>?
      </Modal>
    </div>
  );
}
