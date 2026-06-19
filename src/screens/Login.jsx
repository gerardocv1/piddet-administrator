import React from 'react';
import { Input, Button } from '../components';
import { useIsMobile } from '../lib/useIsMobile.js';
import { api } from '../lib/api.js';

/** Login partido en escritorio · cabecera de marca compacta + formulario en móvil. */
export function Login({ onLogin, theme = 'light', onToggleTheme }) {
  const isMobile = useIsMobile(760);
  const [phone, setPhone] = React.useState('300 123 4567');
  const [pwd, setPwd] = React.useState('password');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { token } = await api.login(phone, pwd);
      if (token) localStorage.setItem('piddet_token', token);
      onLogin && onLogin();
    } catch (err) {
      setError('No se pudo iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const themeBtn = onToggleTheme ? (
    <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      style={{ position: 'absolute', top: 18, right: 18, zIndex: 5, width: 40, height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-card)', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '1rem' }}>
      <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
    </button>
  ) : null;

  const form = (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input label="Teléfono" icon="fas fa-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Input label="Contraseña" icon="fas fa-lock" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} error={error} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: '2px 0 4px' }}>
        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-primary)' }} /> Recordarme en este equipo
      </label>
      <Button variant="primary" block type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
    </form>
  );

  // ─── Móvil: cabecera de marca compacta + formulario que llena la pantalla ───
  if (isMobile) {
    return (
      <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', background: 'var(--surface-card)' }}>
        {themeBtn}
        <div style={{ background: 'var(--brand-dark)', color: '#fff', padding: 'calc(1.8rem + env(safe-area-inset-top)) 1.5rem 1.7rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>pid<span style={{ color: 'var(--color-primary)' }}>det</span></span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.25 }}>Gestiona pedidos, menús y mesas <span style={{ color: 'var(--color-primary)' }}>en un solo lugar.</span></div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.8rem 1.5rem calc(1.8rem + env(safe-area-inset-bottom))' }}>
          <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Iniciar sesión</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-base)', marginTop: 6, marginBottom: 22 }}>Ingresa con tu teléfono para continuar.</p>
            {form}
          </div>
        </div>
      </div>
    );
  }

  // ─── Escritorio: panel partido ───
  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)' }}>
      {themeBtn}
      <div style={{ flex: '1 1 0', background: 'var(--brand-dark)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', color: '#fff' }}>
        <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>pid<span style={{ color: 'var(--color-primary)' }}>det</span></span>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.25, maxWidth: 420 }}>Gestiona tus pedidos, menús y mesas <span style={{ color: 'var(--color-primary)' }}>en un solo lugar.</span></div>
          <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.55)', fontSize: 'var(--text-md)', maxWidth: 420, lineHeight: 1.6 }}>Una plataforma simple para administrar la operación de cada restaurante.</div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)' }}>© 2026 piddet</div>
      </div>
      <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: 'var(--surface-card)' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Iniciar sesión</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-base)', marginTop: 6, marginBottom: 28 }}>Ingresa con tu teléfono para continuar.</p>
          {form}
        </div>
      </div>
    </div>
  );
}
