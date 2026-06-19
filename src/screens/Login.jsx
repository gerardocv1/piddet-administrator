import React from 'react';
import { Input, Button } from '../components';
import { useIsMobile } from '../lib/useIsMobile.js';
import { api } from '../lib/api.js';
import s from './Login.module.css';

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
    <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} className={s.themeBtn}>
      <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} />
    </button>
  ) : null;

  const form = (
    <form onSubmit={submit} className={s.form}>
      <Input label="Teléfono" icon="fas fa-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Input label="Contraseña" icon="fas fa-lock" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} error={error} />
      <label className={s.remember}>
        <input type="checkbox" defaultChecked /> Recordarme en este equipo
      </label>
      <Button variant="primary" block type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
    </form>
  );

  // ─── Móvil: cabecera de marca compacta + formulario que llena la pantalla ───
  if (isMobile) {
    return (
      <div className={s.mobile}>
        {themeBtn}
        <div className={s.mHeader}>
          <span className={s.logo}>pid<b>det</b></span>
          <div className={s.mHero}>Gestiona pedidos, menús y mesas <span className={s.accent}>en un solo lugar.</span></div>
        </div>
        <div className={s.mForm}>
          <div className={s.mBox}>
            <h2 className={s.formTitle}>Iniciar sesión</h2>
            <p className={`${s.formLead} ${s.mobileLead}`}>Ingresa con tu teléfono para continuar.</p>
            {form}
          </div>
        </div>
      </div>
    );
  }

  // ─── Escritorio: panel partido ───
  return (
    <div className={s.split}>
      {themeBtn}
      <div className={s.brand}>
        <span className={s.logo}>pid<b>det</b></span>
        <div>
          <div className={s.hero}>Gestiona tus pedidos, menús y mesas <span className={s.accent}>en un solo lugar.</span></div>
          <div className={s.heroSub}>Una plataforma simple para administrar la operación de cada restaurante.</div>
        </div>
        <div className={s.copyright}>© 2026 piddet</div>
      </div>
      <div className={s.formSide}>
        <div className={s.formBox}>
          <h2 className={s.formTitle}>Iniciar sesión</h2>
          <p className={`${s.formLead} ${s.desktop}`}>Ingresa con tu teléfono para continuar.</p>
          {form}
        </div>
      </div>
    </div>
  );
}
