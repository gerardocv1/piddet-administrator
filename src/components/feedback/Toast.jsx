import React from 'react';
import styles from './Toast.module.css';

const TONE_ICON = {
  success: 'fas fa-circle-check',
  info: 'fas fa-circle-info',
  warning: 'fas fa-triangle-exclamation',
  neutral: 'fas fa-eye-slash',
};

/**
 * Toast — confirma sin interrumpir: la acción YA terminó bien y el usuario no tiene que hacer
 * nada. Si tiene que leer con calma (error del servidor) es un Alert; si tiene que decidir, un
 * Modal. Normalmente no se usa directo: se lanza con useToast().
 */
export function Toast({ tone = 'success', icon, title, actionLabel, onAction, onClose }) {
  const t = TONE_ICON[tone] ? tone : 'success';

  return (
    <div className={styles.toast} role="status">
      <i className={`${icon || TONE_ICON[t]} ${styles.icon}`} data-tone={t} aria-hidden="true" />
      <span className={styles.title}>{title}</span>
      {actionLabel && (
        <button type="button" className={styles.action} onClick={onAction}>{actionLabel}</button>
      )}
      {onClose && (
        <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
          <i className="fas fa-xmark" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const ToastCtx = React.createContext(null);

/**
 * ToastProvider — uno solo, en la raíz de la app. Pinta la pila abajo a la derecha (arriba en
 * móvil), con un máximo de 3 y autocierre a los 4 s.
 */
export function ToastProvider({ children, duration = 4000, max = 3 }) {
  const [toasts, setToasts] = React.useState([]);
  const timers = React.useRef(new Map());
  const seq = React.useRef(0);

  const dismiss = React.useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
    setToasts((ts) => ts.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback((opts) => {
    seq.current += 1;
    const id = seq.current;
    setToasts((ts) => [...ts, { ...opts, id }].slice(-max));
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [duration, max, dismiss]);

  // Al desmontar: no dejar timeouts vivos apuntando a un estado que ya no existe.
  React.useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); pending.clear(); };
  }, []);

  const api = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className={styles.stack}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            tone={t.tone}
            icon={t.icon}
            title={t.title}
            actionLabel={t.actionLabel}
            onAction={t.onAction ? () => { t.onAction(); dismiss(t.id); } : undefined}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/**
 * useToast() — `const { toast } = useToast(); toast({ tone: 'success', title: 'Reserva creada' })`
 * Fuera del provider devuelve no-ops, para que una pantalla montada suelta no reviente.
 */
export function useToast() {
  return React.useContext(ToastCtx) || NOOP;
}

const NOOP = { toast: () => {}, dismiss: () => {} };
