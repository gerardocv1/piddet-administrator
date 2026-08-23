import React from 'react';
import { Spinner } from '../core/Spinner.jsx';
import styles from './Notifications.module.css';

// La presentación (icono + color) se decide aquí a partir del `type` que envía
// la API — no del backend. Así la API solo manda datos, no estilos.
const TYPE = {
  pedido: { icon: 'fas fa-receipt', tile: styles.pedido },
  mesa: { icon: 'fas fa-hand', tile: styles.mesa },
  alerta: { icon: 'fas fa-triangle-exclamation', tile: styles.alerta },
  tienda: { icon: 'fas fa-store', tile: styles.tienda },
};

/**
 * Panel de notificaciones desplegable.
 *
 * Por defecto se muestra con su propia campana. Con `showTrigger={false}` se monta solo el
 * panel y la apertura se controla desde fuera (`open` / `onOpenChange`): así el acceso a
 * notificaciones puede vivir en el menú de usuario en vez de ocupar un botón en la barra.
 */
export function Notifications({ open: openProp, onOpenChange, showTrigger = true }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next) => {
    const value = typeof next === 'function' ? next(open) : next;
    if (!isControlled) setInternalOpen(value);
    onOpenChange && onOpenChange(value);
  };
  // El módulo de notificaciones aún no tiene endpoint en backend: no se consulta hasta
  // implementarlo (reactivar con `useResource(api.notifications, [])`). Mientras tanto la
  // campana se muestra vacía sin disparar peticiones.
  const [notis, setNotis] = React.useState([]);
  const loading = false;
  const error = null;

  const unread = notis.filter((n) => n.unread).length;
  return (
    <div className={styles.root} data-headless={!showTrigger || undefined}>
      {showTrigger && (
        <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones"
          className={[styles.bell, open ? styles.open : ''].filter(Boolean).join(' ')}>
          <i className="far fa-bell" />
          {unread > 0 && <span className={styles.unreadDot} />}
        </button>
      )}
      {open && (
        <>
          <div onClick={() => setOpen(false)} className={styles.scrim} />
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Notificaciones {unread > 0 && <span className={styles.count}>· {unread}</span>}</span>
              <button onClick={() => setNotis((ns) => ns.map((n) => ({ ...n, unread: false })))} className={styles.markRead}>Marcar leídas</button>
            </div>
            <div className={styles.list}>
              {loading ? (
                <Spinner center label="Cargando…" />
              ) : error ? (
                <div className={styles.state}><i className="fas fa-triangle-exclamation" /> {error}</div>
              ) : notis.length === 0 ? (
                <div className={styles.state}>No tienes notificaciones.</div>
              ) : notis.map((n, i) => {
                const t = TYPE[n.type] || TYPE.tienda;
                return (
                  <div key={i} className={[styles.item, n.unread ? styles.unread : ''].filter(Boolean).join(' ')}>
                    <span className={[styles.tile, t.tile].join(' ')}><i className={t.icon} /></span>
                    <div className={styles.content}>
                      <div className={styles.itemTitle}>{n.title}</div>
                      <div className={styles.itemSub}>{n.sub}</div>
                      <div className={styles.itemTime}>{n.time}</div>
                    </div>
                    {n.unread && <span className={styles.itemDot} />}
                  </div>
                );
              })}
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); setOpen(false); }} className={styles.viewAll}>Ver todas</a>
          </div>
        </>
      )}
    </div>
  );
}
