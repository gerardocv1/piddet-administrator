import React from 'react';
import { api } from '../../lib/api.js';

/** Campana con panel de notificaciones desplegable. */
export function Notifications() {
  const [open, setOpen] = React.useState(false);
  const [notis, setNotis] = React.useState([]);

  React.useEffect(() => { api.notificaciones().then(setNotis).catch(() => {}); }, []);

  const unread = notis.filter((n) => n.unread).length;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones"
        style={{ width: 38, height: 38, borderRadius: 'var(--radius)', border: 'none', background: open ? 'var(--gray-100)' : 'transparent', color: 'var(--gray-500)', cursor: 'pointer', position: 'relative', fontSize: '1rem', transition: 'background .12s ease' }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--gray-100)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}>
        <i className="far fa-bell" />
        {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 7, minWidth: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', border: '2px solid #fff' }} />}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, background: 'var(--surface-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 41, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: 'var(--text-base)' }}>Notificaciones {unread > 0 && <span style={{ color: 'var(--color-primary)' }}>· {unread}</span>}</span>
              <button onClick={() => setNotis((ns) => ns.map((n) => ({ ...n, unread: false })))} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Marcar leídas</button>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notis.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '0.85rem 1.1rem', borderTop: i ? '1px solid var(--gray-100)' : 'none', background: n.unread ? 'var(--color-primary-050)' : 'var(--surface-card)', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-100)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.unread ? 'var(--color-primary-050)' : 'var(--surface-card)')}>
                  <span style={{ width: 36, height: 36, flex: '0 0 auto', borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: n.tint, color: n.fg, fontSize: '0.85rem' }}><i className={n.icon} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-800)' }}>{n.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 1 }}>{n.sub}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginTop: 3 }}>{n.time}</div>
                  </div>
                  {n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flex: '0 0 auto', marginTop: 6 }} />}
                </div>
              ))}
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); setOpen(false); }} style={{ display: 'block', textAlign: 'center', padding: '0.8rem', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', borderTop: '1px solid var(--border-color)' }}>Ver todas</a>
          </div>
        </>
      )}
    </div>
  );
}
