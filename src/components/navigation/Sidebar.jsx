import React from 'react';

const NAV = [
  { key: 'dashboard', label: 'Inicio', icon: 'fas fa-house' },
  { section: 'Oferta' },
  { key: 'productos', label: 'Productos', icon: 'fas fa-burger' },
  { key: 'categorias', label: 'Categorías', icon: 'fas fa-tags' },
  { key: 'toppings', label: 'Toppings', icon: 'fas fa-bacon' },
  { section: 'Operación' },
  { key: 'mesas', label: 'Mesas', icon: 'fas fa-chair', badge: 4 },
  { key: 'tiendas', label: 'Tiendas', icon: 'fas fa-store' },
  { section: 'Cuentas' },
  { key: 'usuarios', label: 'Usuarios', icon: 'fas fa-user' },
  { key: 'roles', label: 'Roles', icon: 'fas fa-user-shield' },
];

const initials = (s = '') => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// Tile de empresa: tono derivado del color secundario (sin degradado).
const COMPANY_TILE_BG = 'var(--color-accent-100)';
const COMPANY_TILE_FG = 'var(--color-accent)';

/** Menú lateral oscuro fijo, con selector de EMPRESA (tenant SaaS), secciones
 * y resaltado naranja del activo. En móvil funciona como cajón deslizante. */
export function Sidebar({ active, onNavigate, onLogout, open = false, onClose, company, companies = [], onSwitchCompany }) {
  const [hover, setHover] = React.useState(null);
  const [picker, setPicker] = React.useState(false);
  const go = (key) => { onNavigate(key); onClose && onClose(); };

  return (
    <nav className={`pd-sidebar${open ? ' is-open' : ''}`} style={{ width: 'var(--sidebar-w)', flex: '0 0 auto', background: 'var(--brand-dark)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>
      <div style={{ padding: '1.5rem 1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 800, fontSize: '1.6rem', color: '#fff', letterSpacing: '-0.02em' }}>pid<span style={{ color: 'var(--color-primary)' }}>det</span></span>
        <button onClick={onClose} aria-label="Cerrar menú" className="pd-hide-desktop" style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.1rem' }}><i className="fas fa-times" /></button>
      </div>

      {/* ── Selector de empresa (tenant activo) ── */}
      {company && (
        <div style={{ position: 'relative', padding: '0 0.75rem 0.5rem' }}>
          <button onClick={() => setPicker((p) => !p)} aria-label="Cambiar empresa"
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.6rem 0.7rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', background: picker ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', cursor: companies.length > 1 ? 'pointer' : 'default', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
            <span style={{ width: 34, height: 34, flex: '0 0 auto', borderRadius: 'var(--radius)', background: COMPANY_TILE_BG, color: COMPANY_TILE_FG, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{initials(company.name)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>{company.plan ? `Plan ${company.plan}` : 'Empresa'}{company.tiendas != null ? ` · ${company.tiendas} tiendas` : ''}</span>
            </span>
            {companies.length > 1 && <i className="fas fa-chevron-down" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', transition: 'transform .15s', transform: picker ? 'rotate(180deg)' : 'none' }} />}
          </button>

          {picker && companies.length > 1 && (
            <>
              <div onClick={() => setPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{ position: 'absolute', top: 'calc(100% - 2px)', left: '0.75rem', right: '0.75rem', zIndex: 41, background: 'var(--brand-dark-2, #1b2c4a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', padding: 4 }}>
                <div style={{ padding: '0.5rem 0.6rem 0.35rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Cambiar empresa</div>
                {companies.map((c) => {
                  const cur = c.id === company.id;
                  return (
                    <button key={c.id} onClick={() => { setPicker(false); if (!cur) onSwitchCompany && onSwitchCompany(c); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.55rem 0.6rem', borderRadius: 'var(--radius)', border: 'none', background: cur ? 'rgba(255,124,0,0.16)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left' }}
                      onMouseEnter={(e) => { if (!cur) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={(e) => { if (!cur) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 28, height: 28, flex: '0 0 auto', borderRadius: 'var(--radius-sm)', background: cur ? COMPANY_TILE_BG : 'rgba(255,255,255,0.1)', color: cur ? COMPANY_TILE_FG : '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.66rem' }}>{initials(c.name)}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span style={{ display: 'block', fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)' }}>{c.tiendas} tiendas</span>
                      </span>
                      {cur && <i className="fas fa-check" style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.75rem' }}>
        {NAV.map((n, i) => n.section ? (
          <div key={`s${i}`} style={{ padding: '1.1rem 0.75rem 0.45rem', fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.32)' }}>{n.section}</div>
        ) : (
          <a key={n.key} href="#" onClick={(e) => { e.preventDefault(); go(n.key); }}
            onMouseEnter={() => setHover(n.key)} onMouseLeave={() => setHover(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.75rem', margin: '1px 0',
              borderRadius: 'var(--radius)', textDecoration: 'none', fontSize: 'var(--text-base)',
              fontWeight: n.key === active ? 600 : 400,
              color: n.key === active ? '#fff' : (hover === n.key ? '#fff' : 'rgba(255,255,255,0.62)'),
              background: n.key === active ? 'rgba(0,0,0,0.28)' : (hover === n.key ? 'rgba(255,255,255,0.06)' : 'transparent'),
              transition: 'background .12s ease, color .12s ease',
            }}>
            <i className={n.icon} style={{ width: 18, textAlign: 'center', fontSize: '0.9rem', color: n.key === active ? 'var(--color-primary)' : 'inherit' }} />
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.badge != null && <span style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-pill)', fontSize: '0.64rem', fontWeight: 700, padding: '1px 7px' }}>{n.badge}</span>}
          </a>
        ))}
      </div>
      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-sans)', padding: '0.4rem 0.5rem' }}>
          <i className="fas fa-arrow-right-from-bracket" style={{ width: 18 }} /> Salir
        </button>
      </div>
    </nav>
  );
}
