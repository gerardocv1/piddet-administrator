import React from 'react';
import { Modal } from './Modal.jsx';
import { Button } from '../core/Button.jsx';
import { Textarea } from '../forms/Textarea.jsx';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog — confirmación estándar para acciones destructivas (cancelar una factura,
 * anular un gasto, cancelar una reserva…). Unifica el patrón «tarjeta compacta + botón
 * peligroso + Volver» que antes cada pantalla replicaba a mano.
 *
 *  reason="none"      → solo confirmar/cancelar, sin campo de motivo.
 *  reason="optional"  → motivo opcional (la etiqueta añade «(opcional)»).
 *  reason="required"  → motivo obligatorio; el botón se bloquea hasta `minReason` caracteres.
 *
 * `onConfirm` recibe el motivo (string sin espacios, o null si va vacío en modo optional;
 * undefined en modo none). El campo se limpia cada vez que el diálogo se abre.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Volver',
  variant = 'danger',
  icon = 'fas fa-ban',
  loading = false,
  error = null,
  reason = 'none',
  reasonLabel = 'Motivo',
  reasonPlaceholder = '',
  reasonRows = 3,
  minReason = 3,
  onConfirm,
  onClose,
}) {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const required = reason === 'required';
  const ready = !required || value.trim().length >= minReason;

  const confirm = () => {
    if (loading || !ready) return;
    onConfirm(reason === 'none' ? undefined : (value.trim() || null));
  };

  return (
    <Modal open={open} size="sm" title={title} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={variant} icon={icon} loading={loading} disabled={!ready} onClick={confirm}>{confirmLabel}</Button>
      </>}>
      <div className={styles.body}>
        {children}
        {reason !== 'none' && (
          <Textarea
            label={required ? reasonLabel : `${reasonLabel} (opcional)`}
            required={required}
            rows={reasonRows}
            placeholder={reasonPlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {error && <div className={styles.error}><i className="fas fa-triangle-exclamation" /> {error}</div>}
      </div>
    </Modal>
  );
}
