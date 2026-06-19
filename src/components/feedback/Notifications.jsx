import React from 'react';
import { api } from '../../lib/api.js';
import styles from './Notifications.module.css';

// La presentación (icono + color) se decide aquí a partir del `type` que envía
// la API — no del backend. Así la API solo manda datos, no estilos.
const TYPE = {
  pedido: { icon: 'fas fa-receipt', tile: styles.pedido },
  mesa: { icon: 'fas fa-hand', tile: styles.mesa },
  alerta: { icon: 'fas fa-triangle-exclamation', tile: styles.alerta },
  tienda: { icon: 'fas fa-store', tile: styles.tienda },
};

/** Campana con panel de notificaciones desplegable. */
export function Notifications() {
  const [open, setOpen] = React.useState(false);
  const [notis, setNotis] = React.useState([]);

  React.useEffect(() => { api.notificaciones().then(setNotis).catch(() => {}); }, []);

  const unread = notis.filter((n) => n.unread).length;
  return (
    <div className={styles.root}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones"
        className={[styles.bell, open ? styles.open : ''].filter(Boolean).join(' ')}>
        <i className="far fa-bell" />
        {unread > 0 && <span className={styles.unreadDot} />}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className={styles.scrim} />
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelTitle}>Notificaciones {unread > 0 && <span className={styles.count}>· {unread}</span>}</span>
              <button onClick={() => setNotis((ns) => ns.map((n) => ({ ...n, unread: false })))} className={styles.markRead}>Marcar leídas</button>
            </div>
            <div className={styles.list}>
              {notis.map((n, i) => {
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
