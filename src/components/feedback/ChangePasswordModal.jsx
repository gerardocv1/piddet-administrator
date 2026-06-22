import React from 'react';
import { Modal } from './Modal.jsx';
import { Input } from '../forms/Input.jsx';
import { Button } from '../core/Button.jsx';
import { api } from '../../lib/api.js';
import styles from './ChangePasswordModal.module.css';

// Reglas de complejidad de la nueva contraseña (validadas en cliente).
const RULES = [
  { key: 'length', label: 'Al menos 8 caracteres', test: (v) => v.length >= 8 },
  { key: 'letter', label: 'Una letra', test: (v) => /[a-zA-Z]/.test(v) },
  { key: 'number', label: 'Un número', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'Un carácter especial (!@#$…)', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

// Traduce los mensajes del backend a textos claros en español.
const SERVER_MESSAGES = {
  'Current password is incorrect': 'La contraseña actual es incorrecta.',
  'New password must be different from the current one': 'La nueva contraseña debe ser distinta de la actual.',
  'User is inactive': 'Tu usuario está inactivo.',
  'User not found': 'No se encontró tu usuario.',
  'Password change failed': 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
};

/** Modal de cambio de contraseña: valida en cliente (8+ chars, letra, número y especial)
 *  y da feedback claro antes y después de llamar al backend. */
export function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  if (!open) return null;

  const checks = RULES.map((r) => ({ ...r, ok: r.test(next) }));
  const allRulesOk = checks.every((c) => c.ok);
  const confirmMismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!current) { setError('Ingresa tu contraseña actual.'); return; }
    if (!allRulesOk) { setError('La nueva contraseña no cumple los requisitos.'); return; }
    if (confirm !== next) { setError('Las contraseñas no coinciden.'); return; }

    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next });
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => { onClose && onClose(); }, 1400);
    } catch (err) {
      setError(SERVER_MESSAGES[err.message] || err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = success ? (
    <Button variant="primary" type="button" onClick={onClose}>Cerrar</Button>
  ) : (
    <>
      <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>Cancelar</Button>
      <Button variant="primary" type="submit" form="pwdForm" loading={submitting}>
        {submitting ? 'Guardando…' : 'Guardar'}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} size="md" footer={footer}
      title="Cambiar contraseña" subtitle="Actualiza tu contraseña de acceso">
      {success ? (
        <div className={styles.success}>
          <i className="fas fa-circle-check" />
          <span>Contraseña actualizada correctamente.</span>
        </div>
      ) : (
        <form id="pwdForm" onSubmit={submit} className={styles.form}>
          {error && (
            <div className={styles.error}><i className="fas fa-circle-exclamation" /> {error}</div>
          )}

          <Input label="Contraseña actual" icon="fas fa-lock" type="password" placeholder="••••••••"
            value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />

          <Input label="Nueva contraseña" icon="fas fa-key" type="password" placeholder="••••••••"
            value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />

          <ul className={styles.rules}>
            {checks.map((c) => (
              <li key={c.key} className={c.ok ? styles.ok : (next ? styles.bad : styles.idle)}>
                <i className={c.ok ? 'fas fa-circle-check' : 'far fa-circle'} /> {c.label}
              </li>
            ))}
          </ul>

          <Input label="Confirmar nueva contraseña" icon="fas fa-key" type="password" placeholder="••••••••"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
            error={confirmMismatch ? 'Las contraseñas no coinciden.' : null} />
        </form>
      )}
    </Modal>
  );
}
