import React from 'react';
import { Modal } from './Modal.jsx';
import { DataTable } from '../data/DataTable.jsx';
import { Pagination } from '../data/Pagination.jsx';
import { Badge } from '../core/Badge.jsx';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/api.js';
import styles from './SessionsModal.module.css';

const PER_PAGE = 8;

// Tipo de evento, derivado del `status` del registro de auditoría.
const EVENT = {
  success: { label: 'Inicio de sesión', variant: 'success', icon: 'fas fa-right-to-bracket' },
  password_changed: { label: 'Cambio de contraseña', variant: 'info', icon: 'fas fa-key' },
};
const eventOf = (status) => EVENT[status] || { label: status || 'Evento', variant: 'neutral', icon: 'fas fa-circle-info' };

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const COLUMNS = [
  {
    key: 'status', header: 'Evento',
    render: (r) => {
      const e = eventOf(r.status);
      return <Badge variant={e.variant}><i className={`${e.icon} ${styles.evIcon}`} /> {e.label}</Badge>;
    },
  },
  { key: 'logged_at', header: 'Fecha y hora', render: (r) => fmtDate(r.logged_at) },
  {
    key: 'device', header: 'Dispositivo',
    render: (r) => (
      <div className={styles.device}>
        <span className={styles.deviceName}>{r.device || 'Desconocido'}</span>
        <span className={styles.deviceMeta}>{[r.browser, r.os].filter(Boolean).join(' · ') || '—'}</span>
      </div>
    ),
  },
  { key: 'ip', header: 'IP', align: 'right', render: (r) => <span className={styles.ip}>{r.ip || '—'}</span> },
];

/** Modal con el historial de sesiones (logins exitosos) del usuario, paginado. */
export function SessionsModal({ open, onClose }) {
  const [page, setPage] = React.useState(1);

  // Resetea a la primera página cada vez que se abre el modal.
  React.useEffect(() => { if (open) setPage(1); }, [open]);

  const { data, loading, error } = useResource(
    () => api.loginHistory({ page, perPage: PER_PAGE }),
    { items: [], pagination: null },
    [page, open]
  );

  const rows = open ? data.items : [];
  const pg = data.pagination;

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg" width={760}
      title="Mis sesiones" subtitle="Dispositivos y plataformas donde has iniciado sesión">
      <div className={styles.tableWrap}>
        <DataTable columns={COLUMNS} rows={rows} loading={loading} error={error}
          empty="Aún no hay sesiones registradas." />
      </div>
      {pg && (
        <div className={styles.footer}>
          <Pagination page={pg.current_page} lastPage={pg.last_page} total={pg.total}
            disabled={loading} onChange={setPage} />
        </div>
      )}
    </Modal>
  );
}
